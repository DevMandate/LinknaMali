from flask import Blueprint, request, jsonify
from flask_cors import CORS
from flask_restful import Api, Resource
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from models.reviews import Review
from models.user import User
from models.engine.db_engine import SessionLocal
from models import Apartment, House, Land, Commercial
from sqlalchemy.orm import joinedload
from datetime import datetime
from celery_server import send_email_task
import uuid
import logging

# Blueprint & API setup
reviews = Blueprint('reviews', __name__)
api = Api(reviews)

CORS(reviews, resources={
    r"/reviews/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://linknamali.ke",
            "https://portal.linknamali.ke"
        ],
        "supports_credentials": True
    },
})

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Welcome route 
@reviews.route('/', methods=['GET'])
def welcome():
    return "Welcome to reviews API!"


PROPERTY_MODEL_MAP = {
            'apartments': Apartment,
            'houses': House,
            'land': Land,
            'commercial': Commercial
            }


# Review Creation Resource 
class ReviewCreateResource(Resource):
    def post(self):
        session = SessionLocal()
        data = request.get_json()

        # Validate required fields
        required_fields = ['user_id', 'property_id', 'property_type', 'rating']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]

        if missing_fields:
            return {
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }, 400

        # Check if user exists
        user = session.query(User).filter_by(user_id=data['user_id']).first()
        if not user:
            return {"error": "User does not exist."}, 404

        # Debug log
        logger.info(f"Creating review: user={data['user_id']}, property={data['property_id']} ({data['property_type']}), rating={data['rating']}")

        try:
            # Create review
            review = Review(
                id=str(uuid.uuid4()),
                user_id=data['user_id'],
                property_id=data['property_id'],
                property_type=data['property_type'],
                rating=int(data['rating']),
                comment=data.get('comment', ''),
                created_at=datetime.utcnow()
            )

            session.add(review)
            session.commit()

            # 📨 Send notification email to property owner
            property_obj, owner = self.get_property_and_owner(session, data['property_id'], data['property_type'])
            if owner and owner.email:
                context = {
                    'property_type': data['property_type'],
                    'property_title': property_obj.title if hasattr(property_obj, 'title') else 'Your property',
                    'rating': data['rating'],
                    'comment': data.get('comment', ''),
                    'reviewer_name': f"{user.first_name} {user.last_name}",
                    'owner_name': f"{owner.first_name}"
                }

                send_email_task.delay(
                    sender_email='support@merimedevelopment.co.ke',
                    recipient_email=owner.email,
                    subject='Linknamali - New Review on Your Property',
                    template_name='new_review_notification.html',
                    context=context
                )


            return {"message": "Review created and email notification sent."}, 201

        except IntegrityError as e:
            session.rollback()
            logger.error(f"IntegrityError: {e}")
            return {"error": "You have already submitted a review for this property."}, 409

        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"SQLAlchemy Error: {e}")
            return {"error": "Failed to create review."}, 500

        finally:
            session.close()

    def get_property_and_owner(self, session, property_id, property_type):
        """Returns property object and its owner User instance."""
        model_mapping = {
            'apartments': Apartment,
            'houses': House,
            'land': Land,
            'commercial': Commercial
        }

        model = model_mapping.get(property_type.lower())
        if not model:
            return None, None

        property_obj = session.query(model).filter_by(id=property_id).first()
        if property_obj and property_obj.user_id:
            owner = session.query(User).filter_by(user_id=property_obj.user_id).first()
            return property_obj, owner

        return None, None


# Review Listing Resource 
class ReviewListResource(Resource):
    def get(self):
        session = SessionLocal()
        property_id = request.args.get('property_id')
        property_type = request.args.get('property_type')

        if not property_id or not property_type:
            return {"error": "property_id and property_type are required."}, 400

        if property_type not in PROPERTY_MODEL_MAP:
            return {"error": f"Unsupported property_type: {property_type}"}, 400

        try:
            # Get the target property model
            property_model = PROPERTY_MODEL_MAP[property_type]
            property_obj = session.query(property_model).filter_by(id=property_id).first()

            if not property_obj:
                return {"error": "Property not found."}, 404

            # Fetch reviews and preload associated user
            reviews = session.query(Review)\
                .options(joinedload(Review.user))\
                .filter_by(property_id=property_id, property_type=property_type)\
                .all()

            result = {
                "property": property_obj.as_dict(session=session) if hasattr(property_obj, 'as_dict') else self.serialize_model(property_obj),
                "reviews": []
            }


            for review in reviews:
                user = review.user
                result["reviews"].append({
                    "review": review.as_dict(),
                    "reviewer": {
                        "user_id": user.user_id,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "email": user.email,
                        "profile_pic_url": user.profile_pic_url
                    }
                })

            return result, 200

        except SQLAlchemyError as e:
            logger.error(f"Error fetching reviews: {e}")
            return {"error": "Failed to fetch reviews"}, 500

        finally:
            session.close()

    def serialize_model(self, model_instance):
        return {col.name: getattr(model_instance, col.name) for col in model_instance.__table__.columns}


# Toggle Review Visibility Resource
class AdminToggleReviewVisibilityResource(Resource):
    def put(self, review_id):
        session = SessionLocal()
        try:
            data = request.get_json()
            is_visible = data.get("is_visible")

            if is_visible not in [0, 1]:
                return {"error": "is_visible must be 0 (hide) or 1 (show)."}, 400

            review = session.query(Review).filter_by(id=review_id).first()
            if not review:
                return {"error": "Review not found."}, 404

            review.is_visible = is_visible
            session.commit()
            state = "visible" if is_visible else "hidden"
            return {"message": f"Review is now {state}."}, 200
        except SQLAlchemyError as e:
            logger.error(f"Error updating review visibility: {e}")
            session.rollback()
            return {"error": "Failed to update review visibility."}, 500
        finally:
            session.close()


# Delete Review Resource
class AdminDeleteReviewResource(Resource):
    def delete(self, review_id):
        session = SessionLocal()
        try:
            review = session.query(Review).filter_by(id=review_id).first()
            if not review:
                return {"error": "Review not found."}, 404

            session.delete(review)
            session.commit()
            return {"message": "Review permanently deleted."}, 200
        except SQLAlchemyError as e:
            logger.error(f"Error deleting review: {e}")
            session.rollback()
            return {"error": "Failed to delete review."}, 500
        finally:
            session.close()


# List Reviews by Property Resource
class ReviewListByPropertyResource(Resource):
    def get(self):
        session = SessionLocal()
        property_id = request.args.get('property_id')
        property_type = request.args.get('property_type')

        if not property_id or not property_type:
            return {"error": "Both 'property_id' and 'property_type' are required."}, 400

        try:
            # Fetch all visible reviews for the given property
            reviews = session.query(Review)\
                .options(joinedload(Review.user))\
                .filter_by(property_id=property_id, property_type=property_type)\
                .order_by(Review.created_at.desc())\
                .all()

            if not reviews:
                return {"message": "No reviews found for this property."}, 200

            response = []
            for review in reviews:
                reviewer = review.user
                response.append({
                    "review": review.as_dict(),
                    "reviewer": {
                        "user_id": reviewer.user_id,
                        "first_name": reviewer.first_name,
                        "last_name": reviewer.last_name,
                        "email": reviewer.email,
                        "profile_pic_url": reviewer.profile_pic_url
                    }
                })

            return {"reviews": response}, 200

        except SQLAlchemyError as e:
            logger.error(f"Error retrieving reviews: {e}")
            return {"error": "Failed to fetch reviews"}, 500

        finally:
            session.close()


# Register resources with Blueprint API 
api.add_resource(ReviewCreateResource, '/reviews/create')
api.add_resource(ReviewListResource, '/reviews/list')
api.add_resource(AdminToggleReviewVisibilityResource, '/displayreview/<string:review_id>')
api.add_resource(AdminDeleteReviewResource, '/deletereview/<string:review_id>')
api.add_resource(ReviewListByPropertyResource, '/getpropertyreviews')