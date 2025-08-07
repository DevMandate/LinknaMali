from sqlalchemy.orm import Session
from models.images import Image

def get_cover_image(session, user_id, property_id, property_type):
    image = session.query(Image).filter_by(
        user_id=user_id,
        property_id=property_id,
        property_type=property_type,
        is_cover=1
    ).first()

    return image.image_url if image else None
