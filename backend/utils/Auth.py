import re
import bleach
def validate_email(email):
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None

def sanitize_data(data):
    # Loop through all the fields in the data dictionary
    for key, value in data.items():
        # Sanitize only the fields that are strings (e.g., text-based fields)
        if isinstance(value, str):
            # Clean the string value to remove unsafe HTML
            data[key] = bleach.clean(value)

    return data
