import mysql.connector
import logging


# Configure MySQL connection
def db_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',         # or use the IP of the remote server
            user='root',        # replace with your MySQL username
            password='M4r1me@20244',      # replace with your MySQL password
            database='linknamali',     # replace with your MySQL database name            
    
        )
        return connection
    except mysql.connector.Error as err:
        logging.error(f"Error connecting to MySQL: {err}")
        return None