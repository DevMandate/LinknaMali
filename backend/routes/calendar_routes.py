from flask import Blueprint, request, jsonify
import uuid
import logging
from models import ExternalCalendar, BlockedDate, SyncLog
from models.engine.db_engine import SessionLocal
from ical_sync_service import sync_property_calendar, sync_external_calendars

logger = logging.getLogger(__name__)

calender_routes = Blueprint('calendar', __name__)

@calender_routes.route('/properties/<string:property_id>/external-calendars', methods=['POST'])
def add_external_calendar(property_id):
    """Add a new external calendar for a property"""
    data = request.get_json()
    
    session = SessionLocal()
    try:
        external_cal = ExternalCalendar(
            id=str(uuid.uuid4()),
            property_id=property_id,
            property_type=data['property_type'],
            platform_name=data['platform_name'],
            ical_url=data['ical_url'],
            is_active=data.get('is_active', True)
        )
        
        session.add(external_cal)
        session.commit()
        
        # Trigger immediate sync for this calendar
        sync_property_calendar(property_id)
        
        return jsonify({
            'success': True,
            'message': 'External calendar added successfully',
            'calendar_id': external_cal.id
        }), 201
        
    except Exception as e:
        session.rollback()
        logging.error(f"Error adding external calendar: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to add external calendar'
        }), 500
    finally:
        session.close()

@calender_routes.route('/properties/<string:property_id>/external-calendars', methods=['GET'])
def get_external_calendars(property_id):
    """Get all external calendars for a property"""
    session = SessionLocal()
    try:
        calendars = session.query(ExternalCalendar).filter_by(property_id=property_id).all()
        
        result = []
        for cal in calendars:
            result.append({
                'id': cal.id,
                'platform_name': cal.platform_name,
                'ical_url': cal.ical_url,
                'is_active': cal.is_active,
                'created_at': cal.created_at.isoformat(),
                'updated_at': cal.updated_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'calendars': result
        })
        
    except Exception as e:
        logging.error(f"Error fetching external calendars: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch external calendars'
        }), 500
    finally:
        session.close()

@calender_routes.route('/properties/<string:property_id>/blocked-dates', methods=['GET'])
def get_blocked_dates(property_id):
    """Get all blocked dates for a property"""
    session = SessionLocal()
    try:
        blocked_dates = session.query(BlockedDate).filter_by(property_id=property_id).all()
        
        result = []
        for date in blocked_dates:
            result.append({
                'id': date.id,
                'blocked_date': date.blocked_date.isoformat(),
                'source': date.source,
                'reason': date.reason,
                'created_at': date.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'blocked_dates': result
        })
        
    except Exception as e:
        logging.error(f"Error fetching blocked dates: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch blocked dates'
        }), 500
    finally:
        session.close()

@calender_routes.route('/properties/<string:property_id>/sync', methods=['POST'])
def manual_sync(property_id):
    """Manually trigger sync for a property"""
    try:
        sync_property_calendar(property_id)
        return jsonify({
            'success': True,
            'message': 'Calendar sync triggered successfully'
        })
    except Exception as e:
        logging.error(f"Error triggering sync: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to trigger sync'
        }), 500

@calender_routes.route('/sync-all', methods=['POST'])
def sync_all_calendars():
    """Manually trigger sync for all properties"""
    try:
        sync_external_calendars()
        return jsonify({
            'success': True,
            'message': 'All calendars sync triggered successfully'
        })
    except Exception as e:
        logging.error(f"Error triggering sync: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to trigger sync'
        }), 500

@calender_routes.route('/properties/<string:property_id>/availability', methods=['GET'])
def check_availability(property_id):
    """Check availability for a property on specific dates"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({
            'success': False,
            'message': 'start_date and end_date are required'
        }), 400
    
    session = SessionLocal()
    try:
        from datetime import datetime
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
        
        # Check for any blocked dates in the range
        blocked_dates = session.query(BlockedDate).filter(
            BlockedDate.property_id == property_id,
            BlockedDate.blocked_date >= start,
            BlockedDate.blocked_date <= end
        ).all()
        
        is_available = len(blocked_dates) == 0
        
        return jsonify({
            'success': True,
            'is_available': is_available,
            'blocked_dates': [date.blocked_date.isoformat() for date in blocked_dates],
            'blocking_sources': list(set([date.source for date in blocked_dates]))
        })
        
    except Exception as e:
        logging.error(f"Error checking availability: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to check availability'
        }), 500
    finally:
        session.close()

@calender_routes.route('/external-calendars/<int:calendar_id>', methods=['DELETE'])
def delete_external_calendar(calendar_id):
    """Delete an external calendar"""
    session = SessionLocal()
    try:
        calendar = session.query(ExternalCalendar).filter_by(id=calendar_id).first()
        
        if not calendar:
            return jsonify({
                'success': False,
                'message': 'Calendar not found'
            }), 404
        
        # Delete associated blocked dates
        session.query(BlockedDate).filter_by(
            property_id=calendar.property_id,
            source=calendar.platform_name
        ).delete()
        
        # Delete the calendar
        session.delete(calendar)
        session.commit()
        
        return jsonify({
            'success': True,
            'message': 'External calendar deleted successfully'
        })
        
    except Exception as e:
        session.rollback()
        logging.error(f"Error deleting external calendar: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete external calendar'
        }), 500
    finally:
        session.close()