from sqlalchemy import Column, String, DateTime, ForeignKey, DECIMAL, func
from models.engine.db_engine import Base
from sqlalchemy.orm import relationship

class Like(Base):
    __tablename__ = 'likes'

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey('users.user_id'), nullable=False, index=True)
    property_id = Column(String(36), nullable=False, index=True) 
    property_type = Column(String(20), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=func.now())

    user = relationship("User", back_populates="likes")