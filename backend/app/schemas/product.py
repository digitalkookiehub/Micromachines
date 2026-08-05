from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.product import ProductCategory


class ProductCreateRequest(BaseModel):
    name: str
    brand: str
    sku: str
    hsn_code: str
    category: ProductCategory
    description: Optional[str] = None
    specifications: dict = {}
    customer_price: float
    dealer_price: float
    stock_quantity: int = 0
    image_url: Optional[str] = None


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    specifications: Optional[dict] = None
    customer_price: Optional[float] = None
    dealer_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerProductResponse(BaseModel):
    """Product response for anonymous/customer users — MRP only."""
    id: int
    name: str
    slug: str
    brand: str
    category: ProductCategory
    description: Optional[str]
    specifications: dict
    price: float  # customer_price (MRP)
    tax_label: str = "Inclusive of all taxes"
    stock_quantity: int
    image_url: Optional[str]
    sku: str
    hsn_code: str
    is_active: bool
    created_at: Optional[datetime]


class DealerProductResponse(BaseModel):
    """Product response for approved dealers — dealer price + savings."""
    id: int
    name: str
    slug: str
    brand: str
    category: ProductCategory
    description: Optional[str]
    specifications: dict
    price: float         # dealer_price
    mrp: float           # customer_price
    savings_percent: float
    savings_amount: float
    is_dealer: bool = True
    stock_quantity: int
    image_url: Optional[str]
    sku: str
    hsn_code: str
    is_active: bool
    created_at: Optional[datetime]


class ProductDraftResponse(BaseModel):
    id: int
    image_url: str
    ai_detected_data: Optional[dict]
    web_scraped_data: Optional[dict]
    final_data: Optional[dict]
    status: str
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ProductDraftUpdateRequest(BaseModel):
    final_data: Optional[dict] = None


class PublishDraftRequest(BaseModel):
    customer_price: float
    dealer_price: float
    sku: str
    hsn_code: str


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class BrandResponse(BaseModel):
    id: int
    name: str
    logo_url: Optional[str]

    model_config = {"from_attributes": True}


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    pages: int


def serialize_product_for_role(product, user=None) -> dict:
    """CRITICAL: Serialize product with only role-appropriate pricing."""
    from app.services.pricing import get_effective_price, sees_dealer_pricing

    base = {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "brand": product.brand,
        "category": product.category.value,
        "description": product.description,
        "specifications": product.specifications or {},
        "stock_quantity": product.stock_quantity,
        "image_url": product.image_url,
        "sku": product.sku,
        "hsn_code": product.hsn_code,
        "is_active": product.is_active,
        "created_at": product.created_at.isoformat() if product.created_at else None,
    }

    # Price shown must equal the price charged — cart and checkout use this same helper
    price = float(get_effective_price(product, user))

    if sees_dealer_pricing(user):
        mrp = float(product.customer_price)
        savings = mrp - price
        savings_pct = (savings / mrp * 100) if mrp > 0 else 0
        return {
            **base,
            "price": price,
            "mrp": mrp,
            "savings_percent": round(savings_pct, 1),
            "savings_amount": round(savings, 2),
            "is_dealer": True,
        }
    else:
        return {
            **base,
            "price": price,
            "tax_label": "Inclusive of all taxes",
        }
