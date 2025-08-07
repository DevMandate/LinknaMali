
import requests
import os
import re

def generate_access_token():
    consumer_key = "btjvVYpXGQjY75D2XZAa53zQvnArttiztYRAQzph56nKK5Ku"
    consumer_secret = "crqqA1yawTwhQYW7whadVeWtMOM9Qa53Mr8LTvdniZGaIV2glwqbtNFTCo5zlCvC"

    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    response = requests.get(url, auth=(consumer_key, consumer_secret))

    print("STATUS CODE:", response.status_code, flush=True)
    print("RAW RESPONSE:", response.text, flush=True)

    if response.status_code != 200:
        print("Failed to retrieve token. Check Consumer Key/Secret.", flush=True)
        return "INVALID_TOKEN"

    response.raise_for_status()
    token = response.json().get("access_token")
    print("Token Retrieved:", token, flush=True)
    return token

# Phone number formatting and validation
def format_mpesa_number(phone):
    phone = phone.replace("+", "")
    if re.match(r"^254\d{9}$", phone):
        return phone
    elif phone.startswith("0") and len(phone) == 10:
        return "254" + phone[1:]
    else:
        raise ValueError("Invalid phone number format")