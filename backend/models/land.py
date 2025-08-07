from decimal import Decimal
from sqlalchemy.orm import relationship, foreign
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, DECIMAL, func
from models.engine.db_engine import Base, get_user_name, get_images, get_documents, get_likes, get_videos
from utils.review_helper import get_reviews, get_average_rating
from utils.media_helpers import get_cover_image


class Land(Base):
    __tablename__ = 'land'

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey('users.user_id'), nullable=False)  
    title = Column(String(255), nullable=False, index=True)
    size = Column(String(100), nullable=False)
    land_type = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False, index=True)
    town = Column(String(50), nullable=True)
    locality = Column(String(50), nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False, index=True)
    availability_status = Column(String(20), nullable=False)
    purpose = Column(String(100), nullable=False, index=True)
    description = Column(String, default=None)
    amenities = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    likes = Column(Integer, default=0)
    deleted = Column(Integer, default=0)  # 0 is False, 1 is True
    is_approved = Column(String(20), default="pending")
    land_number = Column(Integer, autoincrement=True, unique=True, nullable=False, index=True)
    under_review = Column(Integer, default=0)  # 0 is False, 1 is True
    map_location = Column(String(255), nullable = True)
    location_text = Column(String(255), nullable=True)
    display = Column(Integer, default=1)  # 0 is False, 1 is True
    number_of_units = Column(Integer, nullable=False, default=1)
    units_remaining = Column(Integer, nullable=True)
    verified_by_agent_id = Column(String(36), ForeignKey('listing_agents.agent_id'), nullable=True)
    project_id = Column(String(36), ForeignKey('projects.id', ondelete="SET NULL"), nullable=True)
    manually_verified = Column(Integer, default=0)
    is_cover = Column(Integer, default=0)  



    # Define relationship with the User table
    user = relationship("User", back_populates="lands")
    verified_by_agent = relationship("ListingAgent", back_populates="verified_land")
    project = relationship("Project", back_populates="land")
    
    external_calendars = relationship("ExternalCalendar", 
        primaryjoin="and_(Land.id==foreign(ExternalCalendar.property_id), ExternalCalendar.property_type=='land')")

    blocked_dates = relationship("BlockedDate",
        primaryjoin="and_(Land.id==foreign(BlockedDate.property_id), BlockedDate.property_type=='land')")

    sync_logs = relationship("SyncLog",
        primaryjoin="and_(Land.id==foreign(SyncLog.property_id), SyncLog.property_type=='land')")
    
    @classmethod
    def get_active(cls, session, user_id=None):
        query = session.query(cls).filter(
            cls.deleted == 0,
            cls.is_approved == "approved",
            cls.display == 1
        )
        if user_id:
            query = query.filter(cls.user_id == user_id)
        return query
    
    @classmethod
    def get_unapproved(cls, session):
        return session.query(cls).filter(
            cls.deleted == 0, 
            cls.is_approved == "pending"
        )
    
    @classmethod
    def get_approved_and_manually_verified(cls, session):
        return session.query(cls).filter(
            cls.deleted == 0,
            cls.display == 1,
            cls.is_approved == 'approved',
            cls.manually_verified == 1
        )
    
    @classmethod
    def get_by_status_for_user(cls, session, user_id, status):
        query = session.query(cls).filter(
            cls.user_id == user_id,
            cls.deleted == 0,
            cls.is_approved == "approved",
            cls.display == 1,
            cls.availability_status == status
        )

        if status == "vacant":
            query = query.filter(cls.units_remaining.isnot(None), cls.units_remaining > 0)

        return query

    
    
    def as_dict(self, session=None):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}

        # Convert Decimal to float
        for column, value in data.items():
            if isinstance(value, Decimal):
                data[column] = float(value)

        # Format timestamps
        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('deleted_at'):
            data['deleted_at'] = data['deleted_at'].strftime('%Y-%m-%d %H:%M:%S')

        # Convert land_number to int
        if data.get('land_number'):
            data['land_number'] = int(data['land_number'])

        if session:
            # Media
            data['images'] = get_images(session, self.user_id, self.id, 'land')
            data['documents'] = get_documents(session, self.user_id, self.id, 'land')
            data['videos'] = get_videos(session, self.user_id, self.id, 'land')
            cover_url = get_cover_image(session, self.user_id, self.id, 'apartments')
            data['cover_image_url'] = cover_url or (data['images'][0] if data['images'] else None)
            data['cover_image'] = data['cover_image_url']

            # User
            if 'user_id' in data:
                user_first_name, user_last_name, user_email = get_user_name(session, self.user_id)
                data['user_name'] = f"{user_first_name} {user_last_name}"

            # Reviews (✅ use 'land' not 'commercial')
            data['reviews'] = [r.as_dict() for r in get_reviews(session, self.id, 'land')]
            data['average_rating'] = get_average_rating(session, self.id, 'land')

            data['likes'] = get_likes(session, self.id)

            price = float(self.price)  # Ensure price is a float

            data['Listed_price'] = f"KSh {price:,.2f}"  # Default (e.g., sale)

            # Listing agent info
            if self.verified_by_agent_id:
                from models.listing_agents import ListingAgent  
                agent = session.query(ListingAgent).filter_by(agent_id=self.verified_by_agent_id).first()
                if agent:
                    data['verified_by_agent'] = {
                        'agent_id': agent.agent_id,
                        'name': agent.name,
                        'email': agent.email,
                        'unique_identifier': agent.unique_identifier
                    }

            # Verification badge logic
            data['is_verified'] = True if self.verified_by_agent_id or self.manually_verified else False

        else:
            data['likes'] = 0
            
        data['property_type'] = 'land'

        return data

    
    @classmethod
    def get_properties_by_review_status(cls, session, status):
        return session.query(cls).filter(cls.under_review == status)
    
    
    
