from typing import Optional

from pydantic import BaseModel


class AddToCartRequest(BaseModel):
    product_id: int
    quantity: int = 1


class UpdateCartItemRequest(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_image: Optional[str]
    quantity: int
    price: float
    total: float


class CartResponse(BaseModel):
    id: int
    items: list[CartItemResponse]
    subtotal: float
    item_count: int
