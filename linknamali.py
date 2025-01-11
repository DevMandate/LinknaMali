from flask import *
from flask_restful import Api, Resource
from functions import *
from flask_cors import CORS
from werkzeug.utils import secure_filename
from propertymgt import *



# DB Connection
import pymysql
import pymysql.cursors
import jwt
import datetime  # For token expiration
import os
import uuid



# secret key 
SECRET_KEY = "tugyw64t8739qpu9uho8579uq8htou34897r6783tiy4htg5iw795y4p0thu4o58"


def db_connection():
    return pymysql.connect(host='localhost', user='root', password='', database='linknamali')

# starts
app = Flask(__name__)
api = Api(app)
CORS(app)


# Allow requests only from the frontend origin
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})



# Default Route
class Default(Resource):
    def get(self):
        return {'response': 'Welcome to LinkNamali'}




# 1. USER REGISTER
class UserRegister(Resource):
    def post(self):
        # Step 1: DB Connection and Cursor
        connection = db_connection()
        cursor = connection.cursor()

        # Step 2: Request data
        data = request.json
        first_name = data['first_name']
        last_name = data['last_name']
        id_number = data['id_number']
        email = data['email']
        phone_number = data['phone_number']
        password1 = data['password1']
        password2 = data['password2']
        role = data['role']

        # Generate a unique UUID for user_id
        user_id = str(uuid.uuid4())

        # Hash the password
        hashed_password = hashpassword(password1)

        # Validate password match and length
        if password1 != password2:
            return jsonify({'response': 'Passwords do not match'})
        elif len(password1) < 6:
            return jsonify({'response': 'Password length must be more than six'})

        # SQL to insert data
        sql = "INSERT INTO users(user_id, first_name, last_name, id_number, email, phone_number, password, role) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        data = (user_id, first_name, last_name, id_number, email, phone_number, hashed_password, role)

        # Execute cursor and return response
        cursor.execute(sql, data)
        connection.commit()

        return jsonify({'response': 'User registered successfully', 'user_id': user_id})



class UserLogin(Resource):
    def get(self):
        # a. DB Connection and Cursor
        connection = db_connection()
        cursor = connection.cursor()

        # b. Request data
        data = request.json 
        email = data['email']
        password = data['password']

        # c. SQL to verify email and hashed password
        sql = "SELECT * FROM users WHERE email = %s AND password = %s"
        hashed_password = hashpassword(password)
        cursor.execute(sql, (email, hashed_password))

        # d. Verification
        count = cursor.rowcount
        if count == 0:
            return jsonify({'response': 'Invalid Credentials'})
        else:
            user = cursor.fetchone()

            # Generate JWT Token
            payload = {
                'user_id': user[0],  # Assuming user ID is in the first column
                'email': user[4],    # Assuming email is in the fourth column
                'role': user[7],     # Assuming role is in the seventh column
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # Token expiry
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            return jsonify({
                'response': 'Login Successful. Welcome',
                'token': token,
                'last_name': {
                    'id': user[0],
                    'first_name': user[1],
                    'last_name': user[2],
                    'email': user[4],
                    'role': user[7]
                }
            })
        

def decode_jwt(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token has expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}
    

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




class ProtectedResource(Resource):
    @token_required
    def get(self, payload):
        return jsonify({'response': 'Access granted', 'user': payload})




# Save to favourite api
class SaveToFavorites(Resource):
    def post(self):
        # Step 1: Get the input JSON body (expects user_id, property_id, and/or amenity_id)
        data = request.get_json()
        user_id = data.get('user_id')
        property_id = data.get('property_id')  # Optional, for saving a property to favorites
        amenity_id = data.get('amenity_id')    # Optional, for saving an amenity to favorites

        # Step 2: Validate the input
        if not user_id:
            return jsonify({"message": "User ID is required"})
        
        if not (property_id or amenity_id):
            return jsonify({"message": "Either property_id or amenity_id is required"})

        # Step 3: DB Connection and Cursor
        connection = db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)

        try:
            # Step 4: Check if property or amenity already exists in favorites
            if property_id:
                cursor.execute("SELECT * FROM favorites WHERE user_id = %s AND property_id = %s", (user_id, property_id))
                existing_favorite = cursor.fetchone()
                if existing_favorite:
                    return jsonify({"message": "This property is already in your favorites"})

                # Add property to favorites
                cursor.execute("INSERT INTO favorites (user_id, property_id) VALUES (%s, %s)", (user_id, property_id))
            
            if amenity_id:
                cursor.execute("SELECT * FROM favorites WHERE user_id = %s AND amenity_id = %s", (user_id, amenity_id))
                existing_favorite = cursor.fetchone()
                if existing_favorite:
                    return jsonify({"message": "This amenity is already in your favorites"})

                # Add amenity to favorites
                cursor.execute("INSERT INTO favorites (user_id, amenity_id) VALUES (%s, %s)", (user_id, amenity_id))

            # Step 5: Commit changes and return success message
            connection.commit()

            return jsonify({"message": "Successfully added to favorites"})

        except Exception as e:
            return jsonify({"message": "An error occurred", "error": str(e)})

        finally:
            # Step 6: Close DB Connection
            if connection:
                cursor.close()
                connection.close()


# Get favourites 
class GetFavorites(Resource):
    def post(self):
        # Step 1: Get the input JSON body (expects user_id)
        data = request.get_json()
        user_id = data.get('user_id')

        # Step 2: Validate the input
        if not user_id:
            return jsonify({"message": "User ID is required"})

        # Step 3: DB Connection and Cursor
        connection = db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)

        try:
            # Step 4: Retrieve user's favorites (both properties and amenities)
            cursor.execute("""
                SELECT f.favorite_id, f.created_at, p.title AS property_title, a.amenity_name
                FROM favorites f
                LEFT JOIN properties p ON f.property_id = p.property_id
                LEFT JOIN amenities a ON f.amenity_id = a.amenity_id
                WHERE f.user_id = %s
            """, (user_id,))
            favorites = cursor.fetchall()

            if not favorites:
                return jsonify({"message": "No favorites found for the user"})

            return jsonify({"favorites": favorites})

        except Exception as e:
            return jsonify({"message": "An error occurred", "error": str(e)})

        finally:
            # Step 5: Close DB Connection
            if connection:
                cursor.close()
                connection.close()


# Add Apartment Route

UPLOAD_FOLDER = "static/images/"
UPLOAD_FOLDER_DOCS = "static/documents/"

class AddApartment(Resource):
    def post(self):
        connection = None
        cursor = None
        try:
            # Ensure the images folder exists
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            if not os.path.exists(UPLOAD_FOLDER_DOCS):
                os.makedirs(UPLOAD_FOLDER_DOCS)

            # Parse form data
            if "image" not in request.files:
                return jsonify({"message": "Image file is required."})

            image = request.files["image"]


            # Secure the filename
            filename = secure_filename(image.filename)

            # Save the file to the static/images folder
            image.save(os.path.join(UPLOAD_FOLDER, filename))

            # Extract other fields
            user_id = request.form.get("user_id")
            title = request.form.get("title")
            description = request.form.get("description")
            location = request.form.get("location")
            price = request.form.get("price")
            purpose = request.form.get("purpose")
            size = request.form.get("size")
            floor_number = request.form.get("floor_number")
            number_of_bedrooms = request.form.get("number_of_bedrooms")
            number_of_bathrooms = request.form.get("number_of_bathrooms")
            amenities = request.form.get("amenities")

            # Generate a unique UUID for apartment_id
            apartment_id = str(uuid.uuid4())


            # Validate required fields
            if not all([user_id, title, floor_number, number_of_bedrooms, number_of_bathrooms, amenities]):
                return jsonify({"message": "Missing required fields. Please include property_id, title, floor_number, number_of_bedrooms, number_of_bathrooms, amenities"})

            # Handle document uploads if purpose is "sell"
            
            documents_json = None  # Default to None if no documents are uploaded
            if purpose == "sell" and "documents" in request.files:
                documents = request.files.getlist("documents")
                document_names = []

                for document in documents:
                    doc_filename = secure_filename(document.filename)
                    document.save(os.path.join(UPLOAD_FOLDER_DOCS, doc_filename))
                    document_names.append(doc_filename)  # Save only the filename

                # Convert document names to JSON for storage in the database
                documents_json = json.dumps(document_names)
                    


            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Insert data into the database
            sql = """
                INSERT INTO apartments (apartment_id, user_id, title, description, location, price, purpose, size, floor_number, number_of_bedrooms, number_of_bathrooms, amenities, image, documents)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (apartment_id, user_id, title, description, location, price, purpose, size, floor_number, number_of_bedrooms, number_of_bathrooms, amenities, filename, documents_json)
            cursor.execute(sql, values)
            connection.commit()

            # Response
            return jsonify({"message": "Apartment added successfully", "apartment_id": apartment_id})

        except Exception as e:
            return jsonify({"message": "An error occurred while adding the apartment", "error": str(e)})

        finally:
            # Close the DB connection and cursor safely
            if cursor:
                cursor.close()
            if connection:
                connection.close()



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
            apartments = [dict(zip(columns, row)) for row in rows]

            # Response
            return jsonify({"message": "Success", "data": apartments})

        except Exception as e:
            return jsonify({"message": "An error occurred while fetching apartments", "error": str(e)})

        finally:
            # Close the cursor if it exists
            if cursor:
                cursor.close()

            # Close the DB connection if it exists
            if connection:
                connection.close()



# Add House Route
class AddHouse(Resource):
    def post(self):
        connection = None  # Initialize connection to None
        cursor = None  # Initialize cursor to None
        try:
            # Ensure the images folder exists
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            if not os.path.exists(UPLOAD_FOLDER_DOCS):
                os.makedirs(UPLOAD_FOLDER_DOCS)


            # Parse form data
            if "image" not in request.files:
                return jsonify({"message": "Image file is required."})

            image = request.files["image"]


            # Secure the filename
            filename = secure_filename(image.filename)

            # Save the file to the static/images folder
            image.save(os.path.join(UPLOAD_FOLDER, filename))

            # Extract other fields
            user_id = request.form.get("user_id")
            title = request.form.get("title")
            description = request.form.get("description")
            number_of_bedrooms = request.form.get("number_of_bedrooms")
            number_of_bathrooms = request.form.get("number_of_bathrooms")
            amenities = request.form.get("amenities")
            location = request.form.get("location")
            price = request.form.get("price")
            size_in_acres = request.form.get("size_in_acres")
            purpose = request.form.get("purpose")

            # Generate a unique UUID for house
            house_id = str(uuid.uuid4())

            # Validate required fields
            if not all([
                user_id, title, number_of_bedrooms, number_of_bathrooms, amenities, location, size_in_acres
            ]):
                return jsonify({"message": "Missing required fields. Please include all required fields."})



            documents_json = None  # Default to None if no documents are uploaded
            if purpose == "sell" and "documents" in request.files:
                documents = request.files.getlist("documents")
                document_names = []

                for document in documents:
                    doc_filename = secure_filename(document.filename)
                    document.save(os.path.join(UPLOAD_FOLDER_DOCS, doc_filename))
                    document_names.append(doc_filename)  # Save only the filename

                # Convert document names to JSON for storage in the database
                documents_json = json.dumps(document_names)
    

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Insert data into the database
            sql = """
                INSERT INTO houses (
                    house_id, user_id, title, description, number_of_bedrooms, number_of_bathrooms, 
                    amenities, image, location, price, size_in_acres, purpose, documents)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                house_id, user_id, title, description, number_of_bedrooms, number_of_bathrooms, 
                amenities, filename, location, price, size_in_acres, purpose, documents_json)

            cursor.execute(sql, values)
            connection.commit()

            # Response
            return jsonify({"message": "House added successfully", "house_id": house_id})

        except Exception as e:
            return jsonify({"message": "An error occurred while adding the house", "error": str(e)})

        finally:
            # Close the DB connection safely
            if cursor:
                cursor.close()
            if connection:
                connection.close()



# Get HSE class
class GetHouse(Resource):
    def get(self):
        connection = None
        cursor = None

        try:
            # Extract query parameters
            user_id = request.args.get("user_id")
            location = request.args.get("location")
            number_of_bedrooms = request.args.get("number_of_bedrooms")
            min_price = request.args.get("min_price")
            max_price = request.args.get("max_price")
            additional_amenities = request.args.get("additional_amenities")

            # Build the base SQL query
            sql = "SELECT * FROM houses WHERE 1=1"
            values = []

            # Add filters based on available query parameters
            if user_id:
                sql += " AND user_id = %s"
                values.append(user_id)

            if location:
                sql += " AND location LIKE %s"
                values.append(f"%{location}%")

            if number_of_bedrooms:
                sql += " AND number_of_bedrooms = %s"
                values.append(number_of_bedrooms)

            if min_price and max_price:
                sql += " AND CAST(price AS UNSIGNED) BETWEEN %s AND %s"
                values.extend([min_price, max_price])
            elif min_price:
                sql += " AND CAST(price AS UNSIGNED) >= %s"
                values.append(min_price)
            elif max_price:
                sql += " AND CAST(price AS UNSIGNED) <= %s"
                values.append(max_price)

            if additional_amenities:
                sql += " AND additional_amenities LIKE %s"
                values.append(f"%{additional_amenities}%")

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
            houses = [dict(zip(columns, row)) for row in rows]

            # Response
            return jsonify({"message": "Success", "data": houses})

        except Exception as e:
            return jsonify({"message": "An error occurred while fetching houses", "error": str(e)})

        finally:
            # Close the cursor if it exists
            if cursor:
                cursor.close()

            # Close the DB connection if it exists
            if connection:
                connection.close()


# Add Land route
class AddLand(Resource):
    def post(self):
        connection = None
        cursor = None
        try:
            # Ensure the required folders exist
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            if not os.path.exists(UPLOAD_FOLDER_DOCS):
                os.makedirs(UPLOAD_FOLDER_DOCS)

            # Check for image file
            if "image" not in request.files:
                return jsonify({"message": "Image file is required."})

            image = request.files["image"]
            # Secure the filename and save the image
            image_filename = secure_filename(image.filename)
            image.save(os.path.join(UPLOAD_FOLDER, image_filename))

            # Extract other fields
            user_id = request.form.get("user_id")
            title = request.form.get("title")
            description = request.form.get("description")
            land_size = request.form.get("land_size")
            land_type = request.form.get("land_type")
            location = request.form.get("location")
            price = request.form.get("price")
            purpose = request.form.get("purpose")
            amenities = request.form.get("amenities")

            # Generate a unique UUID for land_id
            land_id = str(uuid.uuid4())

            # Validate required fields
            if not all([user_id, title, land_size, land_type, location, price]):
                return jsonify({"message": "Missing required fields. Please include user_id, title, land_size, land_type, location, and price."})

            # Handle document uploads if purpose is "sell"
            documents_json = None  # Default to None if no documents are uploaded
            if purpose == "sell" and "documents" in request.files:
                documents = request.files.getlist("documents")
                document_names = []

                for document in documents:
                    doc_filename = secure_filename(document.filename)
                    document.save(os.path.join(UPLOAD_FOLDER_DOCS, doc_filename))
                    document_names.append(doc_filename)  # Save only the filename

                # Convert document names to JSON for storage in the database
                documents_json = json.dumps(document_names)

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Insert data into the database
            sql = """
                INSERT INTO land (land_id, user_id, title, description, land_size, land_type, location, price, purpose, amenities, image, documents)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                land_id, user_id, title, description, land_size, land_type, location, 
                price, purpose, amenities, image_filename, documents_json
            )
            cursor.execute(sql, values)
            connection.commit()

            # Response
            return jsonify({"message": "Land added successfully", "land_id": land_id})

        except Exception as e:
            return jsonify({"message": "An error occurred while adding the land", "error": str(e)})

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
            min_price = request.args.get("min_price")
            max_price = request.args.get("max_price")
            land_size = request.args.get("land_size")
            land_type = request.args.get("land_type")

            # Build the base SQL query
            sql = "SELECT * FROM land WHERE 1=1"
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

            if min_price and max_price:
                sql += " AND CAST(price AS UNSIGNED) BETWEEN %s AND %s"
                values.extend([min_price, max_price])
            elif min_price:
                sql += " AND CAST(price AS UNSIGNED) >= %s"
                values.append(min_price)
            elif max_price:
                sql += " AND CAST(price AS UNSIGNED) <= %s"
                values.append(max_price)

            if land_size:
                sql += " AND land_size LIKE %s"
                values.append(f"%{land_size}%")

            if land_type:
                sql += " AND land_type = %s"
                values.append(land_type)

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
            land = [dict(zip(columns, row)) for row in rows]

            # Response
            return jsonify({"message": "Success", "data": land})

        except Exception as e:
            return jsonify({"message": "An error occurred while fetching land", "error": str(e)})

        finally:
            # Close the cursor if it exists
            if cursor:
                cursor.close()

            # Close the DB connection if it exists
            if connection:
                connection.close()



# Add Commercials route
class AddCommercial(Resource):
    def post(self):
        connection = None
        cursor = None
        try:
            # Ensure the required folders exist
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            if not os.path.exists(UPLOAD_FOLDER_DOCS):
                os.makedirs(UPLOAD_FOLDER_DOCS)

            # Check for image file
            if "image" not in request.files:
                return jsonify({"message": "Image file is required."})

            image = request.files["image"]
            # Secure the filename and save the image
            image_filename = secure_filename(image.filename)
            image.save(os.path.join(UPLOAD_FOLDER, image_filename))

            # Extract fields from the request
            user_id = request.form.get("user_id")
            title = request.form.get("title")
            description = request.form.get("description")
            commercial_size = request.form.get("commercial_size")
            price = request.form.get("price")
            location = request.form.get("location")
            purpose = request.form.get("purpose")
            size = request.form.get("size")
            commercial_type = request.form.get("commercial_type")
            amenities = request.form.get("amenities")

            # Generate a unique UUID for commercial_id
            commercial_id = str(uuid.uuid4())

            # Validate required fields
            if not all([user_id, title, commercial_size, price, location, commercial_type, amenities]):
                return jsonify({"message": "Missing required fields. Please include user_id, title, commercial_size, price, location, commercial_type, and amenities."})

            # Handle document uploads if purpose is "sell"
            documents_json = None  # Default to None if no documents are uploaded
            if purpose == "sell" and "documents" in request.files:
                documents = request.files.getlist("documents")
                document_names = []

                for document in documents:
                    doc_filename = secure_filename(document.filename)
                    document.save(os.path.join(UPLOAD_FOLDER_DOCS, doc_filename))
                    document_names.append(doc_filename)  # Save only the filename

                # Convert document names to JSON for storage in the database
                documents_json = json.dumps(document_names)

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Insert data into the database
            sql = """
                INSERT INTO commercial (commercial_id, user_id, title, description, commercial_size, price, location, purpose, size, commercial_type, amenities, image, documents)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                commercial_id, user_id, title, description, commercial_size, price, location,
                purpose, size, commercial_type, amenities, image_filename, documents_json
            )
            cursor.execute(sql, values)
            connection.commit()

            # Response
            return jsonify({"message": "Commercial added successfully", "commercial_id": commercial_id})

        except Exception as e:
            return jsonify({"message": "An error occurred while adding the commercial", "error": str(e)})

        finally:
            # Close the DB connection and cursor safely
            if cursor:
                cursor.close()
            if connection:
                connection.close()



# Get commercial
class GetCommercial(Resource):
    def get(self):
        connection = None
        cursor = None

        try:
            # Extract query parameters
            user_id = request.args.get("user_id")
            title = request.args.get("title")
            location = request.args.get("location")
            min_price = request.args.get("min_price")
            max_price = request.args.get("max_price")
            commercial_type = request.args.get("commercial_type")

            # Build the base SQL query
            sql = "SELECT * FROM commercial WHERE 1=1"
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

            if min_price and max_price:
                sql += " AND CAST(price AS UNSIGNED) BETWEEN %s AND %s"
                values.extend([min_price, max_price])
            elif min_price:
                sql += " AND CAST(price AS UNSIGNED) >= %s"
                values.append(min_price)
            elif max_price:
                sql += " AND CAST(price AS UNSIGNED) <= %s"
                values.append(max_price)

            if commercial_type:
                sql += " AND commercial_type = %s"
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

            # Response
            return jsonify({"message": "Success", "data": commercials})

        except Exception as e:
            return jsonify({"message": "An error occurred while fetching commercials", "error": str(e)})

        finally:
            # Close the cursor if it exists
            if cursor:
                cursor.close()

            # Close the DB connection if it exists
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



# Search service
class SearchServices(Resource):
    def get(self):
        connection = None
        cursor = None
        try:
            query = request.args.get("query", "")
            if not query:
                return jsonify({"message": "Search query is required."})

            # Database connection
            connection = db_connection()
            cursor = connection.cursor()

            # SQL query for search
            search_query = """
                SELECT service_id, provider_name, location, contact, description, category, photos
                FROM services
                WHERE provider_name LIKE %s OR location LIKE %s OR description LIKE %s OR category LIKE %s
            """
            values = [f"%{query}%"] * 4

            cursor.execute(search_query, values)
            services = cursor.fetchall()

            # Convert result to dictionaries
            columns = [col[0] for col in cursor.description]
            result = [dict(zip(columns, service)) for service in services]

            return jsonify({"message": "Search results fetched successfully", "data": result})

        except Exception as e:
            return jsonify({"message": "An error occurred during the search", "error": str(e)})

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()



# New Listings Route
class NewListings(Resource):
    def get(self):
        connection = None
        cursor = None
        try:
            # Establish database connection
            connection = db_connection()
            cursor = connection.cursor()

            # Fetch new listings from apartments
            cursor.execute("""
                SELECT apartment_id AS id, title, description, location, price, image, 'apartment' AS category
                FROM apartments
                ORDER BY created_at DESC
                LIMIT 5
            """)
            apartments = cursor.fetchall()

            # Fetch new listings from houses
            cursor.execute("""
                SELECT house_id AS id, title, description, location, price, image, 'house' AS category
                FROM houses
                ORDER BY created_at DESC
                LIMIT 5
            """)
            houses = cursor.fetchall()

            # Fetch new listings from land
            cursor.execute("""
                SELECT land_id AS id, title, description, location, price, image, 'land' AS category
                FROM land
                ORDER BY created_at DESC
                LIMIT 5
            """)
            land = cursor.fetchall()

            # Fetch new listings from commercial
            cursor.execute("""
                SELECT commercial_id AS id, title, description, location, price, image, 'commercial' AS category
                FROM commercial
                ORDER BY created_at DESC
                LIMIT 5
            """)
            commercial = cursor.fetchall()

            # Combine all results into a categorized dictionary
            data = {
                "apartments": apartments,
                "houses": houses,
                "land": land,
                "commercial": commercial,
            }

            # Return as JSON
            return jsonify({
                "message": "New listings fetched successfully",
                "data": data
            })

        except Exception as e:
            return jsonify({"message": "An error occurred", "error": str(e)})

        finally:
            # Close database connection
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
            query = request.args.get("query", "")
            if not query:
                return jsonify({"message": "Search query is required."})

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # SQL Query to search across multiple tables
            search_query = f"""
                SELECT 'apartment' AS category, apartment_id AS id, title, description, location, price, amenities, image
                FROM apartments
                WHERE title LIKE %s OR location LIKE %s OR description LIKE %s OR price LIKE %s OR amenities LIKE %s
                UNION ALL
                SELECT 'house' AS category, house_id AS id, title, description, location, price, amenities, image
                FROM houses
                WHERE title LIKE %s OR location LIKE %s OR description LIKE %s OR price LIKE %s OR amenities LIKE %s
                UNION ALL
                SELECT 'land' AS category, land_id AS id, title, description, location, price, amenities, image
                FROM land
                WHERE title LIKE %s OR location LIKE %s OR description LIKE %s OR price LIKE %s OR amenities LIKE %s
                UNION ALL
                SELECT 'commercial' AS category, commercial_id AS id, title, description, location, price, amenities, image
                FROM commercial
                WHERE title LIKE %s OR location LIKE %s OR description LIKE %s OR price LIKE %s OR amenities LIKE %s
            """

            # Use wildcards for LIKE
            wildcard_query = f"%{query}%"
            values = [wildcard_query] * 20  # 5 columns x 4 tables

            # Execute query
            cursor.execute(search_query, values)
            results = cursor.fetchall()

            # Response
            return jsonify({"message": "Search results fetched successfully", "data": results})

        except Exception as e:
            return jsonify({"message": "An error occurred during the search", "error": str(e)})

        finally:
            # Close DB connection and cursor
            if cursor:
                cursor.close()
            if connection:
                connection.close()


#Support Tickets
class SupportTicket(Resource):
    def post(self):
        connection = None
        cursor = None
        try:
            # Extract JSON data from the request
            data = request.get_json()  # Use JSON parsing
            name = data.get("name")
            email = data.get("email")
            subject = data.get("subject")
            message = data.get("message")

            # Validate required fields
            if not email or not subject or not message:
                return {
                    "message": "Email, subject, and message are required."
                }, 400

            # Generate a unique ticket ID
            ticket_id = str(uuid.uuid4())

            # DB connection
            connection = db_connection()
            cursor = connection.cursor()

            # Insert data into the support_tickets table
            sql = """
                INSERT INTO support_tickets (ticket_id, name, email, subject, message, status)
                VALUES (%s, %s, %s, %s, %s, 'Open')
            """
            values = (ticket_id, name, email, subject, message)
            cursor.execute(sql, values)
            connection.commit()

            # Return success response
            return {
                "message": "Support ticket created successfully.",
                "ticket_id": ticket_id,
                "status": "Open"
            }, 201

        except Exception as e:
            # Return error response
            return {
                "message": "An error occurred while creating the support ticket.",
                "error": str(e)
            }, 500

        finally:
            # Safely close cursor and connection
            if cursor:
                cursor.close()
            if connection:
                connection.close()



# Admin update tickets
class UpdateTicketStatus(Resource):
    def put(self, ticket_id):
        connection = None
        cursor = None
        try:
            # Parse the request data
            data = request.get_json()
            if not data or 'status' not in data:
                return ({"message": "Status field is required."}), 400

            # Sanitize and validate the status input
            new_status = data['status'].strip()
            valid_statuses = ['Open', 'Pending', 'Resolved', 'Closed']
            if new_status not in valid_statuses:
                return ({"message": f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}"}), 400

            # Connect to the database
            connection = db_connection()
            cursor = connection.cursor()

            # Check if the ticket exists
            check_query = "SELECT * FROM support_tickets WHERE ticket_id = %s"
            cursor.execute(check_query, (ticket_id,))
            ticket = cursor.fetchone()
            if not ticket:
                return ({"message": "Ticket not found."}), 404

            # Update the ticket's status
            update_query = "UPDATE support_tickets SET status = %s WHERE ticket_id = %s"
            cursor.execute(update_query, (new_status, ticket_id))
            connection.commit()

            # Log for debugging
            print(f"Updated status for ticket_id {ticket_id} to '{new_status}'.")

            # Return a success response
            return ({"message": "Ticket status updated successfully.", "ticket_id": ticket_id, "status": new_status}), 200

        except Exception as e:
            return ({"message": "An error occurred while updating the ticket status.", "error": str(e)}), 500

        finally:
            # Close the DB connection and cursor
            if cursor:
                cursor.close()
            if connection:
                connection.close()




# Endpoints
api.add_resource(Default, '/')
api.add_resource(UserRegister, '/user_register')
api.add_resource(UserLogin, '/user_login')
api.add_resource(ProtectedResource, '/protected')
api.add_resource(SaveToFavorites, '/savetofavourites')
api.add_resource(GetFavorites, '/getfavorites')
api.add_resource(AddApartment, '/addapartment')
api.add_resource(GetApartment, '/getapartment')
api.add_resource(AddHouse, '/addhouse')
api.add_resource(GetHouse, '/gethouse')
api.add_resource(AddLand, '/addland')
api.add_resource(GetLand, '/getland')
api.add_resource(AddCommercial, '/addcommercial')
api.add_resource(GetCommercial, '/getcommercial')
api.add_resource(NewListings, '/new-listings')
api.add_resource(SearchListings, '/search-listings')
api.add_resource(AddService, '/addservice')
api.add_resource(SearchServices, '/searchservice')
api.add_resource(SupportTicket, '/supportticket')
api.add_resource(UpdateTicketStatus, '/tickets/<string:ticket_id>/status')




app.run(debug=True)
# stops