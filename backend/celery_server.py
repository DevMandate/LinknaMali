from celery import Celery
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Environment, FileSystemLoader
from models import Image, Document, Blog, User, Video, ProjectImage, ProjectDocument, ProjectVideo, ProjectAmenity
from ical_sync_service import sync_external_calendars, sync_property_calendar
from models import SyncLog, ExternalCalendar
from celery.schedules import crontab
from models.engine.db_engine import SessionLocal
from vault.secrets import s3_client_params,s3_session
from sqlalchemy.exc import SQLAlchemyError
from botocore.exceptions import BotoCoreError, ClientError
import asyncio
import uuid
import os
import logging


app = Celery(
    'celery_server',  # Name of the Celery instance
    broker='redis://localhost:6379/0',  # Redis broker URL
    backend='redis://localhost:6379/0'  # Redis result backend
)
app.conf.broker_connection_retry_on_startup = True
logger = logging.getLogger(__name__)
# Load email templates
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "emails")
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

SMTP_SERVER = "mail.merimedevelopment.co.ke"
SMTP_PORT = 587
SENDER_PASSWORD = "M4r1meDvSup0"

# Test Celery
@app.task
def test_task():
    print("Celery is connected to Redis!")
    return "Task complete"

# Send_email_task
@app.task(bind=True, default_retry_delay=10, max_retries=3)  # Retry after 10s, max 3 times
def send_email_task(self,sender_email,recipient_email, subject, template_name, context):
    try:
        # Load the email template and render it with context
        template = env.get_template(template_name)
        email_body = template.render(context)

        # Set up the MIME message
        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(email_body, "html"))

        # Send the email through the SMTP server
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(sender_email, SENDER_PASSWORD)
            server.sendmail(sender_email, recipient_email, msg.as_string())

        return f"Email sent successfully to {recipient_email}"
    
    except smtplib.SMTPException as exc:
        # Retry the task in case of SMTP exceptions
        raise self.retry(exc=exc)


#################################################################################################################
# Create listing tasks
#################################################################################################################

CLOUDFLARE_BUCKET_NAME = "linknamali"
CLOUDFLARE_ENDPOINT = "https://files.linknamali.ke"

@app.task
def upload_property_images_to_r2(property_type, user_id, property_id, image_data):
    """
    Celery task to upload images to Cloudflare R2 asynchronously and store URLs in the database.
    Ensures only one image is marked as cover.
    """
    logger.info('Uploading images to R2')
    
    if not image_data:
        logger.error("No images received, skipping upload.")
        return []

    def sync_upload():
        async def async_upload():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                uploaded_urls = []
                session = SessionLocal()
                try:
                    # --- Reset existing cover image if any new one is provided ---
                    has_cover_image = any(img.get("is_cover") == 1 for img in image_data)
                    if has_cover_image:
                        session.query(Image).filter_by(
                            user_id=user_id,
                            property_id=property_id,
                            property_type=property_type
                        ).update({"is_cover": 0})
                        logger.info("Reset previous cover image flags")

                    for image in image_data:
                        image_id = str(uuid.uuid4())
                        file_extension = image["filename"].split(".")[-1] if "." in image["filename"] else "jpg"
                        image_key = f"properties/{property_type}/{user_id}/{property_id}/{image_id}.{file_extension}"

                        content_type = image.get("content_type", "").lower()
                        if not content_type or content_type == "application/octet-stream":
                            content_type = {
                                "jpg": "image/jpeg",
                                "jpeg": "image/jpeg",
                                "png": "image/png",
                                "gif": "image/gif"
                            }.get(file_extension, "application/octet-stream")

                        try:
                            await s3_client.put_object(
                                Bucket=CLOUDFLARE_BUCKET_NAME,
                                Key=image_key,
                                Body=image["content"],
                                ContentType=content_type
                            )

                            image_url = f"{CLOUDFLARE_ENDPOINT}/{image_key}"
                            is_cover = image.get("is_cover", 0)

                            new_image = Image(
                                id=image_id,
                                user_id=user_id,
                                property_id=property_id,
                                property_type=property_type,
                                image_url=image_url,
                                is_cover=is_cover
                            )
                            session.add(new_image)
                            uploaded_urls.append(image_url)
                            logger.info(f"Uploaded image: {image_url} (cover: {is_cover})")

                        except Exception as e:
                            logger.error(f"Failed to upload image {image_key}: {e}")

                    session.commit()
                    return uploaded_urls

                finally:
                    session.close()

        return asyncio.run(async_upload())

    return sync_upload()

@app.task
def upload_property_documents_to_r2(property_type, user_id, property_id, document_data):
    """
    Celery task to upload documents to Cloudflare R2 asynchronously and store URLs in the database.
    """
    logger.info('Uploading documents to R2')

    if not document_data:
        logger.error("No documents received, skipping upload.")
        return []

    def sync_upload():
        async def async_upload():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                uploaded_urls = []
                session = SessionLocal()
                try:
                    for document in document_data:
                        document_id = str(uuid.uuid4())
                        file_extension = document["filename"].split(".")[-1] if "." in document["filename"] else "pdf"
                        document_key = f"properties/{property_type}/{user_id}/{property_id}/{document_id}.{file_extension}"

                        # Set content type based on file extension
                        content_type = document.get("content_type", "").lower()
                        if not content_type or content_type == "application/octet-stream":
                            content_type = {
                                "pdf": "application/pdf",
                                "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                "txt": "text/plain"
                            }.get(file_extension, "application/octet-stream")

                        try:
                            # Upload document to Cloudflare R2
                            await s3_client.put_object(
                                Bucket=CLOUDFLARE_BUCKET_NAME,
                                Key=document_key,
                                Body=document["content"],
                                ContentType=content_type
                            )

                            document_url = f"{CLOUDFLARE_ENDPOINT}/{document_key}"

                            # Save document info in the database
                            new_document = Document(
                                id=document_id,
                                user_id=user_id,
                                property_id=property_id,
                                property_type=property_type,
                                document_url=document_url
                            )
                            session.add(new_document)
                            uploaded_urls.append(document_url)
                            logger.info(f"Uploaded {document_url} with content type: {content_type} successfully")

                        except Exception as e:
                            logger.error(f"Failed to upload {document_key}: {e}")

                    session.commit()
                finally:
                    session.close()
            return uploaded_urls

        return asyncio.run(async_upload())

    return sync_upload()


@app.task
def upload_property_videos_to_r2(property_type, user_id, property_id, video_data):
    """
    Celery task to upload videos to Cloudflare R2 asynchronously and store URLs in the Video table.
    """
    logger.info('Uploading videos to R2')
    logger.debug(f"Received video_data: {video_data}")

    if not video_data:
        logger.error("No videos received, skipping upload.")
        return []

    def sync_upload():
        async def async_upload():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                uploaded_urls = []
                session = SessionLocal()
                try:
                    for video in video_data:
                        video_id = str(uuid.uuid4())
                        file_extension = video["filename"].split(".")[-1] if "." in video["filename"] else "mp4"
                        video_key = f"properties/{property_type}/{user_id}/{property_id}/videos/{video_id}.{file_extension}"

                        content_type = video.get("content_type", "").lower()
                        if not content_type or content_type == "application/octet-stream":
                            content_type = {
                                "mp4": "video/mp4",
                                "mov": "video/quicktime",
                                "avi": "video/x-msvideo",
                                "webm": "video/webm"
                            }.get(file_extension, "application/octet-stream")

                        try:
                            await s3_client.put_object(
                                Bucket=CLOUDFLARE_BUCKET_NAME,
                                Key=video_key,
                                Body=video["content"],
                                ContentType=content_type
                            )

                            video_url = f"{CLOUDFLARE_ENDPOINT}/{video_key}"

                            new_video = Video(
                                id=video_id,
                                user_id=user_id,
                                property_id=property_id,
                                property_type=property_type,
                                video_url=video_url
                            )
                            logger.info("Adding video record to DB...")
                            session.add(new_video)
                            uploaded_urls.append(video_url)
                            logger.info(f"Uploaded video {video_url} with content type: {content_type} successfully")
                        except Exception as e:
                            logger.error(f"Failed to upload video {video_key}: {e}")

                    # Log all uploaded video URLs before committing
                    if uploaded_urls:
                        logger.info(f"All uploaded video URLs for property {property_id}:")
                        for url in uploaded_urls:
                            logger.info(f"- {url}")
                    else:
                        logger.warning(f"No videos were uploaded for property {property_id}.")

                    session.commit()
                    logger.info(f"Committed video record(s) for property {property_id}")
                finally:
                    session.close()
            return uploaded_urls

        return asyncio.run(async_upload())

    return sync_upload()




@app.task(bind=True, default_retry_delay=10, max_retries=3)
def delete_from_r2(self, folder_prefix):
    """
    Celery task to delete all images and documents related to a blog from Cloudflare R2.
    """
    def sync_delete():
        async def async_delete():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                try:
                    # List objects in the folder
                    response = await s3_client.list_objects_v2(
                        Bucket=CLOUDFLARE_BUCKET_NAME, 
                        Prefix=folder_prefix
                    )
                    objects = response.get("Contents", [])

                    if not objects:
                        logging.warning(f"No files found in {folder_prefix}, skipping deletion.")
                        return True  # No files to delete, treat as success

                    # Extract object keys
                    object_keys = [{"Key": obj["Key"]} for obj in objects]

                    # Delete objects in batches
                    await s3_client.delete_objects(
                        Bucket=CLOUDFLARE_BUCKET_NAME,
                        Delete={"Objects": object_keys}
                    )
                    logging.info(f"Deleted {len(object_keys)} files from {folder_prefix}")
                    return True

                except (BotoCoreError, ClientError) as e:
                    logging.error(f"S3 error while deleting from {folder_prefix}: {e}")
                    raise self.retry(exc=e)
                except Exception as e:
                    logging.error(f"Failed to delete files from {folder_prefix}: {e}")
                    raise self.retry(exc=e)

        return asyncio.run(async_delete())

    return sync_delete()





#################################################################################################################
# Blog upload tasks
#################################################################################################################
@app.task
def upload_blog_thumbnail_to_r2(blog_id, image_data):
    """
    Celery task to upload a blog thumbnail to Cloudflare R2 and update the blog URL in the database.
    """
    if not image_data:
        logging.error("No thumbnail received, skipping upload.")
        return None

    def sync_upload():
        async def async_upload():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                try:
                    # Generate unique image name
                    file_extension = image_data["filename"].split(".")[-1] if "." in image_data["filename"] else "jpg"
                    image_key = f"blogs/{blog_id}/{blog_id}.{file_extension}"

                    # Determine correct content type
                    content_type = image_data.get("content_type", "").lower()
                    if not content_type or content_type == "application/octet-stream":
                        content_type = {
                            "jpg": "image/jpeg",
                            "jpeg": "image/jpeg",
                            "png": "image/png",
                            "gif": "image/gif",
                        }.get(file_extension, "application/octet-stream")

                    # Upload to Cloudflare R2
                    await s3_client.put_object(
                        Bucket=CLOUDFLARE_BUCKET_NAME,
                        Key=image_key,
                        Body=image_data["content"],
                        ContentType=content_type,
                    )

                    return f"{CLOUDFLARE_ENDPOINT}/{image_key}"

                except Exception as e:
                    logging.error(f"Failed to upload thumbnail: {e}")
                    return None

        # Run async_upload inside a new event loop
        return asyncio.run(async_upload())

    # Execute the upload
    image_url = sync_upload()

    # Update the database synchronously
    if image_url:
        session = SessionLocal()
        try:
            blog = session.query(Blog).filter(Blog.id == blog_id).first()
            if blog:
                blog.thumbnail_url = image_url
                session.commit()
                logging.info(f"Thumbnail uploaded successfully: {image_url}")
            else:
                logging.error(f"Blog with ID {blog_id} not found.")
        except SQLAlchemyError as e:
            session.rollback()
            logging.error(f"Database error while updating thumbnail URL: {e}")
        finally:
            session.close()

    return image_url


@app.task
def upload_blog_document_to_r2(blog_id, document_data):
    """
    Celery task to upload a blog HTML document to Cloudflare R2 and update the blog URL in the database.
    """
    if not document_data:
        logging.error("No document received, skipping upload.")
        return None

    def sync_upload():
        async def async_upload():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                try:
                    filename = document_data["filename"]

                    # Ensure only HTML files are uploaded
                    if not filename.lower().endswith(".html"):
                        logging.error(f"Invalid file type: {filename}. Only .html files are allowed.")
                        return None

                    document_key = f"blogs/{blog_id}/{filename}"
                    # Ensure correct content type for HTML
                    content_type = "text/html"

                    # Upload to Cloudflare R2
                    await s3_client.put_object(
                        Bucket=CLOUDFLARE_BUCKET_NAME,
                        Key=document_key,
                        Body=document_data["content"],
                        ContentType=content_type
                    )

                    return f"{CLOUDFLARE_ENDPOINT}/{document_key}"

                except Exception as e:
                    logging.error(f"Failed to upload document: {e}")
                    return None

        # Run async function safely
        return asyncio.run(async_upload())

    # Execute the upload
    document_url = sync_upload()

    # Update the database synchronously
    if document_url:
        session = SessionLocal()
        try:
            blog = session.query(Blog).filter(Blog.id == blog_id).first()
            if blog:
                blog.document_url = document_url
                session.commit()
                logging.info(f"HTML document uploaded successfully: {document_url}")
            else:
                logging.error(f"Blog with ID {blog_id} not found.")
        except SQLAlchemyError as e:
            session.rollback()
            logging.error(f"Database error while updating document URL: {e}")
        finally:
            session.close()

    return document_url


@app.task
def upload_blog_assets_to_r2(blog_id, assets):
    """
    Celery task to upload multiple blog images to Cloudflare R2 and return their URLs.
    """
    if not assets:
        logging.error("No assets received, skipping upload.")
        return None

    def sync_upload():
        async def async_upload():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                uploaded_urls = []
                try:
                    for image_data in assets:
                        filename = image_data["filename"]
                        file_extension = filename.split(".")[-1] if "." in filename else "jpg"
                        image_key = f"blogs/{blog_id}/images/{filename}"

                        # Ensure correct content type
                        content_type = image_data.get("content_type", "").lower()
                        if not content_type or content_type == "application/octet-stream":
                            content_type = {
                                "jpg": "image/jpeg",
                                "jpeg": "image/jpeg",
                                "png": "image/png",
                                "gif": "image/gif",
                            }.get(file_extension, "application/octet-stream")

                        # Upload to Cloudflare R2
                        await s3_client.put_object(
                            Bucket=CLOUDFLARE_BUCKET_NAME,
                            Key=image_key,
                            Body=image_data["content"],
                            ContentType=content_type
                        )

                        # Generate public URL
                        image_url = f"{CLOUDFLARE_ENDPOINT}/{image_key}"
                        uploaded_urls.append(image_url)
                        logging.info(f"Asset uploaded successfully: {image_url}")

                except Exception as e:
                    logging.error(f"Failed to upload assets: {e}")

                return uploaded_urls

        # Run async function safely
        return asyncio.run(async_upload())

    # Execute the upload
    return sync_upload()


#################################################################################################################
# ProfilePic
#################################################################################################################
@app.task
def upload_profile_pic_to_r2(user_id, image_data):
    """
    Celery task to upload a user's profile picture to Cloudflare R2 and update the database.
    """
    if not image_data:
        logging.error("No profile picture received, skipping upload.")
        return None

    def sync_upload():
        async def async_upload():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                try:
                    # Generate unique image name
                    image_name = str(uuid.uuid4())
                    file_extension = image_data["filename"].split(".")[-1] if "." in image_data["filename"] else "jpg"
                    image_key = f"users/{user_id}/profile_pic/{image_name}.{file_extension}"

                    # Ensure correct content type
                    content_type = image_data.get("content_type", "").lower()
                    if not content_type or content_type == "application/octet-stream":
                        content_type = {
                            "jpg": "image/jpeg",
                            "jpeg": "image/jpeg",
                            "png": "image/png",
                            "gif": "image/gif",
                        }.get(file_extension, "application/octet-stream")

                    # Upload to Cloudflare R2
                    await s3_client.put_object(
                        Bucket=CLOUDFLARE_BUCKET_NAME,
                        Key=image_key,
                        Body=image_data["content"],
                        ContentType=content_type
                    )

                    return f"{CLOUDFLARE_ENDPOINT}/{image_key}"

                except Exception as e:
                    logging.error(f"Failed to upload profile picture: {e}")
                    return None

        # Run async function safely
        return asyncio.run(async_upload())

    # Execute the upload
    image_url = sync_upload()

    # Update the database synchronously
    if image_url:
        session = SessionLocal()
        try:
            user = session.query(User).filter(User.user_id == user_id).first()
            if user:
                user.profile_pic_url = image_url
                session.commit()
                logging.info(f"Profile picture uploaded successfully: {image_url}")
            else:
                logging.error(f"User with ID {user_id} not found.")
        except SQLAlchemyError as e:
            session.rollback()
            logging.error(f"Database error while updating profile picture URL: {e}")
        finally:
            session.close()

    return image_url



#####################################################################################################
# Projects handling

###############################################################
@app.task
def upload_project_images_to_r2(user_id, project_id, image_data):
    """
    Celery task to upload project images to Cloudflare R2 asynchronously and store URLs in the project_images table.
    Ensures only one image is marked as cover.
    """
    logger.info('Uploading project images to R2')

    if not image_data:
        logger.error("No images received, skipping upload.")
        return []

    def sync_upload():
        async def async_upload():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                uploaded_urls = []
                session = SessionLocal()
                try:
                    # --- Reset existing cover image if any new one is provided ---
                    has_cover_image = any(img.get("is_cover") == 1 for img in image_data)
                    if has_cover_image:
                        session.query(ProjectImage).filter_by(
                            user_id=user_id,
                            project_id=project_id
                        ).update({"is_cover": 0})
                        logger.info("Reset previous project cover image flags")

                    for image in image_data:
                        image_id = str(uuid.uuid4())
                        file_extension = image["filename"].split(".")[-1] if "." in image["filename"] else "jpg"
                        image_key = f"projects/{user_id}/{project_id}/{image_id}.{file_extension}"

                        content_type = image.get("content_type", "").lower()
                        if not content_type or content_type == "application/octet-stream":
                            content_type = {
                                "jpg": "image/jpeg",
                                "jpeg": "image/jpeg",
                                "png": "image/png",
                                "gif": "image/gif",
                                "webp": "image/webp"
                            }.get(file_extension, "application/octet-stream")

                        try:
                            # Upload to R2
                            await s3_client.put_object(
                                Bucket=CLOUDFLARE_BUCKET_NAME,
                                Key=image_key,
                                Body=image["content"],
                                ContentType=content_type
                            )

                            image_url = f"{CLOUDFLARE_ENDPOINT}/{image_key}"
                            is_cover = image.get("is_cover", 0)

                            # Save to project_images table
                            new_image = ProjectImage(
                                id=image_id,
                                user_id=user_id,
                                project_id=project_id,
                                image_url=image_url,
                                is_cover=is_cover
                            )
                            session.add(new_image)
                            uploaded_urls.append(image_url)
                            logger.info(f"Uploaded project image: {image_url} (cover: {is_cover})")

                        except Exception as e:
                            logger.error(f"Failed to upload project image {image_key}: {e}")

                    session.commit()
                    return uploaded_urls

                finally:
                    session.close()

        return asyncio.run(async_upload())

    return sync_upload()


@app.task
def upload_project_documents_to_r2(project_id, user_id, document_data):
    """
    Celery task to upload project documents to Cloudflare R2 and store them in the project_documents table.
    """
    logger.info(f"Uploading {len(document_data)} project documents to R2")

    if not document_data:
        logger.error("No documents received, skipping upload.")
        return []

    def sync_upload():
        async def async_upload():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                uploaded_urls = []
                session = SessionLocal()

                try:
                    for document in document_data:
                        document_id = str(uuid.uuid4())
                        filename = document.get("filename", f"{document_id}.pdf")
                        file_extension = filename.split(".")[-1].lower() if "." in filename else "pdf"

                        document_key = f"projects/{user_id}/{project_id}/{document_id}.{file_extension}"

                        # Set content type
                        content_type = document.get("content_type", "").lower()
                        if not content_type or content_type == "application/octet-stream":
                            content_type = {
                                "pdf": "application/pdf",
                                "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                "txt": "text/plain",
                                "webp": "image/webp"
                            }.get(file_extension, "application/octet-stream")

                        try:
                            # Upload to Cloudflare R2
                            await s3_client.put_object(
                                Bucket=CLOUDFLARE_BUCKET_NAME,
                                Key=document_key,
                                Body=document["content"],
                                ContentType=content_type
                            )

                            document_url = f"{CLOUDFLARE_ENDPOINT}/{document_key}"

                            # Store in DB
                            new_document = ProjectDocument(
                                id=document_id,
                                user_id=user_id,
                                project_id=project_id,
                                document_url=document_url
                            )
                            session.add(new_document)
                            uploaded_urls.append(document_url)

                            logger.info(f"Uploaded project document: {document_url}")

                        except Exception as e:
                            logger.error(f"Failed to upload document {filename}: {e}")

                    session.commit()
                    return uploaded_urls

                except Exception as db_err:
                    session.rollback()
                    logger.error(f"Database error during document upload: {db_err}")
                    return []
                finally:
                    session.close()

        return asyncio.run(async_upload())

    return sync_upload()


@app.task
def upload_project_videos_to_r2(user_id, project_id, video_data):
    """
    Celery task to upload project videos to Cloudflare R2 and store them in the project_videos table.
    """
    logger.info(f"Uploading {len(video_data)} project videos to R2")
    logger.debug(f"Received video_data: {video_data}")

    if not video_data:
        logger.error("No videos received, skipping upload.")
        return []

    def sync_upload():
        async def async_upload():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                uploaded_urls = []
                session = SessionLocal()
                try:
                    for video in video_data:
                        video_id = str(uuid.uuid4())
                        file_extension = video["filename"].split(".")[-1] if "." in video["filename"] else "mp4"
                        video_key = f"projects/{user_id}/{project_id}/videos/{video_id}.{file_extension}"

                        content_type = video.get("content_type", "").lower()
                        if not content_type or content_type == "application/octet-stream":
                            content_type = {
                                "mp4": "video/mp4",
                                "mov": "video/quicktime",
                                "avi": "video/x-msvideo",
                                "mkv": "video/x-matroska",
                                "webm": "video/webm"
                            }.get(file_extension, "application/octet-stream")

                        try:
                            await s3_client.put_object(
                                Bucket=CLOUDFLARE_BUCKET_NAME,
                                Key=video_key,
                                Body=video["content"],
                                ContentType=content_type
                            )

                            video_url = f"{CLOUDFLARE_ENDPOINT}/{video_key}"

                            new_video = ProjectVideo(
                                id=video_id,
                                user_id=user_id,
                                project_id=project_id,
                                video_url=video_url
                            )
                            session.add(new_video)
                            uploaded_urls.append(video_url)
                            logger.info(f"Uploaded project video: {video_url} (type: {content_type})")

                        except Exception as e:
                            logger.error(f"Failed to upload project video {video_key}: {e}")

                    if uploaded_urls:
                        logger.info(f"✅ Uploaded {len(uploaded_urls)} videos for project {project_id}")
                    else:
                        logger.warning(f"⚠️ No videos were uploaded for project {project_id}")

                    session.commit()
                    logger.info(f"Committed project video records for project {project_id}")

                    return uploaded_urls

                except Exception as db_err:
                    session.rollback()
                    logger.error(f"Database error during project video upload: {db_err}")
                    return []
                finally:
                    session.close()

        return asyncio.run(async_upload())

    return sync_upload()



@app.task(bind=True, default_retry_delay=10, max_retries=3)
def delete_project_media_from_r2(self, object_keys=None, prefix=None):
    """
    Delete specific media files from Cloudflare R2 or delete everything under a folder prefix.

    :param object_keys: List of specific object keys to delete.
    :param prefix: If provided and object_keys is None, deletes all under this folder path.
    """
    def sync_delete():
        async def async_delete():
            async with s3_session.client("s3", **s3_client_params) as s3_client:
                try:
                    keys_to_delete = []

                    if object_keys:
                        # Use the provided keys directly
                        keys_to_delete = [{"Key": key} for key in object_keys]
                    elif prefix:
                        # Fetch all objects under the prefix
                        response = await s3_client.list_objects_v2(
                            Bucket=CLOUDFLARE_BUCKET_NAME,
                            Prefix=prefix
                        )
                        contents = response.get("Contents", [])
                        keys_to_delete = [{"Key": obj["Key"]} for obj in contents]

                    if not keys_to_delete:
                        logging.warning(f"No media files found to delete for prefix={prefix}")
                        return True

                    # Perform deletion
                    await s3_client.delete_objects(
                        Bucket=CLOUDFLARE_BUCKET_NAME,
                        Delete={"Objects": keys_to_delete}
                    )
                    logging.info(f"Deleted {len(keys_to_delete)} media files from R2.")
                    return True

                except (BotoCoreError, ClientError) as e:
                    logging.error(f"Cloudflare R2 deletion error: {e}")
                    raise self.retry(exc=e)
                except Exception as e:
                    logging.error(f"Unexpected error during R2 deletion: {e}")
                    raise self.retry(exc=e)

        return asyncio.run(async_delete())

    return sync_delete()


#################################################################################################################
# Calendar sync tasks
#################################################################################################################

@app.task(bind=True, max_retries=3)
def sync_all_calendars_task(self):
    """Celery task to sync all external calendars"""
    try:
        sync_external_calendars()
        logging.info("Successfully synced all calendars")
        return {"status": "success", "message": "All calendars synced"}
    except Exception as e:
        logging.error(f"Error in sync_all_calendars_task: {str(e)}")
        # Retry the task
        raise self.retry(exc=e, countdown=60)

@app.task(bind=True, max_retries=3)
def sync_property_calendar_task(self, property_id):
    """Celery task to sync calendar for a specific property"""
    session = SessionLocal()
    try:
        # Log sync start
        sync_log = SyncLog(
            property_id=property_id,
            platform_name="all",
            sync_status="in_progress"
        )
        session.add(sync_log)
        session.commit()

        # Perform sync
        sync_property_calendar(property_id)

        # Update log with success
        sync_log.sync_status = "success"
        session.commit()

        logging.info(f"Successfully synced calendar for property {property_id}")
        return {"status": "success", "property_id": property_id}

    except Exception as e:
        # Update log with error
        sync_log.sync_status = "failed"
        sync_log.error_message = str(e)
        session.commit()

        logging.error(f"Error in sync_property_calendar_task: {str(e)}")
        raise self.retry(exc=e, countdown=60)
    finally:
        session.close()

@app.task
def periodic_calendar_sync():
    """Periodic task to sync all calendars - runs every 30 minutes"""
    sync_all_calendars_task.delay()

# Set up periodic tasks
app.conf.beat_schedule = {
    'sync-calendars-every-30-minutes': {
        'task': 'celery_server.periodic_calendar_sync',
        'schedule': crontab(minute='*/30'),
    },
}
app.conf.timezone = 'UTC'