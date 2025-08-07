import boto3
import requests
import os
# Vault Configuration
VAULT_ADDR = "http://127.0.0.1:8200"  # Update if running on a different server
VAULT_TOKEN = os.getenv("VAULT_TOKEN")
VAULT_SECRET_PATH = "secret/data/cloudflare"

def get_vault_secrets():
    """Fetch Cloudflare credentials from HashiCorp Vault"""
    headers = {"X-Vault-Token": VAULT_TOKEN}
    url = f"{VAULT_ADDR}/v1/{VAULT_SECRET_PATH}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data["data"]["data"]  # Extract secrets from KV v2 response
    except requests.RequestException as e:
        print(f"❌ Vault request failed: {e}")
        return None

# Fetch secrets from Vault
secrets = get_vault_secrets()
print("🔑Secrets Acquired")
if not secrets:
    raise SystemExit("⚠️ Exiting: Could not fetch secrets from Vault.")

CLOUDFLARE_ACCESS_KEY = secrets["access_key"]
CLOUDFLARE_SECRET_KEY = secrets["secret_key"]

# Cloudflare R2 Config
CLOUDFLARE_BUCKET_NAME = "linknamali"
CLOUDFLARE_ENDPOINT = "https://d418c3595b04db7f9e063c255ea021d0.r2.cloudflarestorage.com"

# Initialize R2 client
s3_client = boto3.client(
    "s3",
    endpoint_url=CLOUDFLARE_ENDPOINT,
    aws_access_key_id=CLOUDFLARE_ACCESS_KEY,
    aws_secret_access_key=CLOUDFLARE_SECRET_KEY
)

# Function to upload a file
def upload_to_r2(file_path, object_name):
    try:
        s3_client.upload_file(file_path, CLOUDFLARE_BUCKET_NAME, object_name)
        print(f"✅ Uploaded: {file_path} → {CLOUDFLARE_BUCKET_NAME}/{object_name}")
        public_url = f"https://files.linknamali.ke/{object_name}"
        print(f"🌍 Public URL: {public_url}")
        return public_url
    except Exception as e:
        print(f"❌ Upload failed: {e}")


def delete_r2_folder(bucket_name, folder_prefix):
    """
    Deletes all objects within a specified folder in the Cloudflare R2 bucket.
    
    :param bucket_name: Name of the Cloudflare R2 bucket.
    :param folder_prefix: Folder path to delete (e.g., "blogs/blogid/").
    """
    objects = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=folder_prefix)

    if "Contents" in objects:
        for obj in objects["Contents"]:
            print(f"Deleting: {obj['Key']}")
            s3_client.delete_object(Bucket=bucket_name, Key=obj["Key"])
        print(f"✅ Folder '{folder_prefix}' emptied successfully!")
    else:
        print(f"🛑 No objects found in '{folder_prefix}'.")


# Test upload
file_path = "test.png"
object_name = "tests/test.png"
upload_to_r2(file_path, object_name)
#delete_r2_folder(CLOUDFLARE_BUCKET_NAME,"blogs/")