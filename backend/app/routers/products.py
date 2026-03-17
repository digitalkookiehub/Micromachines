import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, get_optional_user, require_approved_dealer
from app.database import get_db
from app.models.product import Brand, Category, Product, ProductDraft, DraftStatus
from app.models.user import User, UserRole
from app.schemas.product import (
    ProductCreateRequest,
    ProductUpdateRequest,
    ProductDraftResponse,
    ProductDraftUpdateRequest,
    PublishDraftRequest,
    CategoryResponse,
    BrandResponse,
    serialize_product_for_role,
)
from app.services.search import index_product, remove_product, search_products
from app.tasks.product_tasks import process_product_image
from app.utils import generate_slug

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """List products with role-based pricing. NEVER returns both prices."""
    query = db.query(Product).filter(Product.is_active == True)

    if category:
        query = query.filter(Product.category == category)
    if brand:
        query = query.filter(Product.brand == brand)

    total = query.count()
    products = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [serialize_product_for_role(p, user) for p in products],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1),
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Search products via Meilisearch with role-based pricing."""
    result = search_products(q, category=category, limit=per_page, offset=(page - 1) * per_page)

    product_ids = [hit["id"] for hit in result["hits"]]
    if not product_ids:
        return {"items": [], "total": 0, "page": page, "per_page": per_page, "pages": 0}

    products = db.query(Product).filter(Product.id.in_(product_ids), Product.is_active == True).all()
    product_map = {p.id: p for p in products}

    items = []
    for pid in product_ids:
        if pid in product_map:
            items.append(serialize_product_for_role(product_map[pid], user))

    return {
        "items": items,
        "total": result["total"],
        "page": page,
        "per_page": per_page,
        "pages": (result["total"] + per_page - 1) // per_page,
    }


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.is_active == True).order_by(Category.display_order).all()


@router.get("/brands", response_model=list[BrandResponse])
async def list_brands(db: Session = Depends(get_db)):
    return db.query(Brand).filter(Brand.is_active == True).order_by(Brand.name).all()


@router.post("/ai/generate-description")
async def ai_generate_description(
    product_name: str = Query(..., min_length=1),
    brand: str = Query(""),
    category: str = Query(""),
    user: User = Depends(get_current_user),
):
    """Generate product description using local Ollama AI model."""
    from app.services.ai_local import generate_product_description
    result = await generate_product_description(product_name, brand, category)
    return result


@router.get("/ai/status")
async def ai_status():
    """Check if local Ollama AI is running."""
    from app.services.ai_local import check_ollama_status
    return await check_ollama_status()


@router.get("/{slug}")
async def get_product(
    slug: str,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Get single product with role-based pricing."""
    product = db.query(Product).filter(Product.slug == slug, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product_for_role(product, user)


@router.post("", status_code=201)
async def create_product(
    req: ProductCreateRequest,
    user: User = Depends(require_approved_dealer),
    db: Session = Depends(get_db),
):
    """Create a product (dealer only)."""
    if db.query(Product).filter(Product.sku == req.sku).first():
        raise HTTPException(status_code=409, detail="SKU already exists")

    slug = generate_slug(f"{req.brand}-{req.name}")
    existing_slug = db.query(Product).filter(Product.slug == slug).first()
    if existing_slug:
        slug = f"{slug}-{req.sku.lower()}"

    product = Product(
        name=req.name,
        slug=slug,
        brand=req.brand,
        sku=req.sku,
        hsn_code=req.hsn_code,
        category=req.category,
        description=req.description,
        specifications=req.specifications,
        customer_price=req.customer_price,
        dealer_price=req.dealer_price,
        stock_quantity=req.stock_quantity,
        image_url=req.image_url,
        created_by=user.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    index_product({
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "category": product.category.value,
        "description": product.description or "",
        "is_active": True,
    })

    logger.info("Product created: %s by dealer %s", product.name, user.email)
    return serialize_product_for_role(product, user)


@router.put("/{product_id}")
async def update_product(
    product_id: int,
    req: ProductUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update product (owner or admin only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.created_by != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    index_product({
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "category": product.category.value,
        "description": product.description or "",
        "is_active": product.is_active,
    })

    return serialize_product_for_role(product, user)


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete product (owner or admin only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.created_by != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    product.is_active = False
    db.commit()
    remove_product(product_id)
    return {"message": "Product deleted"}


# --- AI Product Upload (Draft) Endpoints ---

@router.post("/upload-image", response_model=ProductDraftResponse, status_code=201)
async def upload_product_image(
    file: UploadFile = File(...),
    user: User = Depends(require_approved_dealer),
    db: Session = Depends(get_db),
):
    """Upload product image and trigger AI analysis pipeline."""
    from app.services.storage import upload_file
    import uuid

    file_bytes = await file.read()
    filename = f"products/{uuid.uuid4()}-{file.filename}"
    image_url = upload_file(file_bytes, filename, content_type=file.content_type or "image/jpeg")

    draft = ProductDraft(
        dealer_id=user.id,
        image_url=image_url,
        status=DraftStatus.processing,
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)

    process_product_image.delay(draft.id)
    logger.info("Product draft %d created, AI processing started", draft.id)
    return draft


@router.get("/draft/{draft_id}", response_model=ProductDraftResponse)
async def get_draft(
    draft_id: int,
    user: User = Depends(require_approved_dealer),
    db: Session = Depends(get_db),
):
    """Get AI-generated product draft."""
    draft = db.query(ProductDraft).filter(
        ProductDraft.id == draft_id, ProductDraft.dealer_id == user.id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


@router.put("/draft/{draft_id}", response_model=ProductDraftResponse)
async def update_draft(
    draft_id: int,
    req: ProductDraftUpdateRequest,
    user: User = Depends(require_approved_dealer),
    db: Session = Depends(get_db),
):
    """Update product draft with dealer edits."""
    draft = db.query(ProductDraft).filter(
        ProductDraft.id == draft_id, ProductDraft.dealer_id == user.id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if req.final_data is not None:
        draft.final_data = req.final_data
    db.commit()
    db.refresh(draft)
    return draft


@router.post("/draft/{draft_id}/publish")
async def publish_draft(
    draft_id: int,
    req: PublishDraftRequest,
    user: User = Depends(require_approved_dealer),
    db: Session = Depends(get_db),
):
    """Publish a draft as a real product in the catalog."""
    draft = db.query(ProductDraft).filter(
        ProductDraft.id == draft_id, ProductDraft.dealer_id == user.id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.status == DraftStatus.published:
        raise HTTPException(status_code=409, detail="Draft already published")

    data = draft.final_data or draft.ai_detected_data or {}
    name = data.get("name", "Untitled Product")
    slug = generate_slug(f"{data.get('brand', 'unknown')}-{name}")

    product = Product(
        name=name,
        slug=slug,
        brand=data.get("brand", "Unknown"),
        sku=req.sku,
        hsn_code=req.hsn_code,
        category=data.get("category", "accessories"),
        description=data.get("description", ""),
        specifications=data.get("specifications", {}),
        customer_price=req.customer_price,
        dealer_price=req.dealer_price,
        image_url=draft.image_url,
        created_by=user.id,
        is_active=True,
    )
    db.add(product)
    draft.status = DraftStatus.published
    db.commit()
    db.refresh(product)

    index_product({
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "category": product.category.value,
        "description": product.description or "",
        "is_active": True,
    })

    logger.info("Draft %d published as product %d", draft_id, product.id)
    return serialize_product_for_role(product, user)
