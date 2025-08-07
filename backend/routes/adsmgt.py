import smtplib
import ssl
import threading
from flask import Flask, Blueprint, request, jsonify, render_template
from flask_restful import Api
from database.database import db_connection
from flask_cors import CORS
from urllib.parse import urlparse
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Environment, FileSystemLoader
from dotenv import load_dotenv
import aioboto3
import boto3
import os
import logging
import uuid
import asyncio


# Create Blueprint
adsmgt = Blueprint("adsmgt", __name__)
api = Api(adsmgt)
CORS(adsmgt, resources={
    r"/adsmgt/*": {
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


# Email Configuration
SMTP_SERVER = "mail.merimedevelopment.co.ke"
SMTP_PORT = 587
SENDER_EMAIL = "support@merimedevelopment.co.ke"
SENDER_PASSWORD = "M4r1meDvSup0"  # Store this securely in HashiCorp Vault!

# Define the correct template folder path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # This gets the current script's directory
TEMPLATE_DIR = os.path.join(BASE_DIR, "email_templates")  # Navigate to email_templates

# Set up Jinja2 environment
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

# send email function
def send_email(receiver_email, subject, template_name, context):
    """Sends an email using an HTML template."""
    try:
        # Load the email template
        template = env.get_template(template_name)

        # Render the template with context data
        html_content = template.render(context)

        
        # Create email message
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = receiver_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_content, "html"))  # Use "html" instead of "plain"

        # Send email
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, receiver_email, msg.as_string())

        logging.info(f"Email sent successfully to {receiver_email}")

    except Exception as e:
        logging.error(f"Failed to send email: {e}")


def send_email_async(receiver_email, subject, template_name, context):
    """Helper function to send an email in a separate thread using an HTML template."""
    thread = threading.Thread(
        target=send_email,
        kwargs={
            "receiver_email": receiver_email,
            "subject": subject,
            "template_name": template_name,
            "context": context
        }
    )
    thread.start()


CLOUDFLARE_ACCESS_KEY = os.getenv("CLOUDFLARE_ACCESS_KEY")
CLOUDFLARE_SECRET_KEY = os.getenv("CLOUDFLARE_SECRET_KEY")


if not CLOUDFLARE_ACCESS_KEY or not CLOUDFLARE_SECRET_KEY:
    raise ValueError("❌ Cloudflare credentials are missing! Set them as environment variables.")

# Cloudflare R2 Config
CLOUDFLARE_BUCKET_NAME = "linknamali"
CLOUDFLARE_ENDPOINT = "https://d418c3595b04db7f9e063c255ea021d0.r2.cloudflarestorage.com"


# Async file upload and delete function with content-type support
def upload_ads_media(file_obj, user_id, filename):
    session = boto3.Session()
    
    # Extract the file extension dynamically
    media_id = str(uuid.uuid4())
    file_extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    object_name = f"ads/{user_id}/{media_id}.{file_extension}"  
    
    try:
        s3_client =  session.client(
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
        return f"https://files.linknamali.ke/{object_name}"

    except Exception as e:
        logger.error(f"Profile picture upload failed for {user_id}: {e}")
        return None




# Async bulk delete function for a list of URLs
async def delete_from_r2(media_urls):
    try:
        session = aioboto3.Session()
        async with session.client(
            "s3",
            endpoint_url=CLOUDFLARE_ENDPOINT,
            aws_access_key_id=CLOUDFLARE_ACCESS_KEY,
            aws_secret_access_key=CLOUDFLARE_SECRET_KEY
        ) as s3_client:
            tasks = []

            for media_url in media_urls:
                parsed_url = urlparse(media_url)
                object_key = parsed_url.path.lstrip("/")  # Remove leading "/"

                if not object_key:
                    logger.warning(f"Skipped invalid media URL: {media_url}")
                    continue

                # Schedule deletion task
                tasks.append(
                    s3_client.delete_object(Bucket=CLOUDFLARE_BUCKET_NAME, Key=object_key)
                )

            # Await all deletions
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Check for any failures
            for result, url in zip(results, media_urls):
                if isinstance(result, Exception):
                    logger.error(f"Error deleting {url}: {result}")
                    return False
                elif result.get("ResponseMetadata", {}).get("HTTPStatusCode") != 204:
                    logger.error(f"Failed to delete {url}, response: {result}")
                    return False
                else:
                    logger.info(f"Successfully deleted: {url}")

        return True

    except Exception as e:
        logger.error(f"Bulk delete failed: {e}")
        return False



# Helper function for async upload
async def upload_wrapper(file_obj, filename, user_id):
    media_id = str(uuid.uuid4())
    file_extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    object_name = f"ads/{user_id}/{media_id}.{file_extension}"
    return await upload_ads_media(file_obj, object_name)



# Adds ads media link to table
def store_ads_link(user_id, media_url):
    connection = db_connection()
    if not connection:
        logger.error("Database connection failed while storing profile picture URL.")
        return False

    cursor = connection.cursor()
    try:
        sql = """
            UPDATE ads
            SET media_url = %s, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
        """
        cursor.execute(sql, (media_url, user_id))
        connection.commit()
        return True

    except Exception as e:
        logger.error(f"Error updating media for the ad {user_id}: {e}")
        return False

    finally:
        cursor.close()
        connection.close()


# Function to create ad and file upload
@adsmgt.route('/ads', methods=['POST'])
def create_ad():
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    user_id = data.get('user_id')
    title = data.get('title')
    description = data.get('description')
    start_date_str = str(data.get('start_date', '')).strip()
    end_date_str = str(data.get('end_date', '')).strip()
    budget = data.get('budget')
    payment_method = data.get('payment_method')
    mpesa_number = data.get('mpesa_number') if payment_method == "mpesa" else None
    property_id = data.get('property_id')
    property_type = str(data.get('property_type', '')).strip().lower()

    # Ensure budget is stored as an integer
    try:
        budget = int(budget)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid budget value"}), 400

    # Ensure start_date and end_date are valid
    try:
        if not start_date_str or not end_date_str:
            return jsonify({"message": "Start date and end date are required"}), 400

        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Handle file uploads
    files = request.files.getlist('media_urls')
    request_media_urls = data.get('media_urls')  # Can be a list or string
    media_urls = []

    if not files and not request_media_urls:
        return jsonify({'error': 'Media is required (either file upload or URL).'}), 400

    for file in files:
        try:
            filename = file.filename
            logger.info(f"Processing file: {filename}")
            media_url = upload_ads_media(file, user_id, filename)
            media_urls.append(media_url)
        except Exception as e:
            logger.error(f"File upload failed for user {user_id}, file: {filename}, Error: {str(e)}")
            continue

    if isinstance(request_media_urls, list):
        media_urls.extend(request_media_urls)
    elif isinstance(request_media_urls, str):
        media_urls.append(request_media_urls)

    try:
        conn = db_connection()
        cursor = conn.cursor()

        # ✅ Validate listing if property info provided
        if property_id and property_type:
            table_map = {
                "apartment": "apartments",
                "house": "houses",
                "land": "land",
                "commercial": "commercial"
            }

            if property_type not in table_map:
                conn.close()
                return jsonify({"message": "Invalid property type provided."}), 400

            table_name = table_map[property_type]
            query = f"SELECT is_approved FROM {table_name} WHERE id = %s"
            cursor.execute(query, (property_id,))
            result = cursor.fetchone()

            if not result:
                conn.close()
                return jsonify({"message": f"{property_type.capitalize()} not found."}), 404
            if result[0] != 1:
                conn.close()
                return jsonify({"message": "Cannot create ad. The property is not approved."}), 403

        # ✅ Check for duplicate ad
        cursor.execute(
            "SELECT id FROM ads WHERE user_id = %s AND title = %s AND description = %s",
            (user_id, title, description)
        )
        existing_ad = cursor.fetchone()

        if existing_ad:
            conn.close()
            logger.warning(f"Duplicate ad detected for user {user_id}, title: {title}")
            return jsonify({
                "message": "Duplicate ad detected. This ad already exists.",
                "ad_id": existing_ad[0]
            }), 409

        # ✅ Proceed with inserting the new ad
        ad_id = str(uuid.uuid4())

        if not user_id:
            return jsonify({"message": "User ID is required"}), 400

        cursor.execute(
            """INSERT INTO ads (id, user_id, title, description, start_date, 
                                end_date, budget, payment_method, mpesa_number, 
                                property_id, property_type) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (ad_id, user_id, title, description, start_date, end_date,
             budget, payment_method, mpesa_number, property_id, property_type)
        )

        # ✅ Insert media entries
        for media_url in media_urls:
            cursor.execute(
                "INSERT INTO ads_media (id, ad_id, media_url) VALUES (%s, %s, %s)",
                (str(uuid.uuid4()), ad_id, media_url)
            )

        conn.commit()
        conn.close()

        logger.info(f"Ad created successfully: {ad_id}, User: {user_id}")
        return jsonify({
            "message": "Ad created successfully",
            "ad_id": ad_id,
            "media_urls": media_urls
        }), 201

    except Exception as e:
        logger.error(f"Error creating ad for user {user_id}: {str(e)}")
        return jsonify({"message": "Failed to create ad", "error": str(e)}), 500


# Delete Ads function
@adsmgt.route('/ads/<string:ad_id>', methods=['DELETE'])
def delete_ad(ad_id):
    try:
        conn = db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch ad details from `ads`
        cursor.execute("SELECT media_url FROM ads WHERE id = %s", (ad_id,))
        ad = cursor.fetchone()

        if not ad:
            conn.close()
            return jsonify({"message": "Ad not found"}), 404

        media_urls = []
        if ad["media_url"]:
            media_urls.append(ad["media_url"])

        # Fetch additional media from `ads_media`
        cursor.execute("SELECT media_url FROM ads_media WHERE ad_id = %s", (ad_id,))
        additional_media = cursor.fetchall()
        media_urls += [item["media_url"] for item in additional_media]

        # Delete media from Cloudflare R2
        deleted = asyncio.run(delete_from_r2(media_urls))

        if deleted:
            # Delete from `ads_media` table
            cursor.execute("DELETE FROM ads_media WHERE ad_id = %s", (ad_id,))

            # Delete from `ads` table
            cursor.execute("DELETE FROM ads WHERE id = %s", (ad_id,))
            conn.commit()
            conn.close()

            return jsonify({"message": "Ad and media deleted successfully"}), 200
        else:
            conn.close()
            return jsonify({"message": "Failed to delete ad media"}), 500

    except Exception as e:
        logger.error(f"Error deleting ad {ad_id}: {str(e)}")
        return jsonify({"message": "Error deleting ad", "error": str(e)}), 500


# Function to handle M-Pesa payment
@adsmgt.route('/mpesa-payment', methods=['POST'])
def process_mpesa_payment():
    data = request.json
    user_id = data['user_id']
    ad_id = data['ad_id']
    mpesa_number = data['mpesa_number']
    amount = float(data['amount'])  # Ensure amount is treated as float

    conn = db_connection()
    cursor = conn.cursor()

    # 🟢 Check if an existing payment exists (FETCH results before next query)
    cursor.execute(
        "SELECT id, amount FROM payments WHERE user_id = %s AND ad_id = %s",
        (user_id, ad_id)
    )
    existing_payment = cursor.fetchone()
    
    # 🟢 Clear any remaining unread results
    while cursor.nextset():
        pass

    # 🟢 Get the ad budget (FETCH results immediately)
    cursor.execute("SELECT budget FROM ads WHERE id = %s", (ad_id,))
    ad_budget = cursor.fetchone()

    if not ad_budget:
        conn.close()
        return jsonify({"message": "Invalid ad ID"}), 404  # Not found

    ad_budget = float(ad_budget[0])  # Convert budget to float

    # 🟢 Get the total amount paid for this ad (FETCH results before next query)
    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE ad_id = %s", (ad_id,))
    total_paid_before = float(cursor.fetchone()[0])

    # 🟢 Clear any remaining unread results
    while cursor.nextset():
        pass

    # 🔵 Update existing payment OR insert a new one
    if existing_payment:
        payment_id = existing_payment[0]
        previous_amount = float(existing_payment[1])
        new_total_paid = (total_paid_before - previous_amount) + amount  # Adjust total
        
        # Update the existing payment record
        cursor.execute(
            "UPDATE payments SET amount = %s, mpesa_number = %s WHERE id = %s",
            (amount, mpesa_number, payment_id)
        )
    else:
        # Insert a new payment record
        payment_id = str(uuid.uuid4())
        new_total_paid = total_paid_before + amount
        cursor.execute(
            "INSERT INTO payments (id, user_id, ad_id, amount, method, mpesa_number, transaction_status) VALUES (%s, %s, %s, %s, %s, %s, 'pending')",
            (payment_id, user_id, ad_id, amount, 'mpesa', mpesa_number)
        )

    # 🔵 Determine transaction status
    transaction_status = "completed" if new_total_paid >= ad_budget else "pending"

    # 🔵 Update payment status in the payments table
    cursor.execute("UPDATE payments SET transaction_status = %s WHERE id = %s", (transaction_status, payment_id))

    # 🔵 Update ad payment status if budget is met
    if new_total_paid >= ad_budget:
        cursor.execute("UPDATE ads SET payment_status = 'paid' WHERE id = %s", (ad_id,))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "M-Pesa payment processed",
        "payment_id": payment_id,
        "transaction_status": transaction_status
    }), 200

# User ads with associated media URLs
@adsmgt.route('/user-ads/<user_id>', methods=['GET'])
def get_user_ads(user_id):
    try:
        conn = db_connection()
        cursor = conn.cursor(dictionary=True)  # Return results as dictionaries
        
        # 🔹 Fetch all ads for the user
        cursor.execute(
            """SELECT id, title, description, start_date, end_date, budget, payment_method, payment_status, property_id, property_type FROM ads WHERE user_id = %s""", 
            (user_id,)
        )
        ads = cursor.fetchall()

        if not ads:
            conn.close()
            return jsonify({"message": "No ads found for this user"}), 404

        user_ads = []

        for ad in ads:
            ad_id = ad["id"]
            budget = float(ad["budget"])

            # 🔹 Fetch total payments for this ad
            cursor.execute(
                "SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE ad_id = %s", 
                (ad_id,)
            )
            total_paid = float(cursor.fetchone()["total_paid"])

            # 🔹 Calculate balance
            balance = max(budget - total_paid, 0)

            # 🔹 Fetch payment transactions for this ad
            cursor.execute(
                """SELECT id, amount, method, mpesa_number, transaction_status, created_at 
                   FROM payments WHERE ad_id = %s""", 
                (ad_id,)
            )
            payments = cursor.fetchall()

            # 🔹 Fetch media URLs from the separate ads_media table
            cursor.execute(
                "SELECT media_url FROM ads_media WHERE ad_id = %s",
                (ad_id,)
            )
            media_rows = cursor.fetchall()
            # Convert result to a list of media URLs
            media_urls = [row["media_url"] for row in media_rows]

            # 🔹 Add ad details + payment and media info to response
            user_ads.append({
                "ad_id": ad_id,
                "title": ad["title"],
                "description": ad["description"],
                "media_urls": media_urls,  # Now a list of URLs
                "start_date": str(ad["start_date"]),
                "end_date": str(ad["end_date"]),
                "budget": budget,
                "payment_method": ad["payment_method"],
                "payment_status": ad["payment_status"],
                "total_paid": total_paid,
                "balance": balance,
                "payments": payments,  
                "property_id": ad["property_id"],
                "property_type": ad["property_type"]
            })

        conn.close()
        return jsonify({"user_ads": user_ads}), 200

    except Exception as e:
        logger.error(f"Error fetching user ads: {str(e)}")
        return jsonify({"message": "Failed to fetch user ads", "error": str(e)}), 500


# appove ads
@adsmgt.route('/approveAd/<ad_id>/approve', methods=['POST'])
def approve_ad(ad_id):
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')

        if not admin_id:
            return jsonify({"message": "Admin ID required in request body"}), 400

        conn = db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if user is admin
        cursor.execute("SELECT role FROM users WHERE user_id = %s", (admin_id,))
        admin = cursor.fetchone()
        if not admin or admin["role"] != "admin":
            return jsonify({"message": "Unauthorized"}), 403

        # Get ad and user info
        cursor.execute("""
            SELECT a.title, a.start_date, a.end_date, u.first_name, u.email
            FROM ads a
            JOIN users u ON a.user_id = u.user_id
            WHERE a.id = %s
        """, (ad_id,))
        ad_info = cursor.fetchone()
        if not ad_info:
            return jsonify({"message": "Ad not found"}), 404

        # Approve ad
        cursor.execute("UPDATE ads SET status = 'approved' WHERE id = %s", (ad_id,))
        conn.commit()

        # Send email
        email_context = {
            "user_name": ad_info["first_name"],
            "ad_title": ad_info["title"],
            "start_date": ad_info["start_date"],
            "end_date": ad_info["end_date"]
        }

        send_email_async(
            receiver_email=ad_info["email"],
            subject="Linknamali - Your Ad Has Been Approved",
            template_name="ad_approved.html",
            context=email_context
        )

        conn.close()
        return jsonify({"message": "Ad approved and email sent"}), 200

    except Exception as e:
        logger.error(f"Error approving ad {ad_id}: {str(e)}")
        return jsonify({"message": "Failed to approve ad", "error": str(e)}), 500


# ad rejection route
@adsmgt.route('/rejectAd/<ad_id>/reject', methods=['POST'])
def reject_ad(ad_id):
    try:
        data = request.get_json()
        reason = data.get("reason", "No reason provided.")
        admin_id = data.get("admin_id")

        # Log the extracted admin_id
        logger.info(f"Extracted Admin ID (User ID) from JSON body: {admin_id}")

        if not admin_id:
            logger.warning("Admin ID is missing or empty in request body.")
            return jsonify({"message": "Admin ID required in request body"}), 400

        conn = db_connection()
        cursor = conn.cursor(dictionary=True)

        # ✅ Check if admin exists and is authorized
        logger.info(f"Checking if admin with ID {admin_id} exists in the database...")
        cursor.execute("SELECT role FROM users WHERE user_id = %s", (admin_id,))
        admin = cursor.fetchone()
        logger.info(f"Admin check result: {admin}")

        if not admin or admin["role"] != "admin":
            logger.warning(f"Unauthorized access attempt by user {admin_id}.")
            return jsonify({"message": "Unauthorized"}), 403

        # ✅ Fetch ad and user info
        logger.info(f"Fetching ad and user info for ad_id: {ad_id}...")
        cursor.execute("""
            SELECT a.title, u.first_name, u.email
            FROM ads a
            JOIN users u ON a.user_id = u.user_id
            WHERE a.id = %s
        """, (ad_id,))
        ad_info = cursor.fetchone()

        if not ad_info:
            logger.warning(f"Ad with ID {ad_id} not found.")
            return jsonify({"message": "Ad not found"}), 404

        # ✅ Reject ad
        logger.info(f"Rejecting ad with ID {ad_id}...")
        cursor.execute("UPDATE ads SET status = 'rejected' WHERE id = %s", (ad_id,))
        cursor.execute(
            "INSERT INTO ad_rejections (id, ad_id, reason) VALUES (%s, %s, %s)",
            (str(uuid.uuid4()), ad_id, reason)
        )
        conn.commit()

        # ✅ Send rejection email
        logger.info(f"Sending rejection email to {ad_info['email']}...")
        email_context = {
            "user_name": ad_info["first_name"],
            "ad_title": ad_info["title"],
            "reason": reason
        }

        send_email_async(
            receiver_email=ad_info["email"],
            subject="Linknamali - Your Ad Has Been Rejected",
            template_name="ad_rejected.html",
            context=email_context
        )

        conn.close()
        logger.info(f"Ad {ad_id} rejected and email sent successfully.")
        return jsonify({"message": "Ad rejected and email sent"}), 200

    except Exception as e:
        logger.error(f"Error rejecting ad {ad_id}: {str(e)}")
        return jsonify({"message": "Failed to reject ad", "error": str(e)}), 500


# Endpoint to fetch all ads for all users with associated media URLs
@adsmgt.route('/all-ads', methods=['GET'])
def get_all_ads():
    try:
        conn = db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 🔹 Fetch all ads along with their user details using a JOIN query
        cursor.execute(
            """
            SELECT 
                a.id AS ad_id,
                a.title,
                a.description,
                a.start_date,
                a.end_date,
                a.budget,
                a.payment_method,
                a.payment_status,
                a.status,  -- Added the status field
                a.property_id,
                a.property_type,
                u.user_id,
                u.first_name,
                u.last_name,
                u.email
            FROM ads a
            JOIN users u ON a.user_id = u.user_id
            """
        )
        ads = cursor.fetchall()

        if not ads:
            conn.close()
            return jsonify({"message": "No ads found"}), 404

        all_ads = []

        for ad in ads:
            ad_id = ad["ad_id"]
            budget = float(ad["budget"])

            # 🔹 Fetch total payments for this ad
            cursor.execute(
                "SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE ad_id = %s", 
                (ad_id,)
            )
            total_paid = float(cursor.fetchone()["total_paid"])

            # 🔹 Calculate the remaining balance for the ad
            balance = max(budget - total_paid, 0)

            # 🔹 Fetch payment transactions for this ad
            cursor.execute(
                """
                SELECT id, amount, method, mpesa_number, transaction_status, created_at 
                FROM payments 
                WHERE ad_id = %s
                """, 
                (ad_id,)
            )
            payments = cursor.fetchall()

            # 🔹 Fetch all associated media URLs from the ads_media table
            cursor.execute(
                "SELECT media_url FROM ads_media WHERE ad_id = %s",
                (ad_id,)
            )
            media_rows = cursor.fetchall()
            media_urls = [row["media_url"] for row in media_rows]

            # 🔹 Compile all ad details and include user information in a nested 'user' object
            all_ads.append({
                "ad_id": ad_id,
                "title": ad["title"],
                "description": ad["description"],
                "media_urls": media_urls,  # Now returns a list of media URLs
                "start_date": str(ad["start_date"]),
                "end_date": str(ad["end_date"]),
                "budget": budget,
                "payment_method": ad["payment_method"],
                "payment_status": ad["payment_status"],
                "status": ad["status"],  # Added the status field to the output
                "property_id": ad["property_id"],
                "property_type": ad["property_type"],
                "total_paid": total_paid,
                "balance": balance,
                "payments": payments,  # List of payments for this ad
                "user": {
                    "user_id": ad["user_id"],
                    "first_name": ad["first_name"],
                    "last_name": ad["last_name"],
                    "email": ad["email"]
                }
            })

        conn.close()
        return jsonify({"all_ads": all_ads}), 200

    except Exception as e:
        logger.error(f"Error fetching all ads: {str(e)}")
        return jsonify({"message": "Failed to fetch all ads", "error": str(e)}), 500


# Edit ads
@adsmgt.route('/ads/<string:ad_id>', methods=['PUT'])
def update_ad(ad_id):
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    # Collect fields
    title = data.get('title')
    description = data.get('description')
    start_date_str = str(data.get('start_date', '')).strip()
    end_date_str = str(data.get('end_date', '')).strip()
    budget = data.get('budget')
    payment_method = data.get('payment_method')
    mpesa_number = data.get('mpesa_number') if payment_method == "mpesa" else None

    # Validate and convert budget
    try:
        if budget:
            budget = int(budget)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid budget value"}), 400

    # Validate and convert dates
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date() if start_date_str else None
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date() if end_date_str else None
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Handle file uploads
    files = request.files.getlist('media_urls')
    request_media_urls = data.get('media_urls')
    media_urls = []

    for file in files:
        try:
            filename = file.filename
            logger.info(f"Uploading new file for ad {ad_id}: {filename}")
            media_url = upload_ads_media(file, ad_id, filename)
            media_urls.append(media_url)
        except Exception as e:
            logger.error(f"File upload failed: {str(e)}")

    if isinstance(request_media_urls, list):
        media_urls.extend(request_media_urls)
    elif isinstance(request_media_urls, str):
        media_urls.append(request_media_urls)

    try:
        conn = db_connection()
        cursor = conn.cursor()

        # Check if ad exists
        cursor.execute("SELECT id FROM ads WHERE id = %s", (ad_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"message": "Ad not found"}), 404

        # Build dynamic update query
        update_fields = []
        values = []

        if title:
            update_fields.append("title = %s")
            values.append(title)
        if description:
            update_fields.append("description = %s")
            values.append(description)
        if start_date:
            update_fields.append("start_date = %s")
            values.append(start_date)
        if end_date:
            update_fields.append("end_date = %s")
            values.append(end_date)
        if budget is not None:
            update_fields.append("budget = %s")
            values.append(budget)
        if payment_method:
            update_fields.append("payment_method = %s")
            values.append(payment_method)
        if mpesa_number:
            update_fields.append("mpesa_number = %s")
            values.append(mpesa_number)

        if update_fields:
            values.append(ad_id)
            update_query = f"UPDATE ads SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(update_query, tuple(values))

        # Optional: delete existing media and insert new ones
        if media_urls:
            cursor.execute("DELETE FROM ads_media WHERE ad_id = %s", (ad_id,))
            for media_url in media_urls:
                cursor.execute(
                    "INSERT INTO ads_media (id, ad_id, media_url) VALUES (%s, %s, %s)",
                    (str(uuid.uuid4()), ad_id, media_url)
                )

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Ad updated successfully",
            "ad_id": ad_id,
            "updated_media_urls": media_urls
        }), 200
    except Exception as e:
        logger.error(f"Error updating ad {ad_id}: {str(e)}")
        return jsonify({"message": "Failed to update ad", "error": str(e)}), 500


# archive ads
@adsmgt.route('/ads/<string:ad_id>/archive', methods=['PUT'])
def archive_ad(ad_id):
    try:
        data = request.get_json()
        is_archived = data.get('is_archived')

        if is_archived is None:
            return jsonify({"message": "Missing 'is_archived' in request body."}), 400

        conn = db_connection()
        cursor = conn.cursor()

        # Update the ad's archive status
        cursor.execute(
            "UPDATE ads SET is_archived = %s WHERE id = %s",
            (is_archived, ad_id)
        )

        conn.commit()
        cursor.close()
        conn.close()

        status_text = "archived" if is_archived else "unarchived"
        return jsonify({"message": f"Ad successfully {status_text}."}), 200

    except Exception as e:
        logger.error(f"Error archiving ad {ad_id}: {str(e)}")
        return jsonify({"message": "Failed to archive ad", "error": str(e)}), 500


# Function to submit an ad enquiry
@adsmgt.route('/ads/<ad_id>/enquiries', methods=['POST'])
def submit_ad_enquiry(ad_id):
    data = request.get_json()

    # Optional if user is logged in
    user_id = data.get('user_id')

    # For guests
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    message = data.get('message')

    if not message:
        return jsonify({'message': 'Enquiry message is required.'}), 400

    try:
        conn = db_connection()
        cursor = conn.cursor(dictionary=True)

        # Ensure ad exists and get the owner user_id and ad title
        cursor.execute("SELECT user_id, title FROM ads WHERE id = %s", (ad_id,))
        ad = cursor.fetchone()
        if not ad:
            return jsonify({'message': 'Ad not found'}), 404

        ad_owner_id = ad['user_id']
        ad_title = ad['title']

        # Get ad owner's email
        cursor.execute("SELECT email, first_name FROM users WHERE user_id = %s", (ad_owner_id,))
        owner = cursor.fetchone()
        if not owner:
            return jsonify({'message': 'Ad owner not found'}), 404

        owner_email = owner['email']
        owner_first_name = owner['first_name']

        # Create enquiry
        enquiry_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO ad_enquiries (id, ad_id, user_id, name, email, phone, message)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (enquiry_id, ad_id, user_id, name, email, phone, message)
        )
        conn.commit()
        conn.close()

        logger.info(f"Triggered email to ad owner {owner_email} for ad '{ad_title}' on enquiry {enquiry_id}")

        # --------- EMAIL NOTIFICATION TO AD OWNER ---------
        email_subject = f"New Enquiry for Your Ad: {ad_title}"

        template_context = {
            "owner_name": owner_first_name,
            "ad_title": ad_title,
            "enquirer_name": name if name else "Registered User",
            "enquirer_email": email if email else "Not provided",
            "enquirer_phone": phone if phone else "Not provided",
            "message": message
        }

        # Send email in background
        send_email_async(
            receiver_email=owner_email,
            subject=email_subject,
            template_name="owner_ad_enquries.html",  
            context=template_context
        )

        return jsonify({
            'message': 'Enquiry submitted successfully',
            'enquiry_id': enquiry_id
        }), 201

    except Exception as e:
        logger.error(f"Error submitting enquiry on ad {ad_id}: {str(e)}")
        return jsonify({'message': 'Failed to submit enquiry', 'error': str(e)}), 500


# Function to respond to an ad enquiry
@adsmgt.route('/ads/enquiries/<enquiry_id>/response', methods=['PUT'])
def respond_to_enquiry(enquiry_id):
    data = request.get_json()
    owner_id = data.get('owner_id')  # Should come from session/auth in a real app
    response_message = data.get('response')

    if not response_message:
        return jsonify({'message': 'Response message is required.'}), 400

    try:
        conn = db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch the enquiry, join with ad to verify ownership
        cursor.execute("""
            SELECT ae.*, a.title, a.user_id AS ad_owner_id
            FROM ad_enquiries ae
            JOIN ads a ON ae.ad_id = a.id
            WHERE ae.id = %s
        """, (enquiry_id,))
        enquiry = cursor.fetchone()

        if not enquiry:
            return jsonify({'message': 'Enquiry not found.'}), 404

        if enquiry['ad_owner_id'] != owner_id:
            return jsonify({'message': 'Unauthorized: You do not own this ad.'}), 403

        # Update the enquiry with the owner's response
        cursor.execute("""
            UPDATE ad_enquiries
            SET owner_response = %s
            WHERE id = %s
        """, (response_message, enquiry_id))
        conn.commit()

        # Notify enquirer by email (if email was provided)
        if enquiry['email']:
            email_subject = f"Response to Your Enquiry on '{enquiry['title']}'"
            template_context = {
                "enquirer_name": enquiry['name'] or "Guest",
                "ad_title": enquiry['title'],
                "owner_response": response_message
            }

            send_email_async(
                receiver_email=enquiry['email'],
                subject=email_subject,
                template_name="ad_owner_response.html",  # create a styled template
                context=template_context
            )

        conn.close()
        return jsonify({'message': 'Response sent successfully.'}), 200

    except Exception as e:
        logger.error(f"Error responding to enquiry {enquiry_id}: {str(e)}")
        return jsonify({'message': 'Failed to send response', 'error': str(e)}), 500




# Function to fetch ad enquiries for the ad owner
@adsmgt.route('/ads/enquiries', methods=['GET'])
def get_ad_enquiries_for_owner():
    # Ensure user is logged in and fetch user_id
    user_id = request.args.get('user_id')  # Get user_id from the query params or session

    if not user_id:
        return jsonify({'message': 'User not authenticated.'}), 401

    try:
        conn = db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get all ads owned by the user
        cursor.execute("SELECT id, title FROM ads WHERE user_id = %s", (user_id,))
        ads = cursor.fetchall()

        if not ads:
            return jsonify({'message': 'No ads found for this user.'}), 404

        # Initialize a list to hold the enquiries
        ad_enquiries = []

        # For each ad, fetch its enquiries
        for ad in ads:
            ad_id = ad['id']
            ad_title = ad['title']

            # Fetch all enquiries for this ad
            cursor.execute(
                """SELECT id, name, email, phone, message, created_at 
                   FROM ad_enquiries WHERE ad_id = %s""", (ad_id,)
            )
            enquiries = cursor.fetchall()

            if enquiries:
                ad_enquiries.append({
                    'ad_id': ad_id,
                    'ad_title': ad_title,
                    'enquiries': enquiries
                })
            else:
                ad_enquiries.append({
                    'ad_id': ad_id,
                    'ad_title': ad_title,
                    'enquiries': []
                })

        conn.close()

        return jsonify({
            'message': 'Ad enquiries fetched successfully.',
            'data': ad_enquiries
        }), 200

    except Exception as e:
        logger.error(f"Error fetching enquiries for user {user_id}: {str(e)}")
        return jsonify({'message': 'Failed to fetch enquiries', 'error': str(e)}), 500


# fetch enquiries by ad_id
@adsmgt.route('/ads/<ad_id>/enquiries', methods=['GET'])
def get_enquiries_for_ad(ad_id):
    try:
        conn = db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch enquiries related to the specific ad_id
        cursor.execute(
            """SELECT id, name, email, phone, message, created_at 
               FROM ad_enquiries WHERE ad_id = %s""", (ad_id,)
        )
        enquiries = cursor.fetchall()

        conn.close()

        if not enquiries:
            return jsonify({'message': 'No enquiries found for this ad.'}), 404

        return jsonify({
            'message': 'Enquiries fetched successfully.',
            'ad_id': ad_id,
            'enquiries': enquiries
        }), 200

    except Exception as e:
        logger.error(f"Error fetching enquiries for ad {ad_id}: {str(e)}")
        return jsonify({'message': 'Failed to fetch enquiries', 'error': str(e)}), 500


# fetch a specific enqury by its id
@adsmgt.route('/enquiries/<enquiry_id>', methods=['GET'])
def get_enquiry_by_id(enquiry_id):
    try:
        conn = db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM ad_enquiries WHERE id = %s", (enquiry_id,))
        enquiry = cursor.fetchone()
        conn.close()

        if not enquiry:
            return jsonify({'message': 'Enquiry not found'}), 404

        return jsonify({'message': 'Enquiry retrieved', 'enquiry': enquiry}), 200

    except Exception as e:
        logger.error(f"Error retrieving enquiry {enquiry_id}: {str(e)}")
        return jsonify({'message': 'Failed to retrieve enquiry', 'error': str(e)}), 500


# update the status of an enquiry
@adsmgt.route('/adsenquiries/<enquiry_id>/status', methods=['PUT'])
def update_enquiry_status(enquiry_id):
    data = request.get_json()
    new_status = data.get('status')

    allowed_statuses = ['unread', 'read', 'archived']
    if new_status not in allowed_statuses:
        return jsonify({'message': f'Invalid status. Allowed values: {allowed_statuses}'}), 400

    try:
        conn = db_connection()
        cursor = conn.cursor()

        # Check if the enquiry exists
        cursor.execute("SELECT id FROM ad_enquiries WHERE id = %s", (enquiry_id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Enquiry not found'}), 404

        # Update the status
        cursor.execute(
            "UPDATE ad_enquiries SET status = %s WHERE id = %s",
            (new_status, enquiry_id)
        )
        conn.commit()
        conn.close()

        logger.info(f"Updated status of enquiry {enquiry_id} to '{new_status}'")
        return jsonify({'message': f"Enquiry marked as '{new_status}'"}), 200

    except Exception as e:
        logger.error(f"Error updating status for enquiry {enquiry_id}: {str(e)}")
        return jsonify({'message': 'Failed to update status', 'error': str(e)}), 500


# Delete an Ad enquiry
@adsmgt.route('/enquiries/<enquiry_id>', methods=['DELETE'])
def delete_enquiry(enquiry_id):
    try:
        conn = db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM ad_enquiries WHERE id = %s", (enquiry_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Enquiry deleted successfully'}), 200

    except Exception as e:
        logger.error(f"Error deleting enquiry {enquiry_id}: {str(e)}")
        return jsonify({'message': 'Failed to delete enquiry', 'error': str(e)}), 500
