from datetime import datetime, timezone, date
from enum import Enum
import logging
import requests
import base64
import json
from typing import Dict, Tuple, Optional
from decimal import Decimal
from models import User

logger = logging.getLogger(__name__)

class RefundStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed" 
    REJECTED = "rejected"
    NONE = "none"

class RefundCalculator:
    """Calculate refund amounts based on cancellation timing"""
    
    @staticmethod
    def calculate_refund(check_in_date, booking_amount: Decimal, 
                        cancellation_date: datetime = None) -> Tuple[RefundStatus, Decimal, str]:
        """
        Calculate refund based on time difference between cancellation and check-in
        
        Args:
            check_in_date: Booking check-in date (datetime or date object)
            booking_amount: Total booking amount
            cancellation_date: When cancellation occurred (defaults to now)
            
        Returns:
            Tuple of (RefundStatus, refund_amount, reason)
        """
        if cancellation_date is None:
            cancellation_date = datetime.now(timezone.utc)
            
        # Convert date to datetime
        if isinstance(check_in_date, date) and not isinstance(check_in_date, datetime):
            check_in_date = datetime.combine(check_in_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        
        # Ensure both dates are timezone-aware datetime objects
        if isinstance(check_in_date, datetime) and check_in_date.tzinfo is None:
            check_in_date = check_in_date.replace(tzinfo=timezone.utc)
        if cancellation_date.tzinfo is None:
            cancellation_date = cancellation_date.replace(tzinfo=timezone.utc)
            
        # Calculate hours until check-in
        time_diff = check_in_date - cancellation_date
        
        logger.info(f"Time difference: {time_diff}")
        
        hours_until_checkin = time_diff.total_seconds() / 3600
        
        logger.info(f"Hours until check-in: {hours_until_checkin}")
        
        if hours_until_checkin >= 48:
            # 48+ hours: 100% refund
            refund_amount = booking_amount
            status = RefundStatus.CONFIRMED
            reason = "Cancelled 48+ hours before check-in (100% refund)"
        elif 24 <= hours_until_checkin < 48:
            # 24-48 hours: 50% refund
            refund_amount = booking_amount * Decimal('0.5')
            status = RefundStatus.CONFIRMED
            reason = "Cancelled 24-48 hours before check-in (50% refund)"
        else:
            # <24 hours: No refund
            refund_amount = Decimal('0')
            status = RefundStatus.NONE
            reason = "Cancelled less than 24 hours before check-in (No refund)"
            
        return status, refund_amount, reason

class SafaricomB2CService:
    """Handle Safaricom M-Pesa B2C API transactions"""
    
    def __init__(self, consumer_key: str, consumer_secret: str, 
                 shortcode: str, initiator_name: str, security_credential: str,
                 sandbox: bool = True):
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.shortcode = shortcode
        self.initiator_name = initiator_name
        self.security_credential = security_credential
        self.sandbox = sandbox
        
        # API URLs
        if sandbox:
            self.auth_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
            self.b2c_url = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest"
        else:
            self.auth_url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
            self.b2c_url = "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest"
    
    def get_access_token(self) -> Optional[str]:
        """Get OAuth access token from Safaricom API"""
        try:
            # Basic auth header
            auth_string = f"{self.consumer_key}:{self.consumer_secret}"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(self.auth_url, headers=headers)
            response.raise_for_status()
            
            return response.json().get('access_token')
            
        except Exception as e:
            logger.error(f"Error getting access token: {str(e)}")
            return None
    
    def send_b2c_payment(self, phone_number: str, amount: int, 
                        occasion: str, remarks: str) -> Dict:
        """
        Send B2C payment via M-Pesa
        
        Args:
            phone_number: Recipient phone number (254XXXXXXXXX format)
            amount: Amount to send (in KES)
            occasion: Payment occasion/reason
            remarks: Payment remarks
            
        Returns:
            API response dictionary
        """
        access_token = self.get_access_token()
        if not access_token:
            return {"success": False, "error": "Failed to get access token"}
        
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "OriginatorConversationID": "06bd27f7-850b-4ac7-9b96-f21ff5f8758a",
                "InitiatorName": self.initiator_name,
                "SecurityCredential": self.security_credential,
                "CommandID": "BusinessPayment",
                "Amount": amount,
                "PartyA": self.shortcode,
                "PartyB": '254708374149',
                "Remarks": remarks,
                "QueueTimeOutURL": "https://api.linknamali.ke/api/mpesa/b2c/queue",
                "ResultURL": "https://api.linknamali.ke/api/mpesa/b2c/callback", 
                "Occasion": occasion
            }
            
            response = requests.post(self.b2c_url, json=payload, headers=headers)
            
            response.raise_for_status()
            
            return {"success": True, "data": response.json()}
            
        except Exception as e:
            logger.error(f"Error sending B2C payment: {str(e)}")
            return {"success": False, "error": str(e)}

class RefundService:
    """Main refund processing service"""
    
    def __init__(self, session, safaricom_service: SafaricomB2CService):
        self.session = session
        self.safaricom_service = safaricom_service
    
    def process_refund(self, booking, cancellation_message: str = None) -> Dict:
        """
        Process refund for a cancelled booking
        
        Args:
            booking: Booking object from database
            cancellation_message: Optional cancellation message
            
        Returns:
            Dictionary with refund processing results
        """
        try:
            # Calculate refund amount
            booking_amount = Decimal(str(booking.total_amount or 0))
            refund_status, refund_amount, reason = RefundCalculator.calculate_refund(
                booking.check_in_date, booking_amount
            )
            
            logger.info(f"Refund calculation: Status={refund_status.value}, Amount={refund_amount}, Reason={reason}")
            
            result = {
                "booking_id": booking.id,
                "refund_status": refund_status.value,
                "refund_amount": float(refund_amount),
                "reason": reason,
                "payment_initiated": False,
                "transaction_id": None
            }
            
            # If no refund, return early
            if refund_status == RefundStatus.NONE:
                self._update_booking_refund_info(booking, refund_status, refund_amount, reason)
                return result
            
            # Process payment if refund amount > 0
            if refund_amount > 0:
                payment_result = self._initiate_refund_payment(booking, refund_amount, reason)
                result.update(payment_result)
            
            # Update booking record with refund details
            self._update_booking_refund_info(booking, refund_status, refund_amount, reason)
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing refund for booking {booking.id}: {str(e)}")
            return {
                "booking_id": booking.id,
                "error": str(e),
                "refund_status": "failed"
            }
    
    def _initiate_refund_payment(self, booking, refund_amount: Decimal, reason: str) -> Dict:
        """Initiate M-Pesa B2C payment for refund"""
        try:
            # Get user phone number
            phone_number = booking.phone_number
            
            # if not phone_number:
            #     return {
            #         "payment_initiated": False,
            #         "error": "User phone number not found"
            #     }
            
            # # Format phone number for M-Pesa
            # phone = phone_number
            # if phone.startswith('0'):
            #     phone = '254' + phone[1:]
            # elif not phone.startswith('254'):
            #     phone = '254' + phone
            
            # Convert amount to integer
            amount_int = int(refund_amount)
            
            # Send B2C payment
            payment_response = self.safaricom_service.send_b2c_payment(
                phone_number='254708374149',
                amount=amount_int,
                occasion=f"Booking refund - {booking.id}",
                remarks=f"Refund for cancelled booking. {reason}"
            )
            
            print(f'B2C PAYMENT RESPONSE FROM SAFARICOM: ', payment_response)
            
            if payment_response.get("success"):
                transaction_id = payment_response["data"].get("ConversationID")
                return {
                    "payment_initiated": True,
                    "transaction_id": transaction_id,
                    "mpesa_response": payment_response["data"]
                }
            else:
                return {
                    "payment_initiated": False,
                    "error": payment_response.get("error", "M-Pesa payment failed")
                }
                
        except Exception as e:
            logger.error(f"Error initiating refund payment: {str(e)}")
            return {
                "payment_initiated": False,
                "error": str(e)
            }
    
    def _update_booking_refund_info(self, booking, refund_status: RefundStatus, 
                                  refund_amount: Decimal, reason: str):
        """Update booking record with refund information"""
        try:
            # Update refund fields to booking model
            booking.refund_status = refund_status.value 
            booking.refund_amount = float(refund_amount)
            booking.refund_processed_at = datetime.now(timezone.utc)
            booking.updated_at = datetime.now(timezone.utc)
            
            self.session.commit()
            logger.info(f"Updated booking {booking.id} with refund info")
            
        except Exception as e:
            logger.error(f"Error updating booking refund info: {str(e)}")
            self.session.rollback()