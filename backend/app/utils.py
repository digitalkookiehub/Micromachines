import logging
from datetime import datetime, timezone

from slugify import slugify

logger = logging.getLogger(__name__)


def generate_slug(text: str) -> str:
    """Generate a URL-friendly slug from text."""
    return slugify(text, max_length=250)


def generate_order_number(sequence: int) -> str:
    """Generate order number like ORD-20260315-0001."""
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"ORD-{date_str}-{sequence:04d}"


def generate_invoice_number(sequence: int) -> str:
    """Generate invoice number like INV-2026-0001."""
    year = datetime.now(timezone.utc).year
    return f"INV-{year}-{sequence:04d}"


def generate_dealer_id(sequence: int) -> str:
    """Generate dealer display ID like DLR-0001."""
    return f"DLR-{sequence:04d}"
