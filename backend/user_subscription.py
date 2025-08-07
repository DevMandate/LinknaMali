from flask import request
from flask import Blueprint
from flask_cors import CORS
from flask_argon2 import Argon2
from datetime import datetime, timezone, timedelta
from flask_restful import Api, Resource
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, func
from models import User, UserSubscription, PremiumTier
from models.engine.db_engine import SessionLocal, get_user_name
from celery_server import send_email_task

import logging
import uuid

user_subscriptions = Blueprint('user_subscriptions', __name__, url_prefix='/subscriptions')
api = Api(user_subscriptions)
CORS(user_subscriptions, resources={
    r"/subscriptions/*": {
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

@user_subscriptions.route('/', methods=['GET'])
def welcome():
    return "Welcome to User Subscriptions"

class CreateSubscription(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json

            required_fields = [
                'user_id', 'tier_id', 'start_date', 'end_date'
            ]
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'response': 'Missing required fields', 'fields': missing_fields}, 400
            
            # Validate user exists
            user = session.query(User).filter_by(user_id=data['user_id']).first()
            if not user:
                return {'response': 'User not found'}, 404
            
            # Validate tier exists
            tier = session.query(PremiumTier).filter_by(id=data['tier_id']).first()
            if not tier:
                return {'response': 'Tier not found'}, 404
            
            # Check for overlapping active subscriptions
            existing_subscription = session.query(UserSubscription).filter(
                UserSubscription.user_id == data['user_id'],
                UserSubscription.status == 'active',
                UserSubscription.start_date <= data['end_date'],
                UserSubscription.end_date >= data['start_date']
            ).first()
            
            if existing_subscription:
                return {'response': 'User already has an active subscription for this period'}, 400
            
            # Handle date parsing
            start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            
            if start_date >= end_date:
                return {'response': 'Start date must be before end date'}, 400
                    
            subscription_id = str(uuid.uuid4())
            # Create new subscription entry
            new_subscription = UserSubscription(
                id=subscription_id,
                user_id=data.get('user_id'),
                tier_id=data.get('tier_id'),
                status=data.get('status', 'pending'),
                start_date=start_date,
                end_date=end_date,
                payment_method=data.get('payment_method'),
                payment_reference=data.get('payment_reference'),
                amount_paid=data.get('amount_paid'),
                listings_used=data.get('listings_used', 0),
                auto_renew=data.get('auto_renew', False),
                promo_code_used=data.get('promo_code_used'),
                discount_applied=data.get('discount_applied'),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(new_subscription)
            session.commit()

            # Prepare email context
            user_first_name, user_last_name, user_email = get_user_name(session, data['user_id'])
            user_name = f"{user_first_name} {user_last_name}"
            
            context = {
                "user_name": user_name,
                "tier_name": tier.name,
                "start_date": start_date.strftime('%Y-%m-%d'),
                "end_date": end_date.strftime('%Y-%m-%d'),
                "amount_paid": data.get('amount_paid', 0),
                "subscription_url": f"https://linknamali.ke/subscriptions/{subscription_id}"
            }
            
            # Send confirmation email
            send_email_task.delay(
                sender_email='subscriptions@merimedevelopment.co.ke',
                recipient_email=user_email,
                subject="Linknamali - Subscription Created",
                template_name="create_subscription.html",
                context=context
            )

            return {'response': 'Subscription created successfully and email sent', 'subscription_id': subscription_id}, 201

        except ValueError as e:
            logging.error(f"Date parsing error: {str(e)}")
            return {'response': 'Invalid date format'}, 400
        except SQLAlchemyError as e:
            logging.error(f"Database error during subscription creation: {str(e)}")
            return {'response': 'Database error'}, 500
        except Exception as e:
            logging.error(f"Unexpected error during subscription creation: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()

class GetUserSubscriptions(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            user_id = request.args.get('user_id')

            if not user_id:
                return {'response': 'Missing user_id parameter'}, 400

            # Fetch user to ensure they exist
            user = session.query(User).filter_by(user_id=user_id).first()
            if not user:
                return {'response': 'User not found'}, 404

            # Fetch all subscriptions for the user
            subscriptions = UserSubscription.get_user_subscriptions(session, user_id)

            if not subscriptions:
                return {'response': 'No subscriptions found for this user'}, 404

            # Process subscriptions and include tier information
            subscriptions_list = []
            for subscription in subscriptions:
                subscription_data = subscription.as_dict()
                
                # Get tier information
                tier = session.query(PremiumTier).filter_by(id=subscription.tier_id).first()
                tier_data = tier.as_dict() if tier else {}
                
                # Add computed fields
                subscription_data['is_active'] = subscription.is_active()
                subscription_data['is_expired'] = subscription.is_expired()
                subscription_data['days_remaining'] = subscription.days_remaining()
                
                subscriptions_list.append({
                    "subscription": subscription_data,
                    "tier": tier_data,
                })

            return {'response': 'Success', 'data': subscriptions_list}, 200

        except Exception as e:
            logging.error(f"Error fetching subscriptions: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()

class GetActiveSubscription(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            user_id = request.args.get('user_id')

            if not user_id:
                return {'response': 'Missing user_id parameter'}, 400

            # Fetch user to ensure they exist
            user = session.query(User).filter_by(user_id=user_id).first()
            if not user:
                return {'response': 'User not found'}, 404

            # Get active subscription
            active_subscription = UserSubscription.get_active_subscription(session, user_id)

            if not active_subscription:
                return {'response': 'No active subscription found for this user'}, 404

            # Get subscription and tier data
            subscription_data = active_subscription.as_dict()
            tier = session.query(PremiumTier).filter_by(id=active_subscription.tier_id).first()
            tier_data = tier.as_dict() if tier else {}
            
            # Add computed fields
            subscription_data['is_active'] = active_subscription.is_active()
            subscription_data['days_remaining'] = active_subscription.days_remaining()
            subscription_data['can_create_listing'] = active_subscription.can_create_listing(tier.max_listings if tier else None)

            return {
                'response': 'Success', 
                'data': {
                    'subscription': subscription_data,
                    'tier': tier_data
                }
            }, 200

        except Exception as e:
            logging.error(f"Error fetching active subscription: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()

class UpdateSubscription(Resource):
    def put(self, subscription_id):
        session = None
        try:
            session = SessionLocal()
            data = request.json

            # Fetch subscription
            subscription = session.query(UserSubscription).filter_by(id=subscription_id).first()
            if not subscription:
                return {'response': 'Subscription not found'}, 404

            # Update allowed fields
            updatable_fields = [
                'status', 'payment_method', 'payment_reference', 
                'amount_paid', 'auto_renew', 'promo_code_used', 
                'discount_applied'
            ]
            
            for field in updatable_fields:
                if field in data:
                    setattr(subscription, field, data[field])
            
            # Handle date updates if provided
            if 'start_date' in data:
                subscription.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            if 'end_date' in data:
                subscription.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            
            subscription.updated_at = datetime.now(timezone.utc)
            session.commit()

            return {'response': 'Subscription updated successfully'}, 200

        except ValueError as e:
            logging.error(f"Date parsing error: {str(e)}")
            return {'response': 'Invalid date format'}, 400
        except SQLAlchemyError as e:
            logging.error(f"Database error during subscription update: {str(e)}")
            return {'response': 'Database error'}, 500
        except Exception as e:
            logging.error(f"Unexpected error during subscription update: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()

class CancelSubscription(Resource):
    def put(self, subscription_id):
        session = None
        try:
            session = SessionLocal()

            # Fetch subscription
            subscription = session.query(UserSubscription).filter_by(id=subscription_id).first()
            if not subscription:
                return {'response': 'Subscription not found'}, 404

            # Update subscription status
            subscription.status = 'cancelled'
            subscription.auto_renew = False
            subscription.updated_at = datetime.now(timezone.utc)
            session.commit()

            # Send cancellation email
            user_first_name, user_last_name, user_email = get_user_name(session, subscription.user_id)
            user_name = f"{user_first_name} {user_last_name}"
            
            tier = session.query(PremiumTier).filter_by(id=subscription.tier_id).first()
            
            context = {
                "user_name": user_name,
                "tier_name": tier.name if tier else "Unknown",
                "end_date": subscription.end_date.strftime('%Y-%m-%d'),
                "subscription_url": f"https://linknamali.ke/subscriptions/{subscription_id}"
            }
            
            send_email_task.delay(
                sender_email='subscriptions@merimedevelopment.co.ke',
                recipient_email=user_email,
                subject="Linknamali - Subscription Cancelled",
                template_name="cancel_subscription.html",
                context=context
            )

            return {'response': 'Subscription cancelled successfully'}, 200

        except SQLAlchemyError as e:
            logging.error(f"Database error during subscription cancellation: {str(e)}")
            return {'response': 'Database error'}, 500
        except Exception as e:
            logging.error(f"Unexpected error during subscription cancellation: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()

class IncrementListingUsage(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json

            user_id = data.get('user_id')
            if not user_id:
                return {'response': 'Missing user_id'}, 400

            # Get active subscription
            active_subscription = UserSubscription.get_active_subscription(session, user_id)
            if not active_subscription:
                return {'response': 'No active subscription found'}, 404

            # Get tier to check limits
            tier = session.query(PremiumTier).filter_by(id=active_subscription.tier_id).first()
            if not tier:
                return {'response': 'Tier not found'}, 404

            # Check if user can create more listings
            if not active_subscription.can_create_listing(tier.max_listings):
                return {'response': 'Listing limit reached for current tier'}, 403

            # Increment usage
            active_subscription.increment_listing_usage()
            active_subscription.updated_at = datetime.now(timezone.utc)
            session.commit()

            return {
                'response': 'Listing usage incremented successfully',
                'listings_used': active_subscription.listings_used,
                'max_listings': tier.max_listings
            }, 200

        except SQLAlchemyError as e:
            logging.error(f"Database error during listing usage increment: {str(e)}")
            return {'response': 'Database error'}, 500
        except Exception as e:
            logging.error(f"Unexpected error during listing usage increment: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()

class GetSubscriptionById(Resource):
    def get(self, subscription_id):
        session = None
        try:
            session = SessionLocal()

            # Fetch subscription
            subscription = session.query(UserSubscription).filter_by(id=subscription_id).first()
            if not subscription:
                return {'response': 'Subscription not found'}, 404

            # Get subscription and tier data
            subscription_data = subscription.as_dict()
            tier = session.query(PremiumTier).filter_by(id=subscription.tier_id).first()
            tier_data = tier.as_dict() if tier else {}
            
            # Add computed fields
            subscription_data['is_active'] = subscription.is_active()
            subscription_data['is_expired'] = subscription.is_expired()
            subscription_data['days_remaining'] = subscription.days_remaining()
            subscription_data['can_create_listing'] = subscription.can_create_listing(tier.max_listings if tier else None)

            return {
                'response': 'Success', 
                'data': {
                    'subscription': subscription_data,
                    'tier': tier_data
                }
            }, 200

        except Exception as e:
            logging.error(f"Error fetching subscription: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()

# Register API endpoints
api.add_resource(CreateSubscription, '/create')
api.add_resource(GetUserSubscriptions, '/user')
api.add_resource(GetActiveSubscription, '/active')
api.add_resource(UpdateSubscription, '/update/<string:subscription_id>')
api.add_resource(CancelSubscription, '/cancel/<string:subscription_id>')
api.add_resource(IncrementListingUsage, '/increment-usage')
api.add_resource(GetSubscriptionById, '/<string:subscription_id>')