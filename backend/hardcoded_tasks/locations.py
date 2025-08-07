import uuid
from landing_page.flask_app.models.locations import Location
from landing_page.flask_app.models.engine.db_engine import SessionLocal

# Function to insert location data into the database
def insert_location(name, image_url):
    session = None
    try:
        session = SessionLocal()
        location_id = str(uuid.uuid4())
        location = Location(id=location_id, name=name, image_url=image_url)
        session.add(location)
        session.commit()
        
        print(f"Location '{name}' inserted successfully.")
        
    except Exception as e:
        if session:
            session.rollback()
        print(f"Error occurred while inserting location: {str(e)}")
    
    finally:
        if session:
            session.close()

# Example of inserting locations
insert_location(name="Kilifi", image_url="https://files.linknamali.ke/assets/frontend/locations/Kilifi.jpg")
insert_location(name="Mombasa", image_url="https://files.linknamali.ke/assets/frontend/locations/mombasa.webp")
insert_location(name="Lamu", image_url="https://files.linknamali.ke/assets/frontend/locations/lamu-island-featured.webp")
insert_location(name="Taita Taveta", image_url="https://files.linknamali.ke/assets/frontend/locations/TaitaTaveta.webp")
insert_location(name="Kwale", image_url="https://files.linknamali.ke/assets/frontend/locations/Kwale.jpg")
insert_location(name="Tana River", image_url="https://files.linknamali.ke/assets/frontend/locations/Tana%20River.jpg")