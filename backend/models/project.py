from decimal import Decimal
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base


class Project(Base):
    __tablename__ = 'projects'

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey('users.user_id', ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    location = Column(String(255))
    status = Column(String(50), default="planned")  # e.g., planned, ongoing, completed
    type = Column(String(100), nullable=True)       # e.g., residential, mixed-use
    budget = Column(DECIMAL(15, 2), nullable=True)  # Optional project budget
    developer_name = Column(String(255), nullable=True)
    start_date = Column(String(50), nullable=True)  # Can be parsed on frontend
    end_date = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ✅ Relationships to linked properties
    apartments = relationship("Apartment", back_populates="project", passive_deletes=True)
    houses = relationship("House", back_populates="project", passive_deletes=True)
    commercial = relationship("Commercial", back_populates="project", passive_deletes=True)
    land = relationship("Land", back_populates="project", passive_deletes=True)

    # ✅ Media & amenities relationships
    amenities = relationship("ProjectAmenity", back_populates="project", cascade="all, delete-orphan")
    images = relationship("ProjectImage", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("ProjectDocument", back_populates="project", cascade="all, delete-orphan")
    videos = relationship("ProjectVideo", back_populates="project", cascade="all, delete-orphan")

    def as_dict(self, session=None):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}

        # Format Decimal fields
        for column, value in data.items():
            if isinstance(value, Decimal):
                data[column] = float(value)

        # Format timestamps
        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')

        # Add media if session is provided
        if session:
            from utils.project_media_helpers import (
                get_project_images, get_project_documents,
                get_project_videos, get_project_cover_image
            )

            data["images"] = get_project_images(session, self.user_id, self.id)
            data["documents"] = get_project_documents(session, self.user_id, self.id)
            data["videos"] = get_project_videos(session, self.user_id, self.id)
            data["cover_image"] = get_project_cover_image(session, self.user_id, self.id) or (
                data["images"][0] if data["images"] else None
            )

            # Add amenities
            data["amenities"] = [a.amenity for a in self.amenities]

        return data
