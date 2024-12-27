from flask import *
from flask_restful import Api, Resource
from functions import *
from flask_cors import CORS

# DB Connection
import pymysql
import pymysql.cursors
import jwt
import datetime  # For token expiration


# secret key 
SECRET_KEY = "tugyw64t8739qpu9uho8579uq8htou34897r6783tiy4htg5iw795y4p0thu4o58"


def db_connection():
    return pymysql.connect(host='localhost', user='root', password='', database='linknamali')

# starts
app = Flask(__name__)
api = Api(app)
CORS(app)

# 1. USER REGISTER
class UserRegister(Resource):
    def post(self):
        # step 1: DB Connection and Cursor
        connection = db_connection()
        cursor = connection.cursor()

        # step 2: Request data
        data = request.json
        first_name = data['first_name']
        last_name = data['last_name']
        id_number = data['id_number']
        email = data['email']
        phone_number = data['phone_number']
        password1 = data['password1']
        password2 = data['password2']
        role = data['role']

        hashed_password = hashpassword(password1)

        if password1 != password2:
            return jsonify({'response': 'Passwords do not match'})
        elif len(password1) < 6:
            return jsonify({'response': 'Password length must be more than six'})
        
        # d. Write SQL to insert data
        sql = "INSERT INTO users(first_name, last_name, id_number, email, phone_number, password, role) VALUES (%s, %s, %s, %s, %s, %s, %s)"


        data = (first_name, last_name, id_number, email, phone_number, hashed_password, role)


        # e. Execute cursor and return response
        cursor.execute(sql, data)
        connection.commit()
        return jsonify ({'response': 'User registered successfully'})


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



# Retrieve Properties
class GetProperty(Resource):
    def post(self):  # Change to POST if using JSON input
        # Step 1: Get the input JSON body
        data = request.get_json()
        property_id = data.get('property_id')  # Extract property_id from the JSON body
        
        # Step 2: DB Connection and Cursor
        connection = db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        # Step 3: Construct and execute SQL query
        if property_id:
            sql = "SELECT * FROM properties WHERE property_id = %s"
            cursor.execute(sql, (property_id,))
        else:
            return jsonify({"message": "Property ID is required"})
        
        # Step 4: Check if any records exist
        if cursor.rowcount == 0:
            return jsonify({"message": "No records found"})
        else:
            property_details = cursor.fetchone()
            return jsonify(property_details)



# Add Property API
class AddProperty(Resource):
    def post(self):
        try:
            # Step 1: Parse the request JSON data
            data = request.get_json()
            
            # Extract property fields
            owner_id = data.get('owner_id')
            title = data.get('title')
            description = data.get('description')
            location = data.get('location')
            price = data.get('price')
            property_type = data.get('property_type')
            availability_status = data.get('availability_status', 'available')  # Default to 'available'

            # Validate required fields
            if not all([owner_id, title, location, price, property_type]):
                return jsonify({"message": "Missing required fields. Please include owner_id, title, location, price, and property_type."})

            # Step 2: DB Connection and Cursor
            connection = db_connection()
            cursor = connection.cursor()

            # Step 3: Insert SQL Query
            sql = """
                INSERT INTO properties (owner_id, title, description, location, price, property_type, availability_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            values = (owner_id, title, description, location, price, property_type, availability_status)

            # Execute the query
            cursor.execute(sql, values)
            connection.commit()

            # Step 4: Response
            return jsonify({"message": "Property added successfully", "property_id": cursor.lastrowid})

        except Exception as e:
            return jsonify({"message": "An error occurred while adding the property", "error": str(e)})
        finally:
            # Step 5: Close DB Connection
            if connection:
                cursor.close()
                connection.close()


# Retrieve Property by Type
class GetPropertiesByType(Resource):
    def post(self):
        # Step 1: Get the input JSON body (expects the property_type field)
        data = request.get_json()
        property_type = data.get('property_type')

        # Step 2: Validate the input
        if not property_type:
            return jsonify({"message": "Property type is required"})

        # Step 3: DB Connection and Cursor
        connection = db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)

        # Step 4: Construct and execute SQL query to get properties based on the type
        sql = "SELECT * FROM properties WHERE property_type = %s"
        cursor.execute(sql, (property_type,))
        
        # Step 5: Check if any records exist
        properties = cursor.fetchall()
        if len(properties) == 0:
            return jsonify({"message": "No properties found for the given type"})

        # Step 6: Return the properties as a JSON response
        return jsonify({"properties": properties})


# Retrieve property by Amenity
class GetPropertyWithAmenity(Resource):
    def post(self):  # Change to POST if using JSON input
        # Step 1: Get the input JSON body
        data = request.get_json()
        amenity_name = data.get('amenity_name')  # Extract amenity_name from the JSON body
        
        if not amenity_name:
            return jsonify({"message": "Amenity name is required"})
        
        # Step 2: DB Connection and Cursor
        connection = db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        try:
            # Step 3: Construct and execute SQL query
            sql = """
                SELECT a.amenity_name, a.amenity_category, a.amenity_description, p.*
                FROM amenities a
                JOIN property_specific_amenities psa ON psa.amenity_id = a.amenity_id
                JOIN properties p ON psa.property_id = p.property_id
                WHERE a.amenity_name = %s
            """
            cursor.execute(sql, (amenity_name,))
            
            # Step 4: Check if any records exist
            if cursor.rowcount == 0:
                return jsonify({"message": "No properties found with the requested amenity"})
            else:
                # Fetch the result
                result = cursor.fetchall()
                
                # Combine amenity and property details into one response
                properties_with_amenity = []
                for row in result:
                    properties_with_amenity.append({
                        'property_id': row['property_id'],
                        'owner_id': row['owner_id'],
                        'title': row['title'],
                        'description': row['description'],
                        'location': row['location'],
                        'price': row['price'],
                        'property_type': row['property_type'],
                        'availability_status': row['availability_status'],
                        'amenity_name': row['amenity_name'],
                        'amenity_category': row['amenity_category'],
                        'amenity_description': row['amenity_description']
                    })
                return jsonify(properties_with_amenity)

        except Exception as e:
            return jsonify({"message": "An error occurred", "error": str(e)})

        finally:
            # Step 5: Close DB Connection
            if connection:
                cursor.close()
                connection.close()


class DeleteProperty(Resource):
    def delete(self):
        try:
            # Step 1: Parse the request JSON data
            data = request.get_json()

            # Extract property_id from the request
            property_id = data.get('property_id')

            # Validate the input
            if not property_id:
                return {"message": "Property ID is required"}, 400

            # Step 2: DB Connection and Cursor
            connection = db_connection()
            cursor = connection.cursor()

            # Step 3: Delete SQL Query
            sql = "DELETE FROM properties WHERE property_id = %s"

            # Execute the query
            cursor.execute(sql, (property_id,))
            connection.commit()

            # Check if any rows were affected
            if cursor.rowcount == 0:
                return {"message": "No property found with the provided ID"}, 404

            # Step 4: Success Response
            return {"message": f"Property with ID {property_id} has been deleted successfully"}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            # Step 5: Close DB Connection
            if connection:
                cursor.close()
                connection.close()




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




# Endpoints
api.add_resource(UserRegister, '/user_register')
api.add_resource(UserLogin, '/user_login')
api.add_resource(ProtectedResource, '/protected')
api.add_resource(GetProperty, '/get_property')
api.add_resource(AddProperty, '/add_property')
api.add_resource(GetPropertiesByType, '/get_properties_by_type')
api.add_resource(GetPropertyWithAmenity, '/properties/amenity')
api.add_resource(DeleteProperty, '/delete_property')
api.add_resource(SaveToFavorites, '/savetofavourites')
api.add_resource(GetFavorites, '/getfavorites')






app.run(debug=True)
# stops