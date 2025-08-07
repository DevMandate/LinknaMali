from sqlalchemy.orm import relationship, Session
from sqlalchemy import Column, String, event, Boolean
from models.engine.db_engine import Base, SessionLocal  
import re

class ListingAgent(Base):
    __tablename__ = 'listing_agents'

    agent_id = Column(String(36), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    unique_identifier = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True) 

    # relationships
    verified_apartments = relationship("Apartment", back_populates="verified_by_agent")
    verified_houses = relationship("House", back_populates="verified_by_agent")
    verified_land = relationship("Land", back_populates="verified_by_agent")
    verified_commercials = relationship("Commercial", back_populates="verified_by_agent")


@event.listens_for(ListingAgent, 'before_insert')
def generate_unique_identifier(mapper, connection, target):
    session = SessionLocal()

    try:
        existing_ids = session.query(ListingAgent.unique_identifier).all()
        numbers = []
        for (uid,) in existing_ids:
            match = re.match(r"Agent-(\d+)", uid)
            if match:
                numbers.append(int(match.group(1)))

        next_number = max(numbers, default=0) + 1
        target.unique_identifier = f"Agent-{str(next_number).zfill(2)}"

    except Exception as e:
        session.rollback()  
        raise e  
    
    finally:
        session.close()  
