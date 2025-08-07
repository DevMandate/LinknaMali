from flask import Blueprint, request
from flask_restful import Resource, Api
from flask_cors import CORS
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from database.database import db_connection
from jinja2 import Environment, FileSystemLoader, Template
import smtplib
import ssl
import logging
import threading
import os
import uuid





# Create Blueprint
editrequests = Blueprint("edit_requests", __name__)
api = Api(editrequests)
CORS(editrequests, resources={
    r"/editrequests/*": {
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




# Admin Request Property Edit Route
class RequestEditProperty(Resource):
    def post(self):
        connection = None
        cursor = None
        try:
            data = request.get_json()
            if not data:
                return {"message": "Request body must be JSON."}, 400

            # Extract parameters
            property_type = data.get("property_type")  # apartments, houses, land, commercial
            property_id = data.get("id")
            user_id = data.get("user_id")
            edit_details = data.get("edit_details")  # Admin's request details
            admin_id = data.get("admin_id")

            if not property_type or not property_id or not user_id or not edit_details or not admin_id:
                return {"message": "Missing required fields."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Secure SQL query execution
            allowed_tables = {"apartments", "houses", "land", "commercial"}
            if property_type not in allowed_tables:
                return {"message": "Invalid property type."}, 400

            # Fetch property title instead of property ID
            column_name = "title" if property_type in {"apartments", "land", "commercial"} else "house_type"

            query = f"SELECT {column_name} FROM {property_type} WHERE id = %s AND user_id = %s"
            cursor.execute(query, (property_id, user_id))
            property_record = cursor.fetchone()

            if not property_record:
                return {"message": "Property not found or you do not have permission to edit it."}, 404

            property_title = property_record[0]  # Extract property title

            # Mark property as under review
            update_query = f"UPDATE {property_type} SET under_review = TRUE WHERE id = %s"
            cursor.execute(update_query, (property_id,))
            connection.commit()
            

            # Fetch user's email and first_name
            cursor.execute("SELECT email, first_name FROM users WHERE user_id = %s", (user_id,))
            user_data = cursor.fetchone()

            if not user_data:
                return {"message": "User data not found."}, 404

            user_email, first_name = user_data  # Extract email and first_name

            # Read and update the HTML email template
            with open("email_templates/send_for_edits.html", "r", encoding="utf-8") as file:
                email_body = file.read()

            # Ensure placeholders are replaced correctly
            email_body = email_body.replace("{{ first_name }}", first_name)
            email_body = email_body.replace("{{ property_title }}", property_title)
            email_body = email_body.replace("{{ message }}", edit_details)

            # Send email asynchronously
            send_email_async(user_email, "Linknamali - Property Edit Request", email_body, is_html=True)

            conversation_id = str(uuid.uuid4())
            insert_conversation = """
                INSERT INTO edits_conversations (id, sender_id, receiver_id, property_id, property_type, message)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_conversation, (conversation_id, admin_id, user_id, property_id, property_type, edit_details))
            connection.commit()


            return {"message": "Edit request sent to the user via email, and property marked as under review."}, 200

        except Exception as e:
            return {"message": "An error occurred while sending the request.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Confirm Edits Done Route
class ConfirmEditsDone(Resource):
    def post(self):
        connection = None
        cursor = None
        try:
            data = request.get_json()
            property_type = data.get("property_type")
            property_id = data.get("id")
            user_id = data.get("user_id")  # Added for user details
            admin_id = data.get("admin_id")

            if not property_type or not property_id or not user_id:
                return {"message": "Missing required fields."}, 400

            connection = db_connection()
            cursor = connection.cursor()

            allowed_tables = {"apartments", "houses", "land", "commercial"}
            if property_type not in allowed_tables:
                return {"message": "Invalid property type."}, 400

            # Fetch property title
            column_name = "title" if property_type in {"apartments", "land", "commercial"} else "house_type"
            query = f"SELECT {column_name} FROM {property_type} WHERE id = %s"
            cursor.execute(query, (property_id,))
            property_record = cursor.fetchone()

            if not property_record:
                return {"message": "Property not found."}, 404

            property_title = property_record[0]

            # Fetch user details (email and first name)
            cursor.execute("SELECT email, first_name FROM users WHERE user_id = %s", (user_id,))
            user_data = cursor.fetchone()

            if not user_data:
                return {"message": "User data not found."}, 404

            user_email, first_name = user_data

            admin_email = "link.admin@merimedevelopment.co.ke"

            # Read and update the HTML email template
            with open("email_templates/edits_confirmed.html", "r", encoding="utf-8") as file:
                email_body = file.read()

            # Replace placeholders with actual values
            email_body = email_body.replace("{{ first_name }}", first_name)
            email_body = email_body.replace("{{ property_title }}", property_title)

            # Send email asynchronously to notify the admin
            send_email_async(admin_email, "Linknamali - Edits Confirmed", email_body, is_html=True)

            confirmation_message = f"Edits confirmed for property '{property_title}'."
            conversation_id = str(uuid.uuid4())
            insert_conversation = """
                INSERT INTO edits_conversations (id, sender_id, receiver_id, property_id, property_type, message)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_conversation, (conversation_id, user_id, admin_id, property_id, property_type, confirmation_message))
            connection.commit()

            return {"message": "Edits confirmed. Admin has been notified via email."}, 200

        except Exception as e:
            return {"message": "Error confirming edits.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()



# Admin Confirms Edits & Updates under_review Status
class ApproveEdits(Resource):
    def post(self):
        connection = None
        cursor = None
        try:
            data = request.get_json()
            property_type = data.get("property_type")
            property_id = data.get("id")
            admin_id = data.get("admin_id")  # Ensure this is an admin user

            if not property_type or not property_id or not admin_id:
                return {"message": "Missing required fields."}, 400

            connection = db_connection()
            cursor = connection.cursor()

            allowed_tables = {"apartments", "houses", "land", "commercial"}
            if property_type not in allowed_tables:
                return {"message": "Invalid property type."}, 400

            # --- Bypass Admin Verification Start ---
            # cursor.execute("SELECT role FROM users WHERE user_id = %s", (admin_id,))
            # admin_data = cursor.fetchone()
            # if not admin_data or admin_data[0] != "admin":
            #     return {"message": "Unauthorized: Only admins can approve edits."}, 403
            # --- Bypass Admin Verification End ---

            # Mark property as no longer under review
            update_query = f"UPDATE {property_type} SET under_review = FALSE WHERE id = %s"
            cursor.execute(update_query, (property_id,))
            connection.commit()

            return {"message": "Property edit approved. Property is no longer under review."}, 200

        except Exception as e:
            return {"message": "Error approving edits.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Get edit converstaions
class GetEditConversations(Resource):
    def get(self):
        connection = None
        cursor = None
        try:
            connection = db_connection()
            cursor = connection.cursor()
            # Updated query to return houses.title instead of houses.house_type
            query = """
                SELECT 
                    ec.id, 
                    ec.sender_id, 
                    ec.receiver_id, 
                    ec.property_id, 
                    ec.property_type, 
                    ec.message, 
                    ec.is_read, 
                    ec.created_at,
                    COALESCE(h.title, a.title, l.title, c.title) AS property_name
                FROM edits_conversations ec
                LEFT JOIN houses h 
                  ON (ec.property_type = 'houses' AND ec.property_id = h.id)
                LEFT JOIN apartments a 
                  ON (ec.property_type = 'apartments' AND ec.property_id = a.id)
                LEFT JOIN land l 
                  ON (ec.property_type = 'land' AND ec.property_id = l.id)
                LEFT JOIN commercial c 
                  ON (ec.property_type = 'commercial' AND ec.property_id = c.id)
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Convert rows to list of dictionaries, converting datetime to ISO format
            conversations = []
            for row in rows:
                conversations.append({
                    "id": row[0],
                    "sender_id": row[1],
                    "receiver_id": row[2],
                    "property_id": row[3],
                    "property_type": row[4],
                    "message": row[5],
                    "is_read": row[6],
                    "created_at": row[7].isoformat() if row[7] else None,
                    "property_name": row[8]
                })
            
            return {"editConversations": conversations}, 200
        except Exception as e:
            return {"message": "An error occurred while retrieving conversations.", "error": str(e)}, 500
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# delete conversation
class DeleteConversation(Resource):
    def delete(self, conversation_id):
        connection = None
        cursor = None
        try:
            connection = db_connection()
            cursor = connection.cursor()

            # Define the query to delete a conversation by its ID
            query = "DELETE FROM edits_conversations WHERE id = %s"
            cursor.execute(query, (conversation_id,))
            
            # Commit the changes to the database
            connection.commit()

            # Check if the conversation was deleted
            if cursor.rowcount == 0:
                return {"message": "Conversation not found."}, 404

            return {"message": "Conversation deleted successfully."}, 200
        
        except Exception as e:
            return {"message": "An error occurred while deleting the conversation.", "error": str(e)}, 500
        
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()




# Add Resource to API
api.add_resource(RequestEditProperty, "/editrequests")
api.add_resource(ConfirmEditsDone, "/userconfirmedits")
api.add_resource(ApproveEdits, "/approveedits")
api.add_resource(GetEditConversations, '/edit_conversations')
api.add_resource(DeleteConversation, '/conversations/<string:conversation_id>')