import hashlib
from decimal import Decimal


def hashpassword(password):
    salt = "weyuuhriluwrliywg"
    password_2_hashed = salt + password
    hasher = hashlib.md5()
    hasher.update(password.encode('utf-8'))
    hashed_password = hasher.hexdigest()
    return hashed_password

# Function to convert all Decimal values in the data to float
def convert_decimal(data):
    if isinstance(data, dict):
        return {key: convert_decimal(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_decimal(item) for item in data]
    elif isinstance(data, Decimal):
        return float(data)
    return data