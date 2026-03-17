from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.order import OrderStatus, PaymentMethod, PaymentStatus


class CreateOrderRequest(BaseModel):
    shipping_address: dict
    billing_address: dict
    notes: Optional[str] = None
    payment_method: Optional[str] = "razorpay"


class OrderItemResponse(BaseModel):
    id: int
    product_name: str
    quantity: int
    unit_price: float
    total_price: float
    hsn_code: str

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    subtotal: float
    tax_amount: float
    total: float
    shipping_address: Optional[dict]
    billing_address: Optional[dict]
    payment_id: Optional[str]
    payment_status: PaymentStatus
    payment_method: PaymentMethod = PaymentMethod.razorpay
    credit_due_date: Optional[datetime] = None
    notes: Optional[str]
    created_at: Optional[datetime]
    items: list[OrderItemResponse] = []

    model_config = {"from_attributes": True}


class PaymentInitResponse(BaseModel):
    razorpay_order_id: str
    amount: int  # in paise
    currency: str
    key_id: str
