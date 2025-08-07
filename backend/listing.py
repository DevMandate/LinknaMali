from flask import Blueprint, request, jsonify, make_response
from flask_cors import CORS
from flask_restful import Api, Resource, reqparse
from celery_server import upload_property_images_to_r2, upload_property_documents_to_r2, delete_from_r2, upload_property_videos_to_r2
from models import Apartment, House, Land, Commercial, Image, Document, Amenities, Video, User, UserSubscription, PremiumTier
from models.engine.db_engine import SessionLocal
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from celery_server import send_email_task
import logging
import uuid
import os

listings = Blueprint('listings', __name__, url_prefix='/listings')
CORS(listings, resources={
    r"/listings/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174", 
            "https://linknamali.ke",
            "https://portal.linknamali.ke"
        ],
        "supports_credentials": True
    },
})


api = Api(listings)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@listings.route('/', methods=['GET'])
def welcome():
    return "Welcome to listings"


class CreateListing(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = {}
            files = []
            for key in request.form:
                data[key] = request.form[key]  # Store all form fields

            print(f"Received file keys: {list(request.files.keys())}")

            for key in request.files:
                if key == "images[]":
                    files = request.files.getlist("images[]") # Store all image files
                    
            # Check subscription limits before creating listing
            user_id = data.get('user_id')
            if not user_id:
                return {'message': 'User ID is required'}, 400
                
            subscription_check = self.check_subscription_limits(session, user_id)
            if not subscription_check['can_create']:
                return {
                    'response': self.get_subscription_error_message(
                        subscription_check.get('subscription'),
                        subscription_check.get('current_usage'),
                        subscription_check.get('max_listings')
                    ),
                    'subscription_info': subscription_check.get('subscription_info')
                }, 403

            # Validate number and size of images
            MIN_IMAGES = 4
            MIN_IMAGE_SIZE_MB = 0.01
            MAX_IMAGE_SIZE_MB = 2
            MIN_IMAGE_SIZE_BYTES = MIN_IMAGE_SIZE_MB * 1024 * 1024
            MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

            if len(files) < MIN_IMAGES:
                return {
                    "message": f"At least {MIN_IMAGES} images are required. You provided {len(files)}."
                }, 400

            # Check each image's size
            for file in files:
                file.seek(0, os.SEEK_END)  # Go to end of file to get size
                file_size = file.tell()
                file.seek(0)  # Reset file pointer to beginning

                if file_size < MIN_IMAGE_SIZE_BYTES:
                    return {
                        "message": "Each image must be at least 0.05MB in size.",
                        "invalid_image": file.filename,
                        "size_in_mb": round(file_size / (1024 * 1024), 2)
                    }, 400
                if file_size > MAX_IMAGE_SIZE_BYTES:
                    return {
                        "message": f"Each image must not exceed {MAX_IMAGE_SIZE_MB}MB in size.",
                        "invalid_image": file.filename,
                        "size_in_mb": round(file_size / (1024 * 1024), 2)
                    }, 400


            logging.debug(f"Received data: {data}")

            # Validate required fields
            required_fields = ['user_id','property_type','price', 'location', 'purpose']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'message': 'Missing required fields', 'fields': missing_fields}, 400

            property_id = str(uuid.uuid4())
            property_type = data['property_type']
            purpose = data['purpose'].lower()
            model_map = {
                'apartments': Apartment,
                'houses': House,
                'land': Land,
                'commercial': Commercial
            }

            Model = model_map.get(property_type)
            if not Model:
                return {'message': 'Invalid property type'}, 400
            
             # Ensure land has a size
            if property_type == "land":
                size = data.get('size', '').strip()
                if not size:
                    return {"error": "Size is required for land listings."}, 400
                
            # Ensure documents are uploaded if purpose is 'sale'
            uploaded_documents = request.files.getlist("document")
            if purpose == "sale" and not uploaded_documents:
                return {"error": "At least one document must be uploaded for properties on sale."}, 400

            # Land + Sale must include both size and documents**
            if property_type == "land" and purpose == "sale" and not uploaded_documents:
                return {"error": "Land for sale must include both size and at least one document."}, 400
                


            # Create listing
            valid_fields = Model.__table__.columns.keys()
            filtered_data = {key: value for key, value in data.items() if key in valid_fields}
            filtered_data['id'] = property_id  # Always set the ID
            filtered_data['user_id'] = data['user_id']  # Ensure user_id is always included


            # Handle unit tracking
            try:
                num_units = int(data.get("number_of_units", 1))
                if num_units < 1:
                    num_units = 1
            except (ValueError, TypeError):
                num_units = 1

            filtered_data["number_of_units"] = num_units

            # Only set units_remaining if not explicitly passed (for safety)
            units_remaining = data.get("units_remaining")
            try:
                units_remaining = int(units_remaining) if units_remaining is not None else num_units
            except (ValueError, TypeError):
                units_remaining = num_units

            filtered_data["units_remaining"] = units_remaining


            # Create listing dynamically
            new_listing = Model(**filtered_data)

            session.add(new_listing)
            
            session.commit()

            # Handle amenities 
            amenities_str = data.get("amenities", "")
            if amenities_str:
                amenity_list = [amenity.strip() for amenity in amenities_str.split(",") if amenity.strip()]
                for amenity in amenity_list:
                    amenity_entry = Amenities(
                        property_id=property_id,
                        property_type=property_type,
                        amenity=amenity,
                        created_at=datetime.now(timezone.utc)
                    )
                    session.add(amenity_entry)

                session.commit()

            cover_image_index = data.get("cover_image_index")
            print(f"Cover image index received from frontend: {cover_image_index}")
            image_data = []

            for idx, file in enumerate(files):
                file_content = file.read()
                is_cover = int(cover_image_index) == idx if cover_image_index is not None else 0
                print(f"Image {file.filename} | index {idx} | is_cover: {is_cover}")
                image_data.append({
                    "filename": file.filename,
                    "content": file_content,
                    "content_type": file.content_type,
                    "is_cover": is_cover
                })


            # Send images to Celery for async upload
            upload_property_images_to_r2.delay(property_type, data['user_id'], property_id, image_data)
            
            ALLOWED_DOC_FORMATS = {"pdf", "docx", "txt", "webp"}
            document_data = []
            for doc in request.files.getlist("document"):
                filename = doc.filename.lower()
                file_extension = filename.split(".")[-1] if "." in filename else None

                if file_extension not in ALLOWED_DOC_FORMATS:
                    return {
                        "message": "Invalid document format.",
                        "allowed_formats": list(ALLOWED_DOC_FORMATS)
                    }, 400

                logging.info(f"Received valid document: {doc.filename}")

                document_data.append({
                    "filename": doc.filename,
                    "content": doc.read(),
                    "content_type": doc.content_type
                })

            if document_data:
                upload_property_documents_to_r2.delay(property_type, data['user_id'], property_id, document_data)

            # Handle videos
            ALLOWED_VIDEO_FORMATS = {"mp4", "mov", "avi", "mkv"}
            video_data = []
            for video in request.files.getlist("videos"):
                filename = video.filename.lower()
                file_extension = filename.split(".")[-1] if "." in filename else None

                if file_extension not in ALLOWED_VIDEO_FORMATS:
                    return {
                        "message": "Invalid video format.",
                        "allowed_formats": list(ALLOWED_VIDEO_FORMATS)
                    }, 400

                logging.info(f"Received valid video: {video.filename}")

                video_data.append({
                    "filename": video.filename,
                    "content": video.read(),
                    "content_type": video.content_type
                })

            if video_data:
                logging.info(f"Uploading {len(video_data)} video(s) for property_id: {property_id}")
                upload_property_videos_to_r2.delay(property_type, data['user_id'], property_id, video_data)
                
            # Update subscription listing usage after successful listing creation
            subscription = subscription_check['subscription']
            subscription.increment_listing_usage()
            session.commit()


            # Include remaining listings count in success response
            remaining_listings = (subscription.tier.max_listings - subscription.listings_used 
                                if subscription.tier.max_listings else 'unlimited')

            return {
                'message': 'Listing created successfully. Media is being uploaded.',
                'listings_remaining': remaining_listings
            }, 201

        except Exception as e:
            logging.error(f"Error creating listing: {str(e)}")
            return {'message': 'Server Error. Please try again later.'}, 500
            #return {'message': 'Server Error. Please try again later.', 'error': str(e)}, 500
        finally:
            if session:
                session.close()
                
    def check_subscription_limits(self, session, user_id):
        """Check if user can create more listings based on their subscription."""
        try:
            # Get user's active subscription with tier details
            subscription = session.query(UserSubscription).join(PremiumTier).filter(
                UserSubscription.user_id == user_id,
                UserSubscription.status == 'active',
                UserSubscription.start_date <= datetime.now(),
                UserSubscription.end_date >= datetime.now()
            ).first()
            
            if not subscription:
                return {
                    'can_create': False,
                    'message': 'No active subscription found. Please select a plan to create listings.',
                    'subscription_info': None
                }
            
            # Check if subscription is expired
            if subscription.is_expired():
                return {
                    'can_create': False,
                    'message': 'Your subscription has expired. Please renew or upgrade your plan to continue creating listings.',
                    'subscription_info': {
                        'tier_name': subscription.tier.name,
                        'end_date': subscription.end_date.strftime('%Y-%m-%d'),
                        'status': 'expired'
                    }
                }
            
            # Check listing limits
            max_listings = subscription.tier.max_listings
            current_usage = subscription.listings_used
            
            if max_listings is None:  # Unlimited plan
                return {
                    'can_create': True,
                    'message': 'Listing creation allowed - unlimited plan',
                    'subscription': subscription
                }
            
            if current_usage >= max_listings:
                return {
                    'can_create': False,
                    'message': f'Listing limit reached ({current_usage}/{max_listings}). Please upgrade your plan to create more listings.',
                    'subscription_info': {
                        'tier_name': subscription.tier.name,
                        'current_usage': current_usage,
                        'max_listings': max_listings,
                        'days_remaining': subscription.days_remaining()
                    }
                }
            
            return {
                'can_create': True,
                'message': f'Listing creation allowed ({current_usage}/{max_listings} used)',
                'subscription': subscription
            }
            
        except Exception as e:
            logging.error(f"Error checking subscription limits: {str(e)}")
            return {
                'can_create': False,
                'message': 'Unable to verify subscription status. Please try again.',
                'subscription_info': None
            }

    def get_subscription_error_message(self, subscription, current_usage=None, max_listings=None):
        """Generate appropriate error message based on subscription status."""
        if not subscription:
            return "No active subscription found. Please select a plan to create listings."
        
        if subscription.is_expired():
            return "Your subscription has expired. Please renew or upgrade your plan to continue creating listings."
        
        if current_usage >= max_listings:
            return f"Listing limit reached ({current_usage}/{max_listings}). Please upgrade your plan to create more listings."
        
        return "Unable to create listing. Please check your subscription status."


class CreateHouses(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = {}
            files = []
            
            for key in request.form:
                data[key] = request.form[key]
            
            for key in request.files:
                if key == "images[]":
                    files = request.files.getlist("images[]")

            # Validate image count and size
            MIN_IMAGES = 4
            MIN_IMAGE_SIZE_MB = 0.01
            MAX_IMAGE_SIZE_MB = 2
            MIN_IMAGE_SIZE_BYTES = MIN_IMAGE_SIZE_MB * 1024 * 1024
            MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

            if len(files) < MIN_IMAGES:
                return {
                    "message": f"At least {MIN_IMAGES} images are required. You provided {len(files)}."
                }, 400

            for file in files:
                file.seek(0, os.SEEK_END)  # Move to end to get size
                file_size = file.tell()
                file.seek(0)  # Reset pointer

                if file_size < MIN_IMAGE_SIZE_BYTES:
                    return {
                        "message": f"Each image must be at least {MIN_IMAGE_SIZE_MB}MB in size.",
                        "invalid_image": file.filename,
                        "size_in_mb": round(file_size / (1024 * 1024), 2)
                    }, 400
                if file_size > MAX_IMAGE_SIZE_BYTES:
                    return {
                        "message": f"Each image must not exceed {MAX_IMAGE_SIZE_MB}MB in size.",
                        "invalid_image": file.filename,
                        "size_in_mb": round(file_size / (1024 * 1024), 2)
                    }, 400

            
            logging.debug(f"Received data: {data}")

            # Validate required fields
            required_fields = ['user_id', 'house_type', 'number_of_bedrooms', 'number_of_bathrooms', 'location', 'price', 'availability_status', 'purpose', 'amenities']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'message': 'Missing required fields', 'fields': missing_fields}, 400
            
            # Extract "size" as an optional field
            size = data.get('size')
            map_location = data.get('map_location')
            location_text = data.get('location_text')  
            if size == "":  # Convert empty string to None
                size = None
            if map_location == "":
                map_location = None
            if location_text == "":
                location_text = None

            # Handle unit tracking
            try:
                num_units = int(data.get("number_of_units", 1))
                if num_units < 1:
                    num_units = 1
            except (ValueError, TypeError):
                num_units = 1

            # Only override units_remaining if passed, otherwise default to num_units
            units_remaining = data.get("units_remaining")
            try:
                units_remaining = int(units_remaining) if units_remaining is not None else num_units
            except (ValueError, TypeError):
                units_remaining = num_units

                                    
            property_id = str(uuid.uuid4())
            
            # Explicitly setting fields
            new_house = House(
                id=property_id,
                user_id=data['user_id'],
                house_type=data['house_type'],
                title=data['title'],
                number_of_bedrooms=data['number_of_bedrooms'],
                number_of_bathrooms=data['number_of_bathrooms'],
                location=data['location'],
                town=data.get('town'),
                locality=data.get('locality'),
                price=data['price'],
                availability_status=data['availability_status'],
                size=size,
                purpose=data['purpose'],
                map_location=map_location,
                location_text=location_text,
                description=data.get('description'),
                amenities=data['amenities'],
                number_of_units=num_units,
                units_remaining=units_remaining,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )

            
            session.add(new_house)
            session.commit()
            logging.info(f"House listing created successfully: {property_id}")
            
            property_type = 'houses'
            # Handle amenities 
            amenities_str = data.get("amenities", "")
            if amenities_str:
                amenity_list = [amenity.strip() for amenity in amenities_str.split(",") if amenity.strip()]
                for amenity in amenity_list:
                    amenity_entry = Amenities(
                        property_id=property_id,
                        property_type=property_type,
                        amenity=amenity,
                        created_at=datetime.now(timezone.utc)
                    )
                    session.add(amenity_entry)

                session.commit()
            # Handle images
            cover_image_index = data.get("cover_image_index")
            print(f"Cover image index received from frontend: {cover_image_index}")
            image_data = []
            for idx, file in enumerate(files):
                file_content = file.read()
                is_cover = int(cover_image_index) == idx if cover_image_index is not None else 0
                print(f"Image {file.filename} | index {idx} | is_cover: {is_cover}")
                image_data.append({
                    "filename": file.filename,
                    "content": file_content,
                    "content_type": file.content_type,
                    "is_cover": is_cover
                })
            
            if image_data:
                upload_property_images_to_r2.delay(property_type, data['user_id'], property_id, image_data)
                logging.info(f"Image upload task dispatched for house: {property_id}")

            # Handle documents
            ALLOWED_DOC_FORMATS = {"pdf", "docx", "txt", "webp"}
            document_data = []
            for doc in request.files.getlist("document"):
                filename = doc.filename.lower()
                file_extension = filename.split(".")[-1] if "." in filename else None
                
                if file_extension not in ALLOWED_DOC_FORMATS:
                    return {
                        "message": "Invalid document format.",
                        "allowed_formats": list(ALLOWED_DOC_FORMATS)
                    }, 400
                
                document_data.append({
                    "filename": doc.filename,
                    "content": doc.read(),
                    "content_type": doc.content_type
                })
            
            if document_data:
                upload_property_documents_to_r2.delay(property_type, data['user_id'], property_id, document_data)
                logging.info(f"Document upload task dispatched for house: {property_id}")

            # Handle videos 
            ALLOWED_VIDEO_FORMATS = {"mp4", "mov", "avi", "mkv"}
            video_data = []
            for video in request.files.getlist("videos"):
                filename = video.filename.lower()
                file_extension = filename.split(".")[-1] if "." in filename else None

                if file_extension not in ALLOWED_VIDEO_FORMATS:
                    return {
                        "message": "Invalid video format.",
                        "allowed_formats": list(ALLOWED_VIDEO_FORMATS)
                    }, 400

                video_data.append({
                    "filename": video.filename,
                    "content": video.read(),
                    "content_type": video.content_type
                })

            if video_data:
                upload_property_videos_to_r2.delay(property_type, data['user_id'], property_id, video_data)
                logging.info(f"Video upload task dispatched for house: {property_id}")

            
            return {'message': 'House listing created successfully. Media is being uploaded.'}, 201
        
        except SQLAlchemyError as e:
            logging.error(f"Database error: {str(e)}")
            return {'message': 'Database error, please try again.'}, 500
        except Exception as e:
            logging.error(f"Server error: {str(e)}")
            return {'message': 'Server error, please try again later.'}, 500
        
        finally:
            if session:
                session.close()



class SoftDeleteListing(Resource): 

    def post(self, property_type, property_id):
        session = None
        try:
            session = SessionLocal()
            
            model_map = {
                'apartments': Apartment,
                'houses': House,
                'land': Land,
                'commercial': Commercial
            }
            
            Model = model_map.get(property_type)
            if not Model:
                return {'message': 'Invalid property type'}, 400
            
            property_record = session.query(Model).filter_by(id=property_id).first()
            if not property_record:
                return {'message': 'Property not found'}, 404
            
            property_record.deleted = 1  
            property_record.display = 0
            session.commit()
            
            return {'message': 'Property soft deleted successfully'}, 200
        
        except Exception as e:
            logging.error(f"Error in soft delete: {str(e)}")
            return {'message': 'Server Error. Please try again later.'}, 500
        
        finally:
            if session:
                session.close()          



class DeleteListing(Resource):
    def delete(self, property_type, user_id, property_id):
        session = None
        try:
            session = SessionLocal()
            
            # Validate property type
            model_map = {
                'apartments': Apartment,
                'houses': House,
                'land': Land,
                'commercial': Commercial
            }
            Model = model_map.get(property_type)
            if not Model:
                return {'message': 'Invalid property type'}, 400

            # Step 1: Delete from Cloudflare R2
            folder_prefix = f"properties/{property_type}/{user_id}/{property_id}/"
            delete_from_r2.delay(folder_prefix)
            
            # Step 2: Delete from images and documents tables
            session.query(Image).filter(Image.property_id == property_id).delete()
            session.query(Document).filter(Document.property_id == property_id).delete()
            session.query(Video).filter(Video.property_id == property_id).delete()
            
            # Step 3: Delete from the property table
            session.query(Model).filter(Model.id == property_id).delete()
            
            session.commit()
            return {'message': 'Listing deleted successfully'}, 200
        
        except Exception as e:
            logging.error(f"Error deleting listing: {str(e)}")
            session.rollback()
            return {'message': 'Server Error. Please try again later.'}, 500
        
        finally:
            if session:
                session.close()


class UnarchiveListing(Resource): 
    def post(self, property_type, property_id):
        session = None
        try:
            session = SessionLocal()
            
            model_map = {
                'apartments': Apartment,
                'houses': House,
                'land': Land,
                'commercial': Commercial
            }
            
            Model = model_map.get(property_type)
            if not Model:
                return {'message': 'Invalid property type'}, 400
            
            property_record = session.query(Model).filter_by(id=property_id).first()
            if not property_record:
                return {'message': 'Property not found'}, 404
            
            # Unarchive: Set deleted to 0, but keep display as 0
            property_record.deleted = 0
            property_record.display = 0
            
            session.commit()
            
            return {'message': 'Property unarchived successfully (still hidden from display)'}, 200
        
        except Exception as e:
            logging.error(f"Error in unarchive: {str(e)}")
            return {'message': 'Server Error. Please try again later.'}, 500
        
        finally:
            if session:
                session.close()


class GetArchivedProperties(Resource):
    def get(self, property_type, user_id):
        session = None
        try:
            session = SessionLocal()
            
            model_map = {
                'apartments': Apartment,
                'houses': House,
                'land': Land,
                'commercial': Commercial
            }

            Model = model_map.get(property_type)
            if not Model:
                return {'message': 'Invalid property type'}, 400

            archived_properties = (
                session.query(Model)
                .filter_by(user_id=user_id, deleted=1)
                .all()
            )

            if not archived_properties:
                return {'message': 'No archived properties found for this user'}, 404

            return {
                'message': 'Archived properties retrieved successfully',
                'data': [prop.as_dict(session) for prop in archived_properties]
            }, 200

        except Exception as e:
            logging.error(f"Error fetching archived properties: {str(e)}")
            return {'message': 'Server Error. Please try again later.'}, 500

        finally:
            if session:
                session.close()


class DecrementUnit(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.get_json()

            # Required fields
            required_fields = ['property_type', 'property_id']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'message': 'Missing required fields', 'fields': missing_fields}, 400

            property_type = data['property_type']
            property_id = data['property_id']

            # Supported models
            model_map = {
                'apartments': Apartment,
                'houses': House,
                'land': Land,
                'commercial': Commercial
            }

            Model = model_map.get(property_type)
            if not Model:
                return {'message': 'Invalid property type'}, 400

            # Query listing
            listing = session.query(Model).filter_by(id=property_id).first()
            if not listing:
                return {'message': 'Listing not found'}, 404

            # Check current units
            if listing.units_remaining is None:
                return {'message': 'This listing does not support unit tracking.'}, 400

            if listing.units_remaining <= 0:
                return {'message': 'No units remaining to decrement.'}, 400

            # Decrement and update
            listing.units_remaining -= 1
            listing.updated_at = datetime.now(timezone.utc)
            session.commit()

            return {
                'message': 'Unit decremented successfully.',
                'property_id': property_id,
                'units_remaining': listing.units_remaining
            }, 200

        except Exception as e:
            logging.error(f"Error decrementing unit: {str(e)}")
            return {'message': 'Server error. Please try again later.'}, 500
        finally:
            if session:
                session.close()


class AdminEditUser(Resource):
    def put(self, user_id):
        session = SessionLocal()

        parser = reqparse.RequestParser()
        parser.add_argument('first_name', type=str)
        parser.add_argument('last_name', type=str)
        parser.add_argument('email', type=str)
        parser.add_argument('phone_number', type=str)
        parser.add_argument('id_number', type=str)
        parser.add_argument('role', type=str)
        parser.add_argument('is_verified', type=bool)
        parser.add_argument('is_locked', type=bool)
        parser.add_argument('signup_method', type=str)
        parser.add_argument('profile_pic_url', type=str)
        args = parser.parse_args()

        try:
            user = session.query(User).filter_by(user_id=user_id, is_deleted=False).first()

            if not user:
                return {"message": "User not found or deleted"}, 404

            for key, value in args.items():
                if value is not None:
                    setattr(user, key, value)

            session.commit()
            return {"message": "User updated successfully"}, 200

        except SQLAlchemyError as e:
            session.rollback()
            return {"message": "Database error", "error": str(e)}, 500
        finally:
            session.close()


class ToggleManualVerification(Resource):
    def put(self, property_type, property_id):
        parser = reqparse.RequestParser()
        parser.add_argument('manually_verified', type=int, choices=(0, 1), required=True, help='Verification toggle must be 0 or 1')
        args = parser.parse_args()

        model_map = {
            'apartments': Apartment,
            'houses': House,
            'land': Land,
            'commercial': Commercial
        }

        if property_type not in model_map:
            return {'message': 'Invalid property type'}, 400

        session = SessionLocal()
        try:
            model = model_map[property_type]

            # Get the listing
            listing = session.query(model).filter_by(id=property_id, deleted=0).first()
            if not listing:
                return {'message': f'{property_type.capitalize()} listing not found'}, 404

            # Update manual verification
            listing.manually_verified = args['manually_verified']
            session.commit()

            status = "enabled" if args['manually_verified'] else "disabled"

            # 📨 Send email only if manually verified is enabled
            if args['manually_verified'] == 1:
                owner = session.query(User).filter_by(user_id=listing.user_id).first()
                if owner and owner.email:
                    context = {
                        'property_type': property_type,
                        'property_title': getattr(listing, 'title', 'Your property'),
                        'owner_name': owner.first_name,
                        'verification_date': datetime.utcnow().strftime('%B %d, %Y'),
                    }

                    send_email_task.delay(
                        sender_email='support@merimedevelopment.co.ke',
                        recipient_email=owner.email,
                        subject='Linknamali - Your Property Has Been Verified',
                        template_name='manual_verification_notification.html',
                        context=context
                    )

            return {'message': f'Manual verification {status} for {property_type} listing'}, 200

        except Exception as e:
            session.rollback()
            return {'message': f'Error: {str(e)}'}, 500

        finally:
            session.close()



class EditListing(Resource):
    def put(self, listing_id):
        session = None
        try:
            session = SessionLocal()
            data = request.form.to_dict()
            files = request.files

            property_type = data.get('property_type')
            if not property_type:
                return {'message': 'Property type is required.'}, 400

            model_map = {
                'apartments': Apartment,
                'houses': House,
                'land': Land,
                'commercial': Commercial
            }

            Model = model_map.get(property_type)
            if not Model:
                return {'message': 'Invalid property type.'}, 400

            listing = session.query(Model).filter_by(id=listing_id).first()
            if not listing:
                return {'message': 'Listing not found.'}, 404

            user_id = listing.user_id

            # ✅ Update editable fields
            editable_fields = Model.__table__.columns.keys()
            for key, value in data.items():
                if key in editable_fields and key not in ['id', 'user_id', 'created_at']:
                    setattr(listing, key, value)

            # ✅ Update amenities
            amenities_str = data.get("amenities", "")
            if amenities_str:
                session.query(Amenities).filter_by(property_id=listing_id, property_type=property_type).delete()
                amenity_list = [a.strip() for a in amenities_str.split(",") if a.strip()]
                for amenity in amenity_list:
                    session.add(Amenities(
                        property_id=listing_id,
                        property_type=property_type,
                        amenity=amenity,
                        created_at=datetime.now(timezone.utc)
                    ))

            # ✅ Images: Delete and re-upload only if new images provided
            image_files = files.getlist("images[]")
            if image_files:
                delete_from_r2.delay(f"properties/{property_type}/{user_id}/{listing_id}/")
                session.query(Image).filter_by(property_type=property_type, property_id=listing_id).delete()
                session.commit()
                image_data = [{
                    "filename": f.filename,
                    "content": f.read(),
                    "content_type": f.content_type
                } for f in image_files]
                upload_property_images_to_r2.delay(property_type, user_id, listing_id, image_data)

            # ✅ Documents: Delete and re-upload only if new documents provided
            document_files = files.getlist("document")
            if document_files:
                delete_from_r2.delay(f"properties/{property_type}/{user_id}/{listing_id}/")
                session.query(Document).filter_by(property_type=property_type, property_id=listing_id).delete()
                session.commit()
                document_data = [{
                    "filename": doc.filename,
                    "content": doc.read(),
                    "content_type": doc.content_type
                } for doc in document_files]
                upload_property_documents_to_r2.delay(property_type, user_id, listing_id, document_data)

            # ✅ Videos: Delete and re-upload only if new videos provided
            video_files = files.getlist("videos")
            if video_files:
                delete_from_r2.delay(f"properties/{property_type}/{user_id}/{listing_id}/videos/")
                session.query(Video).filter_by(property_type=property_type, property_id=listing_id).delete()
                session.commit()
                video_data = [{
                    "filename": vid.filename,
                    "content": vid.read(),
                    "content_type": vid.content_type
                } for vid in video_files]
                upload_property_videos_to_r2.delay(property_type, user_id, listing_id, video_data)

            session.commit()
            return {'message': 'Listing updated successfully. Media replaced if new files were provided.'}, 200

        except Exception as e:
            logging.error(f"Error editing listing: {str(e)}")
            return {'message': 'Server Error. Please try again later.'}, 500
        finally:
            if session:
                session.close()




api.add_resource(CreateListing, "/createlisting")
api.add_resource(CreateHouses, "/createhouses")
api.add_resource(SoftDeleteListing, "/softdeletelisting/<string:property_type>/<string:property_id>")
api.add_resource(DeleteListing, "/deletelisting/<string:property_type>/<string:user_id>/<string:property_id>")
api.add_resource(UnarchiveListing, '/unarchive/<string:property_type>/<string:property_id>')
api.add_resource(GetArchivedProperties, '/archived/<string:property_type>/<string:user_id>')
api.add_resource(DecrementUnit, '/decrement_unit')
api.add_resource(AdminEditUser, '/adminedituser/<string:user_id>')
api.add_resource(ToggleManualVerification, '/manual-verify/<string:property_type>/<string:property_id>')
api.add_resource(EditListing, '/editlisting/<string:listing_id>')
