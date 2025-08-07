from flask import Blueprint, request, jsonify
from flask_restful import Resource, Api
from database.database import db_connection
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
from urllib.parse import urlparse
import os
import logging
import uuid
import aioboto3
import asyncio




# Create Blueprint
userprofile = Blueprint("userprofile", __name__)
api = Api(userprofile)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


CLOUDFLARE_ACCESS_KEY = os.getenv("CLOUDFLARE_ACCESS_KEY")
CLOUDFLARE_SECRET_KEY = os.getenv("CLOUDFLARE_SECRET_KEY")


if not CLOUDFLARE_ACCESS_KEY or not CLOUDFLARE_SECRET_KEY:
    raise ValueError("❌ Cloudflare credentials are missing! Set them as environment variables.")

# Cloudflare R2 Config
CLOUDFLARE_BUCKET_NAME = "linknamali"
CLOUDFLARE_ENDPOINT = "https://d418c3595b04db7f9e063c255ea021d0.r2.cloudflarestorage.com"


# Async file upload and delete function with content-type support
async def upload_profile_pic(file_obj, user_id, filename):
    session = aioboto3.Session()
    
    # Extract the file extension dynamically
    file_extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    object_name = f"profile_pics/{user_id}/{filename}"  # Use filename directly to prevent double extension
    content_type = get_content_type(filename)  # Determine correct content type

    try:
        async with session.client(
            "s3",
            endpoint_url=CLOUDFLARE_ENDPOINT,
            aws_access_key_id=CLOUDFLARE_ACCESS_KEY,
            aws_secret_access_key=CLOUDFLARE_SECRET_KEY
        ) as s3_client:
            await s3_client.put_object(
                Bucket=CLOUDFLARE_BUCKET_NAME,
                Key=object_name,
                Body=file_obj,
                ContentType=content_type
            )
            return f"https://files.linknamali.ke/{object_name}"

    except Exception as e:
        logger.error(f"Profile picture upload failed for {user_id}: {e}")
        return None




# ✅ Async file delete function
async def delete_from_r2(image_url):
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
                logger.info(f"Successfully deleted: {image_url}")
                return True
            else:
                logger.error(f"Failed to delete {image_url}, response: {response}")
                return False

    except Exception as e:
        logger.error(f"Error deleting image {image_url}: {e}")
        return False
    

# ✅ Helper function for async upload
async def upload_wrapper(file_obj, filename, user_id):
    file_extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    object_name = f"profile_pics/{user_id}/{filename}"
    return await upload_profile_pic(file_obj, object_name)



# ✅ Image storage to table
def store_profile_pic(user_id, image_url):
    connection = db_connection()
    if not connection:
        logger.error("Database connection failed while storing profile picture URL.")
        return False

    cursor = connection.cursor()
    try:
        sql = """
            UPDATE user_profiles
            SET profile_pic = %s, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
        """
        cursor.execute(sql, (image_url, user_id))
        connection.commit()
        return True

    except Exception as e:
        logger.error(f"Error updating profile picture for user {user_id}: {e}")
        return False

    finally:
        cursor.close()
        connection.close()




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

   
    # ❌ Default for unsupported types
    return "application/octet-stream"



# User Profile
class UserProfile(Resource):
    @cross_origin(origins=[
        "https://portal.linknamali.ke",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://linknamali.ke"
    ], supports_credentials=True)
    def post(self):
        try:
            connection = db_connection()
            if connection is None:
                return {'response': 'Database connection failed'}, 500
            cursor = connection.cursor()

            user_id = request.form.get('user_id')
            print(f"User ID: {user_id}")
            if not user_id:
                return {'response': 'User ID is required'}, 400

            cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
            if not cursor.fetchone():
                return {'response': 'User not found'}, 404

            cursor.execute("SELECT profile_pic FROM user_profiles WHERE user_id = %s", (user_id,))
            existing_profile_pic = cursor.fetchone()
            profile_pic_url = None

            if 'profile_pic' in request.files:
                profile_pic = request.files['profile_pic']
                filename = secure_filename(profile_pic.filename)

                if existing_profile_pic and existing_profile_pic[0]:
                    asyncio.run(delete_from_r2(existing_profile_pic[0]))

                file_bytes = profile_pic.read()
                profile_pic_url = asyncio.run(upload_profile_pic(file_bytes, user_id, filename))

                if not profile_pic_url:
                    return {'response': 'Failed to upload profile picture'}, 500

            first_name = request.form.get('first_name')
            last_name = request.form.get('last_name')
            county = request.form.get('county')
            city = request.form.get('city')
            town = request.form.get('town')
            zip_code = request.form.get('zip_code')
            phone_number = request.form.get('phone_number')
            alternate_phonenumber = request.form.get('alternate_phonenumber')
            alternate_email = request.form.get('alternate_email')

            cursor.execute("SELECT profile_id FROM user_profiles WHERE user_id = %s", (user_id,))
            existing_profile = cursor.fetchone()

            if existing_profile:
                if profile_pic_url:
                    sql_update = """
                        UPDATE user_profiles
                        SET first_name = %s, last_name = %s, county = %s,
                            city = %s, town = %s, zip_code = %s, phone_number = %s,
                            alternate_phonenumber = %s, alternate_email = %s,
                            profile_pic = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = %s
                    """
                    cursor.execute(sql_update, (
                        first_name, last_name, county, city, town, zip_code,
                        phone_number, alternate_phonenumber, alternate_email,
                        profile_pic_url, user_id
                    ))
                else:
                    sql_update = """
                        UPDATE user_profiles
                        SET first_name = %s, last_name = %s, county = %s,
                            city = %s, town = %s, zip_code = %s, phone_number = %s,
                            alternate_phonenumber = %s, alternate_email = %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = %s
                    """
                    cursor.execute(sql_update, (
                        first_name, last_name, county, city, town, zip_code,
                        phone_number, alternate_phonenumber, alternate_email,
                        user_id
                    ))
            else:
                profile_id = str(uuid.uuid4())
                sql_insert = """
                    INSERT INTO user_profiles (
                        profile_id, user_id, first_name, last_name, county,
                        city, town, zip_code, phone_number, alternate_phonenumber,
                        alternate_email, profile_pic
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(sql_insert, (
                    profile_id, user_id, first_name, last_name, county, city,
                    town, zip_code, phone_number, alternate_phonenumber,
                    alternate_email, profile_pic_url
                ))

            
            connection.commit()

            return {
                'profile': {
                    'first_name': first_name,
                    'last_name': last_name,
                    'county': county,
                    'city': city,
                    'town': town,
                    'zip_code': zip_code,
                    'phone_number': phone_number,
                    'alternate_phonenumber': alternate_phonenumber,
                    'alternate_email': alternate_email,
                    'profile_pic': profile_pic_url if profile_pic_url else (existing_profile_pic[0] if existing_profile_pic else None)
                },
                'message': 'Profile saved successfully'
            }, 200



        except Exception as e:
            logging.error(f"Error saving profile: {str(e)}")
            return {'response': str(e)}, 500

        finally:
            if connection:
                connection.close()



# Get User Profile
class GetUserProfile(Resource):
    @cross_origin(origins=[
        "https://portal.linknamali.ke",
        "http://localhost:5173", 
        "http://localhost:5174",
        "https://linknamali.ke"
    ], supports_credentials=True)
    def get(self, user_id):
        try:
            connection = db_connection()
            if connection is None:
                return {'response': 'Database connection failed'}, 500
            cursor = connection.cursor()

            cursor.execute("SELECT * FROM user_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()

            if not profile:
                return {'response': 'User profile not found'}, 404

            profile_data = {
                'user_id': profile[1],
                'first_name': profile[2],
                'last_name': profile[3],
                'county': profile[4],
                'city': profile[5],
                'town': profile[6],
                'zip_code': profile[7],
                'phone_number': profile[8],
                'alternate_phonenumber': profile[9],
                'alternate_email': profile[10],
                'profile_pic': profile[11],
                'created_at': profile[12],
                'updated_at': profile[13]
            }

            return {'response': 'Profile retrieved successfully', 'data': profile_data}, 200

        except Exception as e:
            logging.error(f"Error retrieving profile: {str(e)}")
            return {'response': str(e)}, 500
        finally:
            if connection:
                connection.close()



# Add resources to API
api.add_resource(UserProfile, '/userprofile')
api.add_resource(GetUserProfile, '/getuserprofile/<string:user_id>')