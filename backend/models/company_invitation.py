from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime
from models.engine.db_engine import Base
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

class CompanyInvitation(Base):
    __tablename__ = 'company_invitations'

    invite_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False)
    company_id = Column(String(36), ForeignKey('companies.company_id'), nullable=False)
    invited_by = Column(String(36), ForeignKey('users.user_id'), nullable=True)
    role = Column(String(50), nullable=True)
    token = Column(String(255), unique=True, nullable=False)
    is_accepted = Column(Boolean, default=False)
    expiry = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))
    created_at = Column(DateTime, default=datetime.utcnow)


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
