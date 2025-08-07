from database.database import db_connection
from datetime import datetime, timedelta


def cleanup_soft_deleted_properties():
    """Deletes properties soft-deleted more than 30 days ago."""
    connection = db_connection()
    cursor = connection.cursor()

    tables = ["apartments", "houses", "land", "commercial"]
    threshold_date = datetime.now() - timedelta(days=30)

    for table in tables:
        cleanup_query = f"""
            DELETE FROM {table} 
            WHERE deleted = 1 AND deleted_at <= %s
        """
        cursor.execute(cleanup_query, (threshold_date,))
        connection.commit()

    cursor.close()
    connection.close()
    print(f"Cleanup job ran successfully at {datetime.now()}")  # For debugging logs
