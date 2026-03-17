import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.database import get_db
from app.models.credit import CreditTransaction, CreditTransactionType
from app.models.order import Order, PaymentStatus
from app.models.product import Product
from app.models.user import DealerProfile, User, UserRole
from app.schemas.auth import MessageResponse, UserResponse
from app.schemas.credit import (
    AdminCreditOutstandingResponse,
    SettleTransactionRequest,
)
from app.tasks.product_tasks import send_notification_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])
admin_only = require_role(UserRole.admin)


@router.get("/stats")
async def get_stats(
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar()
    total_dealers = db.query(func.count(User.id)).filter(User.role == UserRole.dealer).scalar()
    pending_dealers = (
        db.query(func.count(DealerProfile.id))
        .filter(DealerProfile.is_approved == False)
        .scalar()
    )
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()
    total_revenue = (
        db.query(func.sum(Order.total))
        .filter(Order.payment_status == PaymentStatus.paid)
        .scalar()
    ) or 0

    return {
        "total_users": total_users,
        "total_dealers": total_dealers,
        "pending_dealers": pending_dealers,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
    }


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    role: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    is_active: bool | None = None,
    role: str | None = None,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if is_active is not None:
        target.is_active = is_active
    if role is not None:
        target.role = role
    db.commit()
    db.refresh(target)
    return target


@router.get("/dealers")
async def list_dealers(
    approved: bool | None = None,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    query = db.query(DealerProfile)
    if approved is not None:
        query = query.filter(DealerProfile.is_approved == approved)
    dealers = query.all()
    return [
        {
            "id": d.id,
            "user_id": d.user_id,
            "company_name": d.company_name,
            "dealer_id": d.dealer_id,
            "gst_number": d.gst_number,
            "is_approved": d.is_approved,
            "special_discount": float(d.special_discount) if d.special_discount else 0,
            "credit_limit": float(d.credit_limit) if d.credit_limit else 0,
            "tier": d.tier.value if d.tier else "silver",
            "user_email": d.user.email if d.user else None,
            "user_name": d.user.full_name if d.user else None,
        }
        for d in dealers
    ]


@router.post("/dealers/{dealer_id}/approve", response_model=MessageResponse)
async def approve_dealer(
    dealer_id: int,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    dealer = db.query(DealerProfile).filter(DealerProfile.id == dealer_id).first()
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found")

    dealer.is_approved = True
    dealer.approved_by = user.id
    dealer.approved_at = datetime.now(timezone.utc)
    db.commit()

    if dealer.user:
        send_notification_email.delay(
            to_email=dealer.user.email,
            subject="Dealer Account Approved - MicroMachines",
            body=f"Your dealer account ({dealer.company_name}) has been approved. You can now access dealer pricing and add products.",
        )

    logger.info("Dealer %s approved by admin %s", dealer.dealer_id, user.email)
    return MessageResponse(message=f"Dealer {dealer.dealer_id} approved")


@router.put("/dealers/{dealer_id}/discount", response_model=MessageResponse)
async def set_dealer_discount(
    dealer_id: int,
    discount: float,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    """Set special discount for a dealer."""
    dealer = db.query(DealerProfile).filter(DealerProfile.id == dealer_id).first()
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found")
    if discount < 0 or discount > 50:
        raise HTTPException(status_code=400, detail="Discount must be between 0 and 50%")
    dealer.special_discount = discount
    db.commit()
    logger.info("Dealer %s special discount set to %s%% by admin %s", dealer.dealer_id, discount, user.email)
    return MessageResponse(message=f"Special discount set to {discount}% for {dealer.dealer_id}")


@router.post("/dealers/{dealer_id}/reject", response_model=MessageResponse)
async def reject_dealer(
    dealer_id: int,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    dealer = db.query(DealerProfile).filter(DealerProfile.id == dealer_id).first()
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found")

    if dealer.user:
        send_notification_email.delay(
            to_email=dealer.user.email,
            subject="Dealer Application Update - MicroMachines",
            body=f"Your dealer application for {dealer.company_name} was not approved. Please contact support for more information.",
        )

    db.delete(dealer)
    if dealer.user:
        dealer.user.role = UserRole.customer
    db.commit()

    logger.info("Dealer %s rejected by admin %s", dealer.dealer_id, user.email)
    return MessageResponse(message=f"Dealer {dealer.dealer_id} rejected")


@router.get("/orders")
async def list_all_orders(
    status: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "user_email": o.user.email if o.user else None,
            "status": o.status.value,
            "total": float(o.total),
            "payment_status": o.payment_status.value,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


@router.get("/products")
async def list_all_products(
    active: bool | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if active is not None:
        query = query.filter(Product.is_active == active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_term))
            | (Product.brand.ilike(search_term))
            | (Product.sku.ilike(search_term))
        )
    total = query.count()
    products = query.order_by(Product.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": products,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.put("/products/{product_id}")
async def moderate_product(
    product_id: int,
    is_active: bool | None = None,
    customer_price: float | None = None,
    dealer_price: float | None = None,
    stock_quantity: int | None = None,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if is_active is not None:
        product.is_active = is_active
    if customer_price is not None:
        product.customer_price = customer_price
    if dealer_price is not None:
        product.dealer_price = dealer_price
    if stock_quantity is not None:
        product.stock_quantity = stock_quantity
    db.commit()
    db.refresh(product)
    return product


# --- Credit Management Endpoints ---


@router.put("/dealers/{dealer_id}/credit-limit", response_model=MessageResponse)
async def set_credit_limit(
    dealer_id: int,
    credit_limit: float,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    """Set credit limit for a dealer."""
    dealer = db.query(DealerProfile).filter(DealerProfile.id == dealer_id).first()
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found")
    if credit_limit < 0:
        raise HTTPException(status_code=400, detail="Credit limit cannot be negative")
    dealer.credit_limit = credit_limit
    db.commit()
    logger.info(
        "Dealer %s credit limit set to %s by admin %s",
        dealer.dealer_id, credit_limit, user.email,
    )
    return MessageResponse(message=f"Credit limit set to {credit_limit} for {dealer.dealer_id}")


@router.get("/credit/outstanding", response_model=list[AdminCreditOutstandingResponse])
async def get_outstanding_credit(
    overdue_only: bool = False,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    """Get all unsettled credit transactions."""
    query = (
        db.query(CreditTransaction)
        .filter(
            CreditTransaction.transaction_type == CreditTransactionType.usage,
            CreditTransaction.settled_at.is_(None),
        )
    )

    if overdue_only:
        query = query.filter(CreditTransaction.due_date < datetime.now(timezone.utc))

    txns = (
        query.order_by(CreditTransaction.due_date.asc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    now = datetime.now(timezone.utc)
    results = []
    for t in txns:
        order_number = None
        if t.order_id:
            order = db.query(Order).filter(Order.id == t.order_id).first()
            if order:
                order_number = order.order_number

        dp = t.dealer_profile
        is_overdue = t.due_date < now if t.due_date else False

        results.append(
            AdminCreditOutstandingResponse(
                id=t.id,
                dealer_id=dp.dealer_id if dp else "",
                company_name=dp.company_name if dp else "",
                order_id=t.order_id,
                order_number=order_number,
                amount=float(t.amount),
                due_date=t.due_date,
                is_overdue=is_overdue,
                created_at=t.created_at,
            )
        )

    return results


@router.post("/credit/transactions/{transaction_id}/settle", response_model=MessageResponse)
async def settle_credit_transaction(
    transaction_id: int,
    req: SettleTransactionRequest,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    """Mark a credit transaction as settled."""
    txn = (
        db.query(CreditTransaction)
        .filter(
            CreditTransaction.id == transaction_id,
            CreditTransaction.transaction_type == CreditTransactionType.usage,
        )
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Credit transaction not found")
    if txn.settled_at is not None:
        raise HTTPException(status_code=400, detail="Transaction already settled")

    txn.settled_at = datetime.now(timezone.utc)
    txn.settled_by = user.id
    txn.notes = req.notes

    # Update the order payment status if linked
    if txn.order_id:
        order = db.query(Order).filter(Order.id == txn.order_id).first()
        if order:
            order.payment_status = PaymentStatus.paid

    db.commit()
    logger.info("Credit transaction %s settled by admin %s", transaction_id, user.email)
    return MessageResponse(message=f"Transaction {transaction_id} settled")
