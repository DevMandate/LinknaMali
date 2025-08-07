import uuid
from sqlalchemy.orm import relationship
from sqlalchemy import Column, String, Text, DateTime
from models.engine.db_engine import Base, get_user_name
from sqlalchemy.sql import func

class Enquiry(Base):
    __tablename__ = 'enquiries'

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), nullable=True)
    property_id = Column(String(36), nullable=False, index=True)
    property_type = Column(String(20), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    def as_dict(self, session=None):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}

        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        # Handle guest user if no user_id
        if session and 'user_id' in data and data['user_id']:
            user_first_name, user_last_name, user_email = get_user_name(session, self.user_id)
            data['user_name'] = f"{user_first_name} {user_last_name}"
        else:
            data['user_name'] = data['user_id']

        return data
