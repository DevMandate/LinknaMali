from sqlalchemy import Column, String, DateTime, Boolean, Enum, ForeignKey, Float, Integer, func
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base
from datetime import datetime, timedelta

class UserSubscription(Base):
    __tablename__ = 'user_subscriptions'
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey('users.user_id'), nullable=False)
    tier_id = Column(String(36), ForeignKey('premium_tiers.id'), nullable=False)
    
    # Subscription status
    status = Column(Enum('active', 'expired', 'cancelled', 'pending', name='subscription_status'), 
                   nullable=False, default='pending')
    
    # Dates
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Payment details
    payment_method = Column(String(50), nullable=True)
    payment_reference = Column(String(255), nullable=True)
    amount_paid = Column(Float, nullable=True)
    
    # Usage tracking
    listings_used = Column(Integer, default=0, nullable=False)
    auto_renew = Column(Boolean, default=False, nullable=False)
    
    # Promo code used
    promo_code_used = Column(String(50), nullable=True)
    discount_applied = Column(Float, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    tier = relationship("PremiumTier")
    
    def as_dict(self):
        """Return subscription details as a dictionary with formatted datetime."""
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}
        
        # Format datetime fields
        for field in ['start_date', 'end_date', 'created_at', 'updated_at']:
            if data.get(field):
                data[field] = data[field].strftime('%Y-%m-%d %H:%M:%S')
        
        return data
    
    def is_active(self):
        """Check if subscription is currently active."""
        return (self.status == 'active' and 
                self.start_date <= datetime.now() <= self.end_date)
    
    def is_expired(self):
        """Check if subscription has expired."""
        return self.end_date < datetime.now()
    
    def days_remaining(self):
        """Get days remaining in subscription."""
        if self.is_expired():
            return 0
        return (self.end_date - datetime.now()).days
    
    def can_create_listing(self, tier_max_listings):
        """Check if user can create more listings based on tier limits."""
        if tier_max_listings is None:  # Unlimited
            return True
        return self.listings_used < tier_max_listings
    
    def increment_listing_usage(self):
        """Increment the listings used counter."""
        self.listings_used += 1
    
    @classmethod
    def get_active_subscription(cls, session, user_id):
        """Get user's active subscription."""
        return session.query(cls).filter(
            cls.user_id == user_id,
            cls.status == 'active',
            cls.start_date <= func.now(),
            cls.end_date >= func.now()
        ).first()
    
    @classmethod
    def get_user_subscriptions(cls, session, user_id):
        """Get all subscriptions for a user."""
        return session.query(cls).filter(
            cls.user_id == user_id
        ).order_by(cls.created_at.desc()).all()