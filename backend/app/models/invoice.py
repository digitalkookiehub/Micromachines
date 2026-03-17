from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(30), unique=True, index=True, nullable=False)
    order_id = Column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    billing_name = Column(String(200), nullable=False)
    billing_address = Column(JSON, nullable=True)
    gstin = Column(String(20), nullable=True)
    subtotal = Column(Numeric(12, 2), nullable=False)
    cgst_amount = Column(Numeric(12, 2), default=0)
    sgst_amount = Column(Numeric(12, 2), default=0)
    igst_amount = Column(Numeric(12, 2), default=0)
    total_tax = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    place_of_supply = Column(String(50), nullable=False)
    is_igst = Column(Boolean, default=False)
    pdf_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="invoice")
    user = relationship("User", foreign_keys=[user_id])
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(
        Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False
    )
    product_name = Column(String(300), nullable=False)
    hsn_code = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    taxable_amount = Column(Numeric(12, 2), nullable=False)
    cgst_rate = Column(Numeric(5, 2), default=9.0)
    cgst_amount = Column(Numeric(12, 2), default=0)
    sgst_rate = Column(Numeric(5, 2), default=9.0)
    sgst_amount = Column(Numeric(12, 2), default=0)
    igst_rate = Column(Numeric(5, 2), default=18.0)
    igst_amount = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), nullable=False)

    # Relationships
    invoice = relationship("Invoice", back_populates="items")
