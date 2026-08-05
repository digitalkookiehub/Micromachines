import logging
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import AddToCartRequest, CartResponse, CartItemResponse, UpdateCartItemRequest
from app.services.pricing import get_effective_price

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cart", tags=["cart"])


def _get_role_price(product: Product, user: User) -> Decimal:
    """Price this user pays — identical to the catalogue price and the order line."""
    return get_effective_price(product, user)


def _get_or_create_cart(user: User, db: Session) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
        db.flush()
    return cart


def _build_cart_response(cart: Cart, user: User, db: Session) -> CartResponse:
    items = []
    subtotal = Decimal("0")
    for ci in cart.items:
        product = db.query(Product).filter(Product.id == ci.product_id).first()
        if not product:
            continue
        price = _get_role_price(product, user)
        total = price * ci.quantity
        subtotal += total
        items.append(CartItemResponse(
            id=ci.id,
            product_id=ci.product_id,
            product_name=product.name,
            product_image=product.image_url,
            quantity=ci.quantity,
            price=float(price),
            total=float(total),
        ))
    return CartResponse(
        id=cart.id,
        items=items,
        subtotal=float(subtotal),
        item_count=len(items),
    )


@router.get("", response_model=CartResponse)
async def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = _get_or_create_cart(user, db)
    db.commit()
    return _build_cart_response(cart, user, db)


@router.post("/items", response_model=CartResponse, status_code=201)
async def add_to_cart(
    req: AddToCartRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == req.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock_quantity < req.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    cart = _get_or_create_cart(user, db)
    price = _get_role_price(product, user)

    existing = db.query(CartItem).filter(
        CartItem.cart_id == cart.id, CartItem.product_id == req.product_id
    ).first()

    if existing:
        existing.quantity += req.quantity
        existing.price_at_add = price
    else:
        item = CartItem(
            cart_id=cart.id,
            product_id=req.product_id,
            quantity=req.quantity,
            price_at_add=price,
        )
        db.add(item)

    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart, user, db)


@router.put("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: int,
    req: UpdateCartItemRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = _get_or_create_cart(user, db)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if req.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = req.quantity
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart, user, db)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = _get_or_create_cart(user, db)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart, user, db)
