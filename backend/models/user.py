from sqlalchemy import Column, String, DateTime, func, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base

class User(Base):
    __tablename__ = 'users'

    user_id = Column(String(36), primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(200), nullable=False)
    id_number = Column(String(20), nullable=True) 
    email = Column(String(255), nullable=False, unique=True)
    phone_number = Column(String(20), nullable=True)
    password = Column(String, nullable=False)
    role = Column(String(100), nullable=False, default='general_user')
    profile_pic_url = Column(String(500), nullable=True) 
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    otp = Column(String(6), nullable=True)  # Added to match DB
    otp_expiry = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    reset_uuid = Column(String(36), nullable=True)
    signup_method = Column(Enum('Normal', 'Google', name='signupmethod'), nullable=False, default='Normal')
    is_locked = Column(Boolean, default=False, nullable=False)
    company_id = Column(String(36), ForeignKey('companies.company_id'), nullable=True)
    is_company_admin_approved = Column(Boolean, default=False, nullable=False)
    pending_company_id = Column(String(36), nullable=True)
    subscriptions = relationship("UserSubscription", back_populates="user")

    
    lands = relationship("Land", back_populates="user")
    houses = relationship("House", back_populates="user")
    commercials = relationship("Commercial", back_populates="user")
    apartments = relationship("Apartment", back_populates="user")
    bookings = relationship("Booking", back_populates="user")
    images = relationship("Image", back_populates="user")
    documents = relationship("Document", back_populates="user")
    likes = relationship("Like", back_populates="user")
    videos = relationship("Video", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    company = relationship("Company", back_populates="users", foreign_keys=[company_id])
    project_images = relationship("ProjectImage", back_populates="user", cascade="all, delete-orphan")
    project_documents = relationship("ProjectDocument", back_populates="user", cascade="all, delete-orphan")
    project_videos = relationship("ProjectVideo", back_populates="user", cascade="all, delete-orphan")


    @classmethod
    def get_active(cls, session):
        return session.query(cls).filter(cls.is_deleted == 0)

#ALTER TABLE users ADD INDEX idx_is_deleted (is_deleted);