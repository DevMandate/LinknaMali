from flask import *
from flask_restful import Api, Resource
from functions import *

# DB Connection
import pymysql
import pymysql.cursors

def db_connection():
    return pymysql.connect(host='localhost', user='root', password='', database='linknamali')

# starts
app = Flask(__name__)
api = Api(app)

# 1. USER REGISTER

class UserRegister(Resource):
    def post(self):
        # a. DB Connection and Cursor
        connection = db_connection()
        cursor = connection.cursor()

        # b. Request form data and file uploads
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        username = request.form.get('username')
        id_number = request.form.get('id_number')
        email = request.form.get('email')
        phone_number = request.form.get('phone_number')
        password1 = request.form.get('password1')
        password2 = request.form.get('password2')
        role = request.form.get('role')
        profile_picture = request.files['profile_picture']
        profile_picture.save("static/images/" + profile_picture.filename)

        hashed_password = hashpassword(password1)

        # Save the profile picture if provided
        if profile_picture:
            picture_path = f"static/images/{profile_picture.filename}"
            profile_picture.save(picture_path)
        else:
            picture_path = None

        # Validate passwords
        if password1 != password2:
            return {'response': 'Passwords do not match'}, 400
        elif len(password1) < 6:
            return {'response': 'Password length must be more than six'}

        # d. Write SQL to insert data
        sql = "INSERT INTO users(first_name, last_name, username, id_number, email, phone_number, password, role, profile_picture) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"

        data = (first_name, last_name, username, id_number, email, phone_number, hashed_password, role, profile_picture.filename)

        # e. Execute cursor and return response
        cursor.execute(sql, data)
        connection.commit()
        return {'response': 'User registered successfully'}


class UserLogin(Resource):
    def get(self): 
        # a. DB Connection and Cursor
        connection = db_connection()
        cursor = connection.cursor()
       
        # b. Request data from query parameters
        email = request.args.get("email")
        password = request.args.get("password")

        if not email or not password:
            return {'response': 'Email and Password are required'}

        hashed_password = hashpassword(password)

        # c. SQL to request users data
        sql = "SELECT * FROM `users` WHERE email = %s AND password = %s"
        data = (email, hashed_password)

        # d. Execute the SQL and fetch user
        cursor.execute(sql, data)

        # Verification
        if cursor.rowcount == 0:
            return {'response': 'Invalid Credentials! Please Register first'}
        else:
            user = cursor.fetchone()
            return {'response': f'Logged In successfully. Welcome, {user[1]}'}





# Endpoints
api.add_resource(UserRegister, '/user_register')
api.add_resource(UserLogin, '/user_login')



app.run(debug=True)
# stops