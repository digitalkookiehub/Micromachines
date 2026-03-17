from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CreditSummaryResponse(BaseModel):
    credit_limit: float
    used: float
    available: float
    tier: str
    terms_days: int


class CreditTransactionResponse(BaseModel):
    id: int
    order_id: Optional[int]
    order_number: Optional[str] = None
    transaction_type: str
    amount: float
    due_date: Optional[datetime]
    settled_at: Optional[datetime]
    settled_by_name: Optional[str] = None
    notes: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class AdminCreditOutstandingResponse(BaseModel):
    id: int
    dealer_id: str
    company_name: str
    order_id: Optional[int]
    order_number: Optional[str] = None
    amount: float
    due_date: Optional[datetime]
    is_overdue: bool
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class SetCreditLimitRequest(BaseModel):
    credit_limit: float


class SettleTransactionRequest(BaseModel):
    notes: Optional[str] = None
