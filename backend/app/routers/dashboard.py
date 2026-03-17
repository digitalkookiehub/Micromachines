import logging

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.order import Order, PaymentStatus
from app.models.product import Product
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Role-based dashboard statistics."""
    if user.role == UserRole.dealer:
        products_count = (
            db.query(func.count(Product.id))
            .filter(Product.created_by == user.id, Product.is_active == True)
            .scalar()
        )
        orders_received = db.query(func.count(Order.id)).filter(Order.user_id == user.id).scalar()
        revenue = (
            db.query(func.sum(Order.total))
            .filter(Order.user_id == user.id, Order.payment_status == PaymentStatus.paid)
            .scalar()
        ) or 0

        recent_orders = (
            db.query(Order)
            .filter(Order.user_id == user.id)
            .order_by(Order.created_at.desc())
            .limit(5)
            .all()
        )

        return {
            "role": "dealer",
            "products_listed": products_count,
            "total_orders": orders_received,
            "total_revenue": float(revenue),
            "dealer_tier": user.dealer_profile.tier.value if user.dealer_profile else "silver",
            "recent_orders": [
                {
                    "id": o.id,
                    "order_number": o.order_number,
                    "total": float(o.total),
                    "status": o.status.value,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                }
                for o in recent_orders
            ],
        }
    else:
        # Customer dashboard
        total_orders = db.query(func.count(Order.id)).filter(Order.user_id == user.id).scalar()
        recent_orders = (
            db.query(Order)
            .filter(Order.user_id == user.id)
            .order_by(Order.created_at.desc())
            .limit(5)
            .all()
        )

        return {
            "role": "customer",
            "total_orders": total_orders,
            "recent_orders": [
                {
                    "id": o.id,
                    "order_number": o.order_number,
                    "total": float(o.total),
                    "status": o.status.value,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                }
                for o in recent_orders
            ],
        }
