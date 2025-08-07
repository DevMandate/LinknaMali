import requests
from icalendar import Calendar
from datetime import datetime, date, timedelta 
from models import BlockedDate, ExternalCalendar
from models.engine.db_engine import SessionLocal
import logging

import schedule
import time

def sync_external_calendars():
    session = SessionLocal()
    try:
        # Get all external calendars
        external_cals = session.query(ExternalCalendar).all()
        
        for cal in external_cals:
            try:
                # Fetch iCal data
                response = requests.get(cal.ical_url, timeout=30)
                response.raise_for_status()
                
                # Parse iCal
                calendar = Calendar.from_ical(response.content)
                
                # Clear existing blocked dates for this source
                session.query(BlockedDate).filter_by(
                    property_id=cal.property_id,
                    source=cal.platform_name
                ).delete()
                
                # Process events
                for event in calendar.walk('vevent'):
                    start_date = event.get('dtstart').dt
                    end_date = event.get('dtend').dt
                    
                    # Handle date vs datetime objects
                    if isinstance(start_date, datetime):
                        start_date = start_date.date()
                    if isinstance(end_date, datetime):
                        end_date = end_date.date()
                    
                    # Create blocked dates for each day
                    current_date = start_date
                    while current_date < end_date:
                        blocked_date = BlockedDate(
                            property_id=cal.property_id,
                            blocked_date=current_date,
                            source=cal.platform_name
                        )
                        session.add(blocked_date)
                        current_date += timedelta(days=1)
                
                session.commit()
                logging.info(f"Synced calendar for property {cal.property_id}")
                
            except Exception as e:
                logging.error(f"Error syncing calendar {cal.id}: {str(e)}")
                session.rollback()
                continue
        
    finally:
        session.close()
# scheduled sync
def schedule_sync():
    """Schedule regular synchronization of external calendars"""
    
    # Run sync every 30 minutes
    schedule.every(30).minutes.do(sync_external_calendars)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

# Function to manually trigger sync for a specific property
def sync_property_calendar(property_id):
    """Sync calendar for a specific property"""
    session = SessionLocal()
    try:
        external_cals = session.query(ExternalCalendar).filter_by(property_id=property_id).all()
        
        for cal in external_cals:
            try:
                response = requests.get(cal.ical_url, timeout=30)
                response.raise_for_status()
                
                calendar = Calendar.from_ical(response.content)
                
                # Clear existing blocked dates for this source
                session.query(BlockedDate).filter_by(
                    property_id=cal.property_id,
                    source=cal.platform_name
                ).delete()
                
                # Process events (same logic as above)
                for event in calendar.walk('vevent'):
                    start_date = event.get('dtstart').dt
                    end_date = event.get('dtend').dt
                    
                    if isinstance(start_date, datetime):
                        start_date = start_date.date()
                    if isinstance(end_date, datetime):
                        end_date = end_date.date()
                    
                    current_date = start_date
                    while current_date < end_date:
                        blocked_date = BlockedDate(
                            property_id=cal.property_id,
                            blocked_date=current_date,
                            source=cal.platform_name
                        )
                        session.add(blocked_date)
                        current_date += timedelta(days=1)
                
                session.commit()
                logging.info(f"Synced calendar for property {property_id}")
                
            except Exception as e:
                logging.error(f"Error syncing calendar {cal.id}: {str(e)}")
                session.rollback()
                
    finally:
        session.close()