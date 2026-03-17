import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin


class CreditTransactionType(str, enum.Enum):
    usage = "usage"
    settlement = "settlement"


class CreditTransaction(Base, TimestampMixin):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    dealer_profile_id = Column(
        Integer, ForeignKey("dealer_profiles.id", ondelete="CASCADE"), nullable=False
    )
    order_id = Column(
        Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True
    )
    transaction_type = Column(
        Enum(CreditTransactionType), nullable=False
    )
    amount = Column(Numeric(12, 2), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    settled_at = Column(DateTime(timezone=True), nullable=True)
    settled_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes = Column(Text, nullable=True)

    # Relationships
    dealer_profile = relationship("DealerProfile", backref="credit_transactions")
    order = relationship("Order", backref="credit_transaction")
    settled_by_user = relationship("User", foreign_keys=[settled_by])
