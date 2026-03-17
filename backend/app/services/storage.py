import logging

import boto3
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)


def get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )


def upload_file(file_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    """Upload file to S3 and return the URL."""
    s3 = get_s3_client()
    key = f"uploads/{filename}"
    try:
        s3.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
        logger.info("Uploaded file to S3: %s", url)
        return url
    except ClientError:
        logger.exception("S3 upload failed")
        raise
