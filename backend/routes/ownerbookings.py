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
ownerbookings = Blueprint("ownerbookings", __name__)
api = Api(ownerbookings)
CORS(ownerbookings, resources={
    r"/ownerbookings/*": {
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



@ownerbookings.route('/', methods=['GET'])
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
template_path = os.path.join(BASE_DIR, "email_templates", "booking_rejection.html")

if not os.path.exists(template_path):
    print(f"Error: File not found at {template_path}")
else:
    with open(template_path, "r", encoding="utf-8") as file:
        email_body = file.read()



# User Bookings
class UserBookings(Resource):
    def post(self):
        connection = None
        cursor = None
        try:
            data = request.get_json()

            # Extract fields from request
            user_id = data.get("user_id")
            property_id = data.get("property_id")
            property_type = data.get("property_type")
            check_in_date = data.get("check_in_date")
            check_out_date = data.get("check_out_date")
            special_requests = data.get("special_requests", "")
            purchase_purpose = data.get("purchase_purpose", "")
            reservation_duration = data.get("reservation_duration", "")
            payment_option = data.get("payment_option", "")
            payment_period = data.get("payment_period", "")
            number_of_guests = data.get("number_of_guests", "0")
            number_of_adults = data.get("number_of_adults", "0")
            number_of_children = data.get("number_of_children", "0")
            number_of_rooms = data.get("number_of_rooms", "0")
            purpose_of_travel = data.get("purpose_of_travel", "")
            payment_date = data.get("payment_date")  # Accept user input
            status = "pending"  # Default status

            # Validate required fields
            if not all([user_id, property_id, property_type, check_in_date, check_out_date]):
                return {"message": "Missing required fields"}, 400

            # Convert check-in date to datetime object
            check_in_date_obj = datetime.strptime(check_in_date, "%Y-%m-%d")

            # Compute default payment date (2 days before check-in)
            min_valid_payment_date = check_in_date_obj - timedelta(days=2)

            if payment_date:
                # Convert user-provided payment_date to datetime object
                payment_date_obj = datetime.strptime(payment_date, "%Y-%m-%d")

                # Validate that the payment_date is at least 2 days before check-in
                if payment_date_obj >= min_valid_payment_date:
                    return {
                        "message": "Invalid payment date",
                        "error": "Payment date must be at least 2 days before the check-in date."
                    }, 400
            else:
                # Set default payment_date if not provided
                payment_date = min_valid_payment_date.strftime("%Y-%m-%d")

            # Generate UUID for booking
            id = str(uuid.uuid4())

            # Connect to the database
            connection = db_connection()
            cursor = connection.cursor()

            # Insert into database
            sql = """
                INSERT INTO bookings (
                    id, user_id, property_id, property_type, check_in_date, check_out_date, 
                    special_requests, purchase_purpose, reservation_duration, 
                    payment_option, payment_period, number_of_guests, number_of_adults, 
                    number_of_children, number_of_rooms, status, 
                    purpose_of_travel, payment_date
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                id, user_id, property_id, property_type, check_in_date, check_out_date, 
                special_requests, purchase_purpose, reservation_duration, 
                payment_option, payment_period, number_of_guests, number_of_adults, 
                number_of_children, number_of_rooms, status, 
                purpose_of_travel, payment_date
            )
            cursor.execute(sql, values)
            connection.commit()

            # Return success response
            return {
                "message": "Booking added successfully",
                "id": id,
                "payment_date": payment_date
            }, 201

        except Exception as e:
            return {"message": "An error occurred while adding the booking", "error": str(e)}, 500
        
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()



# Get all bookings route
class GetAllBookings(Resource):
    def get(self, user_id):  # Expect user_id as a path parameter
        try:
            # Connect to the database
            conn = db_connection()
            cursor = conn.cursor()

            # Fetch bookings for properties owned by the given user_id
            query = """
                SELECT b.id, b.property_type, b.user_id, b.check_in_date, b.check_out_date, b.status, b.created_at, 
                       b.property_id, b.number_of_adults, b.number_of_children, b.number_of_guests, b.number_of_rooms, 
                       b.special_requests, b.purchase_purpose, b.reservation_duration, b.payment_option, b.payment_period,
                       b.is_deleted, b.cancellation_message, 
                       b.purpose_of_travel, b.payment_date,  -- Added new fields
                       u.first_name, u.last_name, u.email
                FROM bookings b
                JOIN (
                    SELECT id, user_id FROM land
                    UNION ALL
                    SELECT id, user_id FROM apartments
                    UNION ALL
                    SELECT id, user_id FROM houses
                    UNION ALL
                    SELECT id, user_id FROM commercial
                ) p ON b.property_id = p.id
                JOIN users u ON b.user_id = u.user_id
                WHERE p.user_id = %s
            """
            cursor.execute(query, (user_id,))
            bookings = cursor.fetchall()

            if not bookings:
                cursor.close()
                conn.close()
                return make_response(jsonify({"message": "No bookings found for this user"}), 404)

            # Process bookings and fetch property details
            bookings_list = []
            for booking in bookings:
                booking_data = {
                    "id": booking[0],
                    "property_type": booking[1],
                    "user_id": booking[2],
                    "check_in_date": booking[3].strftime("%Y-%m-%d") if booking[3] else None,
                    "check_out_date": booking[4].strftime("%Y-%m-%d") if booking[4] else None,
                    "status": booking[5],
                    "created_at": booking[6].strftime("%Y-%m-%d %H:%M:%S") if booking[6] else None,
                    "property_id": booking[7],
                    "number_of_adults": booking[8],
                    "number_of_children": booking[9],
                    "number_of_guests": booking[10],
                    "number_of_rooms": booking[11],
                    "special_requests": booking[12],
                    "purchase_purpose": booking[13],
                    "reservation_duration": booking[14],
                    "payment_option": booking[15],
                    "payment_period": booking[16],
                    "is_cancelled": bool(booking[17]),  # Convert 1/0 to boolean
                    "cancellation_message": booking[18] if booking[17] else None,  # Only show if cancelled
                    "purpose_of_travel": booking[19],  # Newly added field
                    "payment_date": booking[20].strftime("%Y-%m-%d") if booking[20] else None,  # Newly added field
                    "first_name": booking[21],
                    "last_name": booking[22],
                    "email": booking[23]
                }

                # Fetch full property details
                property_query = """
                    SELECT title FROM (
                        SELECT id, title FROM land
                        UNION ALL
                        SELECT id, title FROM apartments
                        UNION ALL
                        SELECT id, house_type FROM houses
                        UNION ALL
                        SELECT id, title FROM commercial
                    ) p WHERE id = %s
                """
                cursor.execute(property_query, (booking_data["property_id"],))
                property_object = cursor.fetchone()

                # Set default title if not found
                booking_data["title"] = property_object[0] if property_object else "No title available"

                bookings_list.append(booking_data)

            # Close database connection
            cursor.close()
            conn.close()

            return make_response(jsonify({"bookings": bookings_list}), 200)

        except Exception as e:
            print(f"Database error: {str(e)}")  # Log the error
            return make_response(jsonify({"message": "Database error", "error": str(e)}), 500)




# Update Booking Status
class UpdateBookingStatus(Resource):
    def put(self):
        connection = None
        cursor = None

        try:
            data = request.get_json()
            booking_id = data.get("booking_id")
            action = data.get("action")  # "confirm" or "reject"
            rejection_message = data.get("rejection_message", "")  # Optional rejection reason

            if not booking_id or action not in ["confirm", "reject"]:
                return {"message": "Invalid request parameters."}, 400

            # DB Connection
            connection = db_connection()
            cursor = connection.cursor()

            # Fetch booking details (user_id, property_title)
            cursor.execute("SELECT user_id, property_type, property_id FROM bookings WHERE id = %s", (booking_id,))
            booking_details = cursor.fetchone()


            if not booking_details:
                return {"message": "Booking not found."}, 404

            user_id, property_type, property_id = booking_details

           # Fetch property title based on type
            if property_type == "apartments":
                cursor.execute("SELECT title FROM apartments WHERE id = %s", (property_id,))
            elif property_type == "land":
                cursor.execute("SELECT title FROM land WHERE id = %s", (property_id,))
            elif property_type == "house":
                cursor.execute("SELECT title FROM houses WHERE id = %s", (property_id,))
            elif property_type == "commercial":
                cursor.execute("SELECT title FROM commercial WHERE id = %s", (property_id,))

            property_result = cursor.fetchone()

            # Assign fetched property title if found
            if property_result:
                logger.info(f"Property title found: {property_result}")
                title = property_result[0]
                logger.info(f"Property title: {title}")
            else:
                print(f"Debug: Property not found for ID: {property_id} and Type: {property_type}")

            # Debugging output
            print(f"Debug: User ID: {user_id}, Property Type: {property_type}, Property ID: {property_id}, Property Title: {title}")


            # Fetch user email and first name
            cursor.execute("SELECT email, first_name FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            if not user:
                return {"message": "User not found."}, 404

            user_email, first_name = user

           

            # Proceed with update
            if action == "confirm":
                sql = "UPDATE bookings SET status = %s, rejection_message = NULL WHERE id = %s"
                cursor.execute(sql, ("confirmed", booking_id))
                message = "Booking confirmed successfully."

                # Read HTML email template
                with open("email_templates/booking_confirmation.html", "r", encoding="utf-8") as file:
                    email_body = file.read()

                # Define booking URL using property_type from the DB
                booking_url = f"https://linknamali.ke/bookings/{property_type}/{booking_id}"

                # Replace placeholders with actual values
                email_body = email_body.replace("{first_name}", first_name)
                email_body = email_body.replace("{property_title}", title)
                email_body = email_body.replace("{booking_url}", booking_url)


                # Send email asynchronously
                send_email_async(user_email, "Linknamali - Booking Confirmed", email_body, is_html=True)


            elif action == "reject":
                if not rejection_message:
                    return {"message": "Rejection message is required when rejecting a booking."}, 400

                sql = "UPDATE bookings SET status = %s, rejection_message = %s WHERE id = %s"
                cursor.execute(sql, ("rejected", rejection_message, booking_id))
                message = "Booking rejected successfully."

                # Read HTML email template
                with open("email_templates/booking_rejection.html", "r", encoding="utf-8") as file:
                    email_body = file.read()

                # ✅ Define booking and login URLs
                booking_url = f"https://linknamali.ke/bookings/{property_type}/{booking_id}"
                login_url = "https://linknamali.ke"

                # ✅ Replace placeholders with actual values
                email_body = email_body.replace("{first_name}", first_name)
                email_body = email_body.replace("{property_title}", title)
                email_body = email_body.replace("{rejection_message}", rejection_message)
                email_body = email_body.replace("{booking_url}", booking_url)
                email_body = email_body.replace("{login_url}", login_url)


                # Send email asynchronously
                send_email_async(user_email, "Linknamali Booking Rejected", email_body, is_html=True)

            # Check if any row was affected
            if cursor.rowcount == 0:
                return {"message": "No booking was updated. Please check the booking ID."}, 404

            connection.commit()
            return {"message": message}, 200

        except Exception as e:
            return {"message": "An error occurred while updating the booking.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Check if a property has bookings
class CheckBookings(Resource):
    def get(self):
        property_id = request.args.get("property_id")

        if not property_id:
            return jsonify({"message": "Missing property_id"}), 400

        try:
            conn = db_connection()
            cursor = conn.cursor()

            query = "SELECT COUNT(*) FROM bookings WHERE property_id = %s"
            cursor.execute(query, (property_id,))
            result = cursor.fetchone()

            cursor.close()
            conn.close()

            return jsonify({"hasBookings": result[0] > 0})

        except Exception as e:
            return jsonify({"message": "Database error", "error": str(e)}), 500


# Get all bookings with user details
class AllBookingsResource(Resource):
    def get(self):
        connection = db_connection()
        cursor = connection.cursor(dictionary=True)

        try:
            cursor.execute("""
                SELECT 
                    b.*, 
                    u.first_name, u.last_name, u.email, u.phone_number
                FROM bookings b
                JOIN users u ON b.user_id = u.user_id
                WHERE b.is_deleted = 0
                ORDER BY b.created_at DESC
            """)
            bookings = cursor.fetchall()

            enriched_bookings = []

            for booking in bookings:
                property_type = booking['property_type'].lower()
                property_id = booking['property_id']

                # Get property table name
                if property_type == 'apartment':
                    table_name = 'apartments'
                elif property_type == 'house':
                    table_name = 'houses'
                elif property_type == 'commercial':
                    table_name = 'commercial'
                elif property_type == 'land':
                    table_name = 'land'
                else:
                    table_name = None

                property_details = {}

                if table_name:
                    cursor.execute(f"SELECT * FROM {table_name} WHERE id = %s", (property_id,))
                    property_details = cursor.fetchone()
                    if property_details:
                        property_details = serialize_dates(property_details)

                # Serialize booking dates
                booking = serialize_dates(booking)

                enriched_bookings.append({
                    'booking': booking,
                    'property_details': property_details
                })

            return {'data': enriched_bookings}, 200

        except mysql.connector.Error as err:
            return {'error': str(err)}, 500

        finally:
            cursor.close()
            connection.close()



# Register the routes
api.add_resource(UserBookings, '/bookings')
api.add_resource(GetAllBookings, "/allbookings/<string:user_id>")
api.add_resource(UpdateBookingStatus, "/updatebookings")
api.add_resource(CheckBookings, "/bookings/check")
api.add_resource(AllBookingsResource, "/allbookings")

# SELECT b.property_type, b.property_id,
#        (SELECT title FROM apartments WHERE id = b.property_id) AS apartment_title,
#        (SELECT title FROM land WHERE id = b.property_id) AS land_title,
#        (SELECT house_type FROM houses WHERE id = b.property_id) AS house_title,
#        (SELECT title FROM commercial WHERE id = b.property_id) AS commercial_title
# FROM bookings b
# WHERE b.id = b2c1df7b-86a3-4e91-8d98-a5e73f50bc40;




# 0f9948b8-3e86-4610-9bb6-d83539bcca9f	