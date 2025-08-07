from sqlalchemy import Column, String, DateTime, Boolean, func, Integer
from models.engine.db_engine import Base

class Blog(Base):
    __tablename__ = 'blogs'

    id = Column(String(36), primary_key=True, index=True)
    author = Column(String(255), nullable=False) 
    title = Column(String(255), nullable=False)  
    description = Column(String(1000), nullable=False) 
    thumbnail_url = Column(String(500), nullable=True) 
    document_url = Column(String(500), nullable=True)  
    blog_class = Column(Integer, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    @classmethod
    def get_active(cls, session):
        """Fetch only public blogs."""
        return session.query(cls).filter(cls.is_public == True).all()

    def as_dict(self):
        """Return blog details as a dictionary."""
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}
        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
        return data
