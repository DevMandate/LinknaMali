from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from models.engine.db_engine import Base
from sqlalchemy.sql import func

class Promotion(Base):
    __tablename__ = 'promotions'

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # e.g., discount, free_trial, seasonal
    applies_to_tier_id = Column(Integer, ForeignKey('premium_tiers.id'), nullable=True)
    discount = Column(Float, nullable=True)
    promo_code = Column(String(50), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    def as_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
    
    def as_dict(self):
        """Return promotion details as a dictionary with formatted datetime."""
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}

        # Format datetime fields
        for field in ['created_at', 'start_date', 'end_date']:
            if data.get(field):
                data[field] = data[field].strftime('%Y-%m-%d %H:%M:%S')

        return data
