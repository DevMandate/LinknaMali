from flask import Blueprint, request, jsonify
from flask_restful import Resource, Api
from database.database import db_connection
from flask_cors import CORS
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Environment, FileSystemLoader
from werkzeug.utils import secure_filename
import asyncio
import aioboto3
import os
import smtplib
import ssl
import logging
import uuid
import threading


# Create Blueprint
supportticket = Blueprint("support_ticket", __name__)
api = Api(supportticket)


# Updated CORS: Allow all routes on this blueprint
CORS(supportticket, resources={
    r"/*": {
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




CLOUDFLARE_ACCESS_KEY = os.getenv("CLOUDFLARE_ACCESS_KEY")
CLOUDFLARE_SECRET_KEY = os.getenv("CLOUDFLARE_SECRET_KEY")




if not CLOUDFLARE_ACCESS_KEY or not CLOUDFLARE_SECRET_KEY:
    raise ValueError("❌ Cloudflare credentials are missing! Set them as environment variables.")


# Cloudflare R2 Config
CLOUDFLARE_BUCKET_NAME = "linknamali"
CLOUDFLARE_ENDPOINT = "https://d418c3595b04db7f9e063c255ea021d0.r2.cloudflarestorage.com"


# file validation
def get_content_type(filename):
    """Determines the correct Content-Type based on file extension."""
    file_extension = filename.rsplit(".", 1)[-1].lower()


    # ✅ Image Content-Types
    if file_extension in ["jpg", "jpeg"]:
        return "image/jpeg"
    elif file_extension == "png":
        return "image/png"
    elif file_extension == "gif":
        return "image/gif"


    # ✅ Document Content-Types
    elif file_extension == "pdf":
        return "application/pdf"
    elif file_extension == "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif file_extension == "txt":
        return "text/plain"


    # ❌ Default for unsupported types
    return "application/octet-stream"


# Upload evidence to Cloudflare R2
async def upload_evidence(file_obj, filename):
    session = aioboto3.Session()

    # Extract file extension
    evidence_id = str(uuid.uuid4())
    file_extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    object_name = f"support_tickets/{evidence_id}.{file_extension}"  # Unique name
    content_type = get_content_type(filename)  # Determine correct content type


    try:
        async with session.client(
            "s3",
            endpoint_url=CLOUDFLARE_ENDPOINT,
            aws_access_key_id=CLOUDFLARE_ACCESS_KEY,
            aws_secret_access_key=CLOUDFLARE_SECRET_KEY
        ) as s3_client:
            await s3_client.put_object(
                Bucket=CLOUDFLARE_BUCKET_NAME,
                Key=object_name,
                Body=file_obj,
                ContentType=content_type
            )
            return f"https://files.linknamali.ke/{object_name}"


    except Exception as e:
        logger.error(f"Evidence upload failed: {e}")
        return None


# Email Configuration
SMTP_SERVER = "mail.merimedevelopment.co.ke"
SMTP_PORT = 587
SENDER_EMAIL = "support@merimedevelopment.co.ke"
SENDER_PASSWORD = "M4r1meDvSup0"  

Logo = "https://linknamali.ke/images/Linknamali.png"


# Load email templates
env = Environment(loader=FileSystemLoader("email_templates"))

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


# Create Support Ticket Function
def create_support_ticket(user_id, email, type, subject, urgency, message, first_name, evidence_url=None, property_id=None, ad_id=None):
    """Creates a support ticket and prevents duplicate submissions."""
    connection = None
    cursor = None
    try:
        connection = db_connection()
        if not connection:
            raise Exception("Database connection failed")

        cursor = connection.cursor(buffered=True)

        # If user_id is not provided, fetch it using email
        if not user_id:
            cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
            user_data = cursor.fetchone()
            cursor.fetchall()  # ✅ Clear any remaining results

            if not user_data:
                raise Exception("User not found.")
            user_id = user_data[0]

        # ✅ Check for Duplicate Open Ticket with the Same Message
        cursor.execute("""
            SELECT ticket_id FROM support_tickets 
            WHERE user_id = %s AND subject = %s AND message = %s AND status = 'Open'
        """, (user_id, subject, message))
        duplicate_ticket = cursor.fetchone()
        cursor.fetchall()  # ✅ Clear remaining results

        if duplicate_ticket:
            return {
                "response": "A similar open support ticket already exists.",
                "ticket_id": duplicate_ticket[0],
                "status": "Duplicate"
            }, 409  # HTTP 409 Conflict

        # Generate ticket_id
        ticket_id = str(uuid.uuid4())

        # ✅ Insert New Ticket
        sql = """
            INSERT INTO support_tickets (user_id, email, type, subject, urgency, message, status, ticket_id, evidence, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'Open', %s, %s, NOW())
        """
        cursor.execute(sql, (user_id, email, type, subject, urgency, message, ticket_id, evidence_url))
        connection.commit()

        # Fetch the last inserted ticket_seq
        cursor.execute("SELECT ticket_seq FROM support_tickets WHERE user_id = %s ORDER BY created_at DESC LIMIT 1", (user_id,))
        ticket_seq_result = cursor.fetchone()
        cursor.fetchall()  # ✅ Clear remaining results

        if not ticket_seq_result:
            raise Exception("Failed to retrieve ticket_seq")

        ticket_seq = ticket_seq_result[0]
        ticket_number = f"SPT{ticket_seq}"

        # Update ticket_number
        cursor.execute("UPDATE support_tickets SET ticket_number = %s WHERE ticket_seq = %s", (ticket_number, ticket_seq))
        connection.commit()

        # Send notification to admin
        cursor.execute("SELECT first_name FROM users WHERE user_id = %s", (user_id,))
        first_name_data = cursor.fetchone()
        cursor.fetchall()  # ✅ Clear remaining results
        first_name = first_name_data[0] if first_name_data else "Unknown User"

        send_admin_notification(ticket_number, email, type, subject, urgency, message, first_name, evidence_url)

        print(f"Support ticket {ticket_number} created successfully for user {user_id} ({email})")

        return {"ticket_id": ticket_id, "ticket_number": ticket_number, "status": "Open", "evidence_url": evidence_url}

    except Exception as e:
        print(f"Error creating support ticket: {str(e)}")
        return {"error": str(e)}

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()





# store evidence url in the database
def store_evidence_url(ticket_id, evidence_url):
    """Stores the evidence URL in the support_tickets table."""
    connection = None
    cursor = None
    try:
        connection = db_connection()
        cursor = connection.cursor()


        # Update the evidence URL
        update_query = "UPDATE support_tickets SET evidence = %s WHERE ticket_id = %s"
        cursor.execute(update_query, (evidence_url, ticket_id))
        connection.commit()


        logging.info(f"Evidence URL stored for ticket {ticket_id}")


    except Exception as e:
        logging.error(f"Error storing evidence URL: {e}")


    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# Sending Admin Notification
def send_admin_notification(ticket_number, email, type, subject, urgency, message, first_name, evidence_url):
    """Sends an email notification to the admin about a new support ticket asynchronously."""
    try:
        receiver_email = "link.admin@merimedevelopment.co.ke"
        email_subject = f"Linknamali - New Support Ticket - {urgency} Priority"
        template = env.get_template("admin_notification.html")     

        email_body = template.render(
            first_name=first_name,
            ticket_number=ticket_number,
            email=email,  
            type=type,  
            subject=subject,  
            urgency=urgency,  
            message=message,  
            evidence_url=evidence_url  
        )

        send_email_async(receiver_email, email_subject, email_body, is_html=True)
        logging.info("Admin email notification sent successfully.")
    except Exception as e:
        logging.error(f"Error sending admin email notification: {e}")


# User acknowledgment
def send_user_acknowledgment(ticket_number, email, subject):
    """Sends an acknowledgment email to the user asynchronously."""
    connection = None
    cursor = None
    try:
        # Fetch first name of the user
        connection = db_connection()
        cursor = connection.cursor()
        user_sql = "SELECT first_name FROM users WHERE email = %s"
        cursor.execute(user_sql, (email,))
        user = cursor.fetchone()


        if not user:
            raise Exception("User not found.")


        first_name = user[0]


        # Load the HTML template and render it
        template = env.get_template("acknowledgment_email.html")
        email_body = template.render(
            first_name=first_name,
            ticket_number=ticket_number,
            subject=subject,
            company_logo_url=Logo
        )


        email_subject = "Linknamali - Support Ticket Received"
        send_email_async(email, email_subject, email_body, is_html=True)
        logging.info(f"Acknowledgment email sent successfully to {email}.")


    except Exception as e:
        logging.error(f"Error sending acknowledgment email: {e}")


    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# Send resolved email with a default admin_response
def send_ticket_resolved_email(ticket_id, email, admin_response=""):
    """Sends an email notifying the user that their support ticket has been resolved asynchronously."""
    connection = None
    cursor = None
    try:
        # Connect to DB
        connection = db_connection()
        cursor = connection.cursor()


        # Fetch first name of the user and ticket_number using ticket_id
        user_sql = """
            SELECT u.first_name, t.ticket_number
            FROM users u
            JOIN support_tickets t ON u.email = t.email
            WHERE t.ticket_id = %s
        """
        cursor.execute(user_sql, (ticket_id,))
        result = cursor.fetchone()


        if not result:
            raise Exception(f"User with email {email} or ticket ID {ticket_id} not found.")


        first_name, ticket_number = result


        # Load email template
        env = Environment(loader=FileSystemLoader(os.path.join(os.getcwd(), "email_templates")))
        template = env.get_template("resolved_ticket_email.html")
        email_body = template.render(first_name=first_name, ticket_number=ticket_number, admin_response=admin_response)


        email_subject = f"Linknamali - Ticket Resolved - {ticket_number}"


        # Send email asynchronously with HTML content
        send_email_async(email, email_subject, email_body, is_html=True)
        logging.info(f"Resolved status email sent to {email} for ticket {ticket_number}.")


    except Exception as e:
        logging.error(f"Error sending ticket resolved email: {e}")


    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# Send admin response email and update ticket status
def send_admin_response_email(ticket_id, email, admin_response):
    """Sends an email notifying the user that an admin has responded to their support ticket asynchronously.
    Also updates the ticket status to 'In Progress' and logs the response in the conversation table.
    """
    connection = None
    cursor = None
    try:
        # Connect to DB
        connection = db_connection()
        cursor = connection.cursor()

        # Fetch first name of the user, ticket_number, status, and user_id using ticket_id
        user_sql = """
            SELECT u.first_name, t.ticket_number, t.status, t.user_id
            FROM users u
            JOIN support_tickets t ON u.email = t.email
            WHERE t.ticket_id = %s
        """
        cursor.execute(user_sql, (ticket_id,))
        result = cursor.fetchone()

        if not result:
            raise Exception(f"User with email {email} or ticket ID {ticket_id} not found.")

        first_name, ticket_number, status, ticket_user_id = result

        # If ticket is still "Open", update status to "In Progress"
        if status == "Open":
            update_status_query = "UPDATE support_tickets SET status = 'In Progress' WHERE ticket_id = %s"
            cursor.execute(update_status_query, (ticket_id,))
            connection.commit()

        # Log admin response in the support_ticket_conversations table including the user_id
        log_response_query = """
            INSERT INTO support_ticket_conversations (con_id, ticket_id, sender, message, is_read, user_id)
            VALUES (UUID(), %s, 'Admin', %s, 0, %s)
        """
        cursor.execute(log_response_query, (ticket_id, admin_response, ticket_user_id))
        connection.commit()

        # Read the HTML email template
        with open("email_templates/admin_response_email.html", "r", encoding="utf-8") as file:
            email_body = file.read()

        # Replace placeholders with actual values
        email_body = email_body.replace("{first_name}", first_name)
        email_body = email_body.replace("{ticket_number}", ticket_number)
        email_body = email_body.replace("{admin_response}", admin_response)

        # Email subject
        email_subject = f"Linknamali - Update on Your Support Ticket - {ticket_number}"

        # Send email asynchronously
        send_email_async(email, email_subject, email_body, is_html=True)
        logging.info(f"Admin response email sent to {email} for ticket {ticket_number}.")

    except Exception as e:
        logging.error(f"Error sending admin response email: {e}")

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# Support Ticket Resource
class SupportTicket(Resource):
    """Handles support ticket creation and related database operations."""
    
    def post(self):
        """Creates a support ticket and logs the conversation."""
        try:
            user_id = request.form.get("user_id")
            email = request.form.get("email")
            ticket_type = request.form.get("type")
            subject = request.form.get("subject")
            urgency = request.form.get("urgency")
            message = request.form.get("message")
            evidence_file = request.files.get("evidence")


            # New Optional Fields
            property_id  = request.form.get("property_id") 
            ad_id = request.form.get("ad_id")



            # Validate required fields
            if not email or not ticket_type or not subject or not message or not urgency:
                return {"response": "All fields are required."}, 400

            if urgency not in ["High", "Medium", "Low"]:
                return {"response": "Invalid urgency level."}, 400

            # Fetch user_id if not provided
            user_id = user_id or self.get_user_id_by_email(email)
            if not user_id:
                return {"response": "User not found."}, 404

            # Fetch user's first_name
            first_name = self.get_user_first_name(user_id) or "User"


             # Validate property_id or ad_id based on ticket_type
            if ticket_type == "Listings" and not property_id:
                return {"response": "Please select a property for this listing request."}, 400
            if ticket_type == "Ads" and not ad_id:
                return {"response": "Please select an ad for this request."}, 400



            # Upload evidence if provided
            evidence_url = self.upload_evidence_if_exists(evidence_file)
            if evidence_file and not evidence_url:
                return {"response": "Failed to upload evidence file."}, 500

            # Create Support Ticket
            response = create_support_ticket(user_id, email, ticket_type, subject, urgency, message, first_name, evidence_url, property_id, ad_id)
            
            # ✅ Ensure proper handling of tuple response
            if isinstance(response, tuple):  # If it's a tuple (duplicate ticket case)
                response_data, status_code = response  # Unpack tuple
                return response_data, status_code

            # If the response doesn't contain 'ticket_number', it's an error
            if "ticket_number" not in response:
                return {"response": f"Failed to create support ticket: {response.get('error', 'Unknown error')}"}, 500

            ticket_id = response["ticket_id"]
            ticket_number = response["ticket_number"]

            # Log the user’s initial message
            self.log_conversation(ticket_id, "User", message)
            send_user_acknowledgment(ticket_number, email, subject)

            return {
                "user_id": user_id,
                "ticket_id": ticket_id,
                "ticket_number": ticket_number,
                "response": "Support ticket created successfully.",
                "evidence_url": evidence_url,
                "status": "Open"
            }, 201

        except Exception as e:
            logging.error(f"Error handling support ticket: {e}")
            return {"response": "Internal server error."}, 500


    def get_user_id_by_email(self, email):
        """Fetches user_id based on email."""
        return self.fetch_single_value("SELECT user_id FROM users WHERE email = %s", (email,))

    def get_user_first_name(self, user_id):
        """Fetches first_name based on user_id."""
        return self.fetch_single_value("SELECT first_name FROM users WHERE user_id = %s", (user_id,))

    def fetch_single_value(self, query, params):
        """Executes a query and returns a single value result."""
        connection, cursor = None, None
        try:
            connection = db_connection()
            cursor = connection.cursor()
            cursor.execute(query, params)
            result = cursor.fetchone()
            return result[0] if result else None
        except Exception as e:
            logging.error(f"Database query error: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def log_conversation(self, ticket_id, sender, message, user_id=None):
        """Logs a message in the support_ticket_conversations table."""
        try:
            connection = db_connection()
            cursor = connection.cursor()
            query = """
                INSERT INTO support_ticket_conversations (con_id, ticket_id, sender, message, sent_at, is_read, user_id)
                VALUES (%s, %s, %s, %s, NOW(), 0, %s)
            """
            cursor.execute(query, (str(uuid.uuid4()), ticket_id, sender, message, user_id))
            connection.commit()
        except Exception as e:
            logging.error(f"Error logging conversation: {e}")
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


    def upload_evidence_if_exists(self, evidence_file):
        """Uploads the evidence file if it exists."""
        if not evidence_file:  # If no file is uploaded, return None
            return None

        filename = secure_filename(evidence_file.filename)
        if not filename:
            return None

        return asyncio.run(upload_evidence(evidence_file, filename))

# Update ticket status
class UpdateTicketStatus(Resource):
    def put(self, ticket_id):
        connection = None
        cursor = None
        try:
            data = request.get_json()
            if not data or 'status' not in data:
                return {"message": "Status field is required."}, 400


            new_status = data['status'].strip()
            valid_statuses = ['Open', 'Resolved']
            if new_status not in valid_statuses:
                return {
                    "message": f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}"
                }, 400


            # Connect to the database
            connection = db_connection()
            cursor = connection.cursor()


            # Check if the ticket exists and fetch the user email & ticket number
            check_query = "SELECT email, ticket_number FROM support_tickets WHERE ticket_id = %s"
            cursor.execute(check_query, (ticket_id,))
            ticket = cursor.fetchone()


            if not ticket:
                return {"message": "Ticket not found."}, 404


            user_email, ticket_number = ticket  # Extract email and ticket_number


            # Update the ticket's status
            update_query = "UPDATE support_tickets SET status = %s WHERE ticket_id = %s"
            cursor.execute(update_query, (new_status, ticket_id))
            connection.commit()


            print(f"Updated status for ticket {ticket_id} ({ticket_number}) to '{new_status}'.")


            # If the status is "Resolved", send notification email (without admin response)
            if new_status == "Resolved":
                send_ticket_resolved_email(ticket_id, user_email)


            return {
                "message": "Ticket status updated successfully.",
                "ticket_id": ticket_id,
                "ticket_number": ticket_number,
                "status": new_status
            }, 200


        except Exception as e:
            return {
                "message": "An error occurred while updating the ticket status.",
                "error": str(e)
            }, 500


        finally:
            if cursor:
                cursor.close()
        if connection:
            connection.close()

# Send Admin Response
class SendAdminResponse(Resource):
    """API Resource to send an admin response, update ticket status, and log conversation."""

    def post(self):
        """Handles admin response, updates ticket status, logs response, and notifies the user."""
        connection = None
        cursor = None
        try:
            data = request.get_json()
            ticket_id = data.get("ticket_id")
            admin_response = data.get("admin_response")

            if not ticket_id or not admin_response:
                return jsonify({"error": "Missing required fields"}), 400

            # Fetch user email and ticket_number using ticket_id
            connection = db_connection()
            cursor = connection.cursor()
            query = "SELECT email, ticket_number FROM support_tickets WHERE ticket_id = %s"
            cursor.execute(query, (ticket_id,))
            result = cursor.fetchone()

            if not result:
                return {"error": "Ticket not found"}, 404

            email, ticket_number = result

            # Log admin response in conversations (updated to include user_id)
            self.log_conversation(ticket_id, "Admin", admin_response)

            # Update Ticket Status to 'In Progress'
            update_status_query = "UPDATE support_tickets SET status = 'In Progress' WHERE ticket_id = %s"
            cursor.execute(update_status_query, (ticket_id,))
            connection.commit()

            # Send response email to user
            send_admin_response_email(ticket_id, email, admin_response)

            return {
                "message": "Admin response email sent successfully!",
                "ticket_id": ticket_id,
                "ticket_number": ticket_number
            }, 200

        except Exception as e:
            logging.error(f"Error in /send-admin-response: {e}")
            return {"error": "Failed to send email"}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def log_conversation(self, ticket_id, sender, message):
        """Logs a message into the support_ticket_conversations table."""
        connection = None
        cursor = None
        try:
            connection = db_connection()
            cursor = connection.cursor()
            # Fetch user_id from support_tickets for the given ticket_id
            cursor.execute("SELECT user_id FROM support_tickets WHERE ticket_id = %s", (ticket_id,))
            result = cursor.fetchone()
            if not result:
                raise Exception("Ticket not found when retrieving user_id")
            ticket_user_id = result[0]

            log_response_query = """
                INSERT INTO support_ticket_conversations (con_id, ticket_id, sender, message, is_read, user_id)
                VALUES (UUID(), %s, %s, %s, 0, %s)
            """
            cursor.execute(log_response_query, (ticket_id, sender, message, ticket_user_id))
            connection.commit()
            logging.info(f"Logged {sender}'s response for ticket {ticket_id}.")
        except Exception as e:
            logging.error(f"Error logging conversation: {e}")
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

# User Respond to Ticket
class UserRespondToTicket(Resource):    
    def post(self):
        """Handles user response to a support ticket, including evidence file upload."""
        connection = None
        cursor = None
        try:
            # Ensure request is multipart/form-data
            if "ticket_id" not in request.form or "email" not in request.form or "user_response" not in request.form:
                return {"error": "Missing required fields"}, 400

            # Extract form data
            ticket_id = request.form["ticket_id"]
            user_email = request.form["email"]
            user_response = request.form["user_response"]
            evidence_file = request.files.get("evidence")  # File upload

            # Log to verify if the evidence is actually optional
            if evidence_file is None:
                logging.info("No evidence file uploaded.")
            else:
                logging.info("Evidence file uploaded.")


            # Connect to DB
            connection = db_connection()
            cursor = connection.cursor()

            # Validate ticket ownership
            query = """
                SELECT u.first_name, t.email, t.status, t.ticket_number, t.user_id
                FROM users u
                JOIN support_tickets t ON u.email = t.email
                WHERE t.ticket_id = %s
            """
            cursor.execute(query, (ticket_id,))
            result = cursor.fetchone()

            if not result:
                return {"error": "Ticket not found"}, 404

            first_name, ticket_owner_email, status, ticket_number, ticket_user_id = result

            if ticket_owner_email != user_email:
                return {"error": "Unauthorized. You can only respond to your own ticket."}, 403

            # Upload evidence if provided
            evidence_url = None
            if evidence_file:
                filename = secure_filename(evidence_file.filename)
                evidence_url = asyncio.run(upload_evidence(evidence_file, filename)) if filename else None

            # Insert user response into the conversation table
            con_id = str(uuid.uuid4())  # Generate unique conversation ID
            log_response_query = """
                INSERT INTO support_ticket_conversations (con_id, ticket_id, sender, message, is_read, user_id, evidence)
                VALUES (%s, %s, 'User', %s, 0, %s, %s)
            """
            cursor.execute(log_response_query, (con_id, ticket_id, user_response, ticket_user_id, evidence_url))
            connection.commit()

            # Optionally update ticket status
            if status == "In Progress":
                update_status_query = "UPDATE support_tickets SET status = 'User Responded' WHERE ticket_id = %s"
                cursor.execute(update_status_query, (ticket_id,))
                connection.commit()

            # Notify the admin
            self.notify_admin(first_name, user_email, user_response, ticket_number, evidence_url)

            return {
                "message": "User response submitted successfully!",
                "ticket_number": ticket_number,
                "evidence": evidence_url if evidence_url else None
            }, 200

        except Exception as e:
            logging.error(f"Error in /user-respond-ticket: {e}")
            return {"error": "Failed to submit response"}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def notify_admin(self, first_name, user_email, user_response, ticket_number, evidence_url=None):
        """Sends an email to the admin notifying them of a user's response."""
        try:
            admin_email = "link.admin@merimedevelopment.co.ke"  # Change this accordingly

            # Read the HTML email template
            with open("email_templates/user_response_email.html", "r", encoding="utf-8") as file:
                email_body = file.read()

            # Replace placeholders correctly
            email_body = email_body.replace("{first_name}", first_name)
            email_body = email_body.replace("{ticket_number}", ticket_number)
            email_body = email_body.replace("{user_email}", user_email)
            email_body = email_body.replace("{user_response}", user_response)

            # Handle optional evidence URL
            evidence_html = f"<p><strong>Evidence:</strong> <a href='{evidence_url}' target='_blank'>View Evidence</a></p>" if evidence_url else ""
            email_body = email_body.replace("{evidence_url_section}", evidence_html)

            # Email subject
            email_subject = f"New User Response for Ticket #{ticket_number}"

            # Send email asynchronously
            send_email_async(admin_email, email_subject, email_body, is_html=True)
            logging.info(f"Admin notified of user response for ticket #{ticket_number}.")

        except Exception as e:
            logging.error(f"Error sending admin notification: {e}")

# Get ticket
class GetSupportTickets(Resource):
    def get(self):
        """Fetches all support tickets along with username, ticket number, and evidence."""
        connection = None
        cursor = None
        try:
            # Establish the database connection
            connection = db_connection()
            if not connection:
                return {"response": "Database connection failed"}, 500

            cursor = connection.cursor()

            # Query to fetch tickets ordered by creation date (newest first)
            query = """
                SELECT 
                    st.ticket_id, 
                    CONCAT(u.first_name, ' ', u.last_name) AS username, 
                    st.email, 
                    st.type, 
                    st.subject, 
                    st.urgency, 
                    st.message, 
                    st.status, 
                    st.ticket_number, 
                    st.evidence,  -- Added evidence
                    st.created_at, 
                    st.updated_at
                FROM support_tickets AS st
                JOIN users AS u ON st.user_id = u.user_id
                ORDER BY st.created_at DESC
            """
            cursor.execute(query)
            rows = cursor.fetchall()

            # Convert the fetched rows into a list of dictionaries
            tickets = []
            for row in rows:
                ticket = {
                    "ticket_id": row[0],
                    "username": row[1],  # Full name from users table
                    "email": row[2],
                    "type": row[3],
                    "subject": row[4],
                    "urgency": row[5],
                    "message": row[6],
                    "status": row[7],
                    "ticket_number": row[8],  # Fetching the ticket number
                    "evidence": row[9],  # Added evidence
                    "created_at": row[10].isoformat() if row[10] else None,
                    "updated_at": row[11].isoformat() if row[11] else None,
                }
                tickets.append(ticket)

            return {"response": "Success", "tickets": tickets}, 200

        except Exception as e:
            logging.error(f"Error fetching tickets: {e}")
            return {"response": "An error occurred while fetching tickets.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

# Delete Ticket
class DeleteTicket(Resource):
    def delete(self, ticket_id):
        connection = None
        cursor = None
        try:
            # Connect to the database
            connection = db_connection()
            cursor = connection.cursor()


            # Check if the ticket exists
            check_query = "SELECT ticket_id FROM support_tickets WHERE ticket_id = %s"
            cursor.execute(check_query, (ticket_id,))
            ticket = cursor.fetchone()


            if not ticket:
                return {"message": "Ticket not found."}, 404


            # Delete the ticket from the database
            delete_query = "DELETE FROM support_tickets WHERE ticket_id = %s"
            cursor.execute(delete_query, (ticket_id,))
            connection.commit()


            print(f"Deleted ticket with ticket_id {ticket_id}.")


            return {"message": f"Ticket with id {ticket_id} deleted successfully."}, 200


        except Exception as e:
            return {
                "message": "An error occurred while deleting the ticket.",
                "error": str(e)
            }, 500


        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

# Get Ticket Conversations
class GetTicketConversations(Resource):
    """API Resource to fetch all messages related to a support ticket."""

    def get(self, ticket_id):
        """Retrieves all messages in a support ticket conversation and marks them as read."""
        connection = None
        cursor = None
        try:
            connection = db_connection()
            cursor = connection.cursor()

            # Modified query to include the 'evidence' column alongside other fields
            query = """
                SELECT con_id, sender, message, sent_at, is_read, evidence
                FROM support_ticket_conversations
                WHERE ticket_id = %s
                ORDER BY sent_at ASC
            """
            cursor.execute(query, (ticket_id,))
            messages = cursor.fetchall()

            if not messages:
                return {"message": "No conversations found for this ticket"}, 404

            # Convert results to JSON format
            conversation = []
            unread_message_ids = []
            for row in messages:
                # Extended unpacking to capture the evidence column without deleting any code lines
                con_id, sender, message, sent_at, is_read, evidence = row

                # Convert datetime to string for JSON serialization
                if hasattr(sent_at, "isoformat"):
                    sent_at_str = sent_at.isoformat()
                else:
                    sent_at_str = str(sent_at)

                conversation.append({
                    "sender": sender,
                    "message": message,
                    "sent_at": sent_at_str,
                    "is_read": bool(is_read),
                    "evidence": evidence  # Added to include the evidence URL from the database
                })

                if is_read == 0:  # If message is unread, mark it for updating
                    unread_message_ids.append(con_id)

            # Mark unread messages as read
            if unread_message_ids:
                placeholders = ','.join(['%s'] * len(unread_message_ids))
                update_query = f"""
                    UPDATE support_ticket_conversations
                    SET is_read = 1
                    WHERE con_id IN ({placeholders})
                """
                cursor.execute(update_query, tuple(unread_message_ids))
                connection.commit()

                # Update conversation list to reflect the new read status
                for msg in conversation:
                    msg["is_read"] = True

            return {"ticket_id": ticket_id, "conversation": conversation}, 200

        except Exception as e:
            logging.error(f"Error fetching ticket conversations: {e}")
            return {"error": "Failed to retrieve conversations"}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

# Get Tickets by User ID with Conversation History
class GetUserTickets(Resource):
    def get(self, user_id):
        connection = None
        cursor = None
        try:
            # Connect to the database
            connection = db_connection()
            cursor = connection.cursor(dictionary=True)


            # Check if the user exists
            user_query = "SELECT first_name, email FROM users WHERE user_id = %s"
            cursor.execute(user_query, (user_id,))
            user = cursor.fetchone()


            if not user:
                return {"error": "User not found"}, 404


            user_email = user["email"]


            # Fetch all tickets for the user
            tickets_query = """
                SELECT ticket_id, ticket_number, subject, status, created_at
                FROM support_tickets WHERE email = %s
                ORDER BY created_at DESC
            """
            cursor.execute(tickets_query, (user_email,))
            tickets = cursor.fetchall()


            if not tickets:
                return {"message": "No tickets found for this user"}, 200


            # Fetch conversations for each ticket
            for ticket in tickets:
                ticket["created_at"] = ticket["created_at"].strftime("%Y-%m-%d %H:%M:%S")  # Convert datetime to string
                ticket_id = ticket["ticket_id"]
               
                conversation_query = """
                    SELECT sender, message, created_at
                    FROM support_ticket_conversations
                    WHERE ticket_id = %s
                    ORDER BY created_at ASC
                """
                cursor.execute(conversation_query, (ticket_id,))
                conversations = cursor.fetchall()
               
                # Convert conversation timestamps to string
                for conversation in conversations:
                    conversation["created_at"] = conversation["created_at"].strftime("%Y-%m-%d %H:%M:%S")
               
                ticket["conversations"] = conversations  # Attach messages to ticket
           
            return {"user_tickets": tickets}, 200


        except Exception as e:
            logging.error(f"Error in /get-user-tickets/{user_id}: {e}")
            return {"error": "Failed to fetch tickets"}, 500


        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

# Get User Listings
class UserListings(Resource):
    def get(self, user_id):
        """Fetch all listings for a specific user."""
        try:
            connection = db_connection()
            cursor = connection.cursor()

            query = """
                SELECT id, house_type AS title FROM houses WHERE user_id = %s
                UNION
                SELECT id, land_type AS title FROM land WHERE user_id = %s
                UNION
                SELECT id, commercial_type AS title FROM commercial WHERE user_id = %s
                UNION
                SELECT id, apartment_type AS title FROM apartments WHERE user_id = %s
            """
            cursor.execute(query, (user_id, user_id, user_id, user_id))
            listings = cursor.fetchall()

            return {"response": "Success", "listings": [{"id": row[0], "title": row[1]} for row in listings]}, 200

        except Exception as e:
            return {"response": "Error fetching listings", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

class UserAds(Resource):
    def get(self, user_id):
        """Fetch active ads for a specific user."""
        try:
            connection = db_connection()
            cursor = connection.cursor()

            query = "SELECT ad_id, title FROM ads WHERE user_id = %s AND status = 'Active'"
            cursor.execute(query, (user_id,))
            ads = cursor.fetchall()

            return {"response": "Success", "ads": [{"id": row[0], "title": row[1]} for row in ads]}, 200

        except Exception as e:
            return {"response": "Error fetching ads", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

# Register Resource with API
api.add_resource(SupportTicket, "/supportticket")
api.add_resource(UpdateTicketStatus, '/tickets/<string:ticket_id>')
api.add_resource(GetSupportTickets, '/support/tickets')
api.add_resource(SendAdminResponse, '/sendadminresponse')
api.add_resource(UserRespondToTicket, "/userrespondticket")
api.add_resource(DeleteTicket, '/tickets/<string:ticket_id>/delete')
api.add_resource(GetTicketConversations, '/ticketconversations/<string:ticket_id>')
api.add_resource(GetUserTickets, '/getusertickets/<string:user_id>')
api.add_resource(UserListings, '/userlistings/<string:user_id>')
api.add_resource(UserAds, '/userads/<string:user_id>')





