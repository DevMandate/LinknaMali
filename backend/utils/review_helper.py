from models.reviews import Review

def get_reviews(session, property_id, property_type):
    return session.query(Review).filter_by(
        property_id=property_id,
        property_type=property_type
    ).all()

def get_average_rating(session, property_id, property_type):
    ratings = session.query(Review.rating).filter_by(
        property_id=property_id,
        property_type=property_type
    ).all()
    if not ratings:
        return None
    return round(sum(r[0] for r in ratings) / len(ratings), 1)
