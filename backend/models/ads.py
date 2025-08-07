import uuid
from sqlalchemy import Column, String, Date, ForeignKey, DateTime, func, Enum, Boolean, DECIMAL
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base
from decimal import Decimal


class Ads(Base):
    __tablename__ = 'ads'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String, default=None)
    media_url = Column(String(500))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    budget = Column(DECIMAL(10,2), nullable=False, index=True)
    payment_method = Column(String(50), nullable=False)
    mpesa_number = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship('User', back_populates='ads')


    @classmethod
    def as_dict(self, session=None):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}

        for column, value in data.items():
            if isinstance(value, Decimal):
                data[column] = float(value)