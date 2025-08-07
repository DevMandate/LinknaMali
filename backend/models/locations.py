from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from models.engine.db_engine import Base, getlistings
from sqlalchemy.sql import func

class Location(Base):
    __tablename__ = 'locations'

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False) 
    image_url = Column(String(500), nullable=False)  # URL for the image
    created_at = Column(DateTime, nullable=False, default=func.now())  # Timestamp for when the location is created
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())  # Timestamp for updates

    def as_dict(self, session=None):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}
        
        # Get the listings count for the location using getlistings function
        listings_count = getlistings(session, self.name)
        data['listings'] = listings_count

        # Formatting dates for better readability
        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')

        return data
    
