import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.invoice import Invoice
from app.models.order import Order, PaymentStatus
from app.models.user import User
from app.schemas.invoice import InvoiceResponse
from app.services.invoice_generator import generate_invoice

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("/generate/{order_id}", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate invoice for a paid order."""
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status != PaymentStatus.paid:
        raise HTTPException(status_code=400, detail="Order not yet paid")

    existing = db.query(Invoice).filter(Invoice.order_id == order_id).first()
    if existing:
        return existing

    invoice = generate_invoice(order, db)
    return invoice


@router.get("", response_model=list[InvoiceResponse])
async def list_invoices(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Invoice)
        .filter(Invoice.user_id == user.id)
        .order_by(Invoice.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download invoice PDF."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if not invoice.pdf_url:
        raise HTTPException(status_code=404, detail="PDF not yet generated")
    return RedirectResponse(url=invoice.pdf_url)
