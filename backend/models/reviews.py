# models/review.py
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from models.engine.db_engine import Base
from models.user import User
from sqlalchemy.orm import relationship

class Review(Base):
    __tablename__ = 'reviews'

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey('users.user_id'), nullable=False)
    property_id = Column(String(36), nullable=False, index=True)  # links to property (commercial, apartment, etc.)
    property_type = Column(String(50), nullable=False)  # e.g. 'commercial', 'apartment', 'land'
    rating = Column(Integer, nullable=False)  # typically 1 to 5
    comment = Column(String(500), nullable=True)    
    created_at = Column(DateTime, nullable=False, default=func.now())
    is_visible = Column(Integer, nullable=False, default=1)  # 1 = visible, 0 = hidden

    user = relationship("User", back_populates="reviews")

    def as_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "property_id": self.property_id,
            "property_type": self.property_type,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            "is_visible": self.is_visible   
        }

    