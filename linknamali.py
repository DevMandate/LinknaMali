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
        return {'response': 'User registered successfully'}




# Endpoints
api.add_resource(UserRegister, '/user_register')




app.run(debug=True)
# stops