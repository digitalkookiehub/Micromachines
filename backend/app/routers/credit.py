import logging
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import require_approved_dealer
from app.database import get_db
from app.models.credit import CreditTransaction, CreditTransactionType
from app.models.order import Order
from app.models.user import DealerTier, User
from app.schemas.credit import CreditSummaryResponse, CreditTransactionResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/credit", tags=["credit"])

TIER_TERMS_DAYS = {
    DealerTier.silver: 30,
    DealerTier.gold: 60,
    DealerTier.platinum: 90,
}


def get_used_credit(db: Session, dealer_profile_id: int) -> Decimal:
    """Calculate total outstanding (unsettled usage) credit for a dealer."""
    result = (
        db.query(func.coalesce(func.sum(CreditTransaction.amount), 0))
        .filter(
            CreditTransaction.dealer_profile_id == dealer_profile_id,
            CreditTransaction.transaction_type == CreditTransactionType.usage,
            CreditTransaction.settled_at.is_(None),
        )
        .scalar()
    )
    return Decimal(str(result))


@router.get("/summary", response_model=CreditSummaryResponse)
async def credit_summary(
    user: User = Depends(require_approved_dealer),
    db: Session = Depends(get_db),
):
    """Get credit summary for the current dealer."""
    dp = user.dealer_profile
    if not dp:
        raise HTTPException(status_code=403, detail="No dealer profile")

    credit_limit = Decimal(str(dp.credit_limit or 0))
    used = get_used_credit(db, dp.id)
    tier = dp.tier or DealerTier.silver
    terms_days = TIER_TERMS_DAYS.get(tier, 30)

    return CreditSummaryResponse(
        credit_limit=float(credit_limit),
        used=float(used),
        available=float(credit_limit - used),
        tier=tier.value,
        terms_days=terms_days,
    )


@router.get("/transactions", response_model=list[CreditTransactionResponse])
async def credit_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(require_approved_dealer),
    db: Session = Depends(get_db),
):
    """Get paginated credit transaction history for the current dealer."""
    dp = user.dealer_profile
    if not dp:
        raise HTTPException(status_code=403, detail="No dealer profile")

    txns = (
        db.query(CreditTransaction)
        .filter(CreditTransaction.dealer_profile_id == dp.id)
        .order_by(CreditTransaction.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    results = []
    for t in txns:
        order_number = None
        if t.order_id:
            order = db.query(Order).filter(Order.id == t.order_id).first()
            if order:
                order_number = order.order_number

        settled_by_name = None
        if t.settled_by_user:
            settled_by_name = t.settled_by_user.full_name

        results.append(
            CreditTransactionResponse(
                id=t.id,
                order_id=t.order_id,
                order_number=order_number,
                transaction_type=t.transaction_type.value,
                amount=float(t.amount),
                due_date=t.due_date,
                settled_at=t.settled_at,
                settled_by_name=settled_by_name,
                notes=t.notes,
                created_at=t.created_at,
            )
        )

    return results
