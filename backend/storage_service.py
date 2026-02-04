"""
Storage Service

Provides unified interface for multiple storage backends (local, S3, R2).
Supports file upload, download, deletion, and URL generation.
"""
import os
import logging
from typing import Optional, BinaryIO
from pathlib import Path
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


# ============== Storage Backend Interface ==============

class StorageBackend(ABC):
    """Abstract base class for storage backends."""

    @abstractmethod
    async def upload_file(self, key: str, content: bytes, metadata: Optional[dict] = None) -> None:
        """Upload file content to storage."""
        pass

    @abstractmethod
    async def download_file(self, key: str) -> bytes:
        """Download file content from storage."""
        pass

    @abstractmethod
    async def delete_file(self, key: str) -> None:
        """Delete file from storage."""
        pass

    @abstractmethod
    async def file_exists(self, key: str) -> bool:
        """Check if file exists in storage."""
        pass

    @abstractmethod
    async def get_file_url(self, key: str, expires_in: int = 3600) -> str:
        """Get URL for file download (presigned URL for S3, direct path for local)."""
        pass


# ============== Local Storage Backend ==============

class LocalStorageBackend(StorageBackend):
    """Local filesystem storage backend."""

    def __init__(self, base_path: str = "uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Initialized LocalStorageBackend with base_path: {self.base_path}")

    def _get_full_path(self, key: str) -> Path:
        """Get full filesystem path for a storage key."""
        full_path = self.base_path / key
        # Ensure parent directory exists
        full_path.parent.mkdir(parents=True, exist_ok=True)
        return full_path

    async def upload_file(self, key: str, content: bytes, metadata: Optional[dict] = None) -> None:
        """Upload file to local filesystem."""
        file_path = self._get_full_path(key)
        with open(file_path, 'wb') as f:
            f.write(content)
        logger.debug(f"Uploaded file to local storage: {key}")

    async def download_file(self, key: str) -> bytes:
        """Download file from local filesystem."""
        file_path = self._get_full_path(key)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {key}")
        with open(file_path, 'rb') as f:
            return f.read()

    async def delete_file(self, key: str) -> None:
        """Delete file from local filesystem."""
        file_path = self._get_full_path(key)
        if file_path.exists():
            file_path.unlink()
            logger.debug(f"Deleted file from local storage: {key}")
        else:
            logger.warning(f"File not found for deletion: {key}")

    async def file_exists(self, key: str) -> bool:
        """Check if file exists in local filesystem."""
        return self._get_full_path(key).exists()

    async def get_file_url(self, key: str, expires_in: int = 3600) -> str:
        """Return storage key (URL generation handled by API layer for local files)."""
        # For local storage, return the key - the API layer will serve the file
        return key


# ============== S3/R2 Storage Backend ==============

class S3StorageBackend(StorageBackend):
    """S3-compatible storage backend (AWS S3, Cloudflare R2, etc.)."""

    def __init__(
        self,
        bucket_name: str,
        access_key_id: str,
        secret_access_key: str,
        region: Optional[str] = None,
        endpoint_url: Optional[str] = None
    ):
        self.bucket_name = bucket_name
        self.region = region
        self.endpoint_url = endpoint_url

        try:
            import boto3
            from botocore.exceptions import ClientError

            self.boto3 = boto3
            self.ClientError = ClientError

            # Configure S3 client
            config_params = {
                'service_name': 's3',
                'aws_access_key_id': access_key_id,
                'aws_secret_access_key': secret_access_key,
            }

            if region:
                config_params['region_name'] = region

            if endpoint_url:
                # For R2 or custom S3-compatible services
                config_params['endpoint_url'] = endpoint_url

            self.s3_client = self.boto3.client('s3', **config_params)

            # Test connection
            self.s3_client.head_bucket(Bucket=bucket_name)

            storage_type = "R2" if endpoint_url and "r2" in endpoint_url else "S3"
            logger.info(f"Initialized {storage_type} storage backend with bucket: {bucket_name}")

        except ImportError:
            raise ImportError(
                "boto3 is required for S3/R2 storage. "
                "Install it with: pip install boto3"
            )
        except Exception as e:
            logger.error(f"Failed to initialize S3 storage: {e}")
            raise

    async def upload_file(self, key: str, content: bytes, metadata: Optional[dict] = None) -> None:
        """Upload file to S3/R2."""
        try:
            upload_args = {'Bucket': self.bucket_name, 'Key': key, 'Body': content}

            # Add metadata if provided
            if metadata:
                upload_args['Metadata'] = {str(k): str(v) for k, v in metadata.items()}

            self.s3_client.put_object(**upload_args)
            logger.debug(f"Uploaded file to S3 storage: {key}")

        except self.ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise Exception(f"Failed to upload file to S3: {str(e)}")

    async def download_file(self, key: str) -> bytes:
        """Download file from S3/R2."""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            return response['Body'].read()

        except self.ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            if error_code == 'NoSuchKey':
                raise FileNotFoundError(f"File not found in S3: {key}")
            logger.error(f"S3 download failed: {e}")
            raise Exception(f"Failed to download file from S3: {str(e)}")

    async def delete_file(self, key: str) -> None:
        """Delete file from S3/R2."""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            logger.debug(f"Deleted file from S3 storage: {key}")

        except self.ClientError as e:
            logger.error(f"S3 deletion failed: {e}")
            raise Exception(f"Failed to delete file from S3: {str(e)}")

    async def file_exists(self, key: str) -> bool:
        """Check if file exists in S3/R2."""
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except self.ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            if error_code == '404' or error_code == 'NoSuchKey':
                return False
            logger.error(f"S3 existence check failed: {e}")
            return False

    async def get_file_url(self, key: str, expires_in: int = 3600) -> str:
        """Generate presigned URL for S3/R2 file."""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': key},
                ExpiresIn=expires_in
            )
            return url

        except self.ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise Exception(f"Failed to generate file URL: {str(e)}")


# ============== Storage Service Factory ==============

def get_storage_backend() -> StorageBackend:
    """
    Create storage backend based on environment configuration.

    Environment variables:
    - STORAGE_BACKEND: 'local', 's3', or 'r2' (default: 'local')
    - S3_BUCKET_NAME: Bucket name for S3/R2
    - S3_REGION: AWS region (for S3)
    - S3_ENDPOINT_URL: Custom endpoint (for R2)
    - S3_ACCESS_KEY_ID: Access key
    - S3_SECRET_ACCESS_KEY: Secret key

    Returns:
        StorageBackend instance
    """
    backend_type = os.environ.get('STORAGE_BACKEND', 'local').lower()

    # Local storage (default, no credentials required)
    if backend_type == 'local':
        upload_dir = os.environ.get('UPLOAD_DIR', 'uploads')
        return LocalStorageBackend(base_path=upload_dir)

    # S3/R2 storage (requires credentials)
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    access_key_id = os.environ.get('S3_ACCESS_KEY_ID')
    secret_access_key = os.environ.get('S3_SECRET_ACCESS_KEY')

    if not all([bucket_name, access_key_id, secret_access_key]):
        logger.warning(
            f"STORAGE_BACKEND={backend_type} but S3 credentials not complete. "
            f"Falling back to local storage."
        )
        upload_dir = os.environ.get('UPLOAD_DIR', 'uploads')
        return LocalStorageBackend(base_path=upload_dir)

    # Create S3/R2 backend
    region = os.environ.get('S3_REGION')
    endpoint_url = os.environ.get('S3_ENDPOINT_URL')

    try:
        return S3StorageBackend(
            bucket_name=bucket_name,
            access_key_id=access_key_id,
            secret_access_key=secret_access_key,
            region=region,
            endpoint_url=endpoint_url
        )
    except Exception as e:
        logger.error(f"Failed to initialize {backend_type} storage: {e}. Falling back to local storage.")
        upload_dir = os.environ.get('UPLOAD_DIR', 'uploads')
        return LocalStorageBackend(base_path=upload_dir)


# ============== Global Storage Instance ==============

# Global storage backend instance (initialized on module import)
_storage_backend: Optional[StorageBackend] = None


def get_storage() -> StorageBackend:
    """Get or create global storage backend instance."""
    global _storage_backend
    if _storage_backend is None:
        _storage_backend = get_storage_backend()
    return _storage_backend


def reset_storage():
    """Reset storage backend (useful for testing)."""
    global _storage_backend
    _storage_backend = None
