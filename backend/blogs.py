from flask import Blueprint, request
from flask_cors import CORS
from flask_restful import Api, Resource
from sqlalchemy.exc import SQLAlchemyError
from celery_server import upload_blog_thumbnail_to_r2, upload_blog_document_to_r2, upload_blog_assets_to_r2, delete_from_r2
from models import Blog
from models.engine.db_engine import SessionLocal
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
import logging
import uuid

blogs = Blueprint('blogs', __name__, url_prefix='/blogs')
api = Api(blogs)
CORS(blogs, resources={
    r"/blogs/*": {
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

@blogs.route('/', methods=['GET'])
def welcome():
    return "Welcome to blogs"


class CreateBlog(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = {}

            # Extract form data
            for key in request.form:
                data[key] = request.form[key]

            logger.info(f"Received data: {data}")

            # Check for missing required fields
            required_fields = ['title', 'description']
            missing_fields = [field for field in required_fields if field not in data]

            if missing_fields:
                return {'message': 'Missing required fields', 'fields': missing_fields}, 400

            # Generate unique ID for the blog
            blog_id = str(uuid.uuid4())

            # Create new blog entry
            new_blog = Blog(
                id=blog_id,
                blog_class=data['blog_class'],
                author=data['author'],
                title=data['title'],
                description=data['description'],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )

            session.add(new_blog)
            session.commit()

            logger.info(f"all files received{request.files}")
            # Handle file uploads
            thumbnail = request.files.get('thumbnail')
            document = request.files.get('document')
            assets = request.files.getlist('assets[]') 

            logger.info(f"checking for files: {thumbnail}, {document},Assets: {assets}")

            # Process the thumbnail (No format validation)
            if thumbnail:
                thumbnail_content = thumbnail.read()
                upload_blog_thumbnail_to_r2.delay(blog_id, {
                    "filename": thumbnail.filename,
                    "content": thumbnail_content,
                    "content_type": thumbnail.content_type
                })

            # Process the document (No format validation)
            if document:
                document_content = document.read()
                upload_blog_document_to_r2.delay(blog_id, {
                    "filename": document.filename,
                    "content": document_content,
                    "content_type": document.content_type
                })

            asset_data = []
            for file in assets:
                file_content = file.read()
                asset_data.append({
                    "filename": file.filename,
                    "content": file_content,
                    "content_type": file.content_type
                })

            if asset_data:
                logger.info(f"Uploading {len(asset_data)} assets to R2")
                upload_blog_assets_to_r2.delay(blog_id, asset_data)

            return {'message': 'Blog created successfully. Media is being uploaded.'}, 201

        except KeyError as ke:
            logging.error(f"Missing key in request data: {str(ke)}")
            return {'message': f'Missing key in request: {str(ke)}'}, 400

        except IOError as ioe:
            logging.error(f"File processing error: {str(ioe)}")
            return {'message': 'File processing error. Please try again.'}, 500

        except SQLAlchemyError as db_err:
            session.rollback()
            logging.error(f"Database error: {str(db_err)}")
            return {'message': 'Database error. Please try again later.'}, 500

        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            return {'message': 'Server Error. Please try again later.'}, 500

        finally:
            if session:
                session.close()



class GetAllBlogs(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            blogs = session.query(Blog).all()  # No filters applied

            blogs_list = [blog.as_dict() for blog in blogs]

            if not blogs_list:
                return {"message": "No blogs found.", "data": []}, 404

            return {"message": "Blogs fetched successfully.", "data": blogs_list}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()

class GetBlogsById(Resource):
    def get(self, blog_id):
        """Fetch a blog by its ID."""
        session = None
        try:
            session = SessionLocal()
            blog = session.query(Blog).filter(Blog.id == blog_id).first()

            if not blog:
                return {"message": "Blog not found."}, 404

            return {"message": "Blog fetched successfully.", "data": blog.as_dict()}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()

class PublishBlog(Resource):
    def post(self, blog_id):
        """Set is_public to True for a given blog."""
        session = None
        try:
            session = SessionLocal()
            blog = session.query(Blog).filter(Blog.id == blog_id).first()

            if not blog:
                return {"message": "Blog not found."}, 404

            blog.is_public = True
            session.commit()

            return {"message": "Blog published successfully."}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()


class UnpublishBlog(Resource):
    def post(self, blog_id):
        """Set is_public to False only if the blog is currently public."""
        session = None
        try:
            session = SessionLocal()
            blog = session.query(Blog).filter(Blog.id == blog_id).first()

            if not blog:
                return {"message": "Blog not found."}, 404

            if not blog.is_public:
                return {"message": "This blog is already unpublished or inactive."}, 400  # Bad request

            blog.is_public = False
            session.commit()

            return {"message": "Blog unpublished successfully."}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()
                
class GetBlogClass0(Resource):
    def get(self):
        """Fetch all public blogs with blog_class = 0."""
        session = None
        try:
            session = SessionLocal()
            blogs = Blog.get_active(session)
            filtered_blogs = [blog.as_dict() for blog in blogs if blog.blog_class == 0]

            if not filtered_blogs:
                return {"message": "No blogs found for class 0.", "data": []}, 404

            return {"message": "Blogs for class 0 fetched successfully.", "data": filtered_blogs}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()


class GetBlogClass1(Resource):
    def get(self):
        """Fetch all public blogs with blog_class = 1."""
        session = None
        try:
            session = SessionLocal()
            blogs = Blog.get_active(session)
            filtered_blogs = [blog.as_dict() for blog in blogs if blog.blog_class == 1]

            if not filtered_blogs:
                return {"message": "No blogs found for class 1.", "data": []}, 404

            return {"message": "Blogs for class 1 fetched successfully.", "data": filtered_blogs}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()


class DeleteBlog(Resource):
    def delete(self, blog_id):
        """Deletes a blog from Cloudflare R2 first, then removes it from the database."""
        session = None
        try:
            session = SessionLocal()
            blog = session.query(Blog).filter(Blog.id == blog_id).first()

            if not blog:
                return {"message": "Blog not found."}, 404

            folder_prefix = f"blogs/{blog_id}/"
            delete_from_r2.delay(folder_prefix)

            # Delete blog from the database
            session.delete(blog)
            session.commit()

            return {"message": "Blog deleted successfully."}, 200

        except Exception as e:
            return {"message": "An error occurred", "error": str(e)}, 500

        finally:
            if session:
                session.close()


api.add_resource(CreateBlog, "/createblog")
api.add_resource(GetAllBlogs, "/get-all-blogs")
api.add_resource(GetBlogsById, "/get-blog/<string:blog_id>")
api.add_resource(GetBlogClass0, "/get-all/class-0")
api.add_resource(GetBlogClass1, "/get-all/class-1")
api.add_resource(PublishBlog, '/publish/<string:blog_id>')
api.add_resource(UnpublishBlog, '/unpublish/<string:blog_id>')
api.add_resource(DeleteBlog, "/delete/<string:blog_id>")
