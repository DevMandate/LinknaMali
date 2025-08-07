from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base

class Video(Base):
    __tablename__ = 'videos'

    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), nullable=False, index=True)  # Property ID (apartment, house, etc.)
    property_type = Column(Enum('apartments', 'houses', 'land', 'commercial'), nullable=False, index=True)
    video_url = Column(String(500), nullable=False)  # Cloudflare R2 video URL
    uploaded_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="videos")

    def as_dict(self, session=None):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}

        if data.get('uploaded_at'):
            data['uploaded_at'] = data['uploaded_at'].strftime('%Y-%m-%d %H:%M:%S')

        return data
