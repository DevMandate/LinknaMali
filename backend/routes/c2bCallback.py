from flask import Blueprint, request, jsonify
import logging
from flask_cors import CORS
from database.database import db_connection
from celery_server import send_email_task
from datetime import datetime
from models.engine.db_engine import SessionLocal
from models import Booking, User

logger = logging.getLogger(__name__)

b2c_callback_routes = Blueprint('b2c_callback_routes', __name__)

CORS(b2c_callback_routes, resources={
    r"/b2c_callback_routes/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://linknamali.ke",
            "https://api.linknamali.ke",
            "https://portal.linknamali.ke"
        ],
        "supports_credentials": True
    },
})

@b2c_callback_routes.route('/callback', methods=['POST'])
def b2c_callback():
    """Handle B2C payment callback from Safaricom"""
    callback_data = request.get_json()
    logger.info(f"Received B2C callback: {callback_data}")
    
    try:
        result = callback_data['Result']
        result_code = result['ResultCode']
        result_desc = result['ResultDesc']
        originator_conversation_id = result['OriginatorConversationID']
        conversation_id = result['ConversationID']
        
        logger.info(f"B2C Callback - Result Code: {result_code}, Description: {result_desc}")
        logger.info(f"Conversation ID: {conversation_id}")

        session = SessionLocal()
        
        try:
            if result_code != 0:
                # Payment failed - update refund status
                logger.warning(f"B2C payment failed - Code: {result_code}, Description: {result_desc}")
                
                # Update booking refund status to failed
                booking = session.query(Booking).filter(
                    Booking.refund_status == 'pending'
                ).first()
                
                if booking:
                    booking.refund_status = 'failed'
                    booking.updated_at = datetime.now()
                    session.commit()
                    
                    # Send failure notification email
                    user = session.query(User).filter(User.user_id == booking.user_id).first()
                    if user:
                        context = {
                            "user_name": f"{user.first_name} {user.last_name}",
                            "booking_id": booking.id,
                            "error_message": result_desc,
                            "refund_amount": booking.refund_amount or 0
                        }
                        
                        send_email_task.delay(
                            sender_email='bookings@merimedevelopment.co.ke',
                            recipient_email=user.email,
                            subject="Linknamali - Refund Processing Failed",
                            template_name="refund_failed.html",
                            context=context
                        )
                
                return jsonify({"status": "failed", "message": result_desc}), 200

            # Payment successful - extract transaction details
            result_parameters = result.get('ResultParameters', {}).get('ResultParameter', [])
            
            transaction_id = None
            transaction_amount = None
            recipient_phone = None
            working_account_funds = None
            utility_account_funds = None
            transaction_date = None
            
            for param in result_parameters:
                key = param.get('Key')
                value = param.get('Value')
                
                if key == 'TransactionID':
                    transaction_id = value
                elif key == 'TransactionAmount':
                    transaction_amount = value
                elif key == 'ReceiverPartyPublicName':
                    recipient_phone = value
                elif key == 'WorkingAccountAvailableFunds':
                    working_account_funds = value
                elif key == 'UtilityAccountAvailableFunds':
                    utility_account_funds = value
                elif key == 'TransactionCompletedDateTime':
                    transaction_date = value

            logger.info(f"B2C Success - Transaction ID: {transaction_id}, Amount: {transaction_amount}")
            logger.info(f"Recipient: {recipient_phone}")

            # Update booking refund status to confirmed
            booking = session.query(Booking).filter(
                Booking.refund_status == 'pending'
            ).first()
            
            if booking:
                booking.refund_status = 'confirmed'
                booking.updated_at = datetime.now()
                session.commit()
                
                # Send success notification email
                user = session.query(User).filter(User.user_id == booking.user_id).first()
                if user:
                    context = {
                        "user_name": f"{user.first_name} {user.last_name}",
                        "booking_id": booking.id,
                        "refund_amount": transaction_amount or booking.refund_amount,
                        "transaction_id": transaction_id,
                        "transaction_date": transaction_date,
                        "recipient_phone": recipient_phone
                    }
                    
                    send_email_task.delay(
                        sender_email='bookings@merimedevelopment.co.ke',
                        recipient_email=user.email,
                        subject="Linknamali - Refund Processed Successfully",
                        template_name="refund_success.html",
                        context=context
                    )
            
            logger.info(f"B2C refund processed successfully - Transaction ID: {transaction_id}")
            return jsonify({"status": "success"}), 200

        except Exception as db_error:
            logger.error(f"Database error in B2C callback: {str(db_error)}")
            session.rollback()
            return jsonify({"error": "Database error"}), 500
        finally:
            session.close()

    except Exception as e:
        logger.error(f"B2C Callback error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@b2c_callback_routes.route('/queue', methods=['POST'])
def b2c_queue():
    """Handle B2C queue timeout callback"""
    queue_data = request.get_json()
    logger.info(f"Received B2C queue callback: {queue_data}")
    
    try:
        # Handle queue timeout - update status to timeout
        session = SessionLocal()
        
        try:
            booking = session.query(Booking).filter(
                Booking.refund_status == 'pending'
            ).first()
            
            if booking:
                booking.refund_status = 'timeout'
                booking.updated_at = datetime.now()
                session.commit()
                
                logger.warning(f"B2C payment timed out for booking: {booking.id}")
                
                # Send timeout notification email
                user = session.query(User).filter(User.user_id == booking.user_id).first()
                if user:
                    context = {
                        "user_name": f"{user.first_name} {user.last_name}",
                        "booking_id": booking.id,
                        "refund_amount": booking.refund_amount or 0
                    }
                    
                    send_email_task.delay(
                        sender_email='bookings@merimedevelopment.co.ke',
                        recipient_email=user.email,
                        subject="Linknamali - Refund Processing Timeout",
                        template_name="refund_timeout.html",
                        context=context
                    )
        
        except Exception as db_error:
            logger.error(f"Database error in B2C queue: {str(db_error)}")
            session.rollback()
        finally:
            session.close()
            
        return jsonify({"status": "timeout_handled"}), 200

    except Exception as e:
        logger.error(f"B2C Queue error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@b2c_callback_routes.route('/status/<booking_id>', methods=['GET'])
def get_refund_status(booking_id):
    """Get refund status for a specific booking"""
    try:
        session = SessionLocal()
        
        try:
            # Get booking with user info
            booking = session.query(Booking).filter(
                Booking.id == booking_id
            ).first()
            
            if not booking:
                return jsonify({"error": "Booking not found"}), 404
            
            # Get user info for additional context
            user = session.query(User).filter(User.user_id == booking.user_id).first()
            
            response_data = {
                "booking_id": booking.id,
                "refund_status": booking.refund_status,
                "refund_amount": booking.refund_amount,
                "updated_at": booking.updated_at.isoformat() if booking.updated_at else None,
                "user_name": f"{user.first_name} {user.last_name}" if user else None,
                "user_email": user.email if user else None
            }
            
            # Add status-specific information
            if booking.refund_status == 'pending':
                response_data["message"] = "Refund is being processed"
            elif booking.refund_status == 'confirmed':
                response_data["message"] = "Refund has been processed successfully"
            elif booking.refund_status == 'failed':
                response_data["message"] = "Refund processing failed"
            elif booking.refund_status == 'timeout':
                response_data["message"] = "Refund processing timed out"
            else:
                response_data["message"] = "Unknown status"
            
            return jsonify(response_data), 200
            
        except Exception as db_error:
            logger.error(f"Database error in status query: {str(db_error)}")
            session.rollback()
            return jsonify({"error": "Database error"}), 500
        finally:
            session.close()
            
    except Exception as e:
        logger.error(f"Status query error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500
