
from flask import request
from flask import Blueprint
from flask_cors import CORS
from flask_argon2 import Argon2
from datetime import datetime, timezone, timedelta
from flask_restful import Api, Resource
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from models import User, Booking, Enquiry
from models.engine.db_engine import SessionLocal,get_user_name ,get_property_by_id
from celery_server import send_email_task
from refund_service import *
from OwnerPayoutService import OwnerPayoutService

import logging
import uuid

bookings = Blueprint('bookings', __name__, url_prefix='/bookings')
api = Api(bookings)
CORS(bookings, resources={
    r"/bookings/*": {
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

@bookings.route('/', methods=['GET'])
def welcome():
    return "Welcome to Bookings and Enquiries"

class CreateBooking(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json

            required_fields = [
                'user_id', 'property_id', 'property_type',
            ]
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'response': 'Missing required fields', 'fields': missing_fields}, 400
            
            for key in ['check_in_date', 'check_out_date', 'pay_later_date']:
                if key in data and data[key] == "":
                    data[key] = None

                    
            booking_id = str(uuid.uuid4())
            # Create new booking entry
            new_booking = Booking(
                id=booking_id,
                user_id=data.get('user_id'),
                property_id=data.get('property_id'),
                property_type=data.get('property_type'),
                check_in_date=data.get('check_in_date'),
                check_out_date=data.get('check_out_date'),
                special_requests=data.get('special_requests'),
                purchase_purpose=data.get('purchase_purpose'),
                reservation_duration=data.get('reservation_duration'),
                payment_option=data.get('payment_option'),
                payment_period=data.get('payment_period'),
                number_of_guests=data.get('number_of_guests'),
                number_of_adults=data.get('number_of_adults'),
                number_of_children=data.get('number_of_children'),
                number_of_rooms=data.get('number_of_rooms'),
                travel_purpose=data.get('travel_purpose'),
                payment_method=data.get('payment_method'),
                pay_later_date=data.get('pay_later_date'),
                total_amount= data.get('total_amount'),
                phone_number=data.get('mpesa_phone'),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(new_booking)
            session.commit()

            # Filter out empty fields before sending the email
            all_fields = {
                "Check in date": data.get('check_in_date'),
                "Check out date": data.get('check_out_date'),
                "Travel purpose": data.get('travel_purpose'),
                "Number of Adults": data.get('number_of_adults'),
                "Number of Children": data.get('number_of_children'),
                "Number of Guests": data.get('number_of_guests'),
                "Number of Rooms": data.get('number_of_rooms'),
                "Purchase Purpose": data.get('purchase_purpose'),
                "Reservation Duration": data.get('reservation_duration'),
                "Payment Option": data.get('payment_option'),
                "Payment Period": data.get('payment_period'),
                "Payment method": data.get('payment_method'),
                "Pay later date": data.get('pay_later_date'),
                "Special Requests": data.get('special_requests'),
            }

            # Remove empty fields
            filtered_fields = {key: value for key, value in all_fields.items() if value}
            # Fetch user details (name, email)
            user_first_name, user_last_name, user_email = get_user_name(session, data['user_id'])
            user_name = f"{user_first_name} {user_last_name}"
            context = {
                "user_name": user_name,
                "booking_details": filtered_fields,
                "booking_url": f"https://linknamali.ke/bookings/{booking_id}"                
            }      
            send_email_task.delay(
                sender_email='bookings@merimedevelopment.co.ke',
                recipient_email=user_email,
                subject="Linknamali - Booking Created",
                template_name="create_booking.html",
                context=context
            ) 

            return {'response': 'Booking created successfully and email sent'}, 201

        except SQLAlchemyError as e:
            logging.error(f"Database error during booking creation: {str(e)}")
            return {'response': 'Database error'}, 500
        except Exception as e:
            logging.error(f"Unexpected error during booking creation: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()

class GetBlockedDates(Resource):
    def get(self, property_id):
        session = None
        try:
            session = SessionLocal()
            
            # Get dates from existing bookings
            existing_bookings = session.query(Booking.check_in_date, Booking.check_out_date).filter_by(property_id=property_id).all()
            
            # Get dates from external calendars
            # blocked_dates = session.query(BlockedDate.blocked_date).filter_by(property_id=property_id).all()
            
            # Combine and format dates
            all_blocked_dates = []
            
            # Add booking date ranges
            for booking in existing_bookings:
                if booking.check_in_date and booking.check_out_date:
                    current_date = booking.check_in_date
                    while current_date < booking.check_out_date:
                        all_blocked_dates.append(current_date.strftime('%Y-%m-%d'))
                        current_date += timedelta(days=1)
            
            # Add external blocked dates
            # for blocked in blocked_dates:
            #     if blocked.blocked_date:
            #         all_blocked_dates.append(blocked.blocked_date.strftime('%Y-%m-%d'))
            
            return {'blocked_dates': list(set(all_blocked_dates))}, 200
            
        except Exception as e:
            logging.error(f"Error fetching blocked dates: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()

class GetBookings(Resource):
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

            # Fetch only active bookings for the user
            bookings = Booking.get_active(session).filter(
                Booking.user_id == user_id
            ).all()

            if not bookings:
                return {'response': 'No active bookings found for this user'}, 404

            # Process bookings and filter out empty fields
            bookings_list = []
            for booking in bookings:
                booking_data = booking.as_dict(session)
                filtered_data = {k: v for k, v in booking_data.items() if v not in [None, '', 'null']}

                # Fetch full property details
                property_object = get_property_by_id(session, booking.property_id, booking.property_type)

                # Append property data
                bookings_list.append({
                    "booking": filtered_data,
                    "property": property_object,
                })

            return {'response': 'Success', 'data': bookings_list}, 200

        except Exception as e:
            logging.error(f"Error fetching bookings: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()

class GetAllBookings(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            
            # Fetch bookings with refund_status = 'pending', 'confirmed', or 'none' (NULL)
            bookings = session.query(Booking).filter(
                or_(
                    Booking.refund_status == 'pending',
                    Booking.refund_status == 'confirmed', 
                    # Booking.refund_status == 'none',
                    # Booking.refund_status.is_(None) 
                )
            ).all()
            
            if not bookings:
                return {'response': 'No bookings with refund status found'}, 404
            
            # Process bookings and filter out empty fields
            bookings_list = []
            for booking in bookings:
                booking_data = booking.as_dict(session)
                filtered_data = {k: v for k, v in booking_data.items() if v not in [None, '', 'null']}
                
                # Fetch full property details
                property_object = get_property_by_id(session, booking.property_id, booking.property_type)
                
                # Append property data
                bookings_list.append({
                    "booking": filtered_data,
                    "property": property_object,
                })
            
            return {'response': 'Success', 'data': bookings_list}, 200
        except Exception as e:
            logging.error(f"Error fetching bookings with refund status: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()


class GetBookingById(Resource):
    def get(self, booking_id):
        session = None
        try:
            session = SessionLocal()

            # Fetch the booking by its unique ID
            booking = Booking.get_active(session).filter(
                Booking.id == booking_id
            ).first()
            
            if not booking:
                return {'response': 'Booking not found'}, 404

            # Convert booking to dictionary and filter out empty/null values
            booking_data = booking.as_dict(session)
            filtered_data = {k: v for k, v in booking_data.items() if v not in [None, '', 'null']}
            
            # Fetch full property details
            property_object = get_property_by_id(session, booking.property_id, booking.property_type)
            
            # Check if booking is confirmed/paid to determine what property info to show
            is_payment_confirmed = booking.status == 'confirmed'
            
            print(f"Booking status: {booking.status}, Payment confirmed: {is_payment_confirmed}")
            
            # Filter property object based on payment status
            restricted_property = self._filter_property_by_payment_status(
                property_object, 
                is_payment_confirmed
            )
            
            print(f"Restricted property data: {restricted_property}")
            
            # Append property data
            result = {
                "booking": filtered_data,
                "property": restricted_property,
            }

            return {'response': 'Success', 'data': result}, 200
        
        except Exception as e:
            logging.error(f"Error fetching booking by ID: {str(e)}")
            return {'response': 'Internal server error'}, 500

        finally:
            if session:
                session.close()
                
    def _filter_property_by_payment_status(self, property_object, is_payment_confirmed):
        """
        Filter property data based on payment confirmation status.
        Hide sensitive contact and location details until payment is confirmed.
        """
        if not property_object:
            return property_object
        
        # Make a copy to avoid modifying the original object
        filtered_property = property_object.copy() if isinstance(property_object, dict) else property_object
        
        # If payment is not confirmed, restrict sensitive information
        if not is_payment_confirmed:
            # Fields to restrict/hide
            restricted_fields = [
                'phone_number', 'whatsapp_number',
                'street_address', 'house_number', 'apartment_number', 'floor_number',
                'map_location',
                'location_text', 'location', 'town', 'locality'
            ]
            
            # Remove or mask restricted fields
            if isinstance(filtered_property, dict):
                for field in restricted_fields:
                    if field in filtered_property:
                        filtered_property[field] = "Hidden until payment confirmed"
                
                # Keep general location info but hide specifics
                if 'address' in filtered_property:
                    address = filtered_property.get('address', '')
                    if address:
                        filtered_property['address'] = self._mask_specific_address(address)
            
            # Handle case where property_object is a model instance
            elif hasattr(filtered_property, '__dict__'):
                for field in restricted_fields:
                    if hasattr(filtered_property, field):
                        setattr(filtered_property, field, "Hidden until payment confirmed")
        
        return filtered_property
    
    def _mask_specific_address(self, full_address):
        """
        Mask specific address details while keeping general location.
        """
        
        parts = full_address.split(',')
        if len(parts) > 2:
            return ', '.join(parts[-2:]).strip()
        
        return "Location details hidden until payment confirmed"

class UpdateBooking(Resource):
    def put(self, booking_id):
        session = None
        try:
            session = SessionLocal()
            data = request.json

            # Check if booking_id is valid
            booking = session.query(Booking).filter(Booking.id == booking_id).first()
            if not booking:
                return {'response': 'Booking not found'}, 404

            # Update booking entry
            booking.check_in_date = data['check_in_date'] if data.get('check_in_date') else booking.check_in_date
            booking.check_out_date = data['check_out_date'] if data.get('check_out_date') else booking.check_out_date
            booking.special_requests = data.get('special_requests', booking.special_requests)
            booking.purchase_purpose = data.get('purchase_purpose', booking.purchase_purpose)
            booking.reservation_duration = data.get('reservation_duration', booking.reservation_duration)
            booking.payment_option = data.get('payment_option', booking.payment_option)
            booking.payment_period = data.get('payment_period', booking.payment_period)
            booking.number_of_guests = data.get('number_of_guests', booking.number_of_guests)
            booking.number_of_adults = data.get('number_of_adults', booking.number_of_adults)
            booking.number_of_children = data.get('number_of_children', booking.number_of_children)
            booking.number_of_rooms = data.get('number_of_rooms', booking.number_of_rooms)
            booking.travel_purpose = data.get('travel_purpose', booking.travel_purpose)
            booking.payment_method = data.get('payment_method', booking.payment_method)
            booking.pay_later_date = data['pay_later_date'] if data.get('pay_later_date') else None
            booking.updated_at = datetime.now(timezone.utc)

            session.commit()

            return {'response': 'Booking updated successfully'}, 200

        except Exception as e:
            logging.error(f"Error updating booking: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()

class CancelBooking(Resource):
    def put(self, booking_id):
        session = None
        try:
            session = SessionLocal()
            data = request.json

            # Check if booking_id is valid
            booking = session.query(Booking).filter(Booking.id == booking_id).first()
            if not booking:
                return {'response': 'Booking not found'}, 404

            logger.info('Starting ---------------------------------------------------')
            property_object = get_property_by_id(session, booking.property_id, booking.property_type)
            logger.info(f"Property object: {property_object}")
            user_id = property_object.get("user_id")
            logger.info(f"Property owner ID: {user_id}")

            user = session.query(User).filter(User.user_id == user_id).first()
            if not user:
                return {'response': 'Property owner not found'}, 404
            logger.info(f"Property owner email: {user.email}")

            #Prepare to send email
            user_email = user.email
            user_name = f"{user.first_name} {user.last_name}"

            def clean_booking(booking):
                exclude_fields = {
                    "id", "user_id", "property_id", "property_type",
                    "cancellation_message", "is_deleted", "created_at", "updated_at"
                }
                return {
                    key.replace("_", " ").title(): value
                    for key, value in booking.__dict__.items()
                    if key not in exclude_fields and value not in [None, ""]
                    and not key.startswith("_")
                }

            
            if booking:
                cleaned_booking = clean_booking(booking)
                context = {
                    "user_name": user_name,
                    "property_object": property_object,
                    "booking": cleaned_booking,
                    "cancellation_message": data.get("cancellation_message", "No reason provided")
                }

                send_email_task.delay(
                    sender_email="bookings@merimedevelopment.co.ke",
                    recipient_email=user_email,
                    subject=f"Linknamali - Booking Cancelled",
                    template_name="cancel_booking.html",
                    context=context
                )


            # Set cancellation message and mark as deleted
            booking.cancellation_message = data.get('cancellation_message', booking.cancellation_message)
            booking.refund_status = "pending"
            booking.updated_at = datetime.now(timezone.utc)
            
            session.commit()

            return {'response': 'Booking cancelled successfully'}, 200

        except Exception as e:
            logging.error(f"Error cancelling booking: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()


class ProcessBookingCancellation(Resource):
    def put(self, booking_id):
        session = None
        try:
            session = SessionLocal()
            data = request.json

            # Check if booking_id is valid
            booking = session.query(Booking).filter(Booking.id == booking_id).first()
            if not booking:
                return {'response': 'Booking not found'}, 404
            
            # Check if booking is already rejected or cancelled
            if booking.status in ["rejected", "cancelled"]:
                return {'response': f'Booking is already {booking.status}'}, 400
            
           # Get property owner information for email
            property_object = get_property_by_id(session, booking.property_id, booking.property_type)
            logger.info(f"Property object: {property_object}")
                     
            if not property_object:
                return {'response': 'Property not found'}, 404
                     
            user_id = property_object.get("user_id")
            logger.info(f"Property owner ID: {user_id}")
            
            # Don't continue if there's no property owner ID
            if not user_id:
                logger.error(f"Property owner ID is missing for property {booking.property_id}")
                return {'response': 'Property owner information not available'}, 400

            logger.info('Starting Process ---------------------------------------------------')
            
            # Initialize Safaricom B2C service
            safaricom_service = SafaricomB2CService(
                consumer_key="WcI0tqgAxR27CdFlyS7oHnF2OQAqjsD5rumx5Xq3RuuPXgS4",
                consumer_secret="DHunGxGCEj0OHKIV93WvqWsYLD5aHGMiMPBrajiGzX0GFbpsDcvC90q3LDwqLJGi",
                shortcode="600426",
                initiator_name="testapi",
                security_credential="eCjsyscqpdPQeN2hV8k/u5Af3SlcBEcF7mNxr22J8eyhxk+zkHpTCE1SfF14tnuWSKSRy4dEaX7/KeqL0r7hU5sDK3LLbdHkc3gzjuzftqTSUJ276DjQDjS8/OJhmUmSF5o6tZIZU8CTA3kzCFE4buZiGB5eHqdvGjyAfHJn3oqgij+DvumrJlOVnkXZoW3i+5Jvwmf2LdnwOrBGYJPM+2VUx+xomWAIZL19qZ2VcdJ2jz/4wmpGZWvWsAyOa8gQX+gluYcOfQpBLvozw7yQWuM9uz6MW3i0sb6Q5DaM7cvuOCeDryIFTYALgZ6IyJLs5jj02tiujDAHR/BPtKP5ew==",
                sandbox=True
            )
            
            # Initialize refund service
            refund_service = RefundService(session, safaricom_service)
            
                        
            # Process refund BEFORE marking booking as deleted
            refund_result = refund_service.process_refund(booking, data.get('cancellation_message'))
            
            logger.info(f"Refund processing result: {refund_result}")
            
            # Get property owner information
            property_owner = session.query(User).filter(User.user_id == user_id).first()
            if not property_owner:
                return {'response': 'Property owner not found'}, 404
            logger.info(f"Property owner email: {property_owner.email}")

            # Get booking user information
            booking_user = session.query(User).filter(User.user_id == booking.user_id).first()
            if not booking_user:
                return {'response': 'Booking user not found'}, 404
            logger.info(f"Booking user email: {booking_user.email}")

            def clean_booking(booking):
                exclude_fields = {
                    "id", "user_id", "property_id", "property_type",
                    "cancellation_message", "is_deleted", "created_at", "updated_at",
                    "refund_status", "refund_amount", "refund_processed_at"
                }
                return {
                    key.replace("_", " ").title(): value
                    for key, value in booking.__dict__.items()
                    if key not in exclude_fields and value not in [None, ""]
                    and not key.startswith("_")
                }

            
            if booking:
                cleaned_booking = clean_booking(booking)
                
                # Email to property owner
                property_owner_context = {
                    "user_name": f"{property_owner.first_name} {property_owner.last_name}",
                    "property_object": property_object,
                    "booking": cleaned_booking,
                    "cancellation_message": data.get("cancellation_message", "No reason provided"),
                    "refund_info": refund_result 
                }

                send_email_task.delay(
                    sender_email="bookings@merimedevelopment.co.ke",
                    recipient_email=property_owner.email,
                    subject=f"Linknamali - Booking Cancelled",
                    template_name="cancel_booking.html",
                    context=property_owner_context
                )
                
            # Email to booking user
            booking_user_context = {
            "user_name": f"{booking_user.first_name} {booking_user.last_name}",
            "property_object": property_object,
            "booking": cleaned_booking,
            "cancellation_message": data.get("cancellation_message", "No reason provided"),
            "refund_info": refund_result
            }

            send_email_task.delay(
            sender_email="bookings@merimedevelopment.co.ke",
            recipient_email=booking_user.email,
            subject=f"Linknamali - Your Cancellation Has Been Processed",
            template_name="booking_user_cancellation.html",
            context=booking_user_context
            )
                
            # Set cancellation message and mark as deleted
            booking.cancellation_message = data.get('cancellation_message', booking.cancellation_message)
            booking.is_deleted = True
            booking.status = "cancelled"
            booking.updated_at = datetime.now(timezone.utc)
            
            session.commit()
            
            # Return response with refund information
            response_data = {
                'response': 'Booking cancelled successfully',
                'refund_info': {
                    'refund_status': refund_result.get('refund_status'),
                    'booking_status': booking.status,
                    'amount': refund_result.get('refund_amount', 0),
                    'payment_initiated': refund_result.get('payment_initiated', False)
                }
            }
            
            return response_data, 200

        except Exception as e:
            logging.error(f"Error cancelling booking: {str(e)}")
            if session:
                session.rollback()
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()

class ProcessOwnerPayout(Resource):
    def post(self, booking_id):
        session = None
        try:
            session = SessionLocal()
            data = request.json
            
            # Get booking
            booking = session.query(Booking).filter(Booking.id == booking_id).first()
            if not booking:
                return {'response': 'Booking not found'}, 404
            
            # Get owner phone number from request or property data
            owner_phone = data.get('owner_phone_number')
            if not owner_phone:
                # Try to get from property owner data
                property_object = get_property_by_id(session, booking.property_id, booking.property_type)
                if property_object:
                    user_id = property_object.get("user_id")
                    if user_id:
                        owner = session.query(User).filter(User.user_id == user_id).first()
                        if owner and owner.phone:
                            owner_phone = owner.phone
            
            if not owner_phone:
                return {'response': 'Owner phone number required for payout'}, 400
            
            # Initialize services
            safaricom_service = SafaricomB2CService(
                consumer_key="WcI0tqgAxR27CdFlyS7oHnF2OQAqjsD5rumx5Xq3RuuPXgS4",
                consumer_secret="DHunGxGCEj0OHKIV93WvqWsYLD5aHGMiMPBrajiGzX0GFbpsDcvC90q3LDwqLJGi",
                shortcode="600426",
                initiator_name="testapi",
                security_credential="PIQ+oVIQSkPUCYuoyx4MYsZFqCB8NDyAqxPLbrXaM/DVQIPOrEVXhXOc8va/VEHsVQur5hlLrJ3eSjHFNKINeedb1Z/IiAlff7fiUMDcfQOwFu64dmHwwqZmj1rpZJjMp2W4M2cc75j0IHjU/8HDpWeTlAR9H/JZvBqmFTbxsN6P8BU2lMeW4ilHp8VhiwFm2P3Cnghc+BftnVaylZNvHYiL4t0+XW95/x4gmpdUbsaDbxsZ4vSSuzOMsyjBwrPHw1BVSqZYwVkJM3N76ViUrjnS1xtg51qTpur57usVQ0Dpdu9WpKg5wh1nIVaTLI1SKA5Uj+13h7+Mqk9e8oFGAw==",
                sandbox=True
            )
            
            payout_service = OwnerPayoutService(session, safaricom_service)
            
            # Process payout
            result = payout_service.process_owner_payout(booking, owner_phone)
            
            return {
                'response': result['message'],
                'payout_details': {
                    'booking_id': booking_id,
                    'payout_status': result['payout_status'],
                    'owner_amount': result.get('amount'),
                    'platform_amount': result.get('platform_amount'),
                    'transaction_reference': result.get('transaction_reference')
                }
            }, 200 if result['success'] else 400
            
        except Exception as e:
            logging.error(f"Error processing owner payout: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()
                
                
class GetPendingPayouts(Resource):
    def get(self):
        session = None
        try:
            session = SessionLocal()
            
            # Initialize payout service with None for safaricom_service since we're only reading data
            payout_service = OwnerPayoutService(session, None)
            
            # Get pending payouts
            pending_bookings = payout_service.get_pending_payouts()
            
            if not pending_bookings:
                return {'response': 'No pending payouts found'}, 404
            
            # Process bookings and filter out empty fields
            pending_payouts_list = []
            for booking in pending_bookings:
                booking_data = booking.as_dict(session)
                filtered_data = {k: v for k, v in booking_data.items() if v not in [None, '', 'null']}
                
                # Fetch full property details
                property_object = get_property_by_id(session, booking.property_id, booking.property_type)
                
                # Get property owner details
                owner_info = None
                if property_object:
                    user_id = property_object.get("user_id")
                    if user_id:
                        owner = session.query(User).filter(User.user_id == user_id).first()
                        if owner:
                            owner_info = {
                                "name": f"{owner.first_name} {owner.last_name}",
                                "email": owner.email,
                                "phone": owner.phone
                            }
                
                # Calculate payout amounts if not already calculated
                platform_amount = booking.platform_amount
                owner_amount = booking.owner_amount
                
                if not platform_amount or not owner_amount:
                    platform_amount, owner_amount = payout_service.calculate_revenue_split(booking.total_amount)
                
                # Append booking data with additional payout info
                pending_payouts_list.append({
                    "booking": filtered_data,
                    "property": property_object,
                    "owner_info": owner_info,
                    "payout_details": {
                        "total_amount": float(booking.total_amount) if booking.total_amount else 0,
                        "platform_amount": float(platform_amount) if platform_amount else 0,
                        "owner_amount": float(owner_amount) if owner_amount else 0,
                        "payout_status": booking.owner_payout_status or 'pending'
                    }
                })
            
            return {
                'response': 'Success',
                'data': pending_payouts_list,
                'total_pending': len(pending_payouts_list)
            }, 200
            
        except Exception as e:
            logging.error(f"Error fetching pending payouts: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()

class GetPayoutHistory(Resource):
    def get(self):
        """Get all completed payouts for admin dashboard"""
        session = None
        try:
            session = SessionLocal()
            
            # Query bookings with completed payouts
            completed_payouts = session.query(Booking)\
                .filter(Booking.owner_payout_status == 'completed')\
                .filter(Booking.is_deleted == False)\
                .order_by(Booking.owner_payout_date.desc())\
                .all()
            
            if not completed_payouts:
                return {'response': 'No completed payouts found'}, 404
            
            payout_data = []
            for booking in completed_payouts:
                # Get property details using the existing helper function
                property_object = get_property_by_id(session, booking.property_id, booking.property_type)
                
                # Get owner details
                owner = None
                owner_name = "Unknown Owner"
                if property_object:
                    user_id = property_object.get("user_id")
                    if user_id:
                        owner = session.query(User).filter(User.user_id == user_id).first()
                        if owner:
                            owner_name = f"{owner.first_name} {owner.last_name}"
                
                payout_info = {
                    "id": booking.id,
                    "owner_name": owner_name,
                    "property_name": property_object.get('name') if property_object else "Unknown Property",
                    "owner_amount": float(booking.owner_amount) if booking.owner_amount else 0.0,
                    "platform_amount": float(booking.platform_amount) if booking.platform_amount else 0.0,
                    "owner_payout_date": booking.owner_payout_date.isoformat() if booking.owner_payout_date else None,
                    "status": "processed",
                    "mpesa_transaction_id": booking.owner_payout_reference,
                    "booking_date": booking.created_at.isoformat() if booking.created_at else None,
                    "total_amount": float(booking.total_amount) if booking.total_amount else 0.0
                }
                payout_data.append(payout_info)
            
            return {
                "success": True,
                "data": payout_data,
                "message": f"Retrieved {len(payout_data)} completed payouts"
            }, 200
            
        except Exception as e:
            logging.error(f"Error fetching payout history: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()
                

class SubmitEnquiry(Resource):
    def post(self):
        session = None
        try:
            session = SessionLocal()
            data = request.json

            # Validate required fields
            required_fields = ['first_name', 'last_name', 'email', 'subject', 'message']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {'response': 'Missing required fields', 'fields': missing_fields}, 400

            # Handle cases with and without user_id
            if 'user_id' in data and data['user_id']:
                user = session.query(User).filter_by(user_id=data['user_id']).first()
                if not user:
                    return {'response': 'User not found for the given user_id'}, 404
            else:
                # If no user_id, handle as guest
                data['user_id'] = f"Guest-{str(uuid.uuid4())}"[:36]

            # Generate enquiry ID
            enquiry_id = str(uuid.uuid4())            
            new_enquiry = Enquiry(
                id=enquiry_id,
                user_id=data.get('user_id'),
                property_id=data['property_id'],
                property_type=data['property_type'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                email=data['email'],
                subject=data['subject'],
                message=data['message'],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )

            session.add(new_enquiry)
            session.commit()

            return {'response': 'Enquiry submitted successfully'}, 201

        except IntegrityError as e:
            logging.error(f"IntegrityError during enquiry submission: {str(e)}")
            session.rollback() 
            return {'response': 'Foreign key constraint failed'}, 400
        except Exception as e:
            logging.error(f"Error during enquiry submission: {str(e)}")
            return {'response': 'Internal server error'}, 500
        finally:
            if session:
                session.close()

class DeleteBooking(Resource):
    def delete(self, booking_id):
        session = None
        try:
            session = SessionLocal()

            booking = session.query(Booking).filter(Booking.id == booking_id).first()
            if not booking:
                return {'response': 'Booking not found.'}, 404

            session.delete(booking)
            session.commit()

            return {'response': 'Booking deleted successfully.'}, 200

        except Exception as e:
            logging.error(f"Error deleting booking: {str(e)}")
            return {'response': 'Internal server error.'}, 500
        finally:
            if session:
                session.close()





api.add_resource(CreateBooking, '/createbookings')
api.add_resource(GetBlockedDates, '/blocked-dates/<string:property_id>')
api.add_resource(GetBookings, "/getbookings")
api.add_resource(GetAllBookings, "/getallbookings")
api.add_resource(GetBookingById, "/getbookingbyid/<string:booking_id>")
api.add_resource(UpdateBooking, "/updatebookings/<string:booking_id>")
api.add_resource(CancelBooking, '/bookings/<string:booking_id>/cancel')
api.add_resource(ProcessBookingCancellation, '/bookings/<string:booking_id>/confirm_cancel')
api.add_resource(SubmitEnquiry, '/submitenquiry')
api.add_resource(DeleteBooking, '/deletebooking/<string:booking_id>') 

api.add_resource(GetPendingPayouts, '/bookings/pending-payouts')
api.add_resource(GetPayoutHistory, '/bookings/payout-history')
api.add_resource(ProcessOwnerPayout, '/bookings/<string:booking_id>/payout')