from celery import Celery
from ical_sync_service import sync_external_calendars, sync_property_calendar
from models import SyncLog, ExternalCalendar
from models.engine.db_engine import SessionLocal
import logging

# Configure Celery
app = Celery('calendar_sync')
app.config_from_object('celeryconfig')

@app.task(bind=True, max_retries=3)
def sync_all_calendars_task(self):
    """Celery task to sync all external calendars"""
    try:
        sync_external_calendars()
        logging.info("Successfully synced all calendars")
        return {"status": "success", "message": "All calendars synced"}
    except Exception as e:
        logging.error(f"Error in sync_all_calendars_task: {str(e)}")
        # Retry the task
        raise self.retry(exc=e, countdown=60)

@app.task(bind=True, max_retries=3)
def sync_property_calendar_task(self, property_id):
    """Celery task to sync calendar for a specific property"""
    session = SessionLocal()
    try:
        # Log sync start
        sync_log = SyncLog(
            property_id=property_id,
            platform_name="all",
            sync_status="in_progress"
        )
        session.add(sync_log)
        session.commit()
        
        # Perform sync
        sync_property_calendar(property_id)
        
        # Update log with success
        sync_log.sync_status = "success"
        session.commit()
        
        logging.info(f"Successfully synced calendar for property {property_id}")
        return {"status": "success", "property_id": property_id}
        
    except Exception as e:
        # Update log with error
        sync_log.sync_status = "failed"
        sync_log.error_message = str(e)
        session.commit()
        
        logging.error(f"Error in sync_property_calendar_task: {str(e)}")
        raise self.retry(exc=e, countdown=60)
    finally:
        session.close()

@app.task
def periodic_calendar_sync():
    """Periodic task to sync all calendars - runs every 30 minutes"""
    sync_all_calendars_task.delay()

# Set up periodic tasks
from celery.schedules import crontab

app.conf.beat_schedule = {
    'sync-calendars-every-30-minutes': {
        'task': 'tasks.calendar_tasks.periodic_calendar_sync',
        'schedule': crontab(minute='*/30'),
    },
}
app.conf.timezone = 'UTC'