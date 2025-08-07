import uuid
from decimal import Decimal 
from datetime import datetime, date
from sqlalchemy import Column, String, Date, ForeignKey, DateTime, func, Enum, Boolean, Numeric, Float
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base, get_user_name

class Booking(Base):
    __tablename__ = 'bookings'

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey('users.user_id'), nullable=False)
    phone_number = Column(String(20), nullable=True)
    property_id = Column(String(36), nullable=False, index=True)
    property_type = Column(String(20), nullable=False, index=True)
    check_in_date = Column(Date, nullable=True)
    check_out_date = Column(Date, nullable=True)
    special_requests = Column(String, nullable=True)
    purchase_purpose = Column(String(255), nullable=True)
    reservation_duration = Column(String(50), nullable=True)
    payment_option = Column(String(100), nullable=True)
    payment_period = Column(String(100), nullable=True)
    number_of_guests = Column(String(20), nullable=True)
    number_of_adults = Column(String(20), nullable=True)
    number_of_children = Column(String(20), nullable=True)
    number_of_rooms = Column(String(20), nullable=True)
    travel_purpose = Column(String(255), nullable=True)
    payment_method = Column(String(100), nullable=True)
    pay_later_date = Column(Date, nullable=True)
    status = Column(Enum('pending', 'confirmed', 'rejected', 'cancelled', name='booking_status'), nullable=False, default='pending', index=True)
    cancellation_message = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=True)
    refund_status = Column(Enum('pending', 'confirmed', 'rejected', 'none',  name='refund_status'), nullable=True)
    refund_amount = Column(Numeric(10, 2), nullable=True)
    refund_processed_at = Column(DateTime, nullable=True)

    # Commission and payout fields
    platform_amount = Column(Float) 
    owner_amount = Column(Float)
    owner_payout_status = Column(String, default='pending') 
    owner_payout_date = Column(DateTime)
    owner_payout_reference = Column(String) 


    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    # Relationship with User
    user = relationship("User", back_populates="bookings")
    @classmethod
    def get_active(cls, session):
        return session.query(cls).filter(
            cls.is_deleted == 0, 
        )

    def as_dict(self, session=None):
        data = {}
        
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            
            # Handle datetime objects
            if isinstance(value, datetime):
                if column.name in ['check_in_date', 'check_out_date', 'pay_later_date']:
                    data[column.name] = value.strftime('%Y-%m-%d')
                else:
                    data[column.name] = value.strftime('%Y-%m-%d %H:%M:%S')
            # Handle date objects
            elif isinstance(value, date):
                data[column.name] = value.strftime('%Y-%m-%d')
            # Handle Decimal objects
            elif isinstance(value, Decimal):
                data[column.name] = float(value)
            else:
                data[column.name] = value

        if session and 'user_id' in data:
            user_first_name, user_last_name, user_email = get_user_name(session, self.user_id)
            data['user_name'] = f"{user_first_name} {user_last_name}"
        
        return data