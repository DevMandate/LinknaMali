from flask import Blueprint, request, jsonify
import logging
from utils.mpesa_utils import generate_access_token, format_mpesa_number
from flask_cors import CORS
from database.database import db_connection
from celery_server import send_email_task
from models.engine.db_engine import SessionLocal
import os
import base64
from datetime import datetime
import requests
import uuid
import jwt

logger = logging.getLogger(__name__)

mpesa_routes = Blueprint('mpesa_routes', __name__)

SECRET_KEY = "tugyw64t8739qpu9uho8579uq8htou34897r6783tiy4htg5iw795y4p0thu4o58"

CORS(mpesa_routes, resources={
    r"/mpesa_routes/*": {
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

# Environment-safe credentials
SHORTCODE = "174379"
PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
CALLBACK_URL = "https://api.linknamali.ke/api/mpesa/stk-callback"
# CALLBACK_URL = "https://webhook.site/81d61280-1f9a-49e2-8ca0-126a028b596a"

@mpesa_routes.route('/stk-push', methods=['POST'])
def stk_push():
    data = request.get_json()
    phone = data.get("phone")
    booking_id = data.get("booking_id")
    # amount = data.get("amount")
    amount = 1
    
    if not phone or not amount:
        return jsonify({"error": "Phone and amount are required"}), 400
    
    # Get user_id from JWT token
    try:
        token = request.cookies.get('auth_token')
        if not token:
            return jsonify({"error": "User not logged in"}), 401
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload['user_id']

        logger.info(f"Decoded user_id: {user_id}")
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Session expired, please login again"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid session, please login again"}), 401
    except Exception as e:
        logger.error(f"JWT decode error: {str(e)}")
        return jsonify({"error": "Authentication error"}), 401
    
    try:
        phone_number = format_mpesa_number(phone)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode((SHORTCODE + PASSKEY + timestamp).encode()).decode()
    access_token = generate_access_token()
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "BusinessShortCode": SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone_number,
        "PartyB": SHORTCODE,
        "PhoneNumber": phone_number,
        "CallBackURL": CALLBACK_URL,
        "AccountReference": "Linknamali",
        "TransactionDesc": "Booking Payment"
    }
    
    try:
        response = requests.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers=headers,
        )
        
        # Check if response is successful
        if response.status_code != 200:
            return jsonify({
                "success": False,
                "message": f"Safaricom API returned status code {response.status_code}",
                "raw": response.text
            }), response.status_code
        
        try:
            saf_response = response.json()
            
            # Check if the response indicates success
            if saf_response.get('ResponseCode') == '0':
                checkout_request_id = saf_response.get('CheckoutRequestID')
                merchant_request_id = saf_response.get('MerchantRequestID')
                
                # Generate unique payment ID
                payment_id = str(uuid.uuid4()) 
                            
                try:
                    # Save payment record
                    conn = db_connection()
                    cursor = conn.cursor()
                    
                    current_time = datetime.now()
                    
                    # Insert payment record into the database
                    insert_sql = """
                        INSERT INTO payments (
                            id, user_id, booking_id, payment_type, 
                            amount, method, mpesa_number,
                            transaction_status, transaction_id,
                            merchant_request_id, checkout_request_id, transaction_time
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    
                    cursor.execute(insert_sql, (
                        payment_id,        
                        user_id, 
                        booking_id,
                        'booking_payment',    
                        amount,         
                        'mpesa',          
                        phone_number,     
                        'pending',        
                        None,             
                        merchant_request_id,  
                        checkout_request_id,  
                        current_time     
                    ))
                    
                    conn.commit()
                    cursor.close()
                    conn.close()
                    
                    logger.info(f"Payment record saved with ID: {payment_id} for user: {user_id}")
                    
                except Exception as db_error:
                    logger.error(f"Database error: {str(db_error)}")
                    return jsonify({"error": "Failed to save payment record"}), 500
            
            return jsonify(saf_response)
            
        except ValueError as json_error:
            logger.error(f"JSON decode error: {str(json_error)}")
            return jsonify({
                "success": False,
                "message": "Safaricom returned an unexpected response format.",
                "raw": response.text
            }), 502
    
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request to Safaricom timed out"}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Failed to connect to Safaricom"}), 503
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Failed to send request to Safaricom: {str(e)}"}), 500


@mpesa_routes.route('/stk-callback', methods=['POST'])
def stk_callback():
    callback_data = request.get_json()
    logger.info(f"Received STK callback: {callback_data}")
    
    try:
        callback = callback_data['Body']['stkCallback']
        result_code = callback['ResultCode']
        result_desc = callback['ResultDesc']
        merchant_request_id = callback['MerchantRequestID']
        checkout_request_id = callback['CheckoutRequestID']

        logger.info(f"STK Callback - Result Code: {result_code}, Description: {result_desc}, CheckoutRequestID: {checkout_request_id}")

        conn = db_connection()
        cursor = conn.cursor()

        if result_code != 0:
            # Update payment status to failed
            update_sql = """
                UPDATE payments SET transaction_status = 'failed'
                WHERE merchant_request_id = %s AND transaction_status = 'pending'
            """
            cursor.execute(update_sql, (merchant_request_id,))
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.warning(f"STK Push failed - Code: {result_code}, Description: {result_desc}")
            return jsonify({"status": "failed", "message": result_desc}), 200

        metadata = callback.get('CallbackMetadata', {}).get('Item', [])
        amount = receipt = phone_number = trans_time = None

        for item in metadata:
            if item['Name'] == 'Amount':
                amount = item['Value']
            elif item['Name'] == 'MpesaReceiptNumber':
                receipt = item['Value']
            elif item['Name'] == 'PhoneNumber':
                phone_number = str(item['Value'])
            elif item['Name'] == 'TransactionDate':
                raw = str(item['Value'])
                trans_time = datetime.strptime(raw, '%Y%m%d%H%M%S')

        logger.info(f"Payment details - Amount: {amount}, Receipt: {receipt}, Phone: {phone_number}")

        # Retrieve user_id using merchant_request_id
        select_sql = """
            SELECT user_id FROM payments 
            WHERE merchant_request_id = %s AND transaction_status = 'pending'
        """
        cursor.execute(select_sql, (merchant_request_id,))
        payment_record = cursor.fetchone()
        
        if not payment_record:
            logger.error(f"No pending payment found for merchant_request_id: {merchant_request_id}")
            cursor.close()
            conn.close()
            return jsonify({"status": "error", "message": "Payment record not found"}), 404
        
        user_id = payment_record[0] 

        # Update the existing payment record
        update_sql = """
            UPDATE payments SET 
                transaction_status = 'completed',
                transaction_id = %s,
                transaction_time = %s
            WHERE merchant_request_id = %s AND transaction_status = 'pending'
        """

        cursor.execute(update_sql, (receipt, trans_time, merchant_request_id))
        
        # Update booking status to confirmed
        update_booking_sql = """
            UPDATE bookings SET status = 'confirmed', updated_at = %s 
            WHERE user_id = %s AND phone_number = %s AND status = 'pending'
        """
        cursor.execute(update_booking_sql, (datetime.now(), user_id, phone_number))
        
        # Get booking and user details for email
        booking_sql = """
            SELECT b.id, u.first_name, u.last_name, u.email,
                b.check_in_date, b.check_out_date, b.travel_purpose,
                b.number_of_adults, b.number_of_children, b.number_of_guests,
                b.number_of_rooms, b.purchase_purpose, b.reservation_duration,
                b.payment_option, b.payment_period, b.payment_method,
                b.pay_later_date, b.special_requests
            FROM bookings b 
            JOIN users u ON b.user_id = u.user_id 
            WHERE b.user_id = %s AND b.phone_number = %s AND b.status = 'confirmed'
            ORDER BY b.created_at DESC LIMIT 1
        """
        cursor.execute(booking_sql, (user_id, phone_number))
        booking_result = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Payment and booking updated successfully for receipt: {receipt}")
        
        # Send confirmation email
        if booking_result:
            booking_details = {
                "Check in date": booking_result[4],
                "Check out date": booking_result[5], 
                "Travel purpose": booking_result[6],
                "Number of Adults": booking_result[7],
                "Number of Children": booking_result[8],
            }
            # Filter out None values
            booking_details = {k: v for k, v in booking_details.items() if v}
            
            context = {
                "user_name": f"{booking_result[1]} {booking_result[2]}",
                "booking_id": booking_result[0],
                "amount": amount,
                "receipt": receipt,
                "booking_details": booking_details, 
                "booking_url": f"https://linknamali.ke/bookings/{booking_result[0]}"
            }
            
            send_email_task.delay(
                sender_email='bookings@merimedevelopment.co.ke',
                recipient_email="warrenshiv@gmail.com",
                subject="Linknamali - Payment Confirmed & Booking Complete",
                template_name="payment_booking_confirmation.html",
                context=context
            )
            
            logger.info(f"Confirmation email queued for booking: {booking_result[0]}")
        else:
            logger.warning(f"No booking found for phone: {phone_number}, user: {user_id}")

        return jsonify({"status": "success"}), 200

    except Exception as e:
        logger.error(f"STK Callback error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@mpesa_routes.route('/stk-status', methods=['POST'])
def query_stk_push():
    try:
        data = request.get_json()
        checkout_request_id = data.get('checkoutRequestId')

        if not checkout_request_id:
            return jsonify({"error": "checkout_request_id is required"}), 400

        token = generate_access_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode((SHORTCODE + PASSKEY + timestamp).encode()).decode()

        request_body = {
            "BusinessShortCode": SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }

        response = requests.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
            json=request_body,
            headers=headers,
        )
        return jsonify(response.json())

    except requests.RequestException as e:
        return jsonify({"error": f"Request failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500