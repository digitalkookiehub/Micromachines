import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin


class UserRole(str, enum.Enum):
    customer = "customer"
    dealer = "dealer"
    admin = "admin"


class DealerTier(str, enum.Enum):
    silver = "silver"
    gold = "gold"
    platinum = "platinum"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    company_name = Column(String(200), nullable=True)
    logo_url = Column(Text, nullable=True)

    # Relationships
    dealer_profile = relationship(
        "DealerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="DealerProfile.user_id",
    )
    refresh_tokens = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    products = relationship("Product", back_populates="creator", foreign_keys="Product.created_by")
    orders = relationship("Order", back_populates="user")
    carts = relationship("Cart", back_populates="user")


class DealerProfile(Base, TimestampMixin):
    __tablename__ = "dealer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    company_name = Column(String(200), nullable=False)
    dealer_id = Column(String(20), unique=True, nullable=False)
    gst_number = Column(String(20), nullable=True)
    tier = Column(Enum(DealerTier), default=DealerTier.silver)
    credit_limit = Column(Numeric(12, 2), default=0)
    is_approved = Column(Boolean, default=False)
    special_discount = Column(Numeric(5, 2), default=0)  # Extra % off dealer price
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="dealer_profile", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token = Column(String(500), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
