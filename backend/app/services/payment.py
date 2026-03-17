import hashlib
import hmac
import logging

import razorpay

from app.config import settings

logger = logging.getLogger(__name__)


def get_razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_razorpay_order(amount_inr: float, order_number: str) -> dict:
    """Create a Razorpay order. Amount in INR, converted to paise."""
    client = get_razorpay_client()
    amount_paise = int(amount_inr * 100)
    order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": order_number,
        "notes": {"order_number": order_number},
    })
    logger.info("Razorpay order created: %s for %s", order["id"], order_number)
    return order


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify Razorpay webhook signature."""
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature."""
    client = get_razorpay_client()
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        })
        return True
    except razorpay.errors.SignatureVerificationError:
        logger.warning("Payment signature verification failed")
        return False
