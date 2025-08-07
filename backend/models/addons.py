from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, func
from models.engine.db_engine import Base

class AddOn(Base):
    __tablename__ = 'addons'

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    price_min = Column(Float, nullable=True)
    price_max = Column(Float, nullable=True)
    is_monthly = Column(Boolean, default=False, nullable=False)
    included_in_tier_id = Column(Integer, ForeignKey('premium_tiers.id'), nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    def as_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

    def as_dict(self):
        """Return premium details as a dictionary."""
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}
        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
        return data