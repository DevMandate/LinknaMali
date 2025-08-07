import logging
from flask import Blueprint, request, jsonify, make_response
from jinja2 import Environment, FileSystemLoader
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask_restful import Api, Resource
from flask_cors import CORS
from database.database import db_connection
import uuid, os, boto3
from werkzeug.utils import secure_filename
import smtplib
import ssl
import threading

# Blueprint Setup
serviceprofiles = Blueprint("profiles", __name__)
api = Api(serviceprofiles)
CORS(serviceprofiles, resources={
    r"/serviceprofiles/*": {
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

# Cloudflare Config
CLOUDFLARE_ACCESS_KEY = os.getenv("CLOUDFLARE_ACCESS_KEY")
CLOUDFLARE_SECRET_KEY = os.getenv("CLOUDFLARE_SECRET_KEY")
CLOUDFLARE_BUCKET_NAME = "linknamali"
CLOUDFLARE_ENDPOINT = "https://d418c3595b04db7f9e063c255ea021d0.r2.cloudflarestorage.com"
CLOUDFLARE_CDN = "https://files.linknamali.ke"

def upload_service_media(file_obj, user_id, filename):
    session = boto3.Session()
    media_id = str(uuid.uuid4())
    extension = filename.rsplit(".", 1)[-1].lower()
    object_name = f"servicesproviders/{user_id}/{media_id}.{extension}"

    try:
        s3_client = session.client(
            "s3",
            endpoint_url=CLOUDFLARE_ENDPOINT,
            aws_access_key_id=CLOUDFLARE_ACCESS_KEY,
            aws_secret_access_key=CLOUDFLARE_SECRET_KEY
        )
        s3_client.put_object(
            Bucket=CLOUDFLARE_BUCKET_NAME,
            Key=object_name,
            Body=file_obj
        )
        return f"{CLOUDFLARE_CDN}/{object_name}"
    except Exception as e:
        print(f"Upload failed: {e}")
        return None

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB in bytes


# Email Configuration
SMTP_SERVER = "mail.merimedevelopment.co.ke"
SMTP_PORT = 587
SENDER_EMAIL = "support@merimedevelopment.co.ke"
SENDER_PASSWORD = "M4r1meDvSup0"


# Configure Jinja2 environment
TEMPLATE_ENV = Environment(loader=FileSystemLoader("email_templates"))


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


# Send email asynchronously
def send_email_async(receiver_email, subject, body, is_html=False):
    """Helper function to send an email in a separate thread."""
    thread = threading.Thread(target=send_email, args=(receiver_email, subject, body, is_html))
    thread.start()


# Function to check the total size of user's previous uploads
def get_user_total_upload_size(user_id):
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(LENGTH(file_data)) FROM service_media WHERE user_id = %s", (user_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    total_size = result[0] if result[0] is not None else 0
    return total_size



# Service Profile
class CreateServiceProfile(Resource):
    def post(self):
        try:
            data = request.get_json()
            user_id = data.get("user_id")
            business_name = data.get("business_name")
            category = data.get("category")
            description = data.get("description")
            location = data.get("location")
            phone_number = data.get("phonenumber")
            email = data.get("email")

            conn = db_connection()
            cursor = conn.cursor()

            # Check if user already has a profile under the same category
            check_sql = """
                SELECT id FROM service_profiles 
                WHERE user_id = %s AND business_name = %s AND category = %s
            """
            cursor.execute(check_sql, (user_id, business_name, category))
            existing_profile = cursor.fetchone()

            if existing_profile:
                cursor.close()
                conn.close()
                return make_response(jsonify({
                    "message": "You already have a service profile in this category.",
                    "profile_id": existing_profile[0]
                }), 400)

            # Otherwise, allow creation
            profile_id = str(uuid.uuid4())
            insert_sql = """
                INSERT INTO service_profiles (id, user_id, business_name, category, description, location, phone_number, email)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_sql, (profile_id, user_id, business_name, category, description, location, phone_number, email))
            conn.commit()

            cursor.close()
            conn.close()

            return jsonify({"message": "Profile created", "profile_id": profile_id})

        except Exception as e:
            return make_response(jsonify({"message": "Error", "error": str(e)}), 500)


# Upload Media
class UploadServiceMedia(Resource):
    def post(self):
        try:
            user_id = request.form.get("user_id")
            profile_id = request.form.get("profile_id")
            files = request.files.getlist("files")  # Accept multiple files using "files"

            if not files:
                return make_response(jsonify({"message": "No files uploaded"}), 400)

            # Calculate total size of uploaded files
            total_size = 0
            for file in files:
                file_size = file.content_length or len(file.read())
                total_size += file_size
                file.seek(0)  # Reset file pointer after reading

            # Check if total size exceeds 50MB
            max_size = 50 * 1024 * 1024  # 50MB in bytes
            if total_size > max_size:
                return make_response(jsonify({
                    "message": "Upload exceeds size limit of 50MB",
                    "total_upload_size_MB": round(total_size / (1024 * 1024), 2)
                }), 400)

            uploaded_files = []

            conn = db_connection()
            cursor = conn.cursor()

            for file in files:
                filename = secure_filename(file.filename)
                media_url = upload_service_media(file, user_id, filename)

                if not media_url:
                    continue  # Skip this file, optionally log it

                media_type = "video" if filename.lower().endswith(("mp4", "mov")) else "image"
                media_id = str(uuid.uuid4())

                sql = """
                    INSERT INTO service_media (id, profile_id, media_url, media_type)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(sql, (media_id, profile_id, media_url, media_type))
                uploaded_files.append(media_url)

            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({
                "message": f"{len(uploaded_files)} media file(s) uploaded successfully",
                "uploaded": uploaded_files
            })

        except Exception as e:
            return make_response(jsonify({"message": "Error", "error": str(e)}), 500)


# Get All Service Providers
class AllServiceProviders(Resource):
    def get(self):
        connection = db_connection()
        cursor = connection.cursor()

        query = """
            SELECT 
                sp.id AS profile_id,
                sp.user_id,
                sp.business_name,
                sp.category,
                sp.description,
                sp.location,
                sp.phone_number,
                sp.email,
                sp.created_at,
                sp.status,
                sp.under_review,
                sm.id AS media_id,
                sm.media_url,
                sm.media_type,
                sm.uploaded_at
            FROM 
                service_profiles sp
            LEFT JOIN 
                service_media sm ON sp.id = sm.profile_id
            ORDER BY 
                sp.created_at DESC;
        """

        cursor.execute(query)
        results = cursor.fetchall()

        # Group media by profile_id
        providers = {}
        for row in results:
            profile_id = row[0]
            if profile_id not in providers:
                providers[profile_id] = {
                    'profile_id': profile_id,
                    'user_id': row[1],
                    'business_name': row[2],
                    'category': row[3],
                    'description': row[4],
                    'location': row[5],
                    'phone_number': row[6],
                    'email': row[7],
                    'created_at': row[8].strftime('%Y-%m-%d %H:%M:%S'),
                    'status': row[9],
                    'under_review': bool(row[10]),
                    'media': []
                }
            if row[11]:  # If media exists
                providers[profile_id]['media'].append({
                    'media_id': row[11],
                    'media_url': row[12],
                    'media_type': row[13],
                    'uploaded_at': row[14].strftime('%Y-%m-%d %H:%M:%S') if row[14] else None
                })

        cursor.close()
        connection.close()

        return list(providers.values()), 200


# Get Service Providers by Category
class ServiceProvidersByCategory(Resource):
    def get(self):
        category = request.args.get('category')
        if not category:
            return {'message': 'Category parameter is required.'}, 400

        connection = db_connection()
        cursor = connection.cursor()

        query = """
            SELECT 
                sp.id AS profile_id,
                sp.user_id,
                sp.business_name,
                sp.category,
                sp.description,
                sp.location,
                sp.phone_number,
                sp.email,
                sp.created_at,
                sm.id AS media_id,
                sm.media_url,
                sm.media_type,
                sm.uploaded_at
            FROM 
                service_profiles sp
            LEFT JOIN 
                service_media sm ON sp.id = sm.profile_id
            WHERE 
                sp.category = %s
            ORDER BY 
                sp.created_at DESC;
        """

        cursor.execute(query, (category,))
        results = cursor.fetchall()

        # Group media by profile_id
        providers = {}
        for row in results:
            profile_id = row[0]
            if profile_id not in providers:
                providers[profile_id] = {
                    'profile_id': profile_id,
                    'user_id': row[1],
                    'business_name': row[2],
                    'category': row[3],
                    'description': row[4],
                    'location': row[5],
                    'phone_number': row[6],
                    'email': row[7],
                    'created_at': row[8].strftime('%Y-%m-%d %H:%M:%S'),
                    'media': []
                }
            if row[9]:  # Check if there's media
                providers[profile_id]['media'].append({
                    'media_id': row[9],
                    'media_url': row[10],
                    'media_type': row[11],
                    'uploaded_at': row[12].strftime('%Y-%m-%d %H:%M:%S') if row[12] else None
                })

        cursor.close()
        connection.close()

        return list(providers.values()), 200


# Get Service Providers by User ID
class ServiceProvidersByUserId(Resource):
    def get(self):
        user_id = request.args.get('user_id')
        if not user_id:
            return {'message': 'user_id parameter is required.'}, 400

        connection = db_connection()
        cursor = connection.cursor()

        query = """
            SELECT 
                sp.id AS profile_id,
                sp.user_id,
                sp.business_name,
                sp.category,
                sp.description,
                sp.location,
                sp.phone_number,
                sp.email,
                sp.created_at,
                sm.id AS media_id,
                sm.media_url,
                sm.media_type,
                sm.uploaded_at
            FROM 
                service_profiles sp
            LEFT JOIN 
                service_media sm ON sp.id = sm.profile_id
            WHERE 
                sp.user_id = %s
            ORDER BY 
                sp.created_at DESC;
        """

        cursor.execute(query, (user_id,))
        results = cursor.fetchall()

        # Group media by profile_id
        providers = {}
        for row in results:
            profile_id = row[0]
            if profile_id not in providers:
                providers[profile_id] = {
                    'profile_id': profile_id,
                    'user_id': row[1],
                    'business_name': row[2],
                    'category': row[3],
                    'description': row[4],
                    'location': row[5],
                    'phone_number': row[6],
                    'email': row[7],
                    'created_at': row[8].strftime('%Y-%m-%d %H:%M:%S'),
                    'media': []
                }
            if row[9]:  # Media exists
                providers[profile_id]['media'].append({
                    'media_id': row[9],
                    'media_url': row[10],
                    'media_type': row[11],
                    'uploaded_at': row[12].strftime('%Y-%m-%d %H:%M:%S') if row[12] else None
                })

        cursor.close()
        connection.close()

        return list(providers.values()), 200



# Service Profile Editing
class EditServiceProfile(Resource):
    def put(self):
        try:
            data = request.get_json()
            user_id = data.get("user_id")

            if not user_id:
                return make_response(jsonify({"message": "Missing user_id"}), 400)

            # Build the SQL SET clause dynamically based on which fields are provided
            allowed_fields = ["business_name", "category", "description", "location", "phonenumber", "email"]
            updates = []
            values = []

            field_map = {
                "phonenumber": "phone_number"  # map request field to DB field
            }

            for field in allowed_fields:
                if field in data:
                    column = field_map.get(field, field)
                    updates.append(f"{column} = %s")
                    values.append(data[field])

            if not updates:
                return make_response(jsonify({"message": "No fields provided to update"}), 400)

            values.append(user_id)  # Add user_id as last item for WHERE clause

            sql = f"""
                UPDATE service_profiles
                SET {', '.join(updates)}
                WHERE user_id = %s
            """

            conn = db_connection()
            cursor = conn.cursor()
            cursor.execute(sql, values)
            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({"message": "Service profile updated successfully"})

        except Exception as e:
            return make_response(jsonify({"message": "Error", "error": str(e)}), 500)


# Service Media Update
class UpdateServiceMedia(Resource):
    def post(self):
        try:
            user_id = request.form.get("user_id")
            profile_id = request.form.get("profile_id")
            files = request.files.getlist("files")

            if not files:
                return make_response(jsonify({"message": "No files uploaded"}), 400)

            # --- Step 1: Fetch and delete existing media from DB and Cloudflare ---
            conn = db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT media_url FROM service_media WHERE profile_id = %s", (profile_id,))
            old_media = cursor.fetchall()

            # Delete from Cloudflare R2
            session = boto3.Session()
            s3_client = session.client(
                "s3",
                endpoint_url=CLOUDFLARE_ENDPOINT,
                aws_access_key_id=CLOUDFLARE_ACCESS_KEY,
                aws_secret_access_key=CLOUDFLARE_SECRET_KEY
            )

            for media in old_media:
                old_url = media[0]
                object_key = old_url.replace(f"{CLOUDFLARE_CDN}/", "")
                try:
                    s3_client.delete_object(Bucket=CLOUDFLARE_BUCKET_NAME, Key=object_key)
                except Exception as e:
                    print(f"Failed to delete object {object_key}: {e}")

            # Delete from DB
            cursor.execute("DELETE FROM service_media WHERE profile_id = %s", (profile_id,))
            conn.commit()

            # --- Step 2: Upload new files ---
            uploaded_files = []
            for file in files:
                filename = secure_filename(file.filename)
                media_url = upload_service_media(file, user_id, filename)
                if not media_url:
                    continue

                media_type = "video" if filename.lower().endswith(("mp4", "mov")) else "image"
                media_id = str(uuid.uuid4())

                sql = """
                    INSERT INTO service_media (id, profile_id, media_url, media_type)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(sql, (media_id, profile_id, media_url, media_type))
                uploaded_files.append(media_url)

            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({
                "message": f"{len(uploaded_files)} media file(s) updated successfully",
                "uploaded": uploaded_files
            })

        except Exception as e:
            return make_response(jsonify({"message": "Error", "error": str(e)}), 500)


# Approve or Reject Service Profile 
class ApproveOrRejectServiceProfile(Resource):
    def post(self):
        try:
            data = request.get_json()
            profile_id = data.get("profile_id")
            admin_id = data.get("admin_id")
            status = data.get("status")  # 'approved' or 'rejected'
            rejection_message = data.get("rejection_message")

            if not all([profile_id, admin_id, status]):
                return make_response(jsonify({"message": "Missing required fields"}), 400)

            if status not in ["approved", "rejected"]:
                return make_response(jsonify({"message": "Invalid status"}), 400)

            conn = db_connection()
            cursor = conn.cursor()

            # Fetch provider info
            cursor.execute("""
                SELECT email, user_id, business_name
                FROM service_profiles
                WHERE id = %s
            """, (profile_id,))
            profile = cursor.fetchone()

            if not profile:
                return make_response(jsonify({"message": "Service profile not found"}), 404)

            email, user_id, business_name = profile

            cursor.execute("SELECT first_name FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            provider_first_name = user[0] if user else "Service Provider"

            # Update DB
            cursor.execute("""
                UPDATE service_profiles
                SET status = %s, under_review = FALSE
                WHERE id = %s
            """, (status, profile_id))
            conn.commit()

            # Prepare email
            if status == "approved":
                subject = "Your Service Profile Has Been Approved"
                template = TEMPLATE_ENV.get_template("serviceprofile_approval.html")
                body = template.render(name=provider_first_name, business_name=business_name)

            elif status == "rejected":
                if not rejection_message:
                    return make_response(jsonify({"message": "Rejection message required"}), 400)
                subject = "Your Service Profile Was Rejected"
                template = TEMPLATE_ENV.get_template("serviceprofile_rejection.html")
                body = template.render(
                    name=provider_first_name,
                    business_name=business_name,
                    rejection_message=rejection_message
                )

            # Send email
            send_email_async(
                receiver_email=email,
                subject=f"Linknamali - {subject}",
                body=body,
                is_html=True
            )

            cursor.close()
            conn.close()

            return jsonify({
                "message": f"Profile has been {status} and email notification sent.",
                "profile_id": profile_id,
                "status": status
            })

        except Exception as e:
            return make_response(jsonify({"message": "Error", "error": str(e)}), 500)


# Request Service Profile Edits
class RequestServiceProfileEdits(Resource):
    def post(self):
        try:
            data = request.get_json()
            profile_id = data.get("profile_id")
            admin_id = data.get("admin_id")
            message = data.get("message")

            if not all([profile_id, admin_id, message]):
                return make_response(jsonify({"message": "Missing profile_id, admin_id or message"}), 400)

            conn = db_connection()
            cursor = conn.cursor()

            # Mark under_review
            cursor.execute("""
                UPDATE service_profiles
                SET under_review = TRUE
                WHERE id = %s
            """, (profile_id,))

            # Save feedback message
            feedback_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO service_profile_feedback (id, profile_id, admin_id, message)
                VALUES (%s, %s, %s, %s)
            """, (feedback_id, profile_id, admin_id, message))

            conn.commit()

            # Fetch provider's email and name
            cursor.execute("""
                SELECT email, user_id, business_name
                FROM service_profiles
                WHERE id = %s
            """, (profile_id,))
            profile = cursor.fetchone()

            if not profile:
                return make_response(jsonify({"message": "Service profile not found"}), 404)

            email, user_id, business_name = profile

            cursor.execute("SELECT first_name FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            provider_first_name = user[0] if user else "Service Provider"

            # Load the email template
            template = TEMPLATE_ENV.get_template('requestserviceprofileedits.html')

            # Render the email body with dynamic values
            body = template.render(
                provider_first_name=provider_first_name,
                business_name=business_name,
                message=message
            )

            # Prepare email subject
            subject = "Request for Edits to Your Service Profile"

            # Send the email asynchronously
            send_email_async(
                receiver_email=email,
                subject=f"Linknamali - {subject}",
                body=body,
                is_html=True
            )

            cursor.close()
            conn.close()

            return jsonify({
                "message": "Edit request sent successfully and email notification sent.",
                "profile_id": profile_id,
                "under_review": True
            })

        except Exception as e:
            return make_response(jsonify({"message": "Error", "error": str(e)}), 500)


# Get Service Profile Feedback
class GetServiceProfileFeedback(Resource):
    def get(self, profile_id):
        try:
            conn = db_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT message, created_at
                FROM service_profile_feedback
                WHERE profile_id = %s
                ORDER BY created_at DESC
            """, (profile_id,))
            results = cursor.fetchall()

            cursor.close()
            conn.close()

            return jsonify([
                {"message": row[0], "created_at": str(row[1])} for row in results
            ])
        except Exception as e:
            return make_response(jsonify({"message": "Error", "error": str(e)}), 500)


# Service Profile by ID
class GetServiceProfileByID(Resource):
    def get(self, profile_id):
        try:
            conn = db_connection()
            cursor = conn.cursor(dictionary=True)

            profile_query = """
                SELECT id, user_id, business_name, category, description,
                       location, phone_number, email, created_at, updated_at,
                       status, under_review
                FROM service_profiles
                WHERE id = %s
            """
            cursor.execute(profile_query, (profile_id,))
            profile = cursor.fetchone()

            if not profile:
                cursor.close()
                conn.close()
                return make_response(jsonify({"message": "Profile not found"}), 404)

            media_query = """
                SELECT id, media_url, media_type, uploaded_at
                FROM service_media
                WHERE profile_id = %s
            """
            cursor.execute(media_query, (profile_id,))
            media = cursor.fetchall()

            profile['media'] = media 

            cursor.close()
            conn.close()

            return jsonify(profile)

        except Exception as e:
            return make_response(jsonify({"message": "Error", "error": str(e)}), 500)


# Register endpoints
api.add_resource(CreateServiceProfile, "/serviceprofiles")
api.add_resource(UploadServiceMedia, "/servicemedia")
api.add_resource(ServiceProvidersByCategory, "/serviceproviderscategory")
api.add_resource(ServiceProvidersByUserId, "/serviceprovidersuserid")
api.add_resource(AllServiceProviders, "/allserviceproviders")
api.add_resource(EditServiceProfile, "/editserviceprofile")
api.add_resource(UpdateServiceMedia, "/updateservicemedia")
api.add_resource(ApproveOrRejectServiceProfile, "/approveserviceprofile")
api.add_resource(RequestServiceProfileEdits, "/requestserviceprofileedits")
api.add_resource(GetServiceProfileFeedback, "/serviceprofilefeedback/<string:profile_id>")
api.add_resource(GetServiceProfileByID, "/getprofilebyprofileid/<string:profile_id>")