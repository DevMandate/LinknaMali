from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from models.engine.db_engine import Base

class TierFeature(Base):
    __tablename__ = 'tier_features'

    id = Column(String(36), primary_key=True, index=True)
    tier_id = Column(Integer, ForeignKey('premium_tiers.id'), nullable=False)
    feature_name = Column(String(100), nullable=False)
    value = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)  # e.g., "Visibility", "Support"
    tooltip = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    def as_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
    
    def as_dict(self):
        """Return tier features details as a dictionary."""
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}
        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
        return data
