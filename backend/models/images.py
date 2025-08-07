from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, func, Integer
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base

class Image(Base):
    __tablename__ = 'images'

    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), nullable=False, index=True)
    property_type = Column(Enum('apartments', 'houses', 'land', 'commercial'), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False) 
    is_cover = Column(Integer, default=0)

    user = relationship("User", back_populates="images")

    def as_dict(self, session=None):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}

        if data.get('uploaded_at'):
            data['uploaded_at'] = data['uploaded_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')

        return data
