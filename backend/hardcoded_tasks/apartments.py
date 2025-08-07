from landing_page.flask_app.models.apartment import Apartment
from landing_page.flask_app.models.engine.db_engine import SessionLocal

# Function to fetch active apartments and write to a file
def fetch_and_write_active_apartments():
    session = None
    try:
        session = SessionLocal()
        active_apartments = Apartment.get_active(session).all()

        with open("apartments.txt", "w", encoding="utf-8") as file:
            if not active_apartments:
                file.write("No active apartments found.\n")
                print("No active apartments found.")
            else:
                for apt in active_apartments:
                    file.write(f"ID: {apt.id}, Title: {apt.title}, Location: {apt.location}\n")
                print("Active apartments have been written to 'apartments.txt'.")
    
    except Exception as e:
        print(f"Error occurred: {str(e)}")
    
    finally:
        if session:
            session.close()

# Run the function
fetch_and_write_active_apartments()
