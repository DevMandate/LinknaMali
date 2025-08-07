from flask import Blueprint, request, make_response, jsonify
from flask_restful import Resource, Api
from database.database import db_connection
from flask_cors import CORS
from datetime import datetime, date, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from decimal import Decimal
import logging
import uuid
import smtplib
import ssl
import threading
import os


# Create Blueprint
usermgt = Blueprint("usermgt", __name__)
api = Api(usermgt)
CORS(usermgt, resources={
    r"/usermgt/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://linknamali.ke",
            "https://portal.linknamali.ke"
        ],
        "supports_credentials": True
    },
})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Email Configuration
SMTP_SERVER = "mail.merimedevelopment.co.ke"
SMTP_PORT = 587
SENDER_EMAIL = "support@merimedevelopment.co.ke"
SENDER_PASSWORD = "M4r1meDvSup0"  # Be sure to store this securely



@usermgt.route('/', methods=['GET'])
def welcome():
    return "Welcome to owners Bookings section"


def serialize_dates(obj):
    """Convert all datetime/date values in a dictionary to strings"""
    for key, value in obj.items():
        if isinstance(value, (datetime, date)):
            obj[key] = value.isoformat()  # or str(value)
    return obj




# Send email function
def send_email(receiver_email, subject, body, is_html=False):
    """Helper function to send an email securely with optional HTML support."""
    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = receiver_email
        msg["Subject"] = subject

        # Set content type based on `is_html`
        if is_html:
            msg.attach(MIMEText(body, "html"))  # HTML email
        else:
            msg.attach(MIMEText(body, "plain"))  # Plain text email

        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, receiver_email, msg.as_string())

        logging.info(f"Email sent successfully to {receiver_email}")

    except Exception as e:
        logging.error(f"Failed to send email: {e}")




def send_email_async(receiver_email, subject, body, is_html=False):
    """Helper function to send an email in a separate thread."""
    thread = threading.Thread(target=send_email, args=(receiver_email, subject, body, is_html))
    thread.start()



# Move up one level from 'routes' to 'backend'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Moves up one level
template_path = os.path.join(BASE_DIR, "email_templates", "account_status_update.html")

if not os.path.exists(template_path):
    print(f"Error: File not found at {template_path}")
else:
    with open(template_path, "r", encoding="utf-8") as file:
        email_body = file.read()



# Account Locking/Unlocking Resource
class UserLockResource(Resource):
    def put(self, user_id):
        conn = None
        cursor = None
        try:
            data = request.get_json()
            is_locked = data.get('is_locked')
            admin_id = data.get('admin_id')

            if is_locked not in [0, 1, True, False]:
                return make_response(jsonify({"message": "Invalid 'is_locked' value. Must be true or false."}), 400)
            if not admin_id:
                return make_response(jsonify({"message": "Missing 'admin_id' in the request."}), 400)

            lock_value = 1 if is_locked else 0

            conn = db_connection()
            cursor = conn.cursor(dictionary=True)

            # ✅ Check if admin_id exists and role is 'Admin'
            cursor.execute("SELECT * FROM users WHERE user_id = %s AND role = 'Admin' AND is_deleted = 0", (admin_id,))
            admin_user = cursor.fetchone()

            if not admin_user:
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()
                return make_response(jsonify({"message": "Invalid Admin ID, not an admin user."}), 403)

            # ✅ Check if user exists (the one to be locked/unlocked)
            cursor.execute("SELECT * FROM users WHERE user_id = %s AND is_deleted = 0", (user_id,))
            user = cursor.fetchone()

            if not user:
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()
                return make_response(jsonify({"message": "User to lock/unlock not found or deleted."}), 404)

            # ✅ Update is_locked
            cursor.execute(
                "UPDATE users SET is_locked = %s, updated_at = NOW() WHERE user_id = %s",
                (lock_value, user_id)
            )
            conn.commit()

            # ✅ Prepare and send email
            email_subject = "Linknamali - Account Locked" if lock_value else "Account Unlocked"
            custom_email_body = email_body.replace("{{USERNAME}}", f"{user['first_name']} {user['last_name']}")
            custom_email_body = custom_email_body.replace("{{ACTION}}", "locked" if lock_value else "unlocked")

            send_email_async(user['email'], email_subject, custom_email_body, is_html=True)

            if cursor:
                cursor.close()
            if conn:
                conn.close()

            status = "locked" if lock_value else "unlocked"
            return make_response(jsonify({"message": f"User successfully {status} by Admin {admin_user['first_name']} {admin_user['last_name']}."}), 200)

        except Exception as e:
            logger.error(f"Error locking/unlocking user: {e}")
            if cursor:
                cursor.close()
            if conn:
                conn.close()
            return make_response(jsonify({"message": "Internal server error."}), 500)





# Register the resource with the API
api.add_resource(UserLockResource, '/lock_user/<string:user_id>')


