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
import traceback

# Create Blueprint
service_inquiries = Blueprint("service_inquiries", __name__)
api = Api(service_inquiries)
CORS(service_inquiries, resources={
    r"/service_inquiries/*": {
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
        msg.attach(MIMEText(html_content, "html"))  

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



@service_inquiries.route('/', methods=['GET'])
def welcome():
    return "Welcome to service_inquiries section"


# Service Inquiry Resource
ADMIN_EMAIL = "link.admin@merimedevelopment.co.ke" 

# ServiceInquiry class
class ServiceInquiry(Resource):
    def post(self):
        try:
            data = request.get_json()
            print("Received JSON:", data)

            if not data:
                return make_response(jsonify({"message": "Invalid JSON or empty request body"}), 400)

            user_id = data.get("user_id")
            service_id = data.get("service_id")
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            email = data.get("email")
            subject = data.get("subject")
            message = data.get("message")

            print("Extracted Fields:", user_id, service_id, first_name, last_name, email, subject, message)

            if not all([service_id, first_name, last_name, email, subject, message]):
                return make_response(jsonify({"message": "Missing required fields"}), 400)

            inquiry_id = str(uuid.uuid4())

            # Database connection
            conn = db_connection()
            cursor = conn.cursor()

            # Insert inquiry
            insert_query = """
                INSERT INTO service_inquiries (
                    id, user_id, service_id, first_name, last_name, email, subject, message
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                inquiry_id, user_id, service_id, first_name, last_name, email, subject, message
            ))

            # Fetch service provider email and user_id from service_profiles
            cursor.execute("SELECT email, user_id FROM service_profiles WHERE id = %s", (service_id,))
            result = cursor.fetchone()
            if not result:
                return make_response(jsonify({"message": "Service provider not found"}), 404)

            provider_email, provider_user_id = result

            # Fetch service provider's first name from users table
            cursor.execute("SELECT first_name FROM users WHERE user_id = %s", (provider_user_id,))
            user_result = cursor.fetchone()
            provider_first_name = user_result[0] if user_result else "there"

            # Close DB connection
            conn.commit()
            cursor.close()
            conn.close()

            # Email context for provider
            provider_context = {
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "subject": subject,
                "message": message,
                "receiver_first_name": provider_first_name
            }

            # Email context for admin
            admin_context = {
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "subject": subject,
                "message": message,
                "receiver_first_name": "Admin"
            }

            # Send to service provider (personalized)
            send_email_async(
                receiver_email=provider_email,
                subject=f" Linknamali - New Service Inquiry: {subject}",
                template_name="service_inquiry_provider.html",
                context=provider_context
            )

            # Send to admin
            send_email_async(
                receiver_email=ADMIN_EMAIL,
                subject=f"New Service Inquiry from {first_name} {last_name}",
                template_name="service_inquiry_admin.html",
                context=admin_context
            )

            return make_response(jsonify({
                "message": "Inquiry submitted successfully. Notifications sent.",
                "inquiry_id": inquiry_id
            }), 201)

        except Exception as e:
            logging.error(f"Error in ServiceInquiry.post: {e}")
            return make_response(jsonify({"message": "Database error", "error": str(e)}), 500)


# Fetch All Service Inquiries
class GetAllServiceInquiries(Resource):
    def get(self):
        try:
            conn = db_connection()
            cursor = conn.cursor(dictionary=True)  # Use dict cursor for readable JSON

            cursor.execute("SELECT * FROM service_inquiries ORDER BY created_at DESC")
            inquiries = cursor.fetchall()

            cursor.close()
            conn.close()

            return jsonify({
                "message": f"{len(inquiries)} service inquiry(ies) found",
                "inquiries": inquiries
            })

        except Exception as e:
            return make_response(jsonify({
                "message": "Error fetching service inquiries",
                "error": str(e)
            }), 500)


# Fetch Inquiries for a Specific Service Provider
class GetProviderInquiries(Resource):
    def get(self):
        try:
            user_id = request.args.get("user_id")
            if not user_id:
                return make_response(jsonify({"message": "Missing user_id"}), 400)

            conn = db_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
                SELECT si.*
                FROM service_inquiries si
                JOIN service_profiles sp ON si.service_id = sp.id
                WHERE sp.user_id = %s
                ORDER BY si.created_at DESC
            """
            cursor.execute(query, (user_id,))
            inquiries = cursor.fetchall()

            cursor.close()
            conn.close()

            return jsonify({
                "message": f"{len(inquiries)} inquiry(ies) found for this provider",
                "inquiries": inquiries
            })

        except Exception as e:
            return make_response(jsonify({
                "message": "Error fetching service inquiries for provider",
                "error": str(e)
            }), 500)


# Service Provider Inquiry Reply
class ServiceProviderInquiryReply(Resource):
    def post(self):
        try:
            data = request.get_json()

            inquiry_id = data.get("inquiry_id")
            responder_id = data.get("responder_id")
            message = data.get("message")

            if not all([inquiry_id, responder_id, message]):
                return make_response(jsonify({"message": "Missing required fields"}), 400)

            reply_id = str(uuid.uuid4())
            conn = db_connection()
            conn.autocommit = True

            # Cursor 1: Get user info (with buffered=True)
            cursor1 = conn.cursor(buffered=True)
            cursor1.execute("""
                SELECT email, first_name, last_name, subject 
                FROM service_inquiries 
                WHERE id = %s
            """, (inquiry_id,))
            user_info = cursor1.fetchone()
            cursor1.close()

            if not user_info:
                conn.close()
                return make_response(jsonify({"message": "Inquiry not found"}), 404)

            user_email, first_name, last_name, inquiry_subject = user_info

            # Cursor 2: Get business name (with buffered=True)
            cursor2 = conn.cursor(buffered=True)
            cursor2.execute("""
                SELECT business_name 
                FROM service_profiles 
                WHERE user_id = %s
            """, (responder_id,))
            business_info = cursor2.fetchone()
            cursor2.close()

            business_name = business_info[0] if business_info else "The Service Provider"

            # Cursor 3: Insert reply and update inquiry
            cursor3 = conn.cursor()
            cursor3.execute("""
                INSERT INTO serviceprovidersinquiry_replies (
                    id, inquiry_id, responder_id, message
                ) VALUES (%s, %s, %s, %s)
            """, (reply_id, inquiry_id, responder_id, message))

            cursor3.execute("""
                UPDATE service_inquiries 
                SET status = 'responded' 
                WHERE id = %s
            """, (inquiry_id,))
            cursor3.close()
            conn.close()

            # Send email
            email_subject = f"Linknamali - Reply to your inquiry: {inquiry_subject}"
            email_context = {
                "first_name": first_name,
                "last_name": last_name,
                "message": message,
                "subject": inquiry_subject,
                "business_name": business_name
            }

            send_email_async(
                receiver_email=user_email,
                subject=email_subject,
                template_name="service_inquiry_user_reply.html",
                context=email_context
            )

            return make_response(jsonify({
                "message": "Reply submitted successfully and email sent.",
                "reply_id": reply_id
            }), 201)

        except Exception as e:
            traceback.print_exc()
            logging.error(f"ServiceProviderInquiryReply error: {e}")
            return make_response(jsonify({
                "message": "An error occurred",
                "error": str(e)
            }), 500)
        

# Register endpoints
api.add_resource(ServiceInquiry, '/serviceinquiries')
api.add_resource(GetAllServiceInquiries, '/allserviceinquiries')
api.add_resource(GetProviderInquiries, '/providerinquiries')
api.add_resource(ServiceProviderInquiryReply, '/serviceproviderinquiryreply')