from datetime import datetime, timezone
from decimal import Decimal
from models import User, Booking

import logging

# Constants
PLATFORM_COMMISSION_PERCENTAGE = 10.0  # 10% platform commission

class OwnerPayoutService:
    def __init__(self, session, safaricom_service):
        self.session = session
        self.safaricom_service = safaricom_service
        self.logger = logging.getLogger(__name__)
    
    def calculate_revenue_split(self, total_amount):
        """Calculate platform and owner amounts based on total amount"""
        if not total_amount:
            return None, None
        
        total = float(total_amount)
        commission_rate = PLATFORM_COMMISSION_PERCENTAGE / 100
        
        platform_amount = Decimal(str(round(total * commission_rate, 2)))
        owner_amount = Decimal(str(round(total * (1 - commission_rate), 2)))
        
        # Debug logging
        print(f"Total Amount: {total}, Platform Amount: {platform_amount}, Owner Amount: {owner_amount}")
        
        return platform_amount, owner_amount
    
    def process_owner_payout(self, booking, owner_phone_number):
        """Process payout to property owner via M-Pesa B2C"""
        try:
            # Validate booking is ready for payout
            if not self._validate_payout_eligibility(booking):
                return {
                    'success': False,
                    'message': 'Booking not eligible for payout',
                    'payout_status': 'failed'
                }
            
            # Calculate amounts
            platform_amount, owner_amount = self.calculate_revenue_split(booking.total_amount)
            booking.platform_amount = platform_amount
            booking.owner_amount = owner_amount
            
            
            # Validate owner amount
            if not booking.owner_amount or booking.owner_amount <= 0:
                return {
                    'success': False,
                    'message': 'Invalid payout amount',
                    'payout_status': 'failed'
                }
            
            # Update payout status to processing
            booking.owner_payout_status = 'processing'
            self.session.commit()
            
            # Process M-Pesa B2C payment
            payout_amount = float(booking.owner_amount)
            
            self.logger.info(f"Processing payout of KES {payout_amount} to {owner_phone_number} for booking {booking.id}")
            
            # Call M-Pesa B2C API
            mpesa_response = self.safaricom_service.send_b2c_payment(
                phone_number=owner_phone_number,
                amount=payout_amount,
                occasion="Owner Payout",
                remarks=f"Property booking payout - {booking.id[:8]}",
            )
            
            print(f"MPESA Response: {mpesa_response}")
            
            if mpesa_response.get('success'):
                # Payout initiated successfully
                booking.owner_payout_status = 'completed'
                booking.owner_payout_date = datetime.now(timezone.utc)
                booking.owner_payout_reference = mpesa_response.get('transaction_id', '')
                
                self.session.commit()
                
                self.logger.info(f"Payout successful for booking {booking.id}: {mpesa_response.get('transaction_id')}")
                
                return {
                    'success': True,
                    'message': 'Payout processed successfully',
                    'payout_status': 'completed',
                    'transaction_reference': booking.owner_payout_reference,
                    'amount': float(booking.owner_amount),
                    'platform_amount': float(booking.platform_amount)
                }
            else:
                # Payout failed
                booking.owner_payout_status = 'failed'
                self.session.commit()
                
                self.logger.error(f"Payout failed for booking {booking.id}: {mpesa_response.get('error_message')}")
                
                return {
                    'success': False,
                    'message': f"Payout failed: {mpesa_response.get('error_message', 'Unknown error')}",
                    'payout_status': 'failed'
                }
                
        except Exception as e:
            # Handle any exceptions
            booking.owner_payout_status = 'failed'
            self.session.rollback()
            
            self.logger.error(f"Exception during payout processing for booking {booking.id}: {str(e)}")
            
            return {
                'success': False,
                'message': f'Payout processing failed: {str(e)}',
                'payout_status': 'failed'
            }
    
    def _validate_payout_eligibility(self, booking):
        """Validate if booking is eligible for owner payout"""
        return (
            booking.status == 'confirmed' and 
            booking.owner_payout_status in ['pending', 'failed', 'processing'] and  # Allow retry for failed payouts
            booking.total_amount and 
            booking.total_amount > 0 and
            not booking.is_deleted
        )
    
    def get_pending_payouts(self):
        """Get all bookings pending owner payout where checkout date has been reached"""
        
        current_date = datetime.now(timezone.utc).date()
        
        return self.session.query(Booking).filter(
            Booking.status == 'confirmed',
            Booking.owner_payout_status == 'pending',
            Booking.is_deleted == False,
            Booking.total_amount > 0,
            # Booking.check_out_date <= current_date  # Only process payouts on or after checkout date
        ).all()