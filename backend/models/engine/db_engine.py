from sqlalchemy import create_engine, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
import os

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

if not DB_USER or not DB_PASSWORD:
    raise ValueError("Database credentials are missing. Please set DB_USER and DB_PASSWORD.")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@localhost/linknamali"
engine = create_engine(
    DATABASE_URL, 
    echo=True,  # Set to True to see SQL queries
    pool_pre_ping=True,  # Checks if the connection is alive before using it
    pool_recycle=300,  # Recycles connections every 5 minutes
    pool_size=10,  # Set max connections
    max_overflow=5
) 
Base = declarative_base()

# SessionLocal factory to create session objects
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_user_name(session: Session, user_id: str):
    from models import User
    user = session.query(User).filter(User.user_id == user_id).first()
    if user:
        return user.first_name, user.last_name, user.email
    return None, None, None 

def get_property_by_id(session: Session, property_id: str, property_type: str):
    from models import Apartment, House, Land, Commercial 

    model_map = {
        "apartments": Apartment,
        "houses": House,
        "land": Land,
        "commercial": Commercial
    }

    model = model_map.get(property_type.lower())
    if not model:
        return None
    
    property_object = session.query(model).filter(
        model.deleted == 0,
        model.is_approved == 'approved', 
        model.display == 1,
        model.id == property_id
    ).first()

    if not property_object:
        return {'is_deleted': True}  # Property not found. Assuming a Hard/Soft delete was done

    return property_object.as_dict(session)

def get_images(session, user_id: str, property_id: str, property_type: str):
    from models import Image

    images = session.query(Image.image_url).filter(
        Image.user_id == user_id,
        Image.property_id == property_id,
        Image.property_type == property_type
    ).all()

    # Convert query results to a list of image URLs
    image_urls = [image.image_url for image in images]

    return image_urls

def get_documents(session, user_id: str, property_id: str, property_type: str):
    from models import Document

    documents = session.query(Document.document_url).filter(
        Document.user_id == user_id,
        Document.property_id == property_id,
        Document.property_type == property_type
    ).all()

    # Convert query results to a list of document URLs
    document_urls = [doc.document_url for doc in documents]

    return document_urls


def getlistings(session, location_name: str):
    from models import Apartment, House, Land, Commercial

    model_map = {
        "apartments": Apartment,
        "houses": House,
        "land": Land,
        "commercial": Commercial
    }
    
    listings_count = 0
    # Count active listings for each property type in the location
    for property_type, model in model_map.items():
        count = model.get_active(session).filter(model.location == location_name).count()
        listings_count += count

    return listings_count


def get_likes(session: Session, property_id: str):
    """Returns the total number of likes for a given property."""
    from models import Like
    return session.query(Like).filter_by(property_id=property_id).count()


def get_videos(session, user_id: str, property_id: str, property_type: str):
    from models import Video

    videos = session.query(Video.video_url).filter(
        Video.user_id == user_id,
        Video.property_id == property_id,
        Video.property_type == property_type
    ).all()

    # Convert query results to a list of video URLs
    video_urls = [video.video_url for video in videos]

    return video_urls
