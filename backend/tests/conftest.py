import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.auth.jwt import create_access_token, hash_password
from app.models.user import User, UserRole, DealerProfile
from app.models.product import Product, ProductCategory

# SQLite in-memory for tests
TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Enable foreign key support in SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def mock_external_services():
    """Mock all external services globally."""
    mock_delay = MagicMock()
    mock_task = MagicMock()
    mock_task.delay = mock_delay

    with (
        patch("app.routers.products.index_product"),
        patch("app.routers.products.remove_product"),
        patch("app.routers.products.search_products", return_value={"hits": [], "total": 0}),
        patch("app.routers.products.process_product_image", mock_task),
        patch("app.routers.orders.generate_invoice_pdf", mock_task),
        patch("app.routers.orders.send_notification_email", mock_task),
        patch("app.routers.admin.send_notification_email", mock_task),
        patch("app.routers.orders.create_razorpay_order", return_value={"id": "order_test123", "amount": 10000}),
        patch("app.services.payment.verify_webhook_signature", return_value=True),
    ):
        yield


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_customer(db) -> User:
    user = User(
        email="customer@test.com",
        hashed_password=hash_password("password123"),
        full_name="Test Customer",
        phone="9876543210",
        role=UserRole.customer,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_dealer(db) -> User:
    user = User(
        email="dealer@test.com",
        hashed_password=hash_password("password123"),
        full_name="Test Dealer",
        phone="9876543211",
        role=UserRole.dealer,
        is_active=True,
    )
    db.add(user)
    db.flush()

    profile = DealerProfile(
        user_id=user.id,
        company_name="Test Peripherals",
        dealer_id="DLR-0001",
        gst_number="27TESTG1234A1Z5",
        is_approved=True,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_admin(db) -> User:
    user = User(
        email="admin@test.com",
        hashed_password=hash_password("password123"),
        full_name="Test Admin",
        role=UserRole.admin,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def customer_token(test_customer) -> str:
    return create_access_token({"sub": str(test_customer.id)})


@pytest.fixture
def dealer_token(test_dealer) -> str:
    return create_access_token({"sub": str(test_dealer.id)})


@pytest.fixture
def admin_token(test_admin) -> str:
    return create_access_token({"sub": str(test_admin.id)})


@pytest.fixture
def sample_product(db, test_dealer) -> Product:
    product = Product(
        name="Logitech G502",
        slug="logitech-g502",
        brand="Logitech",
        sku="LOG-G502-001",
        hsn_code="84716060",
        category=ProductCategory.mouse,
        description="High performance gaming mouse",
        specifications={"dpi": "16000", "buttons": "11"},
        customer_price=Decimal("4995.00"),
        dealer_price=Decimal("3500.00"),
        stock_quantity=50,
        image_url="https://example.com/g502.jpg",
        is_active=True,
        created_by=test_dealer.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
