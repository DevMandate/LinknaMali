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
service_bookings = Blueprint("service_bookings", __name__)
api = Api(service_bookings)
CORS(service_bookings, resources={
    r"/service_bookings/*": {
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




@service_bookings.route('/', methods=['GET'])
def welcome():
    return "Welcome to service_inquiries section"


# Service Booking class
class ServiceBooking(Resource):
    def post(self):
        try:
            data = request.get_json()
            print("Received JSON:", data)

            if not data:
                return make_response(jsonify({"message": "Invalid or empty request"}), 400)

            # Extract fields
            user_id = data.get("user_id")  # can be None
            service_id = data.get("service_id")
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            email = data.get("email")
            phone_number = data.get("phone_number")
            booking_date = data.get("booking_date")  # should be a valid 'YYYY-MM-DD'
            additional_info = data.get("additional_info")

            # Validate required fields
            if not all([service_id, first_name, last_name, email, phone_number, booking_date]):
                return make_response(jsonify({"message": "Missing required fields"}), 400)

            booking_id = str(uuid.uuid4())
            conn = db_connection()
            cursor = conn.cursor()

            # ✅ Get provider email using service_id
            get_provider_email_query = """
                SELECT email, business_name FROM service_profiles WHERE id = %s
            """
            cursor.execute(get_provider_email_query, (service_id,))
            provider_row = cursor.fetchone()

            if not provider_row:
                return make_response(jsonify({"message": "Service provider not found"}), 404)

            provider_email, business_name = provider_row

            # ✅ Insert into service_bookings table
            insert_query = """
                INSERT INTO service_bookings (
                    id, user_id, service_id, first_name, last_name, email, phone_number,
                    booking_date, additional_info, payment_status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            """
            values = (
                booking_id, user_id, service_id, first_name, last_name, email,
                phone_number, booking_date, additional_info
            )
            cursor.execute(insert_query, values)
            conn.commit()

            # ✅ Send email notification to provider
            subject = f"Linknamali - New Booking Request - {first_name} {last_name}"
            template_name = "service_bookings.html"
            email_context = {
                "business_name": business_name,
                "client_name": f"{first_name} {last_name}",
                "client_email": email,
                "client_phone": phone_number,
                "booking_date": booking_date,
                "additional_info": additional_info or "No extra info",
            }

            send_email_async(provider_email, subject, template_name, email_context)

            cursor.close()
            conn.close()

            return make_response(jsonify({
                "message": "Service booking created successfully",
                "booking_id": booking_id
            }), 201)

        except Exception as e:
            return make_response(jsonify({"message": "Database error", "error": str(e)}), 500)
   

# Service Provider Bookings 
class ServiceProviderBookings(Resource):
    def get(self, provider_user_id):
        try:
            conn = db_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
                SELECT sb.id, sb.first_name, sb.last_name, sb.email, sb.phone_number,
                    sb.booking_date, sb.additional_info, sb.status, sb.payment_status,
                    sb.created_at, sb.updated_at, sp.business_name
                FROM service_bookings sb
                JOIN service_profiles sp ON sb.service_id = sp.id
                WHERE sp.user_id = %s
                ORDER BY sb.created_at DESC
            """

            cursor.execute(query, (provider_user_id,))
            bookings = cursor.fetchall()

            cursor.close()
            conn.close()

            return make_response(jsonify({"bookings": bookings}), 200)

        except Exception as e:
            return make_response(jsonify({"message": "Error fetching bookings", "error": str(e)}), 500)


# Update Service Booking Status
class UpdateServiceBookingStatus(Resource):
    def put(self, booking_id):
        try:
            data = request.get_json()
            new_status = data.get("status")
            rejection_reason = data.get("rejection_reason", None)

            if new_status not in ["confirmed", "rejected"]:
                return make_response(jsonify({"error": "Invalid status. Must be 'confirmed' or 'rejected'."}), 400)

            if new_status == "rejected" and not rejection_reason:
                return make_response(jsonify({"error": "Rejection reason must be provided."}), 400)

            conn = db_connection()
            cursor = conn.cursor(dictionary=True)

            # Fetch user details and business name for email
            cursor.execute("""
                SELECT sb.first_name, sb.email, sp.business_name
                FROM service_bookings sb
                JOIN service_profiles sp ON sb.service_id = sp.id
                WHERE sb.id = %s
            """, (booking_id,))
            booking = cursor.fetchone()

            if not booking:
                return make_response(jsonify({"error": "Booking not found."}), 404)

            # Build update query
            update_fields = "status = %s"
            update_values = [new_status]

            if new_status == "rejected":
                update_fields += ", rejection_reason = %s"
                update_values.append(rejection_reason)
            else:
                update_fields += ", rejection_reason = NULL"

            update_values.append(booking_id)

            query = f"""
                UPDATE service_bookings
                SET {update_fields}, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """

            cursor.execute(query, tuple(update_values))
            conn.commit()

            # ✅ Define booking and login URLs
            booking_url = f"https://linknamali.ke/service_bookings/{booking_id}"
            login_url = "https://linknamali.ke"


            # Prepare email
            subject = ""
            template_name = ""
            context = {
                "first_name": booking["first_name"],
                "business_name": booking["business_name"]
                
            }

            if new_status == "confirmed":
                subject = "Linknamali - Service Booking is Confirmed!"
                template_name = "servicebookings_confirmation.html"
                context["booking_url"] = booking_url
                context["login_url"] = login_url
            elif new_status == "rejected":
                subject = "Linknamali - Service Booking was Rejected"
                template_name = "servicebookings_rejection.html"
                context["rejection_reason"] = rejection_reason
                context["login_url"] = login_url
                context["booking_url"] = booking_url

            send_email_async(booking["email"], subject, template_name, context)

            cursor.close()
            conn.close()

            return make_response(jsonify({"message": "Booking status updated and email sent successfully."}), 200)

        except Exception as e:
            return make_response(jsonify({"error": str(e), "message": "Failed to update booking status"}), 500)



# Service Booking Cancellation class
class CancelServiceBooking(Resource):
    def post(self):
        try:
            data = request.get_json()
            print("Received JSON:", data)

            if not data:
                return make_response(jsonify({"message": "Invalid or empty request"}), 400)

            # Extract fields
            booking_id = data.get("booking_id")
            cancellation_reason = data.get("cancellation_reason")

            # Validate required fields
            if not all([booking_id, cancellation_reason]):
                return make_response(jsonify({"message": "Missing required fields"}), 400)

            # Database connection
            conn = db_connection()
            cursor = conn.cursor()

            # ✅ Fetch booking details using booking_id
            get_booking_query = """
                SELECT service_id, user_id, first_name, last_name, email, phone_number, status
                FROM service_bookings
                WHERE id = %s
            """
            cursor.execute(get_booking_query, (booking_id,))
            booking = cursor.fetchone()

            if not booking:
                return make_response(jsonify({"message": "Booking not found"}), 404)

            service_id, user_id, first_name, last_name, email, phone_number, status = booking

            # Check if the booking is already cancelled
            if status == 'cancelled':
                return make_response(jsonify({"message": "Booking has already been cancelled"}), 400)

            # ✅ Get provider email using service_id
            get_provider_email_query = """
                SELECT email, business_name FROM service_profiles WHERE id = %s
            """
            cursor.execute(get_provider_email_query, (service_id,))
            provider_row = cursor.fetchone()

            if not provider_row:
                return make_response(jsonify({"message": "Service provider not found"}), 404)

            provider_email, business_name = provider_row

            # ✅ Update the booking status to cancelled and store the cancellation reason
            update_query = """
                UPDATE service_bookings
                SET status = 'cancelled', rejection_reason = %s
                WHERE id = %s
            """
            cursor.execute(update_query, (cancellation_reason, booking_id))
            conn.commit()

            # ✅ Send email notification to the service provider about the cancellation
            provider_subject = f"Linknamali - Booking Cancelled - {first_name} {last_name}"
            provider_template_name = "booking_cancellation_provider.html"
            provider_email_context = {
                "business_name": business_name,
                "client_name": f"{first_name} {last_name}",
                "client_email": email,
                "client_phone": phone_number,
                "booking_id": booking_id,
                "cancellation_reason": cancellation_reason,
            }

            send_email_async(provider_email, provider_subject, provider_template_name, provider_email_context)

            # ✅ Send email confirmation to the user that their booking has been cancelled
            user_subject = f"Linknamali - Booking Cancellation Confirmation - {first_name} {last_name}"
            user_template_name = "booking_cancellation_user.html"
            user_email_context = {
                "client_name": f"{first_name} {last_name}",
                "client_email": email,
                "client_phone": phone_number,
                "booking_id": booking_id,
                "cancellation_reason": cancellation_reason,
            }

            send_email_async(email, user_subject, user_template_name, user_email_context)

            cursor.close()
            conn.close()

            return make_response(jsonify({
                "message": "Booking cancelled successfully",
                "booking_id": booking_id
            }), 200)

        except Exception as e:
            return make_response(jsonify({"message": "Database error", "error": str(e)}), 500)




# ALTER DATABASE linknamali CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
#  Register endpoints
api.add_resource(ServiceBooking, '/service_bookings')
api.add_resource(ServiceProviderBookings, '/service_bookings/<string:provider_user_id>')
api.add_resource(UpdateServiceBookingStatus, '/updateservicebookings/<string:booking_id>')
api.add_resource(CancelServiceBooking, '/cancelservicebookings')
