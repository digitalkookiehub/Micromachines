import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.config import settings
from app.database import get_db
from app.models.cart import Cart, CartItem
from app.models.credit import CreditTransaction, CreditTransactionType
from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus
from app.models.product import Product
from app.models.user import DealerTier, User, UserRole
from app.routers.credit import TIER_TERMS_DAYS, get_used_credit
from app.schemas.order import CreateOrderRequest, OrderResponse, PaymentInitResponse
from app.services.payment import create_razorpay_order
from app.services.pricing import get_effective_price
from app.tasks.product_tasks import generate_invoice_pdf, send_notification_email
from app.utils import generate_order_number

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])


def _get_role_price(product: Product, user: User) -> Decimal:
    """Charged price for this user — identical to the price shown in catalogue and cart."""
    return get_effective_price(product, user)


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    req: CreateOrderRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create order from cart."""
    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    is_credit = req.payment_method == "credit"

    # Validate credit eligibility
    if is_credit:
        if user.role != UserRole.dealer or not user.dealer_profile or not user.dealer_profile.is_approved:
            raise HTTPException(status_code=403, detail="Credit payment is only available for approved dealers")
        dp = user.dealer_profile
        credit_limit = Decimal(str(dp.credit_limit or 0))
        if credit_limit <= 0:
            raise HTTPException(status_code=400, detail="No credit limit set. Contact admin.")

    order_count = db.query(Order).count()
    order = Order(
        order_number=generate_order_number(order_count + 1),
        user_id=user.id,
        shipping_address=req.shipping_address,
        billing_address=req.billing_address,
        notes=req.notes,
        payment_method=PaymentMethod.credit if is_credit else PaymentMethod.razorpay,
        subtotal=0,
        tax_amount=0,
        total=0,
    )
    db.add(order)
    db.flush()

    subtotal = Decimal("0")
    for ci in cart.items:
        product = db.query(Product).filter(Product.id == ci.product_id).first()
        if not product or not product.is_active:
            continue
        if product.stock_quantity < ci.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}",
            )

        price = _get_role_price(product, user)
        total_price = price * ci.quantity
        subtotal += total_price

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=ci.quantity,
            unit_price=price,
            total_price=total_price,
            hsn_code=product.hsn_code,
        )
        db.add(order_item)
        product.stock_quantity -= ci.quantity

    tax_rate = Decimal(str(settings.DEFAULT_GST_RATE)) / 100
    tax_amount = subtotal * tax_rate
    order.subtotal = subtotal
    order.tax_amount = tax_amount
    order.total = subtotal + tax_amount

    # Handle credit payment
    if is_credit:
        dp = user.dealer_profile
        used = get_used_credit(db, dp.id)
        available = Decimal(str(dp.credit_limit or 0)) - used
        if available < order.total:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient credit. Available: {float(available):.2f}, Order total: {float(order.total):.2f}",
            )

        tier = dp.tier or DealerTier.silver
        terms_days = TIER_TERMS_DAYS.get(tier, 30)
        due_date = datetime.now(timezone.utc) + timedelta(days=terms_days)

        order.payment_status = PaymentStatus.credit_pending
        order.status = OrderStatus.confirmed
        order.credit_due_date = due_date

        credit_txn = CreditTransaction(
            dealer_profile_id=dp.id,
            order_id=order.id,
            transaction_type=CreditTransactionType.usage,
            amount=order.total,
            due_date=due_date,
        )
        db.add(credit_txn)

    # Clear cart
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

    db.commit()
    db.refresh(order)
    logger.info("Order %s created for user %s (method=%s)", order.order_number, user.email, order.payment_method.value)

    # Trigger async tasks for credit orders (confirmed immediately)
    if is_credit:
        generate_invoice_pdf.delay(order.id)
        send_notification_email.delay(
            to_email=user.email,
            subject=f"Order {order.order_number} Confirmed (Pay Later)",
            body=f"Your order {order.order_number} has been confirmed on credit. Total: \u20b9{order.total}. Payment due by {order.credit_due_date.strftime('%d %b %Y')}.",
        )

    return order


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/pay", response_model=PaymentInitResponse)
async def initiate_payment(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create Razorpay order for payment."""
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status == PaymentStatus.paid:
        raise HTTPException(status_code=400, detail="Order already paid")
    if order.payment_method == PaymentMethod.credit:
        raise HTTPException(status_code=400, detail="Credit orders cannot be paid via Razorpay")

    rz_order = create_razorpay_order(float(order.total), order.order_number)

    order.payment_id = rz_order["id"]
    db.commit()

    return PaymentInitResponse(
        razorpay_order_id=rz_order["id"],
        amount=rz_order["amount"],
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID,
    )


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Razorpay payment webhook."""
    from app.services.payment import verify_webhook_signature

    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not verify_webhook_signature(body, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    import json
    payload = json.loads(body)
    event = payload.get("event", "")

    if event == "payment.captured":
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        rz_order_id = payment_entity.get("order_id")

        order = db.query(Order).filter(Order.payment_id == rz_order_id).first()
        if order:
            order.payment_status = PaymentStatus.paid
            order.status = OrderStatus.confirmed
            db.commit()

            generate_invoice_pdf.delay(order.id)
            send_notification_email.delay(
                to_email=order.user.email if order.user else "",
                subject=f"Order {order.order_number} Confirmed",
                body=f"Your order {order.order_number} has been confirmed. Total: \u20b9{order.total}",
            )
            logger.info("Payment captured for order %s", order.order_number)

    return {"status": "ok"}
