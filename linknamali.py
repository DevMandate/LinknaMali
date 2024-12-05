from flask import *
from flask_restful import Api, Resource
from functions import *

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
                'user': {
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







# Endpoints
api.add_resource(UserRegister, '/user_register')
api.add_resource(UserLogin, '/user_login')
api.add_resource(ProtectedResource, '/protected')





app.run(debug=True)
# stops