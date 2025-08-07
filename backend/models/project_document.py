from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base

class ProjectDocument(Base):
    __tablename__ = 'project_documents'

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    document_url = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="project_documents")
    project = relationship("Project", back_populates="documents")

    def as_dict(self, session=None):
        data = {col.name: getattr(self, col.name) for col in self.__table__.columns}
        if data.get("uploaded_at"):
            data["uploaded_at"] = data["uploaded_at"].strftime('%Y-%m-%d %H:%M:%S')
        return data
