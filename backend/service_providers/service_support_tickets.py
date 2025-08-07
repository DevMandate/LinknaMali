from flask import Blueprint, request, make_response, jsonify
from flask_restful import Resource, Api
from database.database import db_connection
from flask_cors import CORS
from datetime import datetime, date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from decimal import Decimal
from jinja2 import Environment, FileSystemLoader
from werkzeug.utils import secure_filename
from urllib.parse import urlparse
import os
import logging
import uuid
import boto3
import asyncio
import smtplib
import ssl
import threading

# Create Blueprint
service_tickets = Blueprint("service_tickets", __name__)
api = Api(service_tickets)
CORS(service_tickets, resources={
    r"/service_tickets/*": {
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


# Cloudflare Config
CLOUDFLARE_ACCESS_KEY = os.getenv("CLOUDFLARE_ACCESS_KEY")
CLOUDFLARE_SECRET_KEY = os.getenv("CLOUDFLARE_SECRET_KEY")
CLOUDFLARE_BUCKET_NAME = "linknamali"
CLOUDFLARE_ENDPOINT = "https://d418c3595b04db7f9e063c255ea021d0.r2.cloudflarestorage.com"
CLOUDFLARE_CDN = "https://files.linknamali.ke"

def upload_service_media(file_obj, user_id, filename):
    session = boto3.Session()
    media_id = str(uuid.uuid4())
    extension = filename.rsplit(".", 1)[-1].lower()
    object_name = f"servicesproviders/{user_id}/{media_id}.{extension}"

    try:
        s3_client = session.client(
            "s3",
            endpoint_url=CLOUDFLARE_ENDPOINT,
            aws_access_key_id=CLOUDFLARE_ACCESS_KEY,
            aws_secret_access_key=CLOUDFLARE_SECRET_KEY
        )
        s3_client.put_object(
            Bucket=CLOUDFLARE_BUCKET_NAME,
            Key=object_name,
            Body=file_obj
        )
        return f"{CLOUDFLARE_CDN}/{object_name}"
    except Exception as e:
        print(f"Upload failed: {e}")
        return None

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 50MB in bytes

ADMIN_EMAIL = "link.admin@merimedevelopment.co.ke"
# Email Configuration
SMTP_SERVER = "mail.merimedevelopment.co.ke"
SMTP_PORT = 587
SENDER_EMAIL = "support@merimedevelopment.co.ke"
SENDER_PASSWORD = "M4r1meDvSup0"


# Configure Jinja2 environment
TEMPLATE_ENV = Environment(loader=FileSystemLoader("email_templates"))


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


# Send email asynchronously
def send_email_async(receiver_email, subject, body, is_html=False):
    """Helper function to send an email in a separate thread."""
    thread = threading.Thread(target=send_email, args=(receiver_email, subject, body, is_html))
    thread.start()


# Service Provider Support Ticket Resource
class ServiceProviderSupportTicket(Resource):
    def post(self):
        try:
            provider_id = request.form.get("provider_id")
            email = request.form.get("email")
            ticket_type = request.form.get("type")
            subject = request.form.get("subject")
            urgency = request.form.get("urgency")
            message = request.form.get("message")
            evidence_file = request.files.get("evidence")

            if not provider_id or not email or not ticket_type or not subject or not message or not urgency:
                return {"response": "All fields are required."}, 400

            if urgency not in ["High", "Medium", "Low"]:
                return {"response": "Invalid urgency level."}, 400

            evidence_url = None
            if evidence_file and evidence_file.content_length <= 10 * 1024 * 1024:
                filename = secure_filename(evidence_file.filename)
                evidence_url = upload_service_media(evidence_file, provider_id, filename)
                if not evidence_url:
                    return {"response": "Failed to upload evidence file."}, 500

            ticket_id = str(uuid.uuid4())

            connection = db_connection()
            cursor = connection.cursor()

            cursor.execute("""
                INSERT INTO service_providers_support_tickets (
                    ticket_id, provider_id, email, type, subject, urgency,
                    message, status, evidence
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'Open', %s)
            """, (
                ticket_id, provider_id, email, ticket_type, subject,
                urgency, message, evidence_url
            ))

            ticket_seq = cursor.lastrowid
            ticket_number = f"SP-ST-{ticket_seq}"

            cursor.execute("""
                UPDATE service_providers_support_tickets
                SET ticket_number = %s
                WHERE ticket_id = %s
            """, (ticket_number, ticket_id))

            cursor.execute("""
                INSERT INTO service_providers_support_messages (
                    id, ticket_id, sender_id, message, is_read
                ) VALUES (%s, %s, %s, %s, 0)
            """, (str(uuid.uuid4()), ticket_id, provider_id, message))

            cursor.execute("SELECT business_name FROM service_profiles WHERE id = %s", (provider_id,))
            result = cursor.fetchone()
            business_name = result[0] if result else "there"


            connection.commit()

            # Send email to provider using acknowledgment template
            ack_template = TEMPLATE_ENV.get_template("service_ticket_provider_acknowledgement.html")
            ack_body = ack_template.render(
                ticket_number=ticket_number,
                subject=subject,
                message=message,
                business_name=business_name,
                support_link="https://linknamali.ke/login"
            )
            send_email_async(email, f"Linknamali - Ticket Received - {ticket_number}", ack_body, is_html=True)

            # Send email to admin using admin_notification template
            admin_template = TEMPLATE_ENV.get_template("service_tickets_admin_notification.html")
            admin_body = admin_template.render(
                provider_email=email,
                ticket_number=ticket_number,
                subject=subject,
                message=message,
                urgency=urgency,
                evidence_url=evidence_url or "No attachment"
            )
            send_email_async(ADMIN_EMAIL, f"New Service Provider Ticket Raised - {ticket_number}", admin_body, is_html=True)

            return {
                "provider_id": provider_id,
                "ticket_id": ticket_id,
                "ticket_number": ticket_number,
                "response": "Support ticket created and emails sent.",
                "evidence_url": evidence_url,
                "status": "Open"
            }, 201

        except Exception as e:
            logging.error(f"Error creating provider support ticket: {e}")
            return {"response": "Internal server error."}, 500


# Get all service provider support tickets
class AllServiceTickets(Resource):
    def get(self):
        try:
            connection = db_connection()
            cursor = connection.cursor(dictionary=True)

            cursor.execute("""
                SELECT 
                    ticket_id, provider_id, email, type, subject, urgency,
                    status, ticket_number, evidence, created_at
                FROM service_providers_support_tickets
                ORDER BY created_at DESC
            """)

            tickets = cursor.fetchall()

            # Convert datetime and handle evidence display
            for ticket in tickets:
                if isinstance(ticket["created_at"], datetime):
                    ticket["created_at"] = ticket["created_at"].isoformat()
                if not ticket.get("evidence"):
                    ticket["evidence"] = None  # Normalize nulls to explicit None

            return {"tickets": tickets}, 200

        except Exception as e:
            logging.error(f"Error fetching all support tickets: {e}")
            return {"response": "Internal server error."}, 500


# Get service provider support tickets by provider ID
class ProviderServiceTickets(Resource):
    def get(self, provider_id):
        try:
            connection = db_connection()
            cursor = connection.cursor(dictionary=True)

            cursor.execute("""
                SELECT 
                    ticket_id, provider_id, email, type, subject, urgency,
                    status, ticket_number, evidence, created_at
                FROM service_providers_support_tickets
                WHERE provider_id = %s
                ORDER BY created_at DESC
            """, (provider_id,))

            tickets = cursor.fetchall()

            for ticket in tickets:
                if isinstance(ticket["created_at"], datetime):
                    ticket["created_at"] = ticket["created_at"].isoformat()
                if not ticket.get("evidence"):
                    ticket["evidence"] = None

            return {"tickets": tickets}, 200

        except Exception as e:
            logging.error(f"Error fetching tickets for provider {provider_id}: {e}")
            return {"response": "Internal server error."}, 500


# Admin reply to service provider ticket
class AdminServiceTicketReply(Resource):
    def post(self, ticket_id):
        try:
            data = request.get_json()
            admin_id = data.get("admin_id")
            message = data.get("message")

            if not admin_id or not message:
                return {"response": "admin_id and message are required."}, 400

            connection = db_connection()
            cursor = connection.cursor(dictionary=True)

            # Fetch provider info, including business name
            cursor.execute("""
                SELECT s.email, s.subject, s.ticket_number, p.business_name
                FROM service_providers_support_tickets s
                JOIN service_profiles p ON s.provider_id = p.id
                WHERE s.ticket_id = %s
            """, (ticket_id,))
            ticket = cursor.fetchone()

            if not ticket:
                return {"response": "Ticket not found."}, 404

            provider_email = ticket["email"]
            subject = ticket["subject"]
            ticket_number = ticket["ticket_number"]
            business_name = ticket.get("business_name", "there")

            # Log the message
            message_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO service_providers_support_messages (
                    id, ticket_id, sender_id, message, is_read
                )
                VALUES (%s, %s, %s, %s, 0)
            """, (message_id, ticket_id, admin_id, message))

            connection.commit()

            # Render and send email to provider
            reply_template = TEMPLATE_ENV.get_template("service_ticket_admin_reply.html")
            email_body = reply_template.render(
                business_name=business_name,
                ticket_number=ticket_number,
                subject=subject,
                message=message,
                response_link=f"https://linknamali.ke/login"
            )

            send_email_async(
                provider_email,
                f"Linknamali - Response to Your Ticket - {ticket_number}",
                email_body,
                is_html=True
            )

            return {"response": "Reply logged and provider notified."}, 200

        except Exception as e:
            logging.error(f"Error sending admin response for ticket {ticket_id}: {e}")
            return {"response": "Internal server error."}, 500


# Resolve service provider support ticket
class ResolveServiceTicket(Resource):
    def put(self, ticket_id):
        try:
            connection = db_connection()
            cursor = connection.cursor(dictionary=True)

            # Get ticket + provider info (including business_name)
            cursor.execute("""
                SELECT s.email, s.subject, s.ticket_number, p.business_name
                FROM service_providers_support_tickets s
                JOIN service_profiles p ON s.provider_id = p.id
                WHERE s.ticket_id = %s
            """, (ticket_id,))
            ticket = cursor.fetchone()

            if not ticket:
                return {"response": "Ticket not found."}, 404

            # Update ticket status to resolved
            cursor.execute("""
                UPDATE service_providers_support_tickets
                SET status = 'resolved'
                WHERE ticket_id = %s
            """, (ticket_id,))
            connection.commit()

            # Extract email details
            provider_email = ticket["email"]
            subject = ticket["subject"]
            ticket_number = ticket["ticket_number"]
            business_name = ticket.get("business_name", "there")

            # Render resolution email
            resolution_template = TEMPLATE_ENV.get_template("resolve_service_ticket.html")
            email_body = resolution_template.render(
                business_name=business_name,
                ticket_number=ticket_number,
                subject=subject,
                support_link=f"https://linknamali.ke/login"
            )

            # Send email to provider
            send_email_async(
                provider_email,
                f"Linknamali - Ticket #{ticket_number} Resolved",
                email_body,
                is_html=True
            )

            return {"response": "Ticket marked as resolved and provider notified."}, 200

        except Exception as e:
            logging.error(f"Error resolving ticket {ticket_id}: {e}")
            return {"response": "Internal server error."}, 500






# Register the resource with the API
api.add_resource(ServiceProviderSupportTicket, "/create_service_tickets")
api.add_resource(AllServiceTickets, "/all_service_tickets")
api.add_resource(ProviderServiceTickets, "/service_tickets/<string:provider_id>")
api.add_resource(AdminServiceTicketReply, "/admin_reply_serviceticket/<string:ticket_id>")
api.add_resource(ResolveServiceTicket, "/resolve_service_ticket/<string:ticket_id>")