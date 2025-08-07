
from flask import request, jsonify, Blueprint
from flask_restful import Resource, Api
from database.database import db_connection
from flask_cors import CORS
from urllib.parse import urlparse
from routes.admineditrequest import ConfirmEditsDone, send_email_async
from jinja2 import Environment, FileSystemLoader, Template
from decimal import Decimal
from celery_server import upload_property_images_to_r2 
import os
import uuid
import json
import logging
import aioboto3
import asyncio

userlistings = Blueprint('userlistings', __name__)
api = Api(userlistings)
CORS(userlistings, resources={
    r"/userlistings/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174", 
            "https://linknamali.ke",
            "https://portal.linknamali.ke"
        ],
        "supports_credentials": True
    },
})


# Configure logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


CLOUDFLARE_ACCESS_KEY = os.getenv("CLOUDFLARE_ACCESS_KEY")
CLOUDFLARE_SECRET_KEY = os.getenv("CLOUDFLARE_SECRET_KEY")


if not CLOUDFLARE_ACCESS_KEY or not CLOUDFLARE_SECRET_KEY:
    raise ValueError("❌ Cloudflare credentials are missing! Set them as environment variables.")


# Cloudflare R2 Config
CLOUDFLARE_BUCKET_NAME = "linknamali"
CLOUDFLARE_ENDPOINT = "https://d418c3595b04db7f9e063c255ea021d0.r2.cloudflarestorage.com"


# Email Configuration
SMTP_SERVER = "mail.merimedevelopment.co.ke"
SMTP_PORT = 587
SENDER_EMAIL = "support@merimedevelopment.co.ke"
SENDER_PASSWORD = "M4r1meDvSup0"


# Configure Jinja2 environment
TEMPLATE_ENV = Environment(loader=FileSystemLoader("email_templates"))

# file validation
def get_content_type(filename):
    """Determines the correct Content-Type based on file extension."""
    file_extension = filename.rsplit(".", 1)[-1].lower()

    # ✅ Image Content-Types
    if file_extension in ["jpg", "jpeg"]:
        return "image/jpeg"
    elif file_extension == "png":
        return "image/png"
    elif file_extension == "gif":
        return "image/gif"

    # ✅ Document Content-Types
    elif file_extension == "pdf":
        return "application/pdf"
    elif file_extension == "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif file_extension == "txt":
        return "text/plain"

    # ❌ Default for unsupported types
    return "application/octet-stream"


async def upload_to_r2(file_obj, object_name):
    session = aioboto3.Session()
    content_type = get_content_type(object_name)

    try:
        file_obj.seek(0)
        async with session.client(
            "s3",
            endpoint_url=CLOUDFLARE_ENDPOINT,
            aws_access_key_id=CLOUDFLARE_ACCESS_KEY,
            aws_secret_access_key=CLOUDFLARE_SECRET_KEY
        ) as s3_client:
            await s3_client.upload_fileobj(
                Fileobj=file_obj,
                Bucket=CLOUDFLARE_BUCKET_NAME,
                Key=object_name,
                ExtraArgs={"ContentType": content_type}
            )

        return f"https://files.linknamali.ke/{object_name}"

    except Exception as e:
        logger.error(f"Upload failed for {object_name}: {e}")
        return None



async def delete_from_r2(image_url):
    """
    Asynchronously deletes an image from Cloudflare R2.
    """
    try:
        # ✅ Extract object key properly from URL
        parsed_url = urlparse(image_url)  
        object_key = parsed_url.path.lstrip("/")  # Removes leading '/'

        if not object_key:
            logger.error(f"Invalid image URL format: {image_url}")
            return False  # Prevents trying to delete empty keys

        session = aioboto3.Session()
        async with session.client(
            "s3",
            endpoint_url=CLOUDFLARE_ENDPOINT,
            aws_access_key_id=CLOUDFLARE_ACCESS_KEY,
            aws_secret_access_key=CLOUDFLARE_SECRET_KEY
        ) as s3_client:
            response = await s3_client.delete_object(Bucket=CLOUDFLARE_BUCKET_NAME, Key=object_key)
            
            # ✅ Check response to confirm deletion
            if response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 204:
                logger.info(f"Image Update Successful: {image_url}")
                return True
            else:
                logger.error(f"Failed to delete {image_url}, response: {response}")
                return False

    except Exception as e:
        logger.error(f"Error deleting image {image_url}: {e}")
        return False


# Helper function for async upload
async def upload_wrapper(file_obj, object_name):
    return await upload_to_r2(file_obj, object_name)


# video calculate file size
def get_file_size(file):
    pos = file.tell()
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(pos)
    return size



# image storage to table
def store_image_url(user_id, property_id, property_type, image_url):
    connection = db_connection()
    if not connection:
        logger.error("Database connection failed while storing image URL.")
        return False

    cursor = connection.cursor()
    try:
        sql = """
            INSERT INTO images (id, user_id, property_id, property_type, image_url)
            VALUES (UUID(), %s, %s, %s, %s)
        """
        cursor.execute(sql, (user_id, property_id, property_type, image_url))
        connection.commit()
        return True

    except Exception as e:
        logger.error(f"Error storing image URL: {e}")
        return False

    finally:
        cursor.close()
        connection.close()


# document storage to table
def store_document_urls(user_id, property_id, property_type, document_urls):
    connection = db_connection()
    if not connection:
        logger.error("Database connection failed while storing document URLs.")
        return False
    
    cursor = connection.cursor()
    try:
        sql = """
            INSERT INTO documents (id, user_id, property_id, property_type, document_url)
            VALUES (UUID(), %s, %s, %s, %s)
        """
        cursor.executemany(sql, [(user_id, property_id, property_type, doc_url) for doc_url in document_urls])
        connection.commit()
        return True
    
    except Exception as e:
        logger.error(f"Error storing document URLs: {e}")
        return False
    
    finally:
        cursor.close()
        connection.close()



#update images function
async def update_property_images(property_id, property_type, images, user_id, cover_image_index=None):
    """
    Deletes existing images from Cloudflare R2 and database, then uploads new ones.
    """
    connection = db_connection()
    if not connection:
        return None
    
    # ✅ Validate image input before deleting old ones
    MIN_IMAGES = 4
    MIN_IMAGE_SIZE_BYTES = 0.01 * 1024 * 1024

    if len(images) < MIN_IMAGES:
        return {"message": f"At least {MIN_IMAGES} images are required. You provided {len(images)}."}

    for img in images:
        img.seek(0, 2)
        size = img.tell()
        img.seek(0)
        if size < MIN_IMAGE_SIZE_BYTES:
            return {
                "message": "Each image must be at least 0.01MB in size.",
                "invalid_image": img.filename,
                "size_in_mb": round(size / (1024 * 1024), 2)
            }

    cursor = connection.cursor()
    try:
        # ✅ Fetch existing images
        cursor.execute("""
            SELECT image_url FROM images WHERE property_id = %s AND property_type = %s AND user_id = %s
        """, (property_id, property_type, user_id))
        
        existing_images = [row[0] for row in cursor.fetchall()]

        # ✅ Delete existing images from Cloudflare R2 in parallel
        if existing_images:
            await asyncio.gather(*[delete_from_r2(img_url) for img_url in existing_images])

        # ✅ Delete existing records from the database
        cursor.execute("""
            DELETE FROM images WHERE property_id = %s AND property_type = %s AND user_id = %s
        """, (property_id, property_type, user_id))
        connection.commit()

        uploaded_images = []
        new_image_records = []  # For bulk insert

        # ✅ Upload new images
        for idx, image in enumerate(images):
            if image.content_length > 2 * 1024 * 1024:  # Skip large files
                continue
            image_id = str(uuid.uuid4())
            file_extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
            image_key = f"properties/{property_type}/{user_id}/{property_id}/{image_id}.{file_extension}"
            new_image_url = await upload_to_r2(image, image_key)

            if new_image_url:
                is_cover = 1 if cover_image_index is not None and idx == cover_image_index else 0
                uploaded_images.append(new_image_url)
                new_image_records.append(
                    (str(uuid.uuid4()), user_id, property_id, property_type, new_image_url, is_cover)
                )

        # ✅ Bulk insert new images to the database
        if new_image_records:
            cursor.executemany("""
                INSERT INTO images (id, user_id, property_id, property_type, image_url, is_cover)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, new_image_records)
            connection.commit()

        return uploaded_images

    except Exception as e:
        logger.error(f"Error updating images for {property_type} {property_id}: {e}")
        return None

    finally:
        cursor.close()
        connection.close()



# Update property documents function
async def update_property_documents(property_id, property_type, documents, user_id):
    connection = db_connection()
    if not connection:
        return None
    
    cursor = connection.cursor()
    try:
        # ✅ Fetch existing documents
        cursor.execute("""
            SELECT document_url FROM documents WHERE property_id = %s AND property_type = %s AND user_id = %s
        """, (property_id, property_type, user_id))
        existing_documents = [row[0] for row in cursor.fetchall()]

        # ✅ Delete existing documents from Cloudflare R2 in parallel
        if existing_documents:
            await asyncio.gather(*[delete_from_r2(doc_url) for doc_url in existing_documents])

        # ✅ Delete existing records from the database
        cursor.execute("""
            DELETE FROM documents WHERE property_id = %s AND property_type = %s AND user_id = %s
        """, (property_id, property_type, user_id))
        connection.commit()

        uploaded_documents = []
        new_document_records = []

        # ✅ Upload new documents
        for doc in documents:
            if doc.content_length > 2 * 1024 * 1024:  # Skip large files
                continue
            
            doc_id = str(uuid.uuid4())
            file_extension = doc.filename.split(".")[-1] if "." in doc.filename else "pdf"
            doc_key = f"properties/{property_type}/{user_id}/{property_id}/{doc_id}.{file_extension}"

            new_doc_url = await upload_to_r2(doc, doc_key)

            if new_doc_url:
                uploaded_documents.append(new_doc_url)
                new_document_records.append((str(uuid.uuid4()), user_id, property_id, property_type, new_doc_url))

        # ✅ Bulk insert new documents to the database
        if new_document_records:
            cursor.executemany("""
                INSERT INTO documents (id, user_id, property_id, property_type, document_url)
                VALUES (%s, %s, %s, %s, %s)
            """, new_document_records)
            connection.commit()

        return uploaded_documents
    
    except Exception as e:
        logger.error(f"Error updating documents for {property_type} {property_id}: {e}")
        return None
    
    finally:
        cursor.close()
        connection.close()


# update videos function
async def update_property_videos(property_id, property_type, videos, user_id):
    """
    Deletes existing videos from Cloudflare R2 and database, then uploads new ones.
    """
    connection = db_connection()
    if not connection:
        return None

    cursor = connection.cursor()
    try:
        # ✅ Fetch existing videos
        cursor.execute("""
            SELECT video_url FROM videos WHERE property_id = %s AND property_type = %s AND user_id = %s
        """, (property_id, property_type, user_id))
        
        existing_videos = [row[0] for row in cursor.fetchall()]

        # ✅ Delete existing videos from Cloudflare R2 in parallel
        if existing_videos:
            await asyncio.gather(*[delete_from_r2(video_url) for video_url in existing_videos])

        # ✅ Delete existing records from the database
        cursor.execute("""
            DELETE FROM videos WHERE property_id = %s AND property_type = %s AND user_id = %s
        """, (property_id, property_type, user_id))
        connection.commit()

        uploaded_videos = []
        new_video_records = []  # For bulk insert

        # ✅ Upload new videos
        logger.info(f"Starting upload for {len(videos)} video(s) for {property_type} {property_id}")
        for video in videos:
            logger.info(f"Processing video: {video.filename} | Size: {video.content_length}")
            if video.content_length > 100 * 1024 * 1024:  # Skip very large files > 100MB
                continue
            video_id = str(uuid.uuid4())
            file_extension = video.filename.split(".")[-1] if "." in video.filename else "mp4"
            video_key = f"properties_videos/{property_type}/{user_id}/{property_id}/{video_id}.{file_extension}"
            try:
                new_video_url = await upload_to_r2(video, video_key)
            except Exception as e:
                logger.error(f"Failed to upload video {video.filename}: {e}")
                continue

            if new_video_url:
                uploaded_videos.append(new_video_url)
                new_video_records.append((str(uuid.uuid4()), user_id, property_id, property_type, new_video_url))
                logger.info(f"Video Upload Successful: {new_video_url}")


        # ✅ Bulk insert new videos to the database
        if new_video_records:
            cursor.executemany("""
                INSERT INTO videos (id, user_id, property_id, property_type, video_url)
                VALUES (%s, %s, %s, %s, %s)
            """, new_video_records)
            connection.commit()

        return uploaded_videos
    
    

    except Exception as e:
        logger.error(f"Error updating videos for {property_type} {property_id}: {e}")
        return None

    finally:
        cursor.close()
        connection.close()



# Define maximum limits
MAX_IMAGES = 10
MAX_TOTAL_SIZE_MB = 50
MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024
MAX_VIDEOS = 3


def get_current_image_count(user_id, property_id):
    connection = db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM images WHERE user_id = %s AND property_id = %s", (user_id, property_id))
        return cursor.fetchone()[0]
    finally:
        cursor.close()
        connection.close()


def get_current_video_count(user_id, property_id):
    connection = db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM videos WHERE user_id = %s AND property_id = %s", (user_id, property_id))
        return cursor.fetchone()[0]
    finally:
        cursor.close()
        connection.close()


def get_user_total_upload_size(user_id):
    connection = db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT SUM(CHAR_LENGTH(image_url)) FROM images WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()[0]
        return result or 0
    finally:
        cursor.close()
        connection.close()



# Process edits and send notifications to admin
def process_property_edits(property_id, property_type, user_id, update_data):
    connection = db_connection()
    if not connection:
        logger.error("Database connection failed.")
        return

    cursor = connection.cursor(dictionary=True)
    try:
        # Fetch existing property details
        cursor.execute(f"SELECT * FROM {property_type} WHERE id = %s", (property_id,))
        existing_data = cursor.fetchone()
        # logger.info(f"Existing Data: {existing_data}")

        if not existing_data:
            logger.error(f"{property_type.capitalize()} with ID {property_id} not found.")
            return

        # Fetch user's name
        cursor.execute("SELECT first_name FROM users WHERE user_id = %s", (user_id,))
        user_data = cursor.fetchone()
        logger.info(f"User Data: {user_data}")

        if not user_data:
            logger.error(f"User with ID {user_id} not found.")
            return
        first_name = user_data.get('first_name', 'User')

        # Fetch admin user ID (assuming role is 'admin')
        cursor.execute("SELECT user_id FROM users WHERE role = 'admin' LIMIT 1")
        admin_data = cursor.fetchone()

        if not admin_data:
            logger.error("No admin user found. Cannot send notification.")
            return
        admin_id = admin_data['user_id']

        # Identify changes
        changes = []
        for field, new_value in update_data.items():
            # Skip non-editable fields
            if field in ['created_at', 'updated_at', 'deleted_at']:
                continue
            
            # Format the change message
            changes.append(f"{field.replace('_', ' ').capitalize()}: '{new_value}'")

        # If there are changes, proceed
        if changes:
            # Log conversation
            conversation_id = str(uuid.uuid4())
            message = (
                f"User {first_name} has updated the {property_type} "
                f"'{update_data.get('title', existing_data.get('title'))}'.<br><br>"
                f"<b>Edits Done:</b><br>{'<br>'.join(changes)}"
            )
            # logger.info(f"Logging message: {message}")

            cursor.execute("""
                INSERT INTO edits_conversations (id, sender_id, receiver_id, property_id, property_type, message)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (conversation_id, user_id, admin_id, property_id, property_type, message))

            # Prepare and send email to admin
            with open("email_templates/edits_confirmed.html", "r", encoding="utf-8") as file:
                email_body = file.read()

            email_body = email_body.replace("{{ first_name }}", first_name)
            email_body = email_body.replace("{{ property_title }}", update_data.get('title', existing_data.get('title')))
            email_body = email_body.replace("{{ edits_done }}", '<br>'.join(changes))

            send_email_async("link.admin@merimedevelopment.co.ke", "LinkNamali - Property Edits Done", email_body, is_html=True)

            connection.commit()
            logger.info(f"Edit notification sent and conversation logged for {property_type} ID {property_id}.")
        else:
            logger.info("No changes detected; no notification sent.")


    except Exception as e:
        logger.error(f"Error processing edits: {e}")

    finally:
        cursor.close()
        connection.close()


# Delete existing property images function
def delete_existing_property_images(property_id, property_type, user_id):
    """
    Deletes images for a given property from DB only (Cloudflare will be overridden anyway).
    """
    connection = db_connection()
    if not connection:
        return

    try:
        cursor = connection.cursor()
        cursor.execute("""
            DELETE FROM images WHERE property_id = %s AND property_type = %s AND user_id = %s
        """, (property_id, property_type, user_id))
        connection.commit()
    except Exception as e:
        logger.error(f"Failed to delete existing images for {property_type} {property_id}: {e}")
    finally:
        cursor.close()
        connection.close()



# List Apartments
class AddApartment(Resource):
    def post(self):
        connection = db_connection()
        if not connection:
            return {"message": "Database connection failed."}, 500

        cursor = connection.cursor()

        try:
            # ✅ Validate and get image file
            if "image" not in request.files:
                return {"message": "Image file is required."}, 400

            image = request.files["image"]
            if image.content_length > 5 * 1024 * 1024:  # 5MB Limit
                return {"message": "Image size exceeds 5MB limit."}, 400

            # ✅ Generate unique ID for the apartment
            apartment_id = str(uuid.uuid4())

            # ✅ Extract required fields first
            required_fields = ["user_id", "title", "location", "town", "locality", "purpose", "price",
                               "floor_number", "number_of_bedrooms", "number_of_bathrooms", "description", "amenities"]
            
            data = {field: request.form.get(field) for field in required_fields}

            # ✅ Handle optional fields
            optional_fields = ["size", "map_location", "location_text", "videos"]
            for field in optional_fields:
                data[field] = request.form.get(field) or None

            # Ensure all fields are provided
            if not all(data[field] for field in required_fields):
                return {"message": "Missing required fields."}, 400

            user_id = data["user_id"]  # ✅ Extract user_id early

            # ✅ Upload image to Cloudflare R2
            image_id = str(uuid.uuid4())
            file_extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
            image_key = f"properties/apartments/{user_id}/{apartment_id}/{image_id}.{file_extension}"

            # ✅ Upload asynchronously to R2
            image_url = asyncio.run(upload_to_r2(image, image_key))
            if not image_url:
                return {"message": "Image upload failed."}, 500

            data.update({
                "availability_status": "pending",  # Default status
                "image": image_url
            })

            # ✅ Handle document uploads (only for Sale)
            document_urls = []
            if data["purpose"] == "Sale" and "documents" in request.files:
                for doc in request.files.getlist("documents"):
                    doc_id = str(uuid.uuid4())
                    file_extension = doc.filename.split(".")[-1] if "." in doc.filename else "pdf"

                    # ✅ Ensure document key includes `user_id`
                    doc_key = f"properties/apartments/{user_id}/{apartment_id}/{doc_id}.{file_extension}"

                    # ✅ Upload asynchronously to R2
                    doc_url = asyncio.run(upload_to_r2(doc, doc_key))
                    if doc_url:
                        document_urls.append(doc_url)

            # ✅ Store document URLs in JSON format (nullable in DB)
            data["documents"] = json.dumps(document_urls) if document_urls else None

            #  upload videos if provided
            if "videos" in request.files:
                video_files = request.files.getlist("videos")

                if video_files:
                    # Validate total size or number of videos as needed
                    current_video_count = get_current_video_count(user_id, apartment_id)
                    new_video_size = sum(len(file.read()) for file in video_files)

                    # Reset file cursor after reading
                    for file in video_files:
                        file.seek(0)

                    if current_video_count + len(video_files) > MAX_VIDEOS:
                        return {"message": f"Max video limit of {MAX_VIDEOS} reached."}, 400

                    current_total_size = get_user_total_upload_size(user_id)
                    if current_total_size + new_video_size > MAX_TOTAL_SIZE_BYTES:
                        remaining_space = (MAX_TOTAL_SIZE_BYTES - current_total_size) / (1024 * 1024)
                        return {
                            "message": f"Upload limit exceeded. You have only {remaining_space:.2f}MB remaining."
                        }, 400

                    # Upload new videos (same async pattern as images/documents)
                    uploaded_videos = asyncio.run(update_property_videos(apartment_id, "apartments", video_files, user_id))

                    if uploaded_videos:
                        data["videos"] = json.dumps(uploaded_videos)
                        logger.info(f"User {user_id} added videos for apartment {apartment_id}: {uploaded_videos}")

            # ✅ Insert into `apartments` table
            sql = """
                INSERT INTO apartments (id, user_id, title, location, town, locality, purpose, 
                    size, price, availability_status, floor_number, number_of_bedrooms, 
                    number_of_bathrooms, description, amenities, image, documents, map_location, location_text)
                VALUES (%(apartment_id)s, %(user_id)s, %(title)s, %(location)s, %(town)s, %(locality)s, 
                        %(purpose)s, %(size)s, %(price)s, %(availability_status)s, 
                        %(floor_number)s, %(number_of_bedrooms)s, %(number_of_bathrooms)s, 
                        %(description)s, %(amenities)s, %(image)s, %(documents)s, %(map_location)s, %(location_text)s)
            """
            cursor.execute(sql, {**data, "apartment_id": apartment_id})

            # ✅ Insert into `images` table
            image_sql = """
                INSERT INTO images (id, user_id, property_id, property_type, image_url)
                VALUES (%s, %s, %s, %s, %s)
            """
            property_type = request.form.get("property_type", "apartments")  # Default to "apartments"
            cursor.execute(image_sql, (str(uuid.uuid4()), user_id, apartment_id, property_type, image_url))

            # ✅ Store document URLs in the `documents` table
            if document_urls:
                document_sql = """
                    INSERT INTO documents (id, user_id, property_id, property_type, document_url)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.executemany(document_sql, [(str(uuid.uuid4()), user_id, apartment_id, property_type, doc_url) for doc_url in document_urls])

            # store videos in the database
            if "videos" in data:
                video_sql = """
                    INSERT INTO videos (id, user_id, property_id, property_type, video_url)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.executemany(video_sql, [(str(uuid.uuid4()), user_id, apartment_id, property_type, video_url) for video_url in json.loads(data["videos"])])

            connection.commit()

            return jsonify({
                "message": "Apartment added successfully.",
                "id": apartment_id,
                "image_url": image_url,
                "document_urls": document_urls if document_urls else None,
                "video_urls": json.loads(data["videos"]) if "videos" in data else None
            })

        except Exception as e:
            logger.error(f"Error adding apartment: {e}")
            return {"message": "Error adding apartment", "error": str(e)}, 500

        finally:
            cursor.close()
            connection.close()


# Update Apartment Route
class UpdateApartment(Resource):
    def put(self, apartment_id):
        """Updates apartment details and handles image & document updates properly."""
        connection = db_connection()
        if not connection:
            return {"message": "Database connection failed."}, 500

        cursor = connection.cursor()
        try:
            # ✅ Check if the apartment exists
            cursor.execute("SELECT * FROM apartments WHERE id = %s", (apartment_id,))
            apartment = cursor.fetchone()
            if not apartment:
                return {"message": "Apartment not found."}, 404

            # ✅ Extract allowed fields dynamically
            allowed_fields = ["title", "location", "town", "locality", "purpose", "size", "price",
                              "floor_number", "number_of_bedrooms", "number_of_bathrooms",
                              "description", "amenities", "availability_status", "map_location", "location_text"]
            update_data = {field: request.form.get(field) for field in allowed_fields if request.form.get(field)}

            # ✅ Validate user_id
            user_id = request.form.get("user_id")
            if not user_id:
                return {"message": "User ID is required."}, 400

            # ✅ Count existing images
            cursor.execute("SELECT COUNT(*) FROM images WHERE property_id = %s AND property_type = 'apartments' AND user_id = %s",
                           (apartment_id, user_id))
            current_image_count = cursor.fetchone()[0]
            

           # ✅ Handle new image uploads
            if "image" in request.files and request.files.getlist("image"):
                image_files = request.files.getlist("image")

                # Validate image count and size
                MIN_IMAGES = 4
                MAX_IMAGE_SIZE_MB = 2
                MIN_IMAGE_SIZE_BYTES = 0.01 * 1024 * 1024
                MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

                if len(image_files) < MIN_IMAGES:
                    return {"message": f"At least {MIN_IMAGES} images are required. You provided {len(image_files)}."}, 400

                for img in image_files:
                    img.seek(0, 2)
                    size = img.tell()
                    img.seek(0)
                    if size < MIN_IMAGE_SIZE_BYTES:
                        return {
                            "message": "Each image must be at least 0.01MB in size.",
                            "invalid_image": img.filename,
                            "size_in_mb": round(size / (1024 * 1024), 2)
                        }, 400
                    if size > MAX_IMAGE_SIZE_BYTES:
                        return {
                            "message": f"Image {img.filename} exceeds the maximum size of {MAX_IMAGE_SIZE_MB}MB.",
                            "size_in_mb": round(size / (1024 * 1024), 2)
                        }, 400

                # Check current limits (optional logic)
                current_image_count = get_current_image_count(user_id, apartment_id)
                if current_image_count + len(image_files) > MAX_IMAGES:
                    return {
                        "message": f"Max image limit of {MAX_IMAGES} reached. Please delete some before adding more."
                    }, 400

                current_total_size = get_user_total_upload_size(user_id)
                new_upload_size = sum(len(file.read()) for file in image_files)
                for file in image_files:
                    file.seek(0)

                if current_total_size + new_upload_size > MAX_TOTAL_SIZE_BYTES:
                    remaining_space = (MAX_TOTAL_SIZE_BYTES - current_total_size) / (1024 * 1024)
                    return {
                        "message": f"Upload limit exceeded. You have only {remaining_space:.2f}MB remaining."
                    }, 400

                # ✅ Upload new images and update cover image
                cover_image_index = request.form.get("cover_image_index")  # Keep it as string
                selected_cover_index = None

                if cover_image_index and cover_image_index.startswith("new-"):
                    try:
                        selected_cover_index = int(cover_image_index.split("-")[1])
                    except (IndexError, ValueError):
                        selected_cover_index = None
                uploaded_images = asyncio.run(update_property_images(
                    apartment_id, "apartments", image_files, user_id, selected_cover_index
                ))

                if uploaded_images:
                    update_data["image"] = uploaded_images[0]
                    if selected_cover_index is not None and selected_cover_index < len(uploaded_images):
                        cover_url = uploaded_images[selected_cover_index]
                        cursor = connection.cursor()
                        cursor.execute("""
                            UPDATE apartments SET cover_image_url = %s WHERE id = %s AND user_id = %s
                        """, (cover_url, apartment_id, user_id))
                        connection.commit()
                        cursor.close()
                    logger.info(f"User {user_id} updated images for apartments {apartment_id}: {uploaded_images}")

            # ✅ No new images but cover image was selected from existing ones
            elif "cover_image_url" in request.form:
                cover_url = request.form["cover_image_url"]
                try:
                    cursor = connection.cursor()

                    # Unset any previous cover image
                    cursor.execute("""
                        UPDATE images SET is_cover = 0 
                        WHERE property_id = %s AND property_type = 'apartments' AND user_id = %s
                    """, (apartment_id, user_id))

                    # Set the new cover image
                    cursor.execute("""
                        UPDATE images SET is_cover = 1 
                        WHERE image_url = %s AND property_id = %s AND property_type = 'apartments' AND user_id = %s
                    """, (cover_url, apartment_id, user_id))
                    
                    # Optional: update apartments table with cover image URL
                    cursor.execute("""
                        UPDATE apartments SET cover_image_url = %s WHERE id = %s AND user_id = %s
                    """, (cover_url, apartment_id, user_id))

                    connection.commit()
                    logger.info(f"Cover image updated for apartment {apartment_id}: {cover_url}")
                except Exception as e:
                    logger.error(f"Error setting cover image from existing images: {e}")
                    return {"message": "Failed to update cover image."}, 500




            # ✅ Handle document uploads (only for Sale)
            if request.form.get("purpose") == "Sale" and "documents" in request.files:

                # delete existing documents
                uploaded_documents = asyncio.run(update_property_documents(apartment_id, "apartments", request.files.getlist("documents"), user_id))

                if uploaded_documents:
                    update_data["documents"] = json.dumps(uploaded_documents)

           # ✅ Handle video uploads (optional)
            if "videos" in request.files:
                video_files = request.files.getlist("videos")

                if video_files:
                    # Validate total size or number of videos as needed
                    current_video_count = get_current_video_count(user_id, apartment_id)
                    new_video_size = sum(get_file_size(file) for file in video_files)

                    # Reset file cursor after reading
                    for file in video_files:
                        file.seek(0)

                    if current_video_count + len(video_files) > MAX_VIDEOS:
                        return {"message": f"Max video limit of {MAX_VIDEOS} reached."}, 400

                    current_total_size = get_user_total_upload_size(user_id)
                    if current_total_size + new_video_size > MAX_TOTAL_SIZE_BYTES:
                        remaining_space = (MAX_TOTAL_SIZE_BYTES - current_total_size) / (1024 * 1024)
                        return {
                            "message": f"Upload limit exceeded. You have only {remaining_space:.2f}MB remaining."
                        }, 400

                    # Upload new videos (same async pattern as images/documents)
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    uploaded_videos = loop.run_until_complete(update_property_videos(
                        apartment_id, "apartments", video_files, user_id
                    ))


                    if not uploaded_videos:
                        logger.warning(f"No videos uploaded for apartments {apartment_id} by user {user_id}")
                    else:
                        logger.info(f"User {user_id} updated videos for apartment {apartment_id}: {uploaded_videos}")



                    

            # ✅ Update the apartment details in DB
            if update_data:
                update_query = "UPDATE apartments SET " + ", ".join(f"{k} = %s" for k in update_data.keys()) + " WHERE id = %s"
                values = list(update_data.values()) + [apartment_id]
                cursor.execute(update_query, values)
                connection.commit()


                # process and send edits to admin
                process_property_edits(
                    property_id=apartment_id,
                    property_type="apartments",
                    user_id=user_id,
                    update_data=update_data
                )

            response_data = ({
                "message": "Apartment updated successfully.",
                "updated_fields": update_data
            })

            # include image url if images were updated
            if "image" in update_data:
                response_data["image_url"] = update_data["image"]

            # ✅ Include cover image in response
            cursor.execute("""
                SELECT image_url FROM images
                WHERE property_id = %s AND property_type = 'apartments' AND user_id = %s AND is_cover = 1
                LIMIT 1
            """, (apartment_id, user_id))

            cover_result = cursor.fetchone()
            if cover_result:
                response_data["cover_image_url"] = cover_result[0]

            return jsonify(response_data)

        except Exception as e:
            logger.error(f"Error updating apartment: {e}")
            return {"message": "Error updating apartment", "error": str(e)}, 500

        finally:
            cursor.close()
            connection.close()


# House Listing
class AddHouse(Resource):
    def post(self):
        connection = db_connection()
        if not connection:
            return {"message": "Database connection failed."}, 500
        
        cursor = connection.cursor()
        try:
            # ✅ Validate and get image file
            if "image" not in request.files:
                return {"message": "Image file is required."}, 400
            
            image = request.files["image"]
            if image.content_length > 5 * 1024 * 1024:  # 5MB Limit
                return {"message": "Image size exceeds 5MB limit."}, 400
            
            # ✅ Generate unique ID for the house
            house_id = str(uuid.uuid4())
            
            # ✅ Upload image to Cloudflare R2
            image_id = str(uuid.uuid4())
            file_extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
            image_key = f"properties/houses/{request.form.get('user_id')}/{house_id}/{image_id}.{file_extension}"
            image_url = asyncio.run(upload_to_r2(image, image_key))
            
            if not image_url:
                return {"message": "Image upload failed."}, 500
            
            # ✅ Extract required fields
            required_fields = ["user_id", "house_type", "title", "number_of_bedrooms", "number_of_bathrooms", "amenities", "location"]
            data = {field: request.form.get(field) for field in required_fields}

            # ✅ Handle optional fields
            optional_fields = ["size", "locality", "map_location", "location_text"]
            for field in optional_fields:
                data[field] = request.form.get(field) or None

            if not all(data[field] for field in required_fields):
                return {"message": "Missing required fields."}, 400
            
            data.update({
                "town": request.form.get("town"),
                "price": float(request.form.get("price", 0.0)),
                "availability_status": request.form.get("availability_status", "pending"),
                "purpose": request.form.get("purpose"),
                "description": request.form.get("description"),
                "image": image_url
            })
            
            # ✅ Handle document uploads (only for Sale)
            document_urls = []
            if data["purpose"] == "Sale" and "documents" in request.files:
                for doc in request.files.getlist("documents"):
                    # ✅ Generate unique ID for each document
                    doc_id = str(uuid.uuid4())
                    file_extension = doc.filename.split(".")[-1] if "." in doc.filename else "pdf"
                    
                    # ✅ Corrected document key format
                    doc_key = f"properties/houses/{data['user_id']}/{house_id}/{doc_id}.{file_extension}"
                    
                    # ✅ Upload asynchronously to R2
                    doc_url = asyncio.run(upload_to_r2(doc, doc_key))
                    
                    if doc_url:
                        document_urls.append(doc_url)
            
            # Store document URLs in JSON format
            data["documents"] = json.dumps(document_urls) if document_urls else None
            
            # ✅ Insert into the `houses` table
            sql = """
                INSERT INTO houses (
                    id, user_id, house_type, title, number_of_bedrooms, number_of_bathrooms,
                    location, town, locality, price, availability_status, size, purpose, description, amenities, image, documents, map_location, location_text
                )
                VALUES (%(house_id)s, %(user_id)s, %(house_type)s, %(title)s, %(number_of_bedrooms)s, %(number_of_bathrooms)s,
                        %(location)s, %(town)s, %(locality)s, %(price)s, %(availability_status)s, %(size)s, %(purpose)s, %(description)s,
                        %(amenities)s, %(image)s, %(documents)s, %(map_location)s, %(location_text)s)
            """
            cursor.execute(sql, {**data, "house_id": house_id})
            
            # ✅ Insert into the `images` table
            image_sql = """
                INSERT INTO images (id, user_id, property_id, property_type, image_url)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(image_sql, (str(uuid.uuid4()), data["user_id"], house_id, "houses", image_url))
            
            # ✅ Store document URLs in the `documents` table
            if document_urls:
                document_sql = """
                    INSERT INTO documents (id, user_id, property_id, property_type, document_url)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.executemany(document_sql, [(str(uuid.uuid4()), data["user_id"], house_id, "houses", doc_url) for doc_url in document_urls])
            
            connection.commit()
            
            return jsonify({
                "message": "House added successfully.",
                "id": house_id,
                "image_url": image_url,
                "document_urls": document_urls if document_urls else None
            })
        except Exception as e:
            logger.error(f"Error adding house: {e}")
            return {"message": "Error adding house", "error": str(e)}, 500
        finally:
            cursor.close()
            connection.close()


# Update House Route
class UpdateHouse(Resource):
    def put(self, house_id):
        """Updates house details and handles image & document updates properly."""
        connection = db_connection()
        if not connection:
            return {"message": "Database connection failed."}, 500

        cursor = connection.cursor()
        try:
            # ✅ Check if the house exists
            cursor.execute("SELECT * FROM houses WHERE id = %s", (house_id,))
            house = cursor.fetchone()
            if not house:
                return {"message": "House not found."}, 404

            # ✅ Extract allowed fields dynamically
            allowed_fields = ["house_type", "title", "location", "town", "locality", "purpose", "size", "price",
                              "number_of_bedrooms", "number_of_bathrooms",
                              "description", "amenities", "availability_status", "map_location", "location_text"]
            update_data = {field: request.form.get(field) for field in allowed_fields if request.form.get(field)}

            # ✅ Validate user_id
            user_id = request.form.get("user_id")
            if not user_id:
                return {"message": "User ID is required."}, 400

            # ✅ Count existing images
            cursor.execute("SELECT COUNT(*) FROM images WHERE property_id = %s AND property_type = 'houses' AND user_id = %s",
                           (house_id, user_id))
            current_image_count = cursor.fetchone()[0]
            
            # ✅ Handle new image uploads
            if "image" in request.files and request.files.getlist("image"):
                image_files = request.files.getlist("image")

                # Validate image count and size
                MIN_IMAGES = 4
                MAX_IMAGE_SIZE_MB = 2
                MIN_IMAGE_SIZE_BYTES = 0.01 * 1024 * 1024
                MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

                if len(image_files) < MIN_IMAGES:
                    return {"message": f"At least {MIN_IMAGES} images are required. You provided {len(image_files)}."}, 400

                for img in image_files:
                    img.seek(0, 2)
                    size = img.tell()
                    img.seek(0)
                    if size < MIN_IMAGE_SIZE_BYTES:
                        return {
                            "message": "Each image must be at least 0.01MB in size.",
                            "invalid_image": img.filename,
                            "size_in_mb": round(size / (1024 * 1024), 2)
                        }, 400
                    if size > MAX_IMAGE_SIZE_BYTES:
                        return {
                            "message": f"Image {img.filename} exceeds the maximum size of {MAX_IMAGE_SIZE_MB}MB.",
                            "size_in_mb": round(size / (1024 * 1024), 2)
                        }, 400

                # Check current limits (optional logic)
                current_image_count = get_current_image_count(user_id, house_id)
                if current_image_count + len(image_files) > MAX_IMAGES:
                    return {
                        "message": f"Max image limit of {MAX_IMAGES} reached. Please delete some before adding more."
                    }, 400

                current_total_size = get_user_total_upload_size(user_id)
                new_upload_size = sum(len(file.read()) for file in image_files)
                for file in image_files:
                    file.seek(0)

                if current_total_size + new_upload_size > MAX_TOTAL_SIZE_BYTES:
                    remaining_space = (MAX_TOTAL_SIZE_BYTES - current_total_size) / (1024 * 1024)
                    return {
                        "message": f"Upload limit exceeded. You have only {remaining_space:.2f}MB remaining."
                    }, 400

                # ✅ Upload new images and update cover image
                cover_image_index = request.form.get("cover_image_index", type=int)
                uploaded_images = asyncio.run(update_property_images(house_id, "houses", image_files, user_id, cover_image_index))

                if uploaded_images:
                    update_data["image"] = uploaded_images[0]
                    logger.info(f"User {user_id} updated images for houses {house_id}: {uploaded_images}")

            # ✅ No new images but cover image was selected from existing ones
            elif "cover_image_url" in request.form:
                cover_url = request.form["cover_image_url"]
                try:
                    cursor = connection.cursor()

                    # Unset any previous cover image
                    cursor.execute("""
                        UPDATE images SET is_cover = 0 
                        WHERE property_id = %s AND property_type = 'houses' AND user_id = %s
                    """, (house_id, user_id))

                    # Set the new cover image
                    cursor.execute("""
                        UPDATE images SET is_cover = 1 
                        WHERE image_url = %s AND property_id = %s AND property_type = 'houses' AND user_id = %s
                    """, (cover_url, house_id, user_id))
                    
                    # Optional: update houses table with cover image URL
                    cursor.execute("""
                        UPDATE houses SET cover_image_url = %s WHERE id = %s AND user_id = %s
                    """, (cover_url, house_id, user_id))

                    connection.commit()
                    logger.info(f"Cover image updated for house {house_id}: {cover_url}")
                except Exception as e:
                    logger.error(f"Error setting cover image from existing images: {e}")
                    return {"message": "Failed to update cover image."}, 500


           # ✅ Handle document uploads (only for Sale)
            if request.form.get("purpose") == "Sale" and "documents" in request.files:
                
                # delete existing documents
                uploaded_documents = asyncio.run(update_property_documents(house_id, "houses", request.files.getlist("documents"), user_id))
                logger.info(f"Uploaded Documents: {uploaded_documents}")  # Add this line

                if uploaded_documents:
                    update_data["documents"] = json.dumps(uploaded_documents)

            # ✅ Handle video uploads (optional)
            if "videos" in request.files:
                video_files = request.files.getlist("videos")

                if video_files:
                    # Validate total size or number of videos as needed
                    current_video_count = get_current_video_count(user_id, house_id)
                    new_video_size = sum(get_file_size(file) for file in video_files)

                    # Reset file cursor after reading
                    for file in video_files:
                        file.seek(0)

                    if current_video_count + len(video_files) > MAX_VIDEOS:
                        return {"message": f"Max video limit of {MAX_VIDEOS} reached."}, 400

                    current_total_size = get_user_total_upload_size(user_id)
                    if current_total_size + new_video_size > MAX_TOTAL_SIZE_BYTES:
                        remaining_space = (MAX_TOTAL_SIZE_BYTES - current_total_size) / (1024 * 1024)
                        return {
                            "message": f"Upload limit exceeded. You have only {remaining_space:.2f}MB remaining."
                        }, 400

                    # Upload new videos (same async pattern as images/documents)
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    uploaded_videos = loop.run_until_complete(update_property_videos(
                        house_id, "houses", video_files, user_id
                    ))


                    if not uploaded_videos:
                        logger.warning(f"No videos uploaded for house {house_id} by user {user_id}")
                    else:
                        logger.info(f"User {user_id} updated videos for house {house_id}: {uploaded_videos}")




            # ✅ Update the house details in DB
            if update_data:
                update_query = "UPDATE houses SET " + ", ".join(f"{k} = %s" for k in update_data.keys()) + " WHERE id = %s"
                values = list(update_data.values()) + [house_id]
                cursor.execute(update_query, values)
                connection.commit()

                # process and send edits to admin
                process_property_edits(
                    property_id=house_id,
                    property_type="houses",
                    user_id=user_id,
                    update_data=update_data
                )


            response_data = {
                "message": "House updated successfully.",
                "updated_fields": update_data
            }

            # ✅ Include main image URL if any images were updated
            if "image" in update_data:
                response_data["image_url"] = update_data["image"]

            # ✅ Include cover image URL if one was selected
            cursor.execute("""
                SELECT image_url FROM images
                WHERE property_id = %s AND property_type = 'houses' AND user_id = %s AND is_cover = 1
                LIMIT 1
            """, (house_id, user_id))

            cover_result = cursor.fetchone()
            if cover_result:
                response_data["cover_image_url"] = cover_result[0]

            return jsonify(response_data)

        except Exception as e:
            logger.error(f"Error updating house: {e}")
            return {"message": "Error updating house", "error": str(e)}, 500

        finally:
            cursor.close()
            connection.close()


# Add Land Route
class AddLand(Resource):
    def post(self):
        connection = db_connection()
        if not connection:
            return {"message": "Database connection failed."}, 500
        
        cursor = connection.cursor()
        try:
            # ✅ Validate and get image file
            if "image" not in request.files:
                return {"message": "Image file is required."}, 400
            
            image = request.files["image"]
            if image.content_length > 2 * 1024 * 1024:  # 2MB Limit
                return {"message": "Image size exceeds 2MB limit."}, 400
            
            # ✅ Generate unique ID for the land
            land_id = str(uuid.uuid4())
            
            # ✅ Upload image to Cloudflare R2
            image_id = str(uuid.uuid4())
            file_extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
            image_key = f"properties/land/{request.form.get('user_id')}/{land_id}/{image_id}.{file_extension}"
            image_url = asyncio.run(upload_to_r2(image, image_key))
            
            if not image_url:
                return {"message": "Image upload failed."}, 500
            
            # ✅ Extract required fields
            required_fields = ["user_id", "title", "land_type", "location", "price"]
            data = {field: request.form.get(field) for field in required_fields}

            # ✅ Handle optional fields
            optional_fields = ["size", "locality", "map_location", "location_text"]
            for field in optional_fields:
                data[field] = request.form.get(field) or None

            
            if not all(data[field] for field in required_fields):
                return {"message": "Missing required fields."}, 400

            data.update({
                "town": request.form.get("town"),
                "availability_status": request.form.get("availability_status"),
                "purpose": request.form.get("purpose"),
                "description": request.form.get("description"),
                "amenities": request.form.get("amenities"),
                "image": image_url
            })
            
            # ✅ Handle document uploads (only for Sale)
            document_urls = []
            if data["purpose"] == "Sale" and "documents" in request.files:
                for doc in request.files.getlist("documents"):
                    # ✅ Generate unique ID for each document
                    doc_id = str(uuid.uuid4())
                    file_extension = doc.filename.split(".")[-1] if "." in doc.filename else "pdf"
                    
                    # ✅ Corrected document key format
                    doc_key = f"properties/land/{data['user_id']}/{land_id}/{doc_id}.{file_extension}"
                    
                    # ✅ Upload asynchronously to R2
                    doc_url = asyncio.run(upload_to_r2(doc, doc_key))
                    
                    if doc_url:
                        document_urls.append(doc_url)
            
            # Store document URLs in JSON format
            data["documents"] = json.dumps(document_urls) if document_urls else None  # Ensure it’s nullable in DB
            
            # ✅ Insert into the `land` table
            sql = """
                INSERT INTO land (id, user_id, title, size, land_type, location, town, locality, price, 
                availability_status, purpose, description, amenities, image, documents, map_location, location_text)
                VALUES (%(land_id)s, %(user_id)s, %(title)s, %(size)s, %(land_type)s, %(location)s, 
                %(town)s, %(locality)s, %(price)s, %(availability_status)s, %(purpose)s, %(description)s, 
                %(amenities)s, %(image)s, %(documents)s, %(map_location)s, %(location_text)s)
            """
            cursor.execute(sql, {**data, "land_id": land_id})
            
            # ✅ Insert into the `images` table
            image_sql = """
                INSERT INTO images (id, user_id, property_id, property_type, image_url)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(image_sql, (str(uuid.uuid4()), data["user_id"], land_id, "land", image_url))
            
            # ✅ Store document URLs in the `documents` table
            if document_urls:
                document_sql = """
                    INSERT INTO documents (id, user_id, property_id, property_type, document_url)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.executemany(document_sql, [(str(uuid.uuid4()), data["user_id"], land_id, "land", doc_url) for doc_url in document_urls])
            
            connection.commit()
            
            return jsonify({
                "message": "Land added successfully.",
                "id": land_id,
                "image_url": image_url,
                "document_urls": document_urls if document_urls else None
            })
        
        except Exception as e:
            logger.error(f"Error adding land: {e}")
            return {"message": "Error adding land", "error": str(e)}, 500
        
        finally:
            cursor.close()
            connection.close()


# Update Land Route
class UpdateLand(Resource):
    def put(self, land_id):
        """Updates land details and handles image & document updates properly."""
        connection = db_connection()
        if not connection:
            return {"message": "Database connection failed."}, 500

        cursor = connection.cursor()
        try:
            # ✅ Check if the land exists
            cursor.execute("SELECT * FROM land WHERE id = %s", (land_id,))
            land = cursor.fetchone()
            if not land:
                return {"message": "Land not found."}, 404

            # ✅ Extract allowed fields dynamically
            allowed_fields = ["title", "location", "town", "locality", "purpose", "size", "price",
                              "land_type", "description", "amenities", "availability_status", "map_location", "location_text"]
            update_data = {field: request.form.get(field) for field in allowed_fields if request.form.get(field)}

            # ✅ Validate user_id
            user_id = request.form.get("user_id")
            if not user_id:
                return {"message": "User ID is required."}, 400

            # ✅ Count existing images
            cursor.execute("SELECT COUNT(*) FROM images WHERE property_id = %s AND property_type = 'land' AND user_id = %s",
                           (land_id, user_id))
            current_image_count = cursor.fetchone()[0]
            

            # ✅ Handle new image uploads
            if "image" in request.files and request.files.getlist("image"):
                image_files = request.files.getlist("image")

                # Validate image count and size
                MIN_IMAGES = 4
                MAX_IMAGE_SIZE_MB = 2
                MIN_IMAGE_SIZE_BYTES = 0.01 * 1024 * 1024
                MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

                if len(image_files) < MIN_IMAGES:
                    return {"message": f"At least {MIN_IMAGES} images are required. You provided {len(image_files)}."}, 400

                for img in image_files:
                    img.seek(0, 2)
                    size = img.tell()
                    img.seek(0)
                    if size < MIN_IMAGE_SIZE_BYTES:
                        return {
                            "message": "Each image must be at least 0.01MB in size.",
                            "invalid_image": img.filename,
                            "size_in_mb": round(size / (1024 * 1024), 2)
                        }, 400
                    if size > MAX_IMAGE_SIZE_BYTES:
                        return {
                            "message": f"Image {img.filename} exceeds the maximum size of {MAX_IMAGE_SIZE_MB}MB.",
                            "size_in_mb": round(size / (1024 * 1024), 2)
                        }, 400

                # Check current limits (optional logic)
                current_image_count = get_current_image_count(user_id, land_id)
                if current_image_count + len(image_files) > MAX_IMAGES:
                    return {
                        "message": f"Max image limit of {MAX_IMAGES} reached. Please delete some before adding more."
                    }, 400

                current_total_size = get_user_total_upload_size(user_id)
                new_upload_size = sum(len(file.read()) for file in image_files)
                for file in image_files:
                    file.seek(0)

                if current_total_size + new_upload_size > MAX_TOTAL_SIZE_BYTES:
                    remaining_space = (MAX_TOTAL_SIZE_BYTES - current_total_size) / (1024 * 1024)
                    return {
                        "message": f"Upload limit exceeded. You have only {remaining_space:.2f}MB remaining."
                    }, 400

                # ✅ Upload new images and update cover image
                cover_image_index = request.form.get("cover_image_index", type=int)
                uploaded_images = asyncio.run(update_property_images(land_id, "land", image_files, user_id, cover_image_index))

                if uploaded_images:
                    update_data["image"] = uploaded_images[0]
                    logger.info(f"User {user_id} updated images for land {land_id}: {uploaded_images}")

            # ✅ No new images but cover image was selected from existing ones
            elif "cover_image_url" in request.form:
                cover_url = request.form["cover_image_url"]
                try:
                    cursor = connection.cursor()

                    # Unset any previous cover image
                    cursor.execute("""
                        UPDATE images SET is_cover = 0 
                        WHERE property_id = %s AND property_type = 'land' AND user_id = %s
                    """, (land_id, user_id))

                    # Set the new cover image
                    cursor.execute("""
                        UPDATE images SET is_cover = 1 
                        WHERE image_url = %s AND property_id = %s AND property_type = 'land' AND user_id = %s
                    """, (cover_url, land_id, user_id))
                    
                    # Optional: update land table with cover image URL
                    cursor.execute("""
                        UPDATE land SET cover_image_url = %s WHERE id = %s AND user_id = %s
                    """, (cover_url, land_id, user_id))

                    connection.commit()
                    logger.info(f"Cover image updated for land {land_id}: {cover_url}")
                except Exception as e:
                    logger.error(f"Error setting cover image from existing images: {e}")
                    return {"message": "Failed to update cover image."}, 500


            # ✅ Handle document uploads (only for Sale)
            if request.form.get("purpose") == "Sale" and "documents" in request.files:
                uploaded_documents = asyncio.run(update_property_documents(land_id, "land", request.files.getlist("documents"), user_id))
                if uploaded_documents:
                    update_data["documents"] = json.dumps(uploaded_documents)

            # ✅ Handle video uploads (optional)
            if "videos" in request.files:
                video_files = request.files.getlist("videos")

                if video_files:
                    # Validate total size or number of videos as needed
                    current_video_count = get_current_video_count(user_id, land_id)
                    new_video_size = sum(get_file_size(file) for file in video_files)

                    # Reset file cursor after reading
                    for file in video_files:
                        file.seek(0)

                    if current_video_count + len(video_files) > MAX_VIDEOS:
                        return {"message": f"Max video limit of {MAX_VIDEOS} reached."}, 400

                    current_total_size = get_user_total_upload_size(user_id)
                    if current_total_size + new_video_size > MAX_TOTAL_SIZE_BYTES:
                        remaining_space = (MAX_TOTAL_SIZE_BYTES - current_total_size) / (1024 * 1024)
                        return {
                            "message": f"Upload limit exceeded. You have only {remaining_space:.2f}MB remaining."
                        }, 400

                    # Upload new videos (same async pattern as images/documents)
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    uploaded_videos = loop.run_until_complete(update_property_videos(
                        land_id, "land", video_files, user_id
                    ))


                    if not uploaded_videos:
                        logger.warning(f"No videos uploaded for land {land_id} by user {user_id}")
                    else:
                        logger.info(f"User {user_id} updated videos for land {land_id}: {uploaded_videos}")




            # ✅ Update the land details in DB
            if update_data:
                update_query = "UPDATE land SET " + ", ".join(f"{k} = %s" for k in update_data.keys()) + " WHERE id = %s"
                values = list(update_data.values()) + [land_id]
                cursor.execute(update_query, values)
                connection.commit()

                # process and send edits to admin
                process_property_edits(
                    property_id=land_id,
                    property_type="land",
                    user_id=user_id,
                    update_data=update_data
                )

            response_data = {
                "message": "House updated successfully.",
                "updated_fields": update_data
            }

            # ✅ Include main image URL if any images were updated
            if "image" in update_data:
                response_data["image_url"] = update_data["image"]

            # ✅ Include cover image URL if one was selected
            cursor.execute("""
                SELECT image_url FROM images
                WHERE property_id = %s AND property_type = 'land' AND user_id = %s AND is_cover = 1
                LIMIT 1
            """, (land_id, user_id))

            cover_result = cursor.fetchone()
            if cover_result:
                response_data["cover_image_url"] = cover_result[0]

            return jsonify(response_data)


        except Exception as e:
            logger.error(f"Error updating land: {e}")
            return {"message": "Error updating land", "error": str(e)}, 500

        finally:
            cursor.close()
            connection.close()


# Commercial Listings
class AddCommercial(Resource):
    def post(self):
        connection = db_connection()
        if not connection:
            return {"message": "Database connection failed."}, 500

        cursor = connection.cursor()
        
        try:
            # ✅ Validate and get image file
            if "image" not in request.files:
                return {"message": "Image file is required."}, 400

            image = request.files["image"]
            if image.content_length > 2 * 1024 * 1024:  # 2MB Limit
                return {"message": "Image size exceeds 2MB limit."}, 400

            # ✅ Generate unique ID for the commercial property
            commercial_id = str(uuid.uuid4())
            
            # ✅ Extract required fields
            required_fields = ["user_id", "title", "location", "town", "purpose", "price",
                               "commercial_type", "description", "amenities"]
            data = {field: request.form.get(field) for field in required_fields}

            # ✅ Handle optional fields
            optional_fields = ["size", "locality", "map_location", "location_text"]
            for field in optional_fields:
                data[field] = request.form.get(field) or None

            
            if not all(data[field] for field in required_fields):
                return {"message": "Missing required fields"}, 400


            user_id = data["user_id"]  # ✅ Extract user_id early

            # ✅ Upload image to Cloudflare R2
            image_id = str(uuid.uuid4())
            file_extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
            image_key = f"properties/commercial/{user_id}/{commercial_id}/{image_id}.{file_extension}"

            image_url = asyncio.run(upload_to_r2(image, image_key))
            if not image_url:
                return {"message": "Image upload failed."}, 500

            data.update({
                "availability_status": "pending",  # Default status
                "image": image_url
            })

            # ✅ Handle document uploads (only for Sale)
            document_urls = []
            if data["purpose"] == "Sale" and "documents" in request.files:
                for doc in request.files.getlist("documents"):
                    doc_id = str(uuid.uuid4())
                    file_extension = doc.filename.split(".")[-1] if "." in doc.filename else "pdf"
                    
                    doc_key = f"properties/commercial/{user_id}/{commercial_id}/{doc_id}.{file_extension}"
                    doc_url = asyncio.run(upload_to_r2(doc, doc_key))
                    if doc_url:
                        document_urls.append(doc_url)

            data["documents"] = json.dumps(document_urls) if document_urls else None

            #  upload videos if provided
            if "videos" in request.files:
                video_files = request.files.getlist("videos")

                if video_files:
                    # Validate total size or number of videos as needed
                    current_video_count = get_current_video_count(user_id, commercial_id)
                    new_video_size = sum(len(file.read()) for file in video_files)

                    # Reset file cursor after reading
                    for file in video_files:
                        file.seek(0)

                    if current_video_count + len(video_files) > MAX_VIDEOS:
                        return {"message": f"Max video limit of {MAX_VIDEOS} reached."}, 400

                    current_total_size = get_user_total_upload_size(user_id)
                    if current_total_size + new_video_size > MAX_TOTAL_SIZE_BYTES:
                        remaining_space = (MAX_TOTAL_SIZE_BYTES - current_total_size) / (1024 * 1024)
                        return {
                            "message": f"Upload limit exceeded. You have only {remaining_space:.2f}MB remaining."
                        }, 400

                    # Upload new videos (same async pattern as images/documents)
                    uploaded_videos = asyncio.run(update_property_videos(commercial_id, "commercial", video_files, user_id))

                    if uploaded_videos:
                        data["videos"] = json.dumps(uploaded_videos)
                        logger.info(f"User {user_id} added videos for commercial {commercial_id}: {uploaded_videos}")



            # ✅ Insert into `commercial` table
            sql = """
                INSERT INTO commercial (id, user_id, title, location, town, locality, purpose, 
                    size, price, availability_status, commercial_type, 
                    description, amenities, image, documents, map_location, location_text)
                VALUES (%(commercial_id)s, %(user_id)s, %(title)s, %(location)s, %(town)s, %(locality)s,
                        %(purpose)s, %(size)s, %(price)s, %(availability_status)s, 
                        %(commercial_type)s, %(description)s, %(amenities)s, %(image)s, %(documents)s, %(map_location)s, %(location_text)s)
            """
            cursor.execute(sql, {**data, "commercial_id": commercial_id})

            # ✅ Insert into `images` table
            image_sql = """
                INSERT INTO images (id, user_id, property_id, property_type, image_url)
                VALUES (%s, %s, %s, %s, %s)
            """
            property_type = "commercial"
            cursor.execute(image_sql, (str(uuid.uuid4()), user_id, commercial_id, property_type, image_url))

            # ✅ Store document URLs in the `documents` table
            if document_urls:
                document_sql = """
                    INSERT INTO documents (id, user_id, property_id, property_type, document_url)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.executemany(document_sql, [(str(uuid.uuid4()), user_id, commercial_id, property_type, doc_url) for doc_url in document_urls])

             # store videos in the database
            if "videos" in data:
                video_sql = """
                    INSERT INTO videos (id, user_id, property_id, property_type, video_url)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.executemany(video_sql, [(str(uuid.uuid4()), user_id, commercial_id, property_type, video_url) for video_url in json.loads(data["videos"])])



            connection.commit()

            return jsonify({
                "message": "Commercial added successfully.",
                "id": commercial_id,
                "image_url": image_url,
                "document_urls": document_urls if document_urls else None,
                "video_urls": json.loads(data["videos"]) if "videos" in data else None
            })

        except Exception as e:
            logger.error(f"Error adding commercial: {e}")
            return {"message": "Error adding commercial", "error": str(e)}, 500

        finally:
            cursor.close()
            connection.close()


# Update Commercial Listing
class UpdateCommercial(Resource):
    def put(self, commercial_id):
        """Updates commercial property details and handles image & document updates properly."""
        connection = db_connection()
        if not connection:
            return {"message": "Database connection failed."}, 500

        cursor = connection.cursor()
        try:
            # ✅ Check if the commercial property exists
            cursor.execute("SELECT * FROM commercial WHERE id = %s", (commercial_id,))
            commercial = cursor.fetchone()
            if not commercial:
                return {"message": "Commercial property not found."}, 404

            # ✅ Extract allowed fields dynamically
            allowed_fields = ["title", "location", "town", "locality", "purpose", "size", "price",
                              "commercial_type", "description", "amenities", "availability_status", "map_location", "location_text"]
            update_data = {field: request.form.get(field) for field in allowed_fields if request.form.get(field)}

            # ✅ Validate user_id
            user_id = request.form.get("user_id")
            if not user_id:
                return {"message": "User ID is required."}, 400

            # ✅ Count existing images
            cursor.execute("SELECT COUNT(*) FROM images WHERE property_id = %s AND property_type = 'commercial' AND user_id = %s",
                           (commercial_id, user_id))
            current_image_count = cursor.fetchone()[0]


            # ✅ Handle new image uploads
            if "image" in request.files and request.files.getlist("image"):
                image_files = request.files.getlist("image")

                # Validate image count and size
                MIN_IMAGES = 4
                MAX_IMAGE_SIZE_MB = 2
                MIN_IMAGE_SIZE_BYTES = 0.01 * 1024 * 1024
                MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

                if len(image_files) < MIN_IMAGES:
                    return {"message": f"At least {MIN_IMAGES} images are required. You provided {len(image_files)}."}, 400

                for img in image_files:
                    img.seek(0, 2)
                    size = img.tell()
                    img.seek(0)
                    if size < MIN_IMAGE_SIZE_BYTES:
                        return {
                            "message": "Each image must be at least 0.01MB in size.",
                            "invalid_image": img.filename,
                            "size_in_mb": round(size / (1024 * 1024), 2)
                        }, 400
                    if size > MAX_IMAGE_SIZE_BYTES:
                        return {
                            "message": f"Image {img.filename} exceeds the maximum size of {MAX_IMAGE_SIZE_MB}MB.",
                            "size_in_mb": round(size / (1024 * 1024), 2)
                        }, 400

                # Check current limits (optional logic)
                current_image_count = get_current_image_count(user_id, commercial_id)
                if current_image_count + len(image_files) > MAX_IMAGES:
                    return {
                        "message": f"Max image limit of {MAX_IMAGES} reached. Please delete some before adding more."
                    }, 400

                current_total_size = get_user_total_upload_size(user_id)
                new_upload_size = sum(len(file.read()) for file in image_files)
                for file in image_files:
                    file.seek(0)

                if current_total_size + new_upload_size > MAX_TOTAL_SIZE_BYTES:
                    remaining_space = (MAX_TOTAL_SIZE_BYTES - current_total_size) / (1024 * 1024)
                    return {
                        "message": f"Upload limit exceeded. You have only {remaining_space:.2f}MB remaining."
                    }, 400

                # ✅ Upload new images and update cover image
                cover_image_index = request.form.get("cover_image_index", type=int)
                uploaded_images = asyncio.run(update_property_images(commercial_id, "commercial", image_files, user_id, cover_image_index))

                if uploaded_images:
                    update_data["image"] = uploaded_images[0]
                    logger.info(f"User {user_id} updated images for commercial {commercial_id}: {uploaded_images}")

            # ✅ No new images but cover image was selected from existing ones
            elif "cover_image_url" in request.form:
                cover_url = request.form["cover_image_url"]
                try:
                    cursor = connection.cursor()

                    # Unset any previous cover image
                    cursor.execute("""
                        UPDATE images SET is_cover = 0 
                        WHERE property_id = %s AND property_type = 'commercial' AND user_id = %s
                    """, (commercial_id, user_id))

                    # Set the new cover image
                    cursor.execute("""
                        UPDATE images SET is_cover = 1 
                        WHERE image_url = %s AND property_id = %s AND property_type = 'commercial' AND user_id = %s
                    """, (cover_url, commercial_id, user_id))
                    
                    # Optional: update commercial table with cover image URL
                    cursor.execute("""
                        UPDATE commercial SET cover_image_url = %s WHERE id = %s AND user_id = %s
                    """, (cover_url, commercial_id, user_id))

                    connection.commit()
                    logger.info(f"Cover image updated for commercial {commercial_id}: {cover_url}")
                except Exception as e:
                    logger.error(f"Error setting cover image from existing images: {e}")
                    return {"message": "Failed to update cover image."}, 500

            # ✅ Handle document uploads (only for Sale)
            if request.form.get("purpose") == "Sale" and "documents" in request.files:
                uploaded_documents = asyncio.run(update_property_documents(commercial_id, "commercial", request.files.getlist("documents"), user_id))

                if uploaded_documents:
                    update_data["documents"] = json.dumps(uploaded_documents)

            
            # ✅ Handle video uploads (optional)
            if "videos" in request.files:
                video_files = request.files.getlist("videos")

                if video_files:
                    # Validate total size or number of videos as needed
                    current_video_count = get_current_video_count(user_id, commercial_id)
                    new_video_size = sum(get_file_size(file) for file in video_files)

                    # Reset file cursor after reading
                    for file in video_files:
                        file.seek(0)

                    if current_video_count + len(video_files) > MAX_VIDEOS:
                        return {"message": f"Max video limit of {MAX_VIDEOS} reached."}, 400

                    current_total_size = get_user_total_upload_size(user_id)
                    if current_total_size + new_video_size > MAX_TOTAL_SIZE_BYTES:
                        remaining_space = (MAX_TOTAL_SIZE_BYTES - current_total_size) / (1024 * 1024)
                        return {
                            "message": f"Upload limit exceeded. You have only {remaining_space:.2f}MB remaining."
                        }, 400

                    # Upload new videos (same async pattern as images/documents)
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    uploaded_videos = loop.run_until_complete(update_property_videos(
                        commercial_id, "commercial", video_files, user_id
                    ))


                    if not uploaded_videos:
                        logger.warning(f"No videos uploaded for commercial {commercial_id} by user {user_id}")
                    else:
                        logger.info(f"User {user_id} updated videos for commercial {commercial_id}: {uploaded_videos}")





            # ✅ Update commercial property details in the database
            if update_data:
                update_query = "UPDATE commercial SET " + ", ".join(f"{k} = %s" for k in update_data.keys()) + " WHERE id = %s"
                values = list(update_data.values()) + [commercial_id]
                cursor.execute(update_query, values)
                connection.commit()

                # process and send edits to admin
                process_property_edits(
                    property_id=commercial_id,
                    property_type="commercial",
                    user_id=user_id,
                    update_data=update_data
                )

            response_data = {
                "message": "House updated successfully.",
                "updated_fields": update_data
            }

            # ✅ Include main image URL if any images were updated
            if "image" in update_data:
                response_data["image_url"] = update_data["image"]

            # ✅ Include cover image URL if one was selected
            cursor.execute("""
                SELECT image_url FROM images
                WHERE property_id = %s AND property_type = 'commercial' AND user_id = %s AND is_cover = 1
                LIMIT 1
            """, (commercial_id, user_id))

            cover_result = cursor.fetchone()
            if cover_result:
                response_data["cover_image_url"] = cover_result[0]

            return jsonify(response_data)


        except Exception as e:
            logger.error(f"Error updating commercial property: {e}")
            return {"message": "Error updating commercial property", "error": str(e)}, 500

        finally:
            cursor.close()
            connection.close()


async def test_upload():
    file_path = os.path.join(os.getcwd(), "trial.png")  # ✅ Correct filename
    print(f"Looking for file at: {file_path}")  # Debugging step

    if not os.path.exists(file_path):
        print("❌ Test image file not found!")
        return

    object_name = "tests/trial.png"

    try:
        async with open(file_path, "rb") as file_obj:  # Open in binary mode
            image_url = await upload_to_r2(file_obj, object_name)  # Pass file object
            if image_url:
                print(f"✅ Image Upload Successful: {image_url}")
            else:
                print("❌ Image Upload Failed!")
    except Exception as e:
        print(f"❌ Error: {e}")



# Register the routes with Flask-RESTful
api.add_resource(AddApartment, '/apartmentlisting')
api.add_resource(UpdateApartment, "/apartmentupdate/<string:apartment_id>")
api.add_resource(AddHouse, '/houselisting')
api.add_resource(UpdateHouse, "/houseupdate/<string:house_id>")
api.add_resource(AddLand, '/landlisting')
api.add_resource(UpdateLand, "/landupdate/<string:land_id>")
api.add_resource(AddCommercial, '/commerciallisting')
api.add_resource(UpdateCommercial, "/commercialupdate/<string:commercial_id>")



