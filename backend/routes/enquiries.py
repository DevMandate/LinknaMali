from flask import Blueprint, request, make_response, jsonify
from flask_restful import Resource, Api
from database.database import db_connection
from flask_cors import CORS
from datetime import datetime, date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from decimal import Decimal
from jinja2 import Environment, FileSystemLoader
import os
import logging
import uuid
import smtplib
import ssl
import threading

# Create Blueprint
enquiries = Blueprint("enquiries", __name__)
api = Api(enquiries)
CORS(enquiries, resources={
    r"/enquiries/*": {
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
SENDER_PASSWORD = "M4r1meDvSup0"  # Store this securely in HashiCorp Vault!

# Define the correct template folder path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # This gets the current script's directory
TEMPLATE_DIR = os.path.join(BASE_DIR, "email_templates")  # Navigate to email_templates

# Set up Jinja2 environment
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

# send email function
def send_email(receiver_email, subject, template_name, context):
    """Sends an email using an HTML template."""
    try:
        # Load the email template
        template = env.get_template(template_name)

        # Render the template with context data
        html_content = template.render(context)

        
        # Create email message
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = receiver_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_content, "html"))  # Use "html" instead of "plain"

        # Send email
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, receiver_email, msg.as_string())

        logging.info(f"Email sent successfully to {receiver_email}")

    except Exception as e:
        logging.error(f"Failed to send email: {e}")


def send_email_async(receiver_email, subject, template_name, context):
    """Helper function to send an email in a separate thread using an HTML template."""
    thread = threading.Thread(target=send_email, args=(receiver_email, subject, template_name, context))
    thread.start()




@enquiries.route('/', methods=['GET'])
def welcome():
    return "Welcome to enquiries section"


# Enquiries
class Enquiry(Resource):
    def post(self):
        try:
            data = request.get_json()

            # Debugging: Print received data
            print("Received JSON:", data)

            if not data:
                return make_response(jsonify({"message": "Invalid JSON or empty request body"}), 400)

            # Extract required fields
            user_id = data.get("user_id")
            property_id = data.get("property_id")
            property_type = data.get("property_type")
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            email = data.get("email")
            subject = data.get("subject")
            message = data.get("message")

            # Debugging: Print extracted fields
            print("Extracted Fields:", user_id, property_id, property_type, first_name, last_name, email, subject, message)

            # Validate required fields
            if not all([property_id, property_type, first_name, last_name, email, subject, message]):
                return make_response(jsonify({"message": "Missing required fields"}), 400)

            # Generate a unique ID for the enquiry
            enquiry_id = str(uuid.uuid4())

            # Connect to the database
            conn = db_connection()
            cursor = conn.cursor()

            # Insert data into the 'enquiries' table
            insert_query = """
                INSERT INTO enquiries (id, user_id, property_id, property_type, first_name, last_name, email, subject, message)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (enquiry_id, user_id, property_id, property_type, first_name, last_name, email, subject, message)

            cursor.execute(insert_query, values)
            conn.commit()

            # Close database connection
            cursor.close()
            conn.close()

            return make_response(jsonify({"message": "Enquiry submitted successfully", "enquiry_id": enquiry_id}), 201)

        except Exception as e:
            return make_response(jsonify({"message": "Database error", "error": str(e)}), 500)

        except Exception as e:
            return make_response(jsonify({"message": "An error occurred", "error": str(e)}), 500)


# Get enquiries
class GetEnquiries(Resource):
    def get(self, user_id):
        try:
            # Connect to the database
            conn = db_connection()
            cursor = conn.cursor()

            # Fetch enquiries for properties owned by the given user_id, including property title
            query = """
                SELECT e.id, e.property_id, e.property_type, e.first_name, e.last_name, e.email, 
                       e.subject, e.message, e.created_at, p.title
                FROM enquiries e
                JOIN (
                    SELECT id, user_id, title FROM land
                    UNION ALL
                    SELECT id, user_id, title FROM apartments
                    UNION ALL
                    SELECT id, user_id, title FROM commercial
                    UNION ALL
                    SELECT id, user_id, title FROM houses
                ) p ON e.property_id = p.id
                WHERE p.user_id = %s
            """
            cursor.execute(query, (user_id,))
            enquiries = cursor.fetchall()

            # Close database connection
            cursor.close()
            conn.close()

            if not enquiries:
                return make_response(jsonify({"message": "No enquiries found for this user"}), 404)

            # Convert query result into a list of dictionaries
            enquiries_list = []
            for enquiry in enquiries:
                enquiries_list.append({
                    "id": enquiry[0],
                    "property_id": enquiry[1],
                    "property_type": enquiry[2],
                    "first_name": enquiry[3],
                    "last_name": enquiry[4],
                    "email": enquiry[5],
                    "subject": enquiry[6],
                    "message": enquiry[7],
                    "created_at": enquiry[8].strftime("%Y-%m-%d %H:%M:%S"),  # Format timestamp
                    "title": enquiry[9]  # Include property title/house_type
                })

            payload = {"enquiries": enquiries_list}

            return make_response(jsonify(payload), 200)

        except Exception as e:
            print(f"Database error: {str(e)}")  # Log the error
            return make_response(jsonify({"message": "Database error", "error": str(e)}), 500)



# Reply to an enquiry
class ReplyEnquiry(Resource):
    def post(self):
        try:
            data = request.get_json()

            enquiry_id = data.get("enquiry_id")
            reply_message = data.get("reply_message")

            if not enquiry_id or not reply_message:
                return make_response(jsonify({"message": "Missing enquiry_id or reply_message"}), 400)

            # Connect to the database
            conn = db_connection()
            cursor = conn.cursor()

            # Fetch first_name, email, and property_type from enquiries table
            query = """
                SELECT first_name, email, property_type 
                FROM enquiries 
                WHERE id = %s
            """
            cursor.execute(query, (str(enquiry_id),))
            enquiry = cursor.fetchone()

            if not enquiry:
                return make_response(jsonify({"message": "Enquiry not found"}), 404)

            first_name, recipient_email, property_type = enquiry

            # Insert the reply into inquiry_conversations table
            insert_reply_query = """
                INSERT INTO inquiry_conversations (con_id, enquiry_id, sender, message)
                VALUES (UUID(), %s, 'owner', %s)
            """
            cursor.execute(insert_reply_query, (enquiry_id, reply_message))

            # Commit only the reply, not the status update
            conn.commit()

            # Close DB connection
            cursor.close()
            conn.close()

            # Prepare and send email reply
            email_context = {
                "first_name": first_name,
                "property_type": property_type,
                "reply_message": reply_message
            }

            send_email_async(recipient_email, "LinkNamali - Reply to Your Enquiry", "enquiryreply.html", email_context)

            return make_response(jsonify({
                "message": "Reply sent successfully",
                "enquiry_id": enquiry_id
            }), 200)

        except Exception as e:
            return make_response(jsonify({"message": "An error occurred", "error": str(e)}), 500)


# Check if user has any enquiries
class CheckInquiries(Resource):
    def get(self):
        property_id = request.args.get("property_id")

        if not property_id:
            return jsonify({"message": "Missing property_id"}), 400

        try:
            conn = db_connection()
            cursor = conn.cursor()

            query = "SELECT COUNT(*) FROM enquiries WHERE property_id = %s"
            cursor.execute(query, (property_id,))
            result = cursor.fetchone()

            cursor.close()
            conn.close()

            return jsonify({"hasInquiries": result[0] > 0})

        except Exception as e:
            return jsonify({"message": "Database error", "error": str(e)}), 500


# Resolve inquiry
class ResolveEnquiry(Resource):
    def post(self):
        try:
            data = request.get_json()
            enquiry_id = data.get('enquiry_id')

            if not enquiry_id:
                return make_response(jsonify({"message": "Missing enquiry_id"}), 400)

            # Connect to the database
            conn = db_connection()
            cursor = conn.cursor()

            # Step 1: Check if the enquiry exists and get current status
            check_query = "SELECT status FROM enquiries WHERE id = %s"
            cursor.execute(check_query, (enquiry_id,))
            enquiry = cursor.fetchone()

            if not enquiry:
                return make_response(jsonify({"message": "Enquiry not found"}), 404)

            current_status = enquiry[0]

            # Step 2: Check if already resolved
            if current_status == 'resolved':
                return make_response(jsonify({
                    "message": "Enquiry is already resolved"
                }), 409)  # 409 Conflict

            # Step 3: Update the enquiry status
            update_query = "UPDATE enquiries SET status = 'resolved' WHERE id = %s"
            cursor.execute(update_query, (enquiry_id,))
            conn.commit()

            # Final response
            return make_response(jsonify({
                "message": "Enquiry marked as resolved",
                "enquiry_id": enquiry_id,
                "status": "resolved"
            }), 200)

        except Exception as e:
            print(f"Error resolving enquiry: {str(e)}")
            return make_response(jsonify({
                "message": "An unexpected error occurred",
                "error": str(e)
            }), 500)

        finally:
            try:
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()
            except:
                pass



# Add the new reply endpoint
api.add_resource(ReplyEnquiry, "/replyenquiry")
api.add_resource(Enquiry, '/enquiries')
api.add_resource(GetEnquiries, "/getenquiries/<string:user_id>")
api.add_resource(CheckInquiries, "/inquiries/check")
api.add_resource(ResolveEnquiry, '/resolveenquiry')
