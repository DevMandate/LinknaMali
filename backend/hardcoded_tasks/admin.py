import uuid
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..flask_app.models import User
from flask_argon2 import Argon2
# Set up the database connection
DATABASE_URL = "mysql+pymysql://root:M4r1me%4020244@localhost/linknamali"
engine = create_engine(DATABASE_URL, echo=True) 
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

argon2 = Argon2()

admin_data = {
    "first_name": "Merime",
    "last_name": "Realestate",
    "email": "merimerealestate@gmail.com",
    "phone_number": "(+254) 757414345",
    "password1": "M4r1meD4vL0pt",
    "role": "admin",
}

def create_admin_user():
    session = None
    try:
        session = SessionLocal()
        existing_user = session.query(User).filter(User.email == admin_data["email"]).first()
        if existing_user:
            print("Admin user already exists.")
            return
        user_id = str(uuid.uuid4())
        hashed_password = argon2.generate_password_hash(admin_data['password1'])

        new_admin = User(
            user_id=user_id,
            first_name=admin_data['first_name'],
            last_name=admin_data['last_name'],
            email=admin_data['email'],
            phone_number=admin_data['phone_number'],
            password=hashed_password,
            role=admin_data['role'],
        )
        session.add(new_admin)
        session.commit()
        print("Admin user created successfully.")
    except Exception as e:
        logging.error(f"Error during admin creation: {str(e)}")
    finally:
        if session:
            session.close()

if __name__ == "__main__":
    create_admin_user()
