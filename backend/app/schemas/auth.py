from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.user import DealerTier, UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.customer
    company_name: Optional[str] = None
    gst_number: Optional[str] = None


class LoginResponse(BaseModel):
    message: str
    user: "UserResponse"


class DealerProfileResponse(BaseModel):
    id: int
    company_name: str
    dealer_id: str
    gst_number: Optional[str]
    tier: DealerTier
    credit_limit: float
    is_approved: bool

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    is_verified: bool
    company_name: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: Optional[datetime]
    dealer_profile: Optional[DealerProfileResponse] = None

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    logo_url: Optional[str] = None


class MessageResponse(BaseModel):
    message: str
