from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base
from datetime import datetime
import uuid
from decimal import Decimal

class CompanyUserLink(Base):
    __tablename__ = 'company_user_links'

    link_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey('companies.company_id'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.user_id'), nullable=False)
    role = Column(String(50), nullable=True)
    is_accepted = Column(Boolean, default=False)
    invited_by = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    invitation_token = Column(String(255), unique=True, nullable=True)
    token_expiry = Column(DateTime, nullable=True)

    company = relationship("Company")
    user = relationship("User")

    def as_dict(self, session=None):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}

        # Convert Decimal to float
        for column, value in data.items():
            if isinstance(value, Decimal):
                data[column] = float(value)

        # Format timestamps
        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('token_expiry'):
            data['token_expiry'] = data['token_expiry'].strftime('%Y-%m-%d %H:%M:%S')

        return data
