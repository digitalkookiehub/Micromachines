"""The price a user is shown must be the price they are charged.

Regression cover for the special-discount leak: catalogue applied the dealer's
special_discount but cart and order lines charged the undiscounted dealer_price.
"""
from decimal import Decimal

import pytest

from app.auth.jwt import create_access_token, hash_password
from app.models.user import DealerProfile, User, UserRole

ADDRESS = {
    "name": "Test Peripherals",
    "line1": "12 MG Road",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
}


@pytest.fixture
def discounted_dealer(db) -> User:
    """Approved dealer with a 5% admin-granted discount on top of dealer price."""
    user = User(
        email="discounted@test.com",
        hashed_password=hash_password("password123"),
        full_name="Discounted Dealer",
        role=UserRole.dealer,
        is_active=True,
    )
    db.add(user)
    db.flush()

    db.add(DealerProfile(
        user_id=user.id,
        company_name="Discount Peripherals",
        dealer_id="DLR-0009",
        is_approved=True,
        special_discount=Decimal("5.00"),
        credit_limit=Decimal("50000.00"),
    ))
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def discounted_dealer_token(discounted_dealer) -> str:
    return create_access_token({"sub": str(discounted_dealer.id)})


# dealer_price 3500 - 5% = 3325
DISCOUNTED_PRICE = 3325.0


def test_catalogue_applies_special_discount(client, discounted_dealer_token, sample_product):
    client.cookies.set("access_token", discounted_dealer_token)
    response = client.get(f"/api/v1/products/{sample_product.slug}")
    assert response.status_code == 200
    data = response.json()
    assert data["price"] == DISCOUNTED_PRICE
    assert data["mrp"] == 4995.0


def test_cart_charges_discounted_price(client, discounted_dealer_token, sample_product):
    client.cookies.set("access_token", discounted_dealer_token)
    response = client.post("/api/v1/cart/items", json={
        "product_id": sample_product.id,
        "quantity": 2,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["items"][0]["price"] == DISCOUNTED_PRICE
    assert data["subtotal"] == DISCOUNTED_PRICE * 2


def test_order_line_charges_discounted_price(client, discounted_dealer_token, sample_product):
    """The bug: order lines used raw dealer_price, overcharging by the discount."""
    client.cookies.set("access_token", discounted_dealer_token)
    client.post("/api/v1/cart/items", json={"product_id": sample_product.id, "quantity": 2})

    response = client.post("/api/v1/orders", json={
        "shipping_address": ADDRESS,
        "billing_address": ADDRESS,
    })
    assert response.status_code == 201
    order = response.json()
    assert order["items"][0]["unit_price"] == DISCOUNTED_PRICE
    assert order["subtotal"] == DISCOUNTED_PRICE * 2


def test_displayed_price_equals_charged_price(client, discounted_dealer_token, sample_product):
    """Catalogue, cart and order must agree on the unit price."""
    client.cookies.set("access_token", discounted_dealer_token)

    catalogue = client.get(f"/api/v1/products/{sample_product.slug}").json()["price"]
    cart = client.post("/api/v1/cart/items", json={
        "product_id": sample_product.id,
        "quantity": 1,
    }).json()["items"][0]["price"]
    order = client.post("/api/v1/orders", json={
        "shipping_address": ADDRESS,
        "billing_address": ADDRESS,
    }).json()["items"][0]["unit_price"]

    assert catalogue == cart == order


def test_credit_order_consumes_discounted_total(client, discounted_dealer_token, sample_product):
    """Credit usage must be recorded against the discounted total, not list price."""
    client.cookies.set("access_token", discounted_dealer_token)
    client.post("/api/v1/cart/items", json={"product_id": sample_product.id, "quantity": 1})

    order = client.post("/api/v1/orders", json={
        "shipping_address": ADDRESS,
        "billing_address": ADDRESS,
        "payment_method": "credit",
    }).json()

    summary = client.get("/api/v1/credit/summary").json()
    assert summary["used"] == order["total"]
    assert summary["available"] == 50000.0 - order["total"]


def test_dealer_without_discount_pays_dealer_price(client, dealer_token, sample_product):
    """Dealers with no special discount are unaffected."""
    client.cookies.set("access_token", dealer_token)
    catalogue = client.get(f"/api/v1/products/{sample_product.slug}").json()
    cart = client.post("/api/v1/cart/items", json={
        "product_id": sample_product.id,
        "quantity": 1,
    }).json()
    assert catalogue["price"] == 3500.0
    assert cart["items"][0]["price"] == 3500.0


def test_customer_pays_mrp(client, customer_token, sample_product):
    """Customer pricing must not be touched by dealer discounts."""
    client.cookies.set("access_token", customer_token)
    catalogue = client.get(f"/api/v1/products/{sample_product.slug}").json()
    cart = client.post("/api/v1/cart/items", json={
        "product_id": sample_product.id,
        "quantity": 1,
    }).json()
    assert catalogue["price"] == 4995.0
    assert "mrp" not in catalogue
    assert cart["items"][0]["price"] == 4995.0
