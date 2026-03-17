import logging
from decimal import Decimal

from sqlalchemy.orm import Session

from app.config import settings
from app.models.invoice import Invoice, InvoiceItem
from app.models.order import Order
from app.utils import generate_invoice_number

logger = logging.getLogger(__name__)


def calculate_gst(
    taxable_amount: Decimal,
    buyer_state: str,
    cgst_rate: Decimal = Decimal("9"),
    sgst_rate: Decimal = Decimal("9"),
    igst_rate: Decimal = Decimal("18"),
) -> dict:
    """Calculate GST based on seller/buyer state."""
    seller_state = settings.SELLER_STATE

    if seller_state.lower() == buyer_state.lower():
        cgst = taxable_amount * cgst_rate / 100
        sgst = taxable_amount * sgst_rate / 100
        return {
            "cgst": round(cgst, 2),
            "sgst": round(sgst, 2),
            "igst": Decimal("0"),
            "total_tax": round(cgst + sgst, 2),
            "is_igst": False,
        }
    else:
        igst = taxable_amount * igst_rate / 100
        return {
            "cgst": Decimal("0"),
            "sgst": Decimal("0"),
            "igst": round(igst, 2),
            "total_tax": round(igst, 2),
            "is_igst": True,
        }


def generate_invoice(order: Order, db: Session) -> Invoice:
    """Generate a GST-compliant invoice for a paid order."""
    billing = order.billing_address or {}
    buyer_state = billing.get("state", settings.SELLER_STATE)

    invoice_count = db.query(Invoice).count()
    invoice = Invoice(
        invoice_number=generate_invoice_number(invoice_count + 1),
        order_id=order.id,
        user_id=order.user_id,
        billing_name=billing.get("name", order.user.full_name if order.user else ""),
        billing_address=billing,
        gstin=None,
        subtotal=order.subtotal,
        place_of_supply=buyer_state,
    )

    # Get dealer GSTIN if applicable
    if order.user and order.user.dealer_profile:
        invoice.gstin = order.user.dealer_profile.gst_number

    total_cgst = Decimal("0")
    total_sgst = Decimal("0")
    total_igst = Decimal("0")

    for oi in order.items:
        taxable = Decimal(str(oi.total_price))
        gst = calculate_gst(taxable, buyer_state)

        item = InvoiceItem(
            product_name=oi.product_name,
            hsn_code=oi.hsn_code,
            quantity=oi.quantity,
            unit_price=oi.unit_price,
            taxable_amount=taxable,
            cgst_rate=Decimal("9"),
            cgst_amount=gst["cgst"],
            sgst_rate=Decimal("9"),
            sgst_amount=gst["sgst"],
            igst_rate=Decimal("18"),
            igst_amount=gst["igst"],
            total=taxable + gst["total_tax"],
        )
        invoice.items.append(item)

        total_cgst += gst["cgst"]
        total_sgst += gst["sgst"]
        total_igst += gst["igst"]

    invoice.cgst_amount = total_cgst
    invoice.sgst_amount = total_sgst
    invoice.igst_amount = total_igst
    invoice.total_tax = total_cgst + total_sgst + total_igst
    invoice.total_amount = invoice.subtotal + invoice.total_tax
    invoice.is_igst = total_igst > 0

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    logger.info("Invoice %s generated for order %s", invoice.invoice_number, order.order_number)
    return invoice
