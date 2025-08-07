from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base

class Document(Base):
    __tablename__ = 'documents'

    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    property_id = Column(String(36), nullable=False)  # Property ID (apartment, house, etc.)
    property_type = Column(Enum('apartments', 'houses', 'land', 'commercial'), nullable=False)  # Property type
    document_url = Column(String(500), nullable=False)  # Cloudflare R2 link for document
    uploaded_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="documents")

#CREATE INDEX idx_documents_property ON documents (property_id, property_type);
#CREATE INDEX idx_documents_user_property ON documents (user_id, property_id, property_type);
