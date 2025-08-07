from sqlalchemy import Column, String, DateTime, func, Enum, ForeignKey
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base
import uuid
from decimal import Decimal

class Company(Base):
    __tablename__ = 'companies'

    company_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)
    status = Column(Enum('pending_approval', 'approved', 'rejected', name='companystatus'), default='pending_approval')
    rejection_reason = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    company_owner_id = Column(String(36), ForeignKey('users.user_id'), nullable=False)

    users = relationship("User", back_populates="company", foreign_keys="User.company_id")
    owner = relationship("User", foreign_keys=[company_owner_id])

    def as_dict(self, session=None):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}

        # Convert Decimal to float
        for column, value in data.items():
            if isinstance(value, Decimal):
                data[column] = float(value)

        # Format timestamps
        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')

        return data
