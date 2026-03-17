from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class InvoiceItemResponse(BaseModel):
    id: int
    product_name: str
    hsn_code: str
    quantity: int
    unit_price: float
    taxable_amount: float
    cgst_rate: float
    cgst_amount: float
    sgst_rate: float
    sgst_amount: float
    igst_rate: float
    igst_amount: float
    total: float

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    billing_name: str
    gstin: Optional[str]
    subtotal: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    total_tax: float
    total_amount: float
    is_igst: bool
    place_of_supply: str
    pdf_url: Optional[str]
    created_at: Optional[datetime]
    items: list[InvoiceItemResponse] = []

    model_config = {"from_attributes": True}
