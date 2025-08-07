from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from models.engine.db_engine import Base
from sqlalchemy.orm import relationship
from datetime import datetime

class ExternalCalendar(Base):
    __tablename__ = 'external_calendars'
    
    id = Column(String(36), primary_key=True, index=True)
    property_id = Column(String(36), nullable=False)
    property_type = Column(String(20), nullable=False, index=True)
    platform_name = Column(String(50), nullable=False)  # 'airbnb', 'booking.com', etc.
    ical_url = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    def get_property(self, session):
        from models import Apartment, House, Land, Commercial
        
        model_map = {
            'apartments': Apartment,
            'houses': House, 
            'land': Land,
            'commercial': Commercial
        }
        
        model = model_map.get(self.property_type)
        if model:
            return session.query(model).filter(model.id == self.property_id).first()
        return None

class BlockedDate(Base):
    __tablename__ = 'blocked_dates'
    
    id = Column(String(36), primary_key=True, index=True)
    property_id = Column(String(36), nullable=False)
    property_type = Column(String(20), nullable=False, index=True) 
    blocked_date = Column(DateTime, nullable=False)
    source = Column(String(50), nullable=False)  # 'airbnb', 'booking.com', 'manual'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    def get_property(self, session):
        from models import Apartment, House, Land, Commercial
        
        model_map = {
            'apartments': Apartment,
            'houses': House, 
            'land': Land,
            'commercial': Commercial
        }
        
        model = model_map.get(self.property_type)
        if model:
            return session.query(model).filter(model.id == self.property_id).first()
        return None

class SyncLog(Base):
    __tablename__ = 'sync_logs'
    
    id = Column(String(36), primary_key=True, index=True)
    property_id = Column(String(36), nullable=False)
    property_type = Column(String(20), nullable=False, index=True)
    platform_name = Column(String(50), nullable=False)
    sync_status = Column(String(20), nullable=False)  # 'success', 'failed', 'partial'
    events_processed = Column(Integer, default=0)
    error_message = Column(String(500))
    sync_timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    def get_property(self, session):
        from models import Apartment, House, Land, Commercial
        
        model_map = {
            'apartments': Apartment,
            'houses': House, 
            'land': Land,
            'commercial': Commercial
        }
        
        model = model_map.get(self.property_type)
        if model:
            return session.query(model).filter(model.id == self.property_id).first()
        return None