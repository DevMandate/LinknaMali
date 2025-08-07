import hvac  # Vault Client
import aioboto3  # Async Cloudflare R2 Client
import os

VAULT_ADDR = "http://127.0.0.1:8200"
VAULT_TOKEN = os.getenv("VAULT_TOKEN")

class SecretManager:
    def __init__(self):
        self.vault_client = hvac.Client(url=VAULT_ADDR, token=VAULT_TOKEN)
        self.s3_client = None
        self._setup_s3_client()
    
    def _setup_s3_client(self):
        """Fetch Cloudflare R2 credentials from Vault and initialize S3 client."""
        try:
            secret = self.vault_client.read("secret/data/cloudflare")
            if not secret or "data" not in secret or "data" not in secret["data"]:
                raise Exception("Missing Cloudflare credentials in Vault")

            credentials = secret["data"]["data"]
            CLOUDFLARE_ACCESS_KEY = credentials["access_key"]
            CLOUDFLARE_SECRET_KEY = credentials["secret_key"]
            CLOUDFLARE_ENDPOINT = "https://d418c3595b04db7f9e063c255ea021d0.r2.cloudflarestorage.com"
            
            self.s3_session = aioboto3.Session()
            self.s3_client_params = {
                "endpoint_url": CLOUDFLARE_ENDPOINT,
                "aws_access_key_id": CLOUDFLARE_ACCESS_KEY,
                "aws_secret_access_key": CLOUDFLARE_SECRET_KEY,
            }
        except Exception as e:
            print(f"Error setting up S3 client: {str(e)}")
    
    def get_secret(self, path):
        """Fetch secrets from Vault."""
        try:
            secret = self.vault_client.read(f"secret/data/{path}")
            return secret["data"]["data"] if secret and "data" in secret else None
        except Exception as e:
            print(f"Error retrieving secret from Vault: {str(e)}")
            return None

secrets_manager = SecretManager()
#We reuse this session when creating new S3 clients, reducing overhead.
s3_session = secrets_manager.s3_session
#This dictionary stores AWS credentials and endpoint for S3 client.
s3_client_params = secrets_manager.s3_client_params
get_secret = secrets_manager.get_secret
