from decimal import Decimal
from sqlalchemy import Column, String, Integer, DateTime, func
from sqlalchemy.orm import relationship
from models.engine.db_engine import Base

class Amenities(Base):
    __tablename__ = 'amenities'

    id = Column(Integer, primary_key=True, autoincrement=True)
    property_id = Column(String(36), nullable=False,index=True)
    property_type = Column(String(50), nullable=False,index=True)
    amenity = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    def as_dict(self, session=None):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}

        for column, value in data.items():
            if isinstance(value, Decimal):
                data[column] = str(value)

        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')

        return data
