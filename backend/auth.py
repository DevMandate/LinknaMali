from flask import request, make_response, redirect, session
from flask import Blueprint
from flask_cors import CORS
from flask_argon2 import Argon2
from datetime import datetime, timezone, timedelta
from flask_restful import Api, Resource
from models import User, Company, CompanyUserLink, CompanyInvitation
from models.engine.db_engine import SessionLocal
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_, or_
from utils.Auth import validate_email, sanitize_data
from celery_server import send_email_task, upload_profile_pic_to_r2, delete_from_r2
from vault.secrets import get_secret
import requests
import logging
import random
import uuid
import jwt
import json
import traceback

auth = Blueprint('auth', __name__, url_prefix='/auth')
api = Api(auth)
CORS(auth, resources={
    r"/auth/*": {
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
argon2 = Argon2()

@auth.route('/', methods=['GET'])
def welcome():
    return "Welcome to Auth"

# Secret key for encoding JWT token (ensure this is kept secret and secure)
SECRET_KEY = "tugyw64t8739qpu9uho8579uq8htou34897r6783tiy4htg5iw795y4p0thu4o58"


def welcome(user):
    if not user:
        logging.error("Welcome function received a None user")
        return
    
    user_name = user.first_name + " " + user.last_name
    context = {
        'user_name': user_name,
    }
    send_email_task.delay(
        sender_email='noreply@merimedevelopment.co.ke',
        recipient_email=user.email,
        subject="Linknamali - Welcome to Linknamali!",
        template_name="welcome.html",
        context=context
    )

class IsNewUser(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            data = sanitize_data(data)
            logging.debug(f"Received data: {data}")

            # Validate required field
            if 'email' not in data:
                return {'response': 'Email is required'}, 400

            # Validate email format
            if not validate_email(data['email']):
                return {'response': 'Invalid email format'}, 400

            # Check if user exists
            existing_user = session.query(User).filter(User.email == data['email']).first()
            if existing_user:
                if existing_user.is_deleted:
                    return {'response': 'This email has been deactivated. Please contact support'}, 400
                return {'response': 'User with this email already exists'}, 400

            return {'response': 'User does not exist'}, 200

        except Exception as e:
            logging.error(f"Error checking user existence: {str(e)}")
            return {'response': 'Server Error. Please try again later.'}, 500
        finally:
            if session:
                session.close()

class SignUp(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            data = sanitize_data(data)
            logging.debug(f"Received data: {data}")

            # Validate required fields
            required_fields = ['first_name', 'last_name', 'email', 'role', 'password1', 'password2']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'response': 'Missing required fields', 'fields': missing_fields}, 400
            # Validate password
            if data['password1'] != data['password2']:
                return {'response': 'Passwords do not match'}, 400
            
            # Check if user with same email, phone number, or ID already exists
            existing_user = session.query(User).filter(
                (User.email == data['email']) |
                (User.phone_number == data['phone_number']) |
                (User.id_number == data.get('id_number'))
            ).first()

            if existing_user:
                # Determine specific conflict
                if existing_user.email == data['email']:
                    return {'response': 'Email already registered. Try logging in or resetting your password.'}, 400
                if existing_user.phone_number == data['phone_number']:
                    return {'response': 'Phone number already registered. Use a different one or login instead.'}, 400
                if existing_user.id_number == data.get('id_number'):
                    return {'response': 'ID number already registered. Please check or contact support.'}, 400


                        
            # Generate user ID and hash password
            user_id = str(uuid.uuid4())  
            hashed_password = argon2.generate_password_hash(data['password1'])
            otp = random.randint(100000, 999999)
            otp_expiry = datetime.now() + timedelta(minutes=15) #valid for 15 minutes

            # Create new user in DB
            new_user = User(
                user_id=user_id,
                first_name=data['first_name'],
                last_name=data['last_name'],
                id_number=data.get('id_number'),
                email=data['email'],
                phone_number=data['phone_number'],
                password=hashed_password,
                role=data.get('role', 'buyer'),
                otp=otp,
                otp_expiry=otp_expiry,
                signup_method="Normal" 
            )

            # Check for a matching company invitation
            invitation = session.query(CompanyInvitation).filter_by(
                email=data['email'], is_accepted=False
            ).first()

            if invitation and invitation.expiry > datetime.utcnow():
                # Link user to company
                new_user.company_id = invitation.company_id

                # Add user first to get the ID in DB
                session.add(new_user)
                session.flush()

                # Create the link between user and company
                new_link = CompanyUserLink(
                    company_id=invitation.company_id,
                    user_id=new_user.user_id,
                    role=invitation.role,
                    is_accepted=True,
                    invited_by=invitation.invited_by
                )
                session.add(new_link)

                # Mark invitation as accepted
                invitation.is_accepted = True

            else:
                # No invitation? Just add the user normally
                session.add(new_user)
            session.commit()
    
            # Send OTP to user
            user_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
            context = {
                'user_name': user_name,
                'otp': otp,
            }
            send_email_task.delay(
                sender_email='noreply@merimedevelopment.co.ke',
                recipient_email=data['email'],
                subject="Linknamali - OTP Verification",
                template_name="otp_email.html",
                context=context
            )

            response_payload = {'response': 'User registered successfully. Please verify your email with the OTP.'}

            if invitation and invitation.invited_by:
                response_payload['redirect_owner_id'] = invitation.invited_by 

            return response_payload, 201


        except Exception as e:
            logging.error(f"Error during signup: {str(e)}")
            return {'response': 'Server Error. Please try again later.'}, 500
        finally:
            if session:
                session.close()

class VerifyOtp(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            data = sanitize_data(data)
            logging.debug(f"Received OTP verification data: {data}")

            required_fields = ['email', 'otp']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'response': 'Missing required fields', 'fields': missing_fields}, 400

            email = data['email']
            otp = data['otp']

            user = User.get_active(session).filter(User.email == email).first()
            if not user:
                return {'response': 'Server error. User registration was not successful'}, 400

            # Check if OTP has expired
            if datetime.now() > user.otp_expiry:
                return {'response': 'OTP has expired'}, 400
            
            # Check if OTP matches
            if user.otp != otp:
                return {'response': 'Invalid OTP'}, 400

            # Generate JWT Token
            payload = {
                'user_id': user.user_id,
                'email': user.email,
                'role': user.role,
                'exp': datetime.now(timezone.utc) + timedelta(days=2)
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            # Clear OTP after verification
            user.otp = None
            user.is_verified = True 
            session.commit()

            #send welcome email
            welcome(user)

            # Set authentication cookie
            response = make_response({'response': 'Email verified successfully'})
            response.set_cookie(
                key='auth_token',
                value=token,
                httponly=True,
                secure=True,
                samesite='None',
                domain='.linknamali.ke',
                max_age=172800
            )

            logger.info(f"Set auth cookie after OTP verification for {email}, {token}")
            return response

        except Exception as e:
            logging.error(f"Error during OTP verification: {str(e)}")
            return {'response': 'Server Error. Please try again later.'}, 500
        finally:
            if session:
                session.close()

class UserData(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            token = request.cookies.get('auth_token')
            if not token:
                return {'error': 'Token is missing'}, 401

            # Decode JWT
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            user_id = payload['user_id']

            if user_id:
                logger.info(f"User ID from token: {user_id}")
            user = session.query(User).filter_by(user_id=user_id).first()
            if not user:
                return {'error': 'User not found'}, 404
            
            redirect_owner_id = None
            if user.company_id:
                company = session.query(Company).filter_by(company_id=user.company_id).first()
                redirect_owner_id = company.company_owner_id if company else None

            return {
                'user_id': user.user_id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'role': user.role,
                'signup_method': user.signup_method,
                'profile_pic_url': user.profile_pic_url,
                'company_id': user.company_id,
                'redirect_owner_id': redirect_owner_id
            }, 200

        except jwt.ExpiredSignatureError:
            return {'error': 'Token has expired'}, 401
        except jwt.InvalidTokenError:
            return {'error': 'Invalid token'}, 401
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500
        finally:
            if session:
                session.close()

class Login(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            print("Login request data received:", data)
            data = sanitize_data(data)
            
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return {'response': 'Email and password are required'}, 400
            
            if not validate_email(email):
                return {'response': 'Invalid email format'}, 400

            user = session.query(User).filter(User.email == email).first()
            if not user:
                return {'response': 'This email is not registered'}, 400

            if user.is_deleted:
                return {'response': 'This email has been deactivated. Please contact support'}, 400
            
            if user.signup_method == "Google":
                return {'response': f"This account was registered using Google. Please sign in with Google instead."}, 400

            if not argon2.check_password_hash(user.password, password):
                return {'response': 'Invalid password'}, 400
            
            if not user.is_verified:
                otp = random.randint(100000, 999999)
                user.otp = otp
                user.otp_expiry = datetime.now() + timedelta(minutes=15)
                session.commit()
                context = {
                    'otp': otp,
                }
                send_email_task.delay(
                    sender_email='noreply@merimedevelopment.co.ke',
                    recipient_email=email,
                    subject="Linknamali - OTP Verification",
                    template_name="otp_email.html",
                    context=context
                )
                return {'response': 'User needs Verification', 'error_code': 'USER_NOT_VERIFIED'}, 400
            
            redirect_owner_id = None
            if user.company_id:
                company = session.query(Company).filter_by(company_id=user.company_id).first()
                redirect_owner_id = company.company_owner_id if company else None

            payload = {
                'user_id': user.user_id,
                'email': user.email,
                'role': user.role,
                'company_id': user.company_id,
                'redirect_owner_id': redirect_owner_id,
                'exp': datetime.now(timezone.utc) + timedelta(hours=1)  
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            # Create response and set cookie
            response = make_response({'response': 'Login successful'})
            response.set_cookie(
                'auth_token',
                value=token,
                httponly=True,
                secure=True,
                samesite='None',
                domain='.linknamali.ke',
                max_age=3600  # 1 hour expiration
            )

            return response

        except Exception as e:
            print("🔥 Login error occurred:", e)
            traceback.print_exc()  # Shows the exact line that failed
            return {'response': 'Server Error. Please try again later.'}, 500
        finally:
            if session:
                session.close()


class Logout(Resource):
    def post(self):
        try:
            response = make_response({'response': 'Logged out successfully'})
            response.set_cookie(
                'auth_token', 
                value='', 
                httponly=True, 
                secure=True,
                samesite='None',
                domain='.linknamali.ke',
                expires=0
            )
            return response
        except Exception as e:
            return {'response': 'Server Error. Logout failed.'}, 500


class UpdateUser(Resource):
    def put(self, user_id):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            data = sanitize_data(data)
            user = User.get_active(session).filter(User.user_id == user_id).first()
            if not user:
                return {'response': 'User not found'}, 404

            # Fields that can be updated
            updatable_fields = ["first_name", "last_name", "email"]
            updated = False
            email_changed = False

            for field in updatable_fields:
                if field in data and getattr(user, field) != data[field]:
                    if field == "email":  # Special handling for email change
                        email_changed = True
                        if not validate_email(data['email']):
                            return {'response': 'Invalid email format'}, 400
                        otp = random.randint(100000, 999999)
                        otp_expiry = datetime.now() + timedelta(minutes=15)
                        user.otp = otp
                        user.is_verified = False
                        user.otp_expiry = otp_expiry

                    setattr(user, field, data[field])
                    updated = True

            if updated:
                session.commit()

                if email_changed:
                    # Send OTP for email verification
                    user_name = f"{user.first_name} {user.last_name}".strip()
                    send_email_task.delay(
                        sender_email='noreply@merimedevelopment.co.ke',
                        recipient_email=user.email,
                        subject="Linknamali - OTP Verification",
                        template_name="otp_email.html",
                        context={"user_name": user_name, "otp": otp}
                    )

                return {'response': 'User updated successfully'}, 200

            return {'response': 'No changes detected'}, 200

        except Exception as e:
            logging.error(f"Error updating user: {str(e)}")
            return {'response': 'Server Error. Please try again later.'}, 500
        finally:
            if session:
                session.close()


class UpdatePassword(Resource):
    def put(self, user_id):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            data = sanitize_data(data)

            user = User.get_active(session).filter(User.user_id == user_id).first()

            if not user:
                return {'response': 'User not found'}, 404

            # Validate required fields
            required_fields = ["old_password", "new_password", "confirm_password"]
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'response': 'Missing required fields', 'fields': missing_fields}, 400

            # Validate new passwords match
            if data["new_password"] != data["confirm_password"]:
                return {'response': 'Passwords do not match'}, 400

            # Verify old password
            if not argon2.check_password_hash(user.password, data["old_password"]):
                return {'response': 'The current password you entered is incorrect.'}, 400

            # Hash and update the new password
            user.password = argon2.generate_password_hash(data["new_password"])
            session.commit()

            return {'response': 'Password updated successfully'}, 200

        except Exception as e:
            logging.error(f"Error updating password: {str(e)}")
            return {'response': 'Server Error. Please try again later.'}, 500
        finally:
            if session:
                session.close()

class SendEmailReset(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            data = sanitize_data(data)

            email = data.get('email')

            if not email:
                return {'response': 'Email is required'}, 400
            
            if not validate_email(email):
                return {'response': 'Invalid email format'}, 400

            user = session.query(User).filter(User.email == email).first()

            if not user:
                return {'response': 'This email is not registered'}, 400

            if user.is_deleted:
                return {'response': 'This email has been deactivated. Please contact support'}, 400
            
            if user.signup_method == "Google":
                return {'response': f"This account was registered using Google. Please sign in with Google instead."}, 400

            # Generate reset_uuid
            reset_uuid = str(uuid.uuid4())
            user.reset_uuid = reset_uuid
            session.commit()

            # Prepare email content
            reset_link = f"https://linknamali.ke/reset/{reset_uuid}/{user.user_id}"
            context = {
                'reset_link': reset_link
            }

            # Send email asynchronously
            send_email_task.delay(
                sender_email='noreply@merimedevelopment.co.ke',
                recipient_email=email,
                subject="Linknamali - Password Reset",
                template_name="password_reset.html",
                context=context
            )
            return {'response': 'A password reset email has been sent'}, 200
        except Exception as e:
            return {'response': 'An error occurred', 'error': str(e)}, 500
        finally:
            if session:
                session.close()

class PasswordReset(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            data = sanitize_data(data)

            user_id = data.get('user_id')
            reset_uuid = data.get('reset_uuid')
            password1 = data.get('password1')
            password2 = data.get('password2')
            
            # Get active user
            user = User.get_active(session).filter(User.user_id == user_id).first()
            if not user:
                return {'response': 'User not found'}, 404

            # Verify reset UUID
            if user.reset_uuid != reset_uuid:
                return {'response': 'Password reset did not succeed', 'error_code': 'RESET_FAILED'}, 400

            # Validate passwords match
            if password1 != password2:
                return {'response': 'Passwords do not match'}, 400

            # Hash the new password
            hashed_password = argon2.generate_password_hash(password1)

            # Update user password and clear reset UUID
            user.password = hashed_password
            user.reset_uuid = None
            session.commit()

            return {'response': 'Password has been reset successfully'}, 200
        except Exception as e:
            return {'response': 'An error occurred', 'error': str(e)}, 500
        finally:
            if session:
                session.close()


class DeleteUser(Resource):
    def put(self, user_id):
        session = None
        try:
            session = SessionLocal()
            user = User.get_active(session).filter(User.user_id == user_id).first()

            if not user:
                return {'response': 'User not found'}, 404

            # Soft delete the user
            user.is_deleted = True
            user.is_verified = False
            session.commit()

            return {'response': 'User account deleted successfully'}, 200

        except Exception as e:
            logging.error(f"Error deleting user: {str(e)}")
            return {'response': 'Server error. Please try again later.'}, 500

        finally:
            if session:
                session.close()




google_secrets = get_secret("google_oauth")
if not google_secrets:
    raise Exception("Google OAuth credentials not found in Vault")

GOOGLE_CLIENT_ID = google_secrets["client_id"]
GOOGLE_CLIENT_SECRET = google_secrets["client_secret"]
GOOGLE_REDIRECT_URIS = json.loads(google_secrets["redirect_uris"])  # Convert JSON string to Python list
if isinstance(GOOGLE_REDIRECT_URIS, list) and GOOGLE_REDIRECT_URIS:
    GOOGLE_REDIRECT_URI = GOOGLE_REDIRECT_URIS[0]
else:
    raise Exception("Invalid redirect_uris format in Vault")

class GoogleAuth(Resource):
    def get(self):
        """Redirects user to Google OAuth login."""
        logger.info(f"Starting Google OAuth flow")
        logger.info(f"Got {GOOGLE_REDIRECT_URI}, {GOOGLE_CLIENT_ID}, {GOOGLE_CLIENT_SECRET}")
        google_auth_url = (
            "https://accounts.google.com/o/oauth2/auth"
            "?response_type=code"
            f"&client_id={GOOGLE_CLIENT_ID}"
            f"&redirect_uri={GOOGLE_REDIRECT_URI}"
            "&scope=email%20profile"
            "&access_type=offline"
            "&prompt=select_account"
        )
        logger.info(f"Ending {google_auth_url}")
        return make_response(redirect(google_auth_url))


class GoogleCallback(Resource):
    def get(self):
        """Handles the OAuth callback from Google."""
        session_db = SessionLocal()
        try:
            code = request.args.get("code")
            if not code:
                return {"response": "Authorization code not found", "error": "Missing code"}, 400

            # Exchange code for access token
            token_data = {
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
            token_response = requests.post("https://oauth2.googleapis.com/token", data=token_data)
            token_json = token_response.json()
            access_token = token_json.get("access_token")

            if not access_token:
                return {"response": "Failed to obtain access token", "error": token_json.get("error_description", "Unknown error")}, 400

            # Get user info
            headers = {"Authorization": f"Bearer {access_token}"}
            user_info_response = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers=headers)
            user_info = user_info_response.json()

            email = user_info.get("email")
            first_name = user_info.get("given_name", "")
            last_name = user_info.get("family_name", "")

            if not email:
                return {"response": "Email not found in Google response", "error": "No email provided"}, 400

            # Check if user exists in database
            user = session_db.query(User).filter(User.email == email).first()
            if not user:
                frontend_redirect_url = (
                    f"https://linknamali.ke/google-callback?status=select-role"
                    f"&email={email}&first_name={first_name}&last_name={last_name}"
                )
                return redirect(frontend_redirect_url)
            
            if user.is_deleted:
                return {'response': 'This email has been deactivated. Please contact support'}, 400

            # Generate JWT Token
            payload = {
                "user_id": user.user_id,
                "email": user.email,
                "role": user.role,
                "exp": datetime.now(timezone.utc) + timedelta(days=2)
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            # Set JWT as HTTP-only cookie
            frontend_redirect_url = f"https://linknamali.ke/google-callback?status=success"
            flask_response = make_response(redirect(frontend_redirect_url))
            flask_response.set_cookie(
                key="auth_token",
                value=token,
                httponly=True,
                secure=True,
                samesite="None",
                domain=".linknamali.ke",
                max_age=172800
            )
            return flask_response

        except Exception as e:
            return {"response": "An error occurred", "error": str(e)}, 500
        finally:
            session_db.close()

class GoogleUserNotFound(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            data = sanitize_data(data)
            logging.debug(f"Received data: {data}")

            # Validate required fields
            required_fields = ['first_name', 'last_name', 'email', 'role']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'response': 'Missing required fields', 'fields': missing_fields}, 400

            # Generate user ID
            user_id = str(uuid.uuid4())
            role = data.get('role', 'buyer')
            hashed_password = argon2.generate_password_hash(data['email'])
            # Create new user in DB
            new_user = User(
                user_id=user_id,
                first_name=data['first_name'],
                last_name=data['last_name'],
                email=data['email'],
                password=hashed_password,
                role = role,
                signup_method="Google"
            )
            session.add(new_user)
            session.commit()

            # Send welcome email
            welcome(new_user)
            
            # Generate JWT Token
            payload = {
                'user_id': user_id,
                'email': data['email'],
                'role': role,
                'exp': datetime.now(timezone.utc) + timedelta(days=2)  
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            # Create response and set cookie
            response = make_response({'response': 'Login successful'})
            response.set_cookie(
                'auth_token',
                value=token,
                httponly=True,
                secure=True,
                samesite='None',
                domain='.linknamali.ke',
                max_age=172800
            )
            return response

        except Exception as e:
            logging.error(f"Error during Google signup: {str(e)}")
            return {'response': 'Server Error. Please try again later.'}, 500
        finally:
            if session:
                session.close()

class CreateProfilePic(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            user_id = request.form.get("user_id")
            if not user_id:
                return {"message": "Missing user_id"}, 400
            
            user = session.query(User).filter(User.user_id == user_id).first()
            if not user:
                return {"message": "User not found"}, 404
            
            if user.profile_pic_url is not None:
                # Delete Previous Image. The one on DB will be overwritten by celery.
                folder_prefix = f"users/{user_id}/profile_pic/"
                delete_from_r2.delay(folder_prefix)

            profile_pic = request.files.get("profile_pic")
            if not profile_pic:
                return {"message": "No profile picture provided"}, 400

            # Read image content
            profile_pic_content = profile_pic.read()

            # Send to Celery for async upload
            upload_profile_pic_to_r2.delay(user_id, {
                "filename": profile_pic.filename,
                "content": profile_pic_content,
                "content_type": profile_pic.content_type
            })

            return {"message": "Profile picture is being uploaded."}, 201

        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            return {"message": "Server error. Please try again later."}, 500

        finally:
            if session:
                session.close()

class DeleteProfilePic(Resource):
    def delete(self):
        session = None
        try:
            session = SessionLocal()
            data = request.get_json()
            
            if "user_id" not in data:
                return {"message": "Missing user_id"}, 400
            
            user_id = data["user_id"]

            #Delete from R2
            folder_prefix = f"users/{user_id}/profile_pic/"
            delete_from_r2.delay(folder_prefix)

            # Fetch user profile
            user = session.query(User).filter(User.user_id == user_id).first()
            if not user:
                return {"message": "User not found"}, 404

            # Remove profile picture URL from the database
            user.profile_pic_url = None
            session.commit()

            return {"message": "Profile picture deleted successfully"}, 200

        except SQLAlchemyError as db_err:
            if session:
                session.rollback()
            logging.error(f"Database error: {db_err}")
            return {"message": "Database error. Please try again later."}, 500
        
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            return {"message": "Server error. Please try again later."}, 500

        finally:
            if session:
                session.close()


class SendBulkEmail(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json

            raw_subject = data.get('subject')
            subject = f"Linknamali - {raw_subject}" if raw_subject else None
            message_body = data.get('message_body')
            note_type = data.get('note_type', 'Notice')
            additional_info = data.get('additional_info', '')
            sender_email = data.get('sender_email', 'support@merimedevelopment.co.ke')
            user_id = data.get('user_id')
            role = data.get('role')  # New

            if not subject or not message_body:
                return {'message': 'Missing required fields'}, 400

            # Determine recipients
            if user_id:
                users = session.query(User).filter_by(user_id=user_id, is_deleted=False).all()
            else:
                query = session.query(User).filter_by(is_deleted=False)
                if role:
                    query = query.filter(User.role == role)
                users = query.all()

            if not users:
                return {'message': 'No matching users found'}, 404

            template_name = 'bulk_announcement_email.html'

            for user in users:
                if not user.email:
                    continue

                context = {
                    'user_name': f"{user.first_name} {user.last_name}",
                    'note_type': note_type,
                    'message_body': message_body,
                    'additional_info': additional_info
                }

                send_email_task.delay(
                    sender_email=sender_email,
                    recipient_email=user.email,
                    subject=subject,
                    template_name=template_name,
                    context=context
                )

            return {'message': f'Bulk email task initiated for {len(users)} user(s).'}, 200

        except Exception as e:
            return {'message': str(e)}, 500
        finally:
            if session:
                session.close()


class SendUserEmail(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json

            user_id = data.get('user_id')
            subject = data.get('subject')
            message_body = data.get('message_body')
            note_type = data.get('note_type', 'Note')
            additional_info = data.get('additional_info', '')

            if not user_id or not subject or not message_body:
                return {'message': 'Missing required fields'}, 400

            user = session.query(User).filter_by(user_id=user_id, is_deleted=False).first()
            if not user:
                return {'message': 'User not found'}, 404

            context = {
                "user_name": f"{user.first_name} {user.last_name}",
                "note_type": note_type,
                "message_body": message_body,
                "additional_info": additional_info
            }

            send_email_task.delay(
                sender_email="support@merimedevelopment.co.ke",
                recipient_email=user.email,
                subject=subject,
                template_name='admin_to_user_email.html',
                context=context
            )

            return {'message': f'Email sent to {user.email}'}, 200

        except Exception as e:
            return {'message': str(e)}, 500

        finally:
            if session:
                session.close()


class SearchUsers(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            query = request.args.get("q", "").strip()
            page = int(request.args.get("page", 1))
            limit = int(request.args.get("limit", 10))
            offset = (page - 1) * limit

            base_query = session.query(User).filter(User.is_deleted == False)

            if query:
                base_query = base_query.filter(
                    or_(
                        User.first_name.ilike(f"%{query}%"),
                        User.last_name.ilike(f"%{query}%"),
                        User.email.ilike(f"%{query}%")
                    )
                )

            total_count = base_query.count()
            users = base_query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

            results = [
                {
                    "user_id": user.user_id,
                    "name": f"{user.first_name} {user.last_name}",
                    "email": user.email
                }
                for user in users
            ]

            return {
                "users": results,
                "has_more": (offset + limit) < total_count
            }, 200

        except Exception as e:
            return {"message": str(e)}, 500

        finally:
            if session:
                session.close()



# Add resources to API
api.add_resource(GoogleAuth, "/google")
api.add_resource(GoogleCallback, "/google/callback")
api.add_resource(GoogleUserNotFound, "/googleusernotfound")
api.add_resource(IsNewUser, '/is-new-user')
api.add_resource(SignUp, '/signup')
api.add_resource(VerifyOtp, '/verify-otp')
api.add_resource(UserData, '/cookie')
api.add_resource(Login, '/login')
api.add_resource(Logout, '/logout')
api.add_resource(UpdateUser, '/updateuser/<string:user_id>')
api.add_resource(UpdatePassword, '/updatepassword/<string:user_id>')
api.add_resource(SendEmailReset, '/send-password-reset')
api.add_resource(PasswordReset, '/password-reset')
api.add_resource(DeleteUser, '/deleteuser/<string:user_id>')
api.add_resource(CreateProfilePic, "/profile-pic/upload")
api.add_resource(DeleteProfilePic, "/profile-pic/delete")
api.add_resource(SendBulkEmail, '/send-bulk-email')
api.add_resource(SendUserEmail, '/send-user-email')
api.add_resource(SearchUsers, '/get-all-users')

