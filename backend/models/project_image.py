from sqlalchemy import Column, String, DateTime, ForeignKey, func, Integer
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base

class ProjectImage(Base):
    __tablename__ = 'project_images'

    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)  # Cloudflare R2 link
    uploaded_at = Column(DateTime, default=func.now(), nullable=False)
    is_cover = Column(Integer, default=0)

    user = relationship("User", back_populates="project_images")
    project = relationship("Project", back_populates="images")

    def as_dict(self, session=None):
        data = {col.name: getattr(self, col.name) for col in self.__table__.columns}
        if data.get("uploaded_at"):
            data["uploaded_at"] = data["uploaded_at"].strftime('%Y-%m-%d %H:%M:%S')
        return data
