import enum

from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin


class ProductCategory(str, enum.Enum):
    mouse = "mouse"
    keyboard = "keyboard"
    monitor = "monitor"
    headset = "headset"
    storage = "storage"
    accessories = "accessories"


class DraftStatus(str, enum.Enum):
    processing = "processing"
    review = "review"
    published = "published"
    failed = "failed"


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False, index=True)
    slug = Column(String(350), unique=True, index=True, nullable=False)
    brand = Column(String(100), nullable=False, index=True)
    sku = Column(String(50), unique=True, nullable=False)
    hsn_code = Column(String(20), nullable=False)
    category = Column(Enum(ProductCategory), nullable=False)
    description = Column(Text, nullable=True)
    specifications = Column(JSON, default=dict)
    customer_price = Column(Numeric(12, 2), nullable=False)
    dealer_price = Column(Numeric(12, 2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    image_url = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    creator = relationship("User", back_populates="products", foreign_keys=[created_by])
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")

    __table_args__ = (
        Index("ix_products_category_active", "category", "is_active"),
    )


class ProductDraft(Base, TimestampMixin):
    __tablename__ = "product_drafts"

    id = Column(Integer, primary_key=True, index=True)
    dealer_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    image_url = Column(String(500), nullable=False)
    ai_detected_data = Column(JSON, nullable=True)
    web_scraped_data = Column(JSON, nullable=True)
    final_data = Column(JSON, nullable=True)
    status = Column(Enum(DraftStatus), default=DraftStatus.processing)

    # Relationships
    dealer = relationship("User", foreign_keys=[dealer_id])


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(120), unique=True, nullable=False)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
