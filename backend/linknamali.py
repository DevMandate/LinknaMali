from flask import Flask, request, jsonify, make_response
from flask.views import MethodView
from flask_restful import Api, Resource
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
from waitress import serve
from functools import wraps
from decimal import Decimal
from utils.functions import * 
from datetime import datetime, timedelta, timezone, date
from database.database import db_connection
from apscheduler.schedulers.background import BackgroundScheduler
from utils.cleanup import cleanup_soft_deleted_properties  # Import the cleanup function
from routes.supportticket import supportticket
from routes.ownerbookings import ownerbookings
from routes.userlistings import userlistings
from routes.enquiries import enquiries
from routes.userprofile import userprofile
from routes.adsmgt import adsmgt
from routes.admineditrequest import editrequests
from routes.usermgt import usermgt
from routes.mpesa import mpesa_routes
from routes.c2bCallback import b2c_callback_routes
from routes.calendar_routes import calender_routes
from service_providers.service_profiles import serviceprofiles
from service_providers.service_inquiries import service_inquiries
from service_providers.service_bookings import service_bookings
from service_providers.service_support_tickets import service_tickets
import smtplib
import random
import re
import logging
import jwt
import uuid
import hashlib
import os
import json 
import requests



app = Flask(__name__)
api = Api(app)


##Landing Page################################################
from auth import auth, SECRET_KEY
from blogs import blogs
from support import support
from listing import listings
from bookings import bookings
from user_subscription import user_subscriptions
from property import property
from search_engine import search_engine
from reviews import reviews
from pricing import pricing
from listingagents import listingagents
from company import company
from project import project


app.register_blueprint(auth)
app.register_blueprint(blogs)
app.register_blueprint(support)
app.register_blueprint(listings)
app.register_blueprint(bookings)
app.register_blueprint(user_subscriptions)
app.register_blueprint(property)
app.register_blueprint(search_engine)
app.register_blueprint(reviews)
app.register_blueprint(pricing)
app.register_blueprint(listingagents)
app.register_blueprint(company)
app.register_blueprint(project)
################################################################



# ========= backend blueprints ================
app.register_blueprint(supportticket)
app.register_blueprint(editrequests)
app.register_blueprint(ownerbookings)
app.register_blueprint(userlistings)
app.register_blueprint(enquiries)
app.register_blueprint(userprofile)
app.register_blueprint(adsmgt)
app.register_blueprint(serviceprofiles)
app.register_blueprint(service_inquiries)
app.register_blueprint(service_bookings)
app.register_blueprint(service_tickets)
app.register_blueprint(usermgt)
app.register_blueprint(mpesa_routes, url_prefix='/api/mpesa')
app.register_blueprint(b2c_callback_routes, url_prefix='/api/mpesa/b2c')
app.register_blueprint(calender_routes, url_prefix='/api/calender')


# =========================================

CORS(app, resources={
    r"/*": {  
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://linknamali.ke",
            "https://portal.linknamali.ke"
        ],
        "methods": ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
        "supports_credentials": True
    }
})

# Secret key
SECRET_KEY = "tugyw64t8739qpu9uho8579uq8htou34897r6783tiy4htg5iw795y4p0thu4o58"


# Configure logging
logging.basicConfig(level=logging.DEBUG)


# Password hashing function
def hashpassword(password):
    return hashlib.sha256(password.encode()).hexdigest()



# JWT decoding function
def decode_jwt(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token has expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}



# Token required decorator
def token_required(f):
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization')  # Expecting 'Bearer <token>'
        if not token:
            return jsonify({'response': 'Token is missing'}), 401

        try:
            token = token.split(" ")[1]  # Remove "Bearer" from the header
            payload = decode_jwt(token)
            if 'error' in payload:
                return jsonify({'response': payload['error']}), 401
        except Exception as e:
            return jsonify({'response': 'Token is invalid'}), 401

        return f(payload, *args, **kwargs)
    return wrapper



# Function to send OTP email
def send_otp_email(email, otp):
    sender_email = "sharonachiengmasiga@gmail.com"
    sender_password = "iiik igec mgdp fkjc"
    subject = "Your OTP Code"
    body = f"Your OTP code is {otp}. Please use this code to verify your email address."

    message = f"Subject: {subject}\n\n{body}"

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, email, message)



#app schedular function  
def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(cleanup_soft_deleted_properties, 'interval', days=1)
    scheduler.start()

start_scheduler()



# Default Test Route
@app.route('/test')
def test():
    return "Hello World! Flask is Running"



# Default Route
class Default(Resource):
    def get(self):
        return {'response': 'Welcome to LinkNamali'}


# User Registration
class UserRegister(Resource):
    @cross_origin()
    def post(self):
        connection = None
        try:
            # Step 1: DB Connection and Cursor
            connection = db_connection()
            if connection is None:
                return {'response': 'Database connection failed'}, 500
            cursor = connection.cursor()

            # Step 2: Request data
            data = request.json
            logging.debug(f"Request data: {data}")
            required_fields = [
                'first_name', 'last_name', 'id_number', 'email', 
                'phone_number', 'password1', 'password2', 'role'
            ]
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'response': 'Missing required fields', 'fields': missing_fields}, 400

            # Extract and validate inputs
            first_name = data['first_name']
            last_name = data['last_name']
            id_number = data['id_number']
            email = data['email']
            phone_number = data['phone_number']
            password1 = data['password1']
            password2 = data['password2']
            role = data['role']

            # Validate email and phone number formats
            if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                return {'response': 'Invalid email format'}, 400

            # Strip non-digit characters from phone number
            phone_number = re.sub(r'\D', '', phone_number)
            if not phone_number.isdigit() or len(phone_number) < 10:
                return {'response': 'Invalid phone number'}, 400

            # Validate password
            if password1 != password2:
                return {'response': 'Passwords do not match'}, 400
            if len(password1) < 6:
                return {'response': 'Password length must be more than six'}, 400

            # Check for duplicate users
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return {'response': 'A user with this email already exists'}, 400

            cursor.execute("SELECT * FROM users WHERE id_number = %s", (id_number,))
            if cursor.fetchone():
                return {'response': 'A user with this ID number already exists'}, 400

            cursor.execute("SELECT * FROM users WHERE phone_number = %s", (phone_number,))
            if cursor.fetchone():
                return {'response': 'A user with this phone number already exists'}, 400

            # Generate user_id and hash password
            user_id = str(uuid.uuid4())
            hashed_password = hashpassword(password1)

            # Generate OTP
            otp = random.randint(100000, 999999)

            # SQL to insert data
            sql = """
                INSERT INTO users(
                    user_id, first_name, last_name, id_number, 
                    email, phone_number, password, role, otp
                ) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                user_id, first_name, last_name, id_number, 
                email, phone_number, hashed_password, role, otp
            ))
            connection.commit()

            # Send OTP email
            send_otp_email(email, otp)

            return jsonify({
                'response': 'User registered successfully. Please check your email for the OTP to verify your email address.',
                'user_id': user_id
            }), 201

        except Exception as e:
            logging.error(f"Error during user registration: {str(e)}")
            return {'response': str(e)}, 500
        finally:
            if connection:
                connection.close()



# OTP Verification
class VerifyOtp(Resource):
    @cross_origin()
    def post(self):
        connection = None
        try:
            # Step 1: DB Connection and Cursor
            connection = db_connection()
            if connection is None:
                return {'response': 'Database connection failed'}, 500
            cursor = connection.cursor()

            # Step 2: Request data
            data = request.json
            logging.debug(f"Request data: {data}")
            required_fields = ['email', 'otp']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'response': 'Missing required fields', 'fields': missing_fields}, 400

            # Extract and validate inputs
            email = data['email']
            otp = data['otp']

            # Validate OTP
            cursor.execute("SELECT * FROM users WHERE email = %s AND otp = %s", (email, otp))
            user = cursor.fetchone()
            if not user:
                return {'response': 'Invalid OTP'}, 400

            # Generate JWT Token
            user_id = user[0]
            role = user[7]
            payload = {
                'user_id': user_id,
                'email': email,
                'role': role,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # Token expiry
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            # Clear OTP after verification
            cursor.execute("UPDATE users SET otp = NULL WHERE email = %s", (email,))
            connection.commit()

            return jsonify({
                'response': 'Email verified successfully',
                'token': token
            }), 200

        except Exception as e:
            logging.error(f"Error during OTP verification: {str(e)}")
            return {'response': str(e)}, 500
        finally:
            if connection:
                connection.close()



# User Login
class UserLogin(Resource):
    @cross_origin()
    def post(self):
        connection = None
        try:
            # a. DB Connection and Cursor
            connection = db_connection()
            if connection is None:
                return {'response': 'Database connection failed'}, 500
            cursor = connection.cursor()

            # b. Request data
            data = request.json 
            logging.debug(f"Request data: {data}")
            email = data['email']
            password = data['password']

            # c. SQL to verify email and hashed password
            sql = "SELECT * FROM users WHERE email = %s"
            cursor.execute(sql, (email,))
            user = cursor.fetchone()

            if user is None:
                return jsonify({'response': 'Invalid Credentials'}), 401

            # Verify the hashed password
            hashed_password = hashpassword(password)
            if user[6] != hashed_password:  # Assuming password is in the sixth column
                return jsonify({'response': 'Invalid Credentials'}), 401

            # Generate JWT Token
            payload = {
                'user_id': user[0],  # Assuming user ID is in the first column
                'email': user[4],    # Assuming email is in the fourth column
                'role': user[7],     # Assuming role is in the seventh column
                'exp': datetime.now(timezone.utc) + timedelta(hours=1)  # Token expirycd
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            return jsonify({
                'response': 'Login Successful. Welcome',
                'token': token,
                'user_info': {
                    'id': user[0],
                    'first_name': user[1],
                    'last_name': user[2],
                    'email': user[4],
                    'role': user[7]
                }
            }), 200
        except Exception as e:
            logging.error(f"Error during user login: {str(e)}")
            return {'response': str(e)}, 500
        finally:
            if connection:
                connection.close()



class ProtectedResource(Resource):
    @token_required
    def get(self, payload):
        return jsonify({'response': 'Access granted', 'user': payload})



class UserLogout(Resource):
    @cross_origin()
    def post(self):
        try:
            # Retrieve the token from the request header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'response': 'Token missing or invalid'}), 401
            
            token = auth_header.split(" ")[1]
            
            # Decode the token to validate it
            try:
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                logging.info(f"Token for user {decoded_token['email']} is logged out.")
                
                # (Optional) Add the token to a blacklist (if implemented)
                # For example:
                # add_token_to_blacklist(token)

                return jsonify({'response': 'Logout successful'}), 200
            except jwt.ExpiredSignatureError:
                return jsonify({'response': 'Token already expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'response': 'Invalid token'}), 401
        except Exception as e:
            logging.error(f"Error during logout: {str(e)}")
            return jsonify({'response': str(e)}), 500



# Add Apartment Route

UPLOAD_FOLDER = "static/images/"
UPLOAD_FOLDER_DOCS = "static/documents/"

# Get Apartment Api
class GetApartment(Resource):
    def get(self):
        connection = None
        cursor = None


        try:
            # Extract query parameters
            user_id = request.args.get("user_id")
            title = request.args.get("title")
            location = request.args.get("location")
            town = request.args.get("town")
            min_price = request.args.get("min_price")
            max_price = request.args.get("max_price")
            number_of_bedrooms = request.args.get("number_of_bedrooms")


            # Build the base SQL query
            sql = "SELECT * FROM apartments WHERE 1=1"
            values = []


            # Add filters based on available query parameters
            if user_id:
                sql += " AND user_id = %s"
                values.append(user_id)


            if title:
                sql += " AND title LIKE %s"
                values.append(f"%{title}%")


            if location:
                sql += " AND location LIKE %s"
                values.append(f"%{location}%")

            if town:
                sql += " AND town LIKE %s"
                values.append(f"%{town}%")


            if min_price and max_price:
                sql += " AND CAST(price AS UNSIGNED) BETWEEN %s AND %s"
                values.extend([min_price, max_price])
            elif min_price:
                sql += " AND CAST(price AS UNSIGNED) >= %s"
                values.append(min_price)
            elif max_price:
                sql += " AND CAST(price AS UNSIGNED) <= %s"
                values.append(max_price)


            if number_of_bedrooms:
                sql += " AND number_of_bedrooms = %s"
                values.append(number_of_bedrooms)


            # DB connection
            connection = db_connection()
            if connection is None:
                raise Exception("Database connection failed")  # Handle missing DB connection


            cursor = connection.cursor()  # Remove dictionary=True here


            # Execute the query
            cursor.execute(sql, values)
            rows = cursor.fetchall()


            # Convert rows to dictionary
            columns = [col[0] for col in cursor.description]  # Get column names
            apartments = [dict(zip(columns, row)) for row in rows] # Convert rows to dictionary




           # Ensure datetime and Decimal values are properly formatted
            def serialize_apartment(apartment):
                return {
                    key: (
                        value.isoformat() if isinstance(value, datetime)  # Convert datetime to string
                        else float(value) if isinstance(value, Decimal)  # Convert Decimal to float
                        else value
                    )
                    for key, value in apartment.items()
                }

            apartments = [serialize_apartment(apartment) for apartment in apartments]


            # Response
            return {"message": "Success", "data": apartments}


        except Exception as e:
            return {"message": "An error occurred while fetching apartments", "error": str(e)}


        finally:
            # Close the cursor if it exists
            if cursor:
                cursor.close()


            # Close the DB connection if it exists
            if connection:
                connection.close()



# Delete apartment Route
class DeleteApartment(Resource):
    def delete(self):
        connection = None
        cursor = None

        try:
            # Extract JSON data from the request body
            data = request.get_json()
            id = data.get("id")
            user_id = data.get("user_id")

            # Validate required parameters
            if not id or not user_id:
                return {"message": "Both 'id' and 'user_id' are required."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Check if the apartment exists and belongs to the user
            cursor.execute("""
                SELECT user_id, image, documents 
                FROM apartments 
                WHERE id = %s
            """, (id,))
            apartment = cursor.fetchone()

            if not apartment:
                return {"message": f"Apartment with ID {id} not found."}, 404

            # Check if the apartment belongs to the user
            db_user_id, image_filename, documents_json = apartment
            if db_user_id != user_id:
                return {"message": f"User ID {user_id} does not own the apartment with ID {id}."}, 403

            # Delete the apartment record from the database
            cursor.execute("DELETE FROM apartments WHERE id = %s AND user_id = %s", (id, user_id))
            connection.commit()

            # Remove associated image file if it exists
            if image_filename:
                image_path = os.path.join(UPLOAD_FOLDER, image_filename)
                if os.path.exists(image_path):
                    os.remove(image_path)
                else:
                    return {"message": f"Image file {image_filename} not found."}, 404

            # Remove associated documents if they exist
            if documents_json:
                document_names = json.loads(documents_json)
                for doc_filename in document_names:
                    doc_path = os.path.join(UPLOAD_FOLDER_DOCS, doc_filename)
                    if os.path.exists(doc_path):
                        os.remove(doc_path)
                    else:
                        return {"message": f"Document file {doc_filename} not found."}, 404

            # Response
            return {"message": "Apartment and associated files deleted successfully."}

        except Exception as e:
            return {"message": "An error occurred while deleting the apartment", "error": str(e)}, 500

        finally:
            # Close the DB connection and cursor safely
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Get House API 
class GetHouse(Resource):
    def get(self):
        connection = None
        cursor = None

        try:
            # Extract query parameters
            user_id = request.args.get("user_id")
            house_type = request.args.get("house_type")
            location = request.args.get("location")
            town = request.args.get("town")
            number_of_bedrooms = request.args.get("number_of_bedrooms")
            min_price = request.args.get("min_price")
            max_price = request.args.get("max_price")
            additional_amenities = request.args.get("additional_amenities")

            # # Validate that user_id is provided
            # if not user_id:
            #     return {"message": "user_id is required"}, 400

            # Build SQL query with proper WHERE clause
            sql = "SELECT * FROM houses WHERE 1=1"
            values = []

            # Add filters based on query parameters
            if user_id:
                sql += " AND user_id = %s"
                values.append(user_id)

            if house_type:
                sql += " AND house_type = %s"
                values.append(house_type)

            if location:
                sql += " AND location = %s"
                values.append(location)  # <-- FIXED: Missing append statement

            if town:
                sql += " AND town = %s"
                values.append(town) 

            if number_of_bedrooms:
                sql += " AND number_of_bedrooms = %s"
                values.append(number_of_bedrooms)

            if min_price and max_price:
                sql += " AND price BETWEEN %s AND %s"
                values.extend([min_price, max_price])
            elif min_price:
                sql += " AND price >= %s"
                values.append(min_price)
            elif max_price: 
                sql += " AND price <= %s"
                values.append(max_price)

            if additional_amenities:
                sql += " AND amenities LIKE %s"
                values.append(f"%{additional_amenities}%")

            # Establish DB connection
            connection = db_connection()
            if connection is None:
                raise Exception("Database connection failed")

            cursor = connection.cursor()

            # Execute the query
            cursor.execute(sql, values)
            rows = cursor.fetchall()

            # Convert rows to dictionary
            columns = [col[0] for col in cursor.description]
            houses = [dict(zip(columns, row)) for row in rows]

            # Ensure datetime and Decimal values are properly formatted
            def serialize_house(house):
                house["title"] = house.get("house_type", "")
                return {
                    key: (
                        value.isoformat() if isinstance(value, datetime)  # Convert datetime to string
                        else float(value) if isinstance(value, Decimal)  # Convert Decimal to float
                        else value
                    )
                    for key, value in house.items()
                }

            houses = [serialize_house(house) for house in houses]

            # Response
            return {"message": "Success", "data": houses}

        except Exception as e:
            return {"message": "An error occurred while fetching houses", "error": str(e)}, 500

        finally:
            # Close the cursor if it exists
            if cursor:
                cursor.close()

            # Close the DB connection if it exists
            if connection:
                connection.close()



# Delete Hse route
class DeleteHouse(Resource):
    def delete(self):
        connection = None
        cursor = None

        try:
            # Parse JSON body
            data = request.get_json()
            if not data:
                return {"message": "Request body must be JSON."}, 400

            # Extract and validate parameters
            id = data.get("id")
            user_id = data.get("user_id")

            if not id:
                return {"message": "'id' is required."}, 400
            if not user_id:
                return {"message": "'user_id' is required."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Check if the house exists
            cursor.execute("SELECT id FROM houses WHERE id = %s", (id,))
            house_exists = cursor.fetchone()
            if not house_exists:
                return {"message": "House not found."}, 404

            # Check if the house belongs to the user
            cursor.execute("""
                SELECT image, documents 
                FROM houses 
                WHERE id = %s AND user_id = %s
            """, (id, user_id))
            house = cursor.fetchone()
            if not house:
                return {"message": "You do not have permission to delete this house."}, 403

            # Extract the image and document paths
            image_filename, documents_json = house

            # Delete the house record from the database
            cursor.execute("DELETE FROM houses WHERE id = %s AND user_id = %s", (id, user_id))
            connection.commit()

            # Remove associated image file
            if image_filename:
                image_path = os.path.join(UPLOAD_FOLDER, image_filename)
                if os.path.exists(image_path):
                    os.remove(image_path)
                else:
                    return {"message": f"Image file '{image_filename}' not found on the server."}, 404

            # Remove associated documents
            if documents_json:
                try:
                    document_names = json.loads(documents_json)
                    for doc_filename in document_names:
                        doc_path = os.path.join(UPLOAD_FOLDER_DOCS, doc_filename)
                        if os.path.exists(doc_path):
                            os.remove(doc_path)
                        else:
                            return {"message": f"Document file '{doc_filename}' not found on the server."}, 404
                except json.JSONDecodeError:
                    return {"message": "Failed to parse associated documents. The JSON data might be invalid."}, 500

            # Response
            return {"message": "House deleted successfully"}

        except Exception as e:
            return {"message": "An unexpected error occurred while deleting the house", "error": str(e)}, 500

        finally:
            # Close the DB connection and cursor safely
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Get land route
class GetLand(Resource):
    def get(self):
        connection = None
        cursor = None

        try:
            # Extract query parameters
            user_id = request.args.get("user_id")
            title = request.args.get("title")
            location = request.args.get("location")
            town = request.args.get("town")
            min_price = request.args.get("min_price")
            max_price = request.args.get("max_price")
            land_size = request.args.get("land_size")
            land_type = request.args.get("land_type")

            # Build the base SQL query with JOIN
            sql = "SELECT * FROM land WHERE 1=1"
            values = []

            # Add filters based on available query parameters
            if user_id:
                sql += " AND land.user_id = %s"
                values.append(user_id)

            if title:
                sql += " AND land.title LIKE %s"
                values.append(f"%{title}%")

            if location:
                sql += " AND land.location LIKE %s"
                values.append(f"%{location}%")

            if town:
                sql += " AND land.town LIKE %s"
                values.append(f"%{town}%")

            if min_price and max_price:
                sql += " AND CAST(land.price AS UNSIGNED) BETWEEN %s AND %s"
                values.extend([min_price, max_price])
            elif min_price:
                sql += " AND CAST(land.price AS UNSIGNED) >= %s"
                values.append(min_price)
            elif max_price:
                sql += " AND CAST(land.price AS UNSIGNED) <= %s"
                values.append(max_price)

            if land_size:
                sql += " AND land.land_size LIKE %s"
                values.append(f"%{land_size}%")

            if land_type:
                sql += " AND land.land_type = %s"
                values.append(land_type)

            # DB connection
            connection = db_connection()
            if connection is None:
                raise Exception("Database connection failed")  # Handle missing DB connection

            cursor = connection.cursor()

            # Execute the query
            cursor.execute(sql, values)
            rows = cursor.fetchall()

            # Convert rows to dictionary
            columns = [col[0] for col in cursor.description]  # Get column names
            land = [dict(zip(columns, row)) for row in rows]


            # Ensure datetime and Decimal values are properly formatted
            def serialize_land(land):
                return {
                    key: (
                        value.isoformat() if isinstance(value, datetime)  # Convert datetime to string
                        else float(value) if isinstance(value, Decimal)  # Convert Decimal to float
                        else value
                    )
                    for key, value in land.items()
                }
            
            land = [serialize_land(land) for land in land]



            # Response
            return {"message": "Success", "data": land}

        except Exception as e:
            return {"message": "An error occurred while fetching land", "error": str(e)}

        finally:
            # Close the cursor if it exists
            if cursor:
                cursor.close()

            # Close the DB connection if it exists
            if connection:
                connection.close()



# Delete Land
class DeleteLand(Resource):
    def delete(self):
        connection = None
        cursor = None

        try:
            # Parse JSON body
            data = request.get_json()
            if not data:
                return {"message": "Request body must be JSON."}, 400

            # Extract and validate parameters
            id = data.get("id")
            user_id = data.get("user_id")

            if not id:
                return {"message": "'id' is required."}, 400
            if not user_id:
                return {"message": "'user_id' is required."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Check if the land exists
            cursor.execute("SELECT id FROM land WHERE id = %s", (id,))
            land_exists = cursor.fetchone()
            if not land_exists:
                return {"message": "Land not found."}, 404

            # Check if the land belongs to the user
            cursor.execute("""
                SELECT image, documents 
                FROM land 
                WHERE id = %s AND user_id = %s
            """, (id, user_id))
            land = cursor.fetchone()
            if not land:
                return {"message": "You do not have permission to delete this land."}, 403

            # Extract the image and document paths
            image_filename, documents_json = land

            # Delete the land record from the database
            cursor.execute("DELETE FROM land WHERE id = %s AND user_id = %s", (id, user_id))
            connection.commit()

            # Remove associated image file
            if image_filename:
                image_path = os.path.join(UPLOAD_FOLDER, image_filename)
                if os.path.exists(image_path):
                    os.remove(image_path)
                else:
                    return {"message": f"Image file '{image_filename}' not found on the server."}, 404

            # Remove associated documents
            if documents_json:
                try:
                    document_names = json.loads(documents_json)
                    for doc_filename in document_names:
                        doc_path = os.path.join(UPLOAD_FOLDER_DOCS, doc_filename)
                        if os.path.exists(doc_path):
                            os.remove(doc_path)
                        else:
                            return {"message": f"Document file '{doc_filename}' not found on the server."}, 404
                except json.JSONDecodeError:
                    return {"message": "Failed to parse associated documents. The JSON data might be invalid."}, 500

            # Response
            return {"message": "Land deleted successfully"}

        except Exception as e:
            return {"message": "An unexpected error occurred while deleting the land", "error": str(e)}, 500

        finally:
            # Close the DB connection and cursor safely
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Get commercial route
class GetCommercial(Resource):
    def get(self):
        connection = None
        cursor = None

        try:
            # Extract query parameters
            user_id = request.args.get("user_id")
            title = request.args.get("title")
            location = request.args.get("location")
            town = request.args.get("town")
            min_price = request.args.get("min_price")
            max_price = request.args.get("max_price")
            commercial_type = request.args.get("commercial_type")

            # Build the base SQL query with JOIN
            sql = "SELECT * FROM commercial WHERE 1=1"
            values = []

            # Add filters based on available query parameters
            if user_id:
                sql += " AND commercial.user_id = %s"
                values.append(user_id)

            if title:
                sql += " AND commercial.title LIKE %s"
                values.append(f"%{title}%")

            if location:
                sql += " AND commercial.location LIKE %s"
                values.append(f"%{location}%")

            if town:
                sql += "AND commercial.town LIKE %s"
                values.append(f"%{town}%")

            if min_price and max_price:
                sql += " AND CAST(commercial.price AS UNSIGNED) BETWEEN %s AND %s"
                values.extend([min_price, max_price])
            elif min_price:
                sql += " AND CAST(commercial.price AS UNSIGNED) >= %s"
                values.append(min_price)
            elif max_price:
                sql += " AND CAST(commercial.price AS UNSIGNED) <= %s"
                values.append(max_price)

            if commercial_type:
                sql += " AND commercial.commercial_type = %s"
                values.append(commercial_type)

            # DB connection
            connection = db_connection()
            if connection is None:
                raise Exception("Database connection failed")  # Handle missing DB connection

            cursor = connection.cursor()  # Remove dictionary=True here

            # Execute the query
            cursor.execute(sql, values)
            rows = cursor.fetchall()

            # Convert rows to dictionary
            columns = [col[0] for col in cursor.description]  # Get column names
            commercials = [dict(zip(columns, row)) for row in rows]

            # Ensure datetime and Decimal values are properly formatted
            def serialize_commercial(commercial):
                return {
                    key: (
                        value.isoformat() if isinstance(value, datetime)  # Convert datetime to string
                        else float(value) if isinstance(value, Decimal)  # Convert Decimal to float
                        else value
                    )
                    for key, value in commercial.items()
                }

            commercials = [serialize_commercial(commercial) for commercial in commercials]

            # Response
            return {"message": "Success", "data": commercials}

        except Exception as e:
            return {"message": "An error occurred while fetching commercials", "error": str(e)}

        finally:
            # Close the cursor if it exists
            if cursor:
                cursor.close()

            # Close the DB connection if it exists
            if connection:
                connection.close()



# Delete commercial
class DeleteCommercial(Resource):
    def delete(self):
        connection = None
        cursor = None

        try:
            # Parse JSON body
            data = request.get_json()
            if not data:
                return {"message": "Request body must be JSON."}, 400

            # Extract and validate parameters
            id = data.get("id")
            user_id = data.get("user_id")

            if not id:
                return {"message": "'id' is required."}, 400
            if not user_id:
                return {"message": "'user_id' is required."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Check if the commercial exists
            cursor.execute("SELECT id FROM commercial WHERE id = %s", (id,))
            commercial_exists = cursor.fetchone()
            if not commercial_exists:
                return {"message": "Commercial not found."}, 404

            # Check if the commercial belongs to the user
            cursor.execute("""
                SELECT image, documents 
                FROM commercial 
                WHERE id = %s AND user_id = %s
            """, (id, user_id))
            commercial = cursor.fetchone()
            if not commercial:
                return {"message": "You do not have permission to delete this commercial."}, 403

            # Extract the image and document paths
            image_filename, documents_json = commercial

            # Delete the commercial record from the database
            cursor.execute("DELETE FROM commercial WHERE id = %s AND user_id = %s", (id, user_id))
            connection.commit()

            # Remove associated image file
            if image_filename:
                image_path = os.path.join(UPLOAD_FOLDER, image_filename)
                if os.path.exists(image_path):
                    os.remove(image_path)
                else:
                    return {"message": f"Image file '{image_filename}' not found on the server."}, 404

            # Remove associated documents
            if documents_json:
                try:
                    document_names = json.loads(documents_json)
                    for doc_filename in document_names:
                        doc_path = os.path.join(UPLOAD_FOLDER_DOCS, doc_filename)
                        if os.path.exists(doc_path):
                            os.remove(doc_path)
                        else:
                            return {"message": f"Document file '{doc_filename}' not found on the server."}, 404
                except json.JSONDecodeError:
                    return {"message": "Failed to parse associated documents. The JSON data might be invalid."}, 500

            # Response
            return {"message": "Commercial deleted successfully"}

        except Exception as e:
            return {"message": "An unexpected error occurred while deleting the commercial", "error": str(e)}, 500

        finally:
            # Close the DB connection and cursor safely
            if cursor:
                cursor.close()
            if connection:
                connection.close()



# Add a Service Provider
class AddService(Resource):
    def post(self):
        connection = None
        cursor = None
        try:
            # Parse request data
            provider_name = request.form.get("provider_name")
            location = request.form.get("location")
            pin_location = request.form.get("pin_location")
            contact = request.form.get("contact")
            description = request.form.get("description")
            category = request.form.get("category")
            photos = request.files.getlist("photos")

            # Generate service_id
            service_id = str(uuid.uuid4())

            # Validate required fields
            if not all([provider_name, contact, description]):
                return jsonify({"message": "Required fields are missing."})

            # Upload photos and save file paths
            photo_paths = []
            for photo in photos:
                filename = secure_filename(photo.filename)
                photo.save(os.path.join("static/service_photos", filename))
                photo_paths.append(filename)

            # Database connection
            connection = db_connection()
            cursor = connection.cursor()

            # Insert data into services table
            sql = """
                INSERT INTO services (service_id, provider_name, location, pin_location, contact, description, category, photos)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (service_id, provider_name, location, pin_location, contact, description, category, json.dumps(photo_paths))
            cursor.execute(sql, values)
            connection.commit()

            return jsonify({"message": "Service added successfully", "service_id": service_id})

        except Exception as e:
            return jsonify({"message": "An error occurred while adding the service", "error": str(e)})

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Search Listings
class SearchListings(Resource):
    def get(self):
        connection = None
        cursor = None
        try:
            # Get query parameters
            query = request.args.get("query", "").strip()
            location = request.args.get("location", "").strip()
            property_type = request.args.get("property_type", "").strip().lower()
            min_price = request.args.get("min_price", "").strip()
            max_price = request.args.get("max_price", "").strip()
            purpose = request.args.get("purpose", "").strip().lower()
            amenities = request.args.get("amenities", "").strip().lower()  

            # DB connection
            connection = db_connection()
            cursor = connection.cursor(dictionary=True)

            # Base SQL query
            base_query = """
                SELECT 'apartment' AS category, id AS id, title, description, location, price, amenities, purpose, image
                FROM apartments
                WHERE (%s = '' OR location LIKE %s)
                AND (%s = '' OR price BETWEEN %s AND %s)
                AND (%s = '' OR purpose LIKE %s)
                AND (%s = '' OR amenities LIKE %s)
                UNION ALL
                SELECT 'house' AS category, id AS id, house_type AS title, description, location, price, amenities, purpose, image
                FROM houses
                WHERE (%s = '' OR location LIKE %s)
                AND (%s = '' OR price BETWEEN %s AND %s)
                AND (%s = '' OR purpose LIKE %s)
                AND (%s = '' OR amenities LIKE %s)
                UNION ALL
                SELECT 'land' AS category, id AS id, title, description, location, price, amenities, purpose, image
                FROM land
                WHERE (%s = '' OR location LIKE %s)
                AND (%s = '' OR price BETWEEN %s AND %s)
                AND (%s = '' OR purpose LIKE %s)
                AND (%s = '' OR amenities LIKE %s)
                UNION ALL
                SELECT 'commercial' AS category, id AS id, title, description, location, price, amenities, purpose, image
                FROM commercial
                WHERE (%s = '' OR location LIKE %s)
                AND (%s = '' OR price BETWEEN %s AND %s)
                AND (%s = '' OR purpose LIKE %s)
                AND (%s = '' OR amenities LIKE %s)
            """

            # Prepare values
            location_filter = f"%{location}%" if location else ""
            purpose_filter = f"%{purpose}%" if purpose else ""
            amenities_filter = f"%{amenities}%" if amenities else ""  
            min_price = min_price if min_price.isdigit() else "0"
            max_price = max_price if max_price.isdigit() else "999999999"
            
            values = [
                location, location_filter, min_price, min_price, max_price, purpose, purpose_filter, amenities, amenities_filter,  # Apartments
                location, location_filter, min_price, min_price, max_price, purpose, purpose_filter, amenities, amenities_filter,  # Houses
                location, location_filter, min_price, min_price, max_price, purpose, purpose_filter, amenities, amenities_filter,  # Land
                location, location_filter, min_price, min_price, max_price, purpose, purpose_filter, amenities, amenities_filter   # Commercial
            ]

            # Execute query
            cursor.execute(base_query, values)
            results = cursor.fetchall()

            # Filter by property type manually
            if property_type:
                results = [item for item in results if item["category"].lower() == property_type]

            return jsonify({"message": "Search results fetched successfully", "data": results})

        except Exception as e:
            return jsonify({"message": "An error occurred during the search", "error": str(e)})

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

           
# fetch all users
class Users(Resource):
    def get(self):
        connection = None
        try:
            connection = db_connection()
            if not connection:
                logging.error("Database connection failed.")
                return {'response': 'Database connection failed'}, 500

            cursor = connection.cursor()

            # Fetch all columns
            cursor.execute("SELECT * FROM users")
            users = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]

            result = []
            for user in users:
                user_dict = {}
                for col, val in zip(columns, user):
                    if isinstance(val, datetime):
                        user_dict[col] = val.isoformat()
                    else:
                        user_dict[col] = val
                result.append(user_dict)

            return {'response': 'Users fetched successfully', 'users': result}, 200

        except Exception as e:
            logging.error(f"Error fetching users: {str(e)}")
            return {'response': 'An error occurred while fetching users'}, 500
        

# Hash the password using hashlib
def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

# Helper function to check authorization token (optional)
def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization']
        if not token:
            return jsonify({'response': 'Authorization token is missing'}), 403
        try:
            jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except Exception as e:
            return jsonify({'response': 'Invalid or expired token', 'error': str(e)}), 401
        return f(*args, **kwargs)
    return decorated_function


# admin login
class AdminLogin(Resource):
    @cross_origin()
    def post(self):
        try:
            data = request.json
            if not data:
                return {'response': 'Missing request data'}, 400
            
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return {'response': 'Email and password are required'}, 400

            # Step 1: Check if the email matches the super admin's email
            if email == "admin@example.com":  # Super admin's email
                # Assuming the super admin password is hashed already
                super_admin_password_hash = hash_password("securepassword123")  # Replace with real super admin hash
                if hash_password(password) == super_admin_password_hash:
                    payload = {
                        'email': email,
                        'role': 'super_admin',
                        'exp': datetime.now(timezone.utc) + timedelta(hours=1)
                    }
                    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
                    return {
                        'response': 'Super Admin Login Successful. Welcome',
                        'token': token,
                        'admin_info': {
                            'email': email,
                            'role': 'super_admin'
                        }
                    }, 200

            # Step 2: Check if the email exists in the admins table for regular admin
            connection = db_connection()
            if not connection:
                return {'response': 'Database connection error'}, 500

            cursor = connection.cursor()
            query = "SELECT id, email, password, role FROM admins WHERE email = %s"
            cursor.execute(query, (email,))
            admin = cursor.fetchone()

            if admin:
                stored_password_hash = admin[2]  # Get stored password hash from database
                if hash_password(password) == stored_password_hash:  # Verify input password hash
                    payload = {
                        'email': email,
                        'role': admin[3],
                        'exp': datetime.now(timezone.utc) + timedelta(hours=1)
                    }
                    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
                    return {
                        'response': 'Admin Login Successful. Welcome',
                        'token': token,
                        'admin_info': {
                            'email': email,
                            'role': admin[3]
                        }
                    }, 200
                else:
                    return {'response': 'Invalid password'}, 401
            else:
                return {'response': 'Admin not found'}, 404

        except Exception as e:
            logging.error(f"Error during admin login: {str(e)}")
            return {'response': 'An error occurred', 'error': str(e)}, 500
        

# Register admin
class RegisterAdmin(Resource):
    @cross_origin()
    def post(self):
        try:
            # Skip token validation for register admin endpoint
            data = request.json
            if not data:
                return jsonify({'response': 'Missing request data'}), 400

            # Extract admin data
            email = data.get('email')
            password = data.get('password')
            if not email or not password:
                return jsonify({'response': 'Email and password are required'}), 400

            # Hash password
            hashed_password = hash_password(password)

            # Insert new admin into the database
            connection = db_connection()
            if not connection:
                return jsonify({'response': 'Database connection error'}), 500

            cursor = connection.cursor()
            query = "INSERT INTO admins (email, password, role) VALUES (%s, %s, %s)"
            cursor.execute(query, (email, hashed_password, 'admin'))
            connection.commit()
            cursor.close()
            connection.close()

            return jsonify({'response': f'Admin {email} registered successfully'}), 201

        except Exception as e:
            logging.error(f"Error during admin registration: {str(e)}")
            return jsonify({'response': 'An error occurred', 'error': str(e)}), 500


# admin logout
class AdminLogout(Resource):
    def post(self):
        try:
            return jsonify({
                'response': 'Admin logged out successfully.'
            }), 200
        except Exception as e:
            logging.error(f"Error during admin logout: {str(e)}")
            return jsonify({'response': 'An error occurred', 'error': str(e)}), 500


# Endpoint to fetch the token (GET request)
class GetToken(Resource):
    @cross_origin()
    def get(self):
        try:
            # Extract token from request headers
            token = request.headers.get('Authorization', '').replace('Bearer ', '')

            if not token:
                return jsonify({'response': 'No token provided'}), 400

            # Decode the token
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

            return jsonify({
                'response': 'Token is valid',
                'token_info': decoded
            }), 200
        except jwt.ExpiredSignatureError:
            return jsonify({'response': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'response': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'response': 'An error occurred', 'error': str(e)}), 500



# delete user
class DeleteUser(Resource):
    @cross_origin(origins=["https://portal.linknamali.ke"])  # Allow specific origin
    def delete(self):
        connection = None
        cursor = None
        try:
            data = request.get_json()
            if not data:
                return {"response": "Request body must be JSON."}, 400

            target_user_id = data.get("target_user_id")
            if not target_user_id:
                return {"response": "'target_user_id' is required."}, 400

            connection = db_connection()
            if connection is None:
                return {"response": "Database connection failed."}, 500
            cursor = connection.cursor()

            cursor.execute("SELECT * FROM users WHERE user_id = %s", (target_user_id,))
            target_user = cursor.fetchone()
            if not target_user:
                return {"response": "User to be deleted not found."}, 404

            cursor.execute("DELETE FROM users WHERE user_id = %s", (target_user_id,))
            connection.commit()

            return {"response": "User deleted successfully."}, 200

        except Exception as e:
            return {"response": "An error occurred.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


#  New Listings Route
class NewListings(Resource):
    def get(self):
        connection = None
        cursor = None
        try:
            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Fetch all pending listings
            cursor.execute("""
                SELECT id, user_id, title, location, purpose, size, price, 
                       availability_status, floor_number, number_of_bedrooms, 
                       number_of_bathrooms, description, amenities, image, documents, created_at 
                FROM pending_apartments
            """)
            listings = cursor.fetchall()

            # Convert the listings to a list of dictionaries
            listings_dict = []
            for listing in listings:
                listing_dict = {
                    "id": listing[0],
                    "user_id": listing[1],
                    "title": listing[2],
                    "location": listing[3],
                    "purpose": listing[4],
                    "size": listing[5],
                    "price": listing[6],
                    "availability_status": listing[7],
                    "floor_number": listing[8],
                    "number_of_bedrooms": listing[9],
                    "number_of_bathrooms": listing[10],
                    "description": listing[11],
                    "amenities": listing[12],
                    "image": listing[13],
                    "documents": listing[14],
                    "created_at": listing[15]
                }
                listings_dict.append(listing_dict)

            # Response
            return jsonify(listings_dict)

        except Exception as e:
            logging.error(f"Error during fetching new listings: {str(e)}")
            return jsonify({"message": "An error occurred while fetching the new listings", "error": str(e)})

        finally:
            # Close the DB connection and cursor safely
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Approve apartment
class ApproveApartment(Resource):
    def post(self):
        connection = None
        cursor = None

        try:
            # Parse JSON body
            data = request.get_json()
            if not data:
                print("No data received in the request.")
                return {"message": "Request body must be JSON."}, 400

            # Extract property ID
            property_id = data.get("id")

            if not property_id:
                print("'id' is required.")
                return {"message": "'id' is required."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Check if the apartment exists
            cursor.execute("SELECT id FROM apartments WHERE id = %s", (property_id,))
            apartment_exists = cursor.fetchone()

            if not apartment_exists:
                print(f"Apartment with ID {property_id} not found.")
                return {"message": "Apartment not found."}, 404

            # Approve the apartment
            cursor.execute("UPDATE apartments SET is_approved = TRUE WHERE id = %s", (property_id,))
            connection.commit()

            print(f"Apartment {property_id} approved successfully.")
            return {"message": "Apartment approved successfully."}, 200

        except Exception as e:
            print(f"Error: {str(e)}")
            return {"message": "An error occurred.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Reject Apartment Route
class RejectApartment(Resource):
    def post(self, id):
        connection = None
        cursor = None
        try:
            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Delete the apartment from the pending_apartments table
            cursor.execute("DELETE FROM pending_apartments WHERE id = %s", (id,))
            connection.commit()

            # Response
            return jsonify({"message": "Apartment rejected and removed from pending listings"})

        except Exception as e:
            return jsonify({"message": "An error occurred while rejecting the apartment", "error": str(e)})

        finally:
            # Close the DB connection and cursor safely
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Soft Delete Property (User)
class SoftDeleteProperty(Resource):
    def put(self):
        connection = None
        cursor = None

        try:
            # Parse JSON body
            data = request.get_json()
            if not data:
                return {"message": "Request body must be JSON."}, 400

            # Extract parameters
            property_type = data.get("property_type")  # apartments, houses, land, commercial
            property_id = data.get("id")
            user_id = data.get("user_id")

            valid_tables = ["apartments", "houses", "land", "commercial"]
            if property_type not in valid_tables:
                return {"message": "Invalid property type."}, 400

            if not property_id or not user_id:
                return {"message": "'id' and 'user_id' are required."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Check if the property exists and belongs to the user
            cursor.execute(f"SELECT id FROM {property_type} WHERE id = %s AND user_id = %s", (property_id, user_id))
            property_record = cursor.fetchone()

            if not property_record:
                return {"message": "Property not found or you do not have permission to delete it."}, 404

            # Perform soft delete
            cursor.execute(f"UPDATE {property_type} SET deleted = TRUE WHERE id = %s", (property_id,))
            connection.commit()

            return {"message": f"{property_type.capitalize()} deleted successfully from your listings."}, 200

        except Exception as e:
            return {"message": "An error occurred while deleting the property.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()



# Approve House Property
class ApproveHouse(Resource):
    def post(self):
        connection = None
        cursor = None

        try:
            # Parse JSON body
            data = request.get_json()
            if not data:
                print("No data received in the request.")
                return {"message": "Request body must be JSON."}, 400

            # Extract house ID
            house_id = data.get("id")
            if not house_id:
                print("'id' is required.")
                return {"message": "'id' is required."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # **Check if the house exists**
            cursor.execute("SELECT id FROM houses WHERE id = %s", (house_id,))
            house_exists = cursor.fetchone()

            if not house_exists:
                print(f"House with ID {house_id} not found.")
                return {"message": "House not found."}, 404

            # **Approve the house**
            cursor.execute("UPDATE houses SET is_approved = TRUE WHERE id = %s", (house_id,))
            connection.commit()

            print(f"House {house_id} approved successfully.")
            return {"message": "House approved successfully."}, 200

        except Exception as e:
            print(f"Error: {str(e)}")
            return {"message": "An error occurred.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()




# Admin Restore / Permanent Delete Property
class AdminManageProperty(Resource):
    def put(self):
        connection = None
        cursor = None

        try:
            # Parse JSON body
            data = request.get_json()
            if not data:
                return {"message": "Request body must be JSON."}, 400

            # Extract parameters
            property_type = data.get("property_type")  # apartments, houses, land, commercials
            property_id = data.get("id")
            action = data.get("action")  # "restore" or "delete"

            valid_tables = ["apartments", "houses", "land", "commercial"]
            if property_type not in valid_tables:
                return {"message": "Invalid property type."}, 400

            if not property_id or action not in ["restore", "delete"]:
                return {"message": "Invalid request parameters."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            if action == "restore":
                cursor.execute(f"UPDATE {property_type} SET deleted = FALSE WHERE id = %s", (property_id,))
                message = "Property restored successfully."
            else:
                cursor.execute(f"DELETE FROM {property_type} WHERE id = %s", (property_id,))
                message = "Property permanently deleted successfully."

            connection.commit()

            return {"message": message}, 200

        except Exception as e:
            return {"message": "An error occurred.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()




# admin approve property
class AdminApproveProperty(Resource):
    def put(self):
        connection = None
        cursor = None

        try:
            # Parse JSON body
            data = request.get_json()
            if not data:
                return {"message": "Request body must be JSON."}, 400

            # Extract parameters
            property_type = data.get("property_type")  # apartments, houses, land, commercials
            property_id = data.get("id")

            valid_tables = ["apartments", "houses", "land", "commercial"]
            if property_type not in valid_tables:
                return {"message": "Invalid property type."}, 400

            if not property_id:
                return {"message": "Invalid request parameters."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Update the is_approved status to 'approved'
            cursor.execute(f"""
                UPDATE {property_type} 
                SET is_approved = 'approved' 
                WHERE id = %s AND is_approved = 'pending'""", (property_id,))

            if cursor.rowcount == 0:
                return {"message": "Property not found or already approved."}, 404

            connection.commit()

            return {"message": "Property approved successfully."}, 200

        except Exception as e:
            return {"message": "An error occurred.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()





# Fetching properties with approval check
class GetApprovedProperties(Resource):
    def get(self, property_type):
        connection = None
        cursor = None

        try:
            valid_tables = ["apartments", "houses", "land", "commercial"]
            if property_type not in valid_tables:
                return {"message": "Invalid property type."}, 400

            # DB connection
            connection = db_connection()
            cursor = connection.cursor(dictionary=True)

            # Fetch only approved and not deleted properties
            cursor.execute(f"SELECT * FROM {property_type} WHERE is_approved = 1")
            properties = cursor.fetchall()
            

            # convert Decimal values to float
            def serialize_value(value):
                if isinstance(value, Decimal):
                    return float(value)
                if isinstance(value, datetime):
                    return value.isoformat()
                return value

            for prop in properties:
                for key in prop:
                    prop[key] = serialize_value(prop[key])

            return {"properties": properties}, 200

        except Exception as e:
            return {"message": "An error occurred.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()





# All Properties Route
class AllProperties(Resource):
    def get(self):
        try:
            # Fetch data from each of the four APIs
            apartment_response = requests.get('https://api.linknamali.ke/getapartment')
            land_response = requests.get('https://api.linknamali.ke/getland')
            commercial_response = requests.get('https://api.linknamali.ke/getcommercial')
            house_response = requests.get('https://api.linknamali.ke/gethouse')

            # Check if the requests were successful
            apartment_data = apartment_response.json() if apartment_response.status_code == 200 else []
            land_data = land_response.json() if land_response.status_code == 200 else []
            commercial_data = commercial_response.json() if commercial_response.status_code == 200 else []
            house_data = house_response.json() if house_response.status_code == 200 else []

            # Combine the data into a single dictionary
            combined_data = {
                'apartments': apartment_data,
                'lands': land_data,
                'commercials': commercial_data,
                'houses': house_data
            }

            return jsonify(combined_data), 200

        except Exception as e:
            # Handle any errors during the requests
            return jsonify({'error': 'Failed to fetch data from external APIs', 'message': str(e)}), 500





# Delete Properties
class DeleteProperty(Resource):
    def delete(self, property_type, property_id):
        """
        Handles both soft and permanent delete based on user role.
        :param property_type: The table name (e.g., apartments, houses, land, commercial)
        :param property_id: The ID of the property to delete
        """
        connection = db_connection()
        cursor = connection.cursor()

        delete_type = request.args.get("type", "soft")  # Default to soft delete
        user_role = request.args.get("role", "user")  # Assume role comes from request

        if property_type not in ["apartments", "houses", "land", "commercial"]:
            return {"error": "Invalid property type"}, 400

        if delete_type == "soft":
            # Perform soft delete
            soft_delete_query = f"""
                UPDATE {property_type} 
                SET deleted = 1, deleted_at = %s 
                WHERE id = %s
            """
            cursor.execute(soft_delete_query, (datetime.now(), property_id))
            connection.commit()
            cursor.close()
            connection.close()
            return {"message": "Property soft deleted successfully"}, 200  

        elif delete_type == "permanent" and user_role == "admin":
            # Perform permanent delete
            delete_query = f"DELETE FROM {property_type} WHERE id = %s"
            cursor.execute(delete_query, (property_id,))
            connection.commit()
            cursor.close()
            connection.close()
            return {"message": "Property permanently deleted"}, 200  

        else:
            return {"error": "Unauthorized action"}, 403  





# Permanent delete
class PermanentDeleteProperty(Resource):
    def delete(self, property_id):
        """
        Handles permanent deletion of a property by admin using property_id only.
        :param property_id: The ID of the property to delete.
        """
        # Validate input
        if not property_id or property_id == "undefined":
            return {"message": "Invalid property ID"}, 400

        # List of property tables to search
        property_tables = ["apartments", "houses", "land", "commercial"]

        try:
            connection = db_connection()
            cursor = connection.cursor()

            # Iterate through all property tables and attempt deletion
            for table in property_tables:
                # Check if property exists in the current table
                cursor.execute(f"SELECT id FROM {table} WHERE id = %s", (property_id,))
                property_record = cursor.fetchone()

                # If found, delete and return success message
                if property_record:
                    cursor.execute(f"DELETE FROM {table} WHERE id = %s", (property_id,))
                    connection.commit()
                    return {"message": f"Property from '{table}' permanently deleted."}, 200

            # Property not found in any table
            return {"message": "Property not found in any category."}, 404

        except Exception as e:
            return {"message": "An error occurred while deleting the property.", "error": str(e)}, 500

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()





# Endpoints
api.add_resource(Default, '/')
api.add_resource(NewListings, '/new-listings')
api.add_resource(RejectApartment, '/reject_apartment/<string:id>')
api.add_resource(Users, '/users')
api.add_resource(UserRegister, '/user_register')
api.add_resource(VerifyOtp, '/verify_otp')
api.add_resource(UserLogin, '/user_login')
api.add_resource(DeleteUser, '/deleteuser')
api.add_resource(AdminLogin, '/admin/login')
api.add_resource(RegisterAdmin, '/admin/register')
api.add_resource(AdminLogout, '/admin/logout')
api.add_resource(ProtectedResource, '/protected')
api.add_resource(GetApartment, '/getapartment')
api.add_resource(DeleteApartment, '/deleteapartment')
api.add_resource(GetHouse, '/gethouse')
api.add_resource(DeleteHouse, '/deletehouse')
api.add_resource(GetLand, '/getland')
api.add_resource(DeleteLand, '/deleteland')
api.add_resource(GetCommercial, '/getcommercial')
api.add_resource(DeleteCommercial, '/deletecommercial')
api.add_resource(SearchListings, '/search-listings')
api.add_resource(AddService, '/addservice')
api.add_resource(UserLogout, '/logout')
api.add_resource(GetToken, '/gettoken')    
api.add_resource(SoftDeleteProperty, "/softdeleteproperty")
api.add_resource(AdminManageProperty, "/adminmanageproperty")
api.add_resource(AdminApproveProperty, "/adminapproveproperty")
api.add_resource(GetApprovedProperties, "/approvedproperties/<string:property_type>")
api.add_resource(AllProperties, "/allproperties")
api.add_resource(ApproveApartment, '/approve_apartment')
api.add_resource(ApproveHouse, "/approve-house")
api.add_resource(PermanentDeleteProperty, '/admin/delete-property/<string:property_id>')
api.add_resource(DeleteProperty, "/delete/<string:property_type>/<string:property_id>")








if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)