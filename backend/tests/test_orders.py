from unittest.mock import patch


def _add_to_cart(client, product_id, quantity=1):
    return client.post("/api/v1/cart/items", json={
        "product_id": product_id,
        "quantity": quantity,
    })


def test_create_order(client, customer_token, sample_product):
    client.cookies.set("access_token", customer_token)
    _add_to_cart(client, sample_product.id, 2)
    response = client.post("/api/v1/orders", json={
        "shipping_address": {"city": "Mumbai", "state": "Maharashtra", "pincode": "400001"},
        "billing_address": {"city": "Mumbai", "state": "Maharashtra", "pincode": "400001"},
    })
    assert response.status_code == 201
    data = response.json()
    assert data["order_number"].startswith("ORD-")
    assert data["status"] == "pending"
    assert float(data["subtotal"]) > 0


def test_create_order_empty_cart(client, customer_token):
    client.cookies.set("access_token", customer_token)
    response = client.post("/api/v1/orders", json={
        "shipping_address": {"city": "Mumbai"},
        "billing_address": {"city": "Mumbai"},
    })
    assert response.status_code == 400


def test_list_orders(client, customer_token, sample_product):
    client.cookies.set("access_token", customer_token)
    _add_to_cart(client, sample_product.id)
    client.post("/api/v1/orders", json={
        "shipping_address": {"city": "Mumbai"},
        "billing_address": {"city": "Mumbai"},
    })
    response = client.get("/api/v1/orders")
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_get_order_detail(client, customer_token, sample_product):
    client.cookies.set("access_token", customer_token)
    _add_to_cart(client, sample_product.id)
    create_resp = client.post("/api/v1/orders", json={
        "shipping_address": {"city": "Mumbai"},
        "billing_address": {"city": "Mumbai"},
    })
    order_id = create_resp.json()["id"]
    response = client.get(f"/api/v1/orders/{order_id}")
    assert response.status_code == 200
    assert response.json()["id"] == order_id


def test_get_order_not_owned(client, customer_token, dealer_token, sample_product):
    # Create order as dealer
    client.cookies.set("access_token", dealer_token)
    _add_to_cart(client, sample_product.id)
    create_resp = client.post("/api/v1/orders", json={
        "shipping_address": {"city": "Mumbai"},
        "billing_address": {"city": "Mumbai"},
    })
    order_id = create_resp.json()["id"]

    # Try to access as customer
    client.cookies.set("access_token", customer_token)
    response = client.get(f"/api/v1/orders/{order_id}")
    assert response.status_code == 404


def test_initiate_payment(client, customer_token, sample_product):
    client.cookies.set("access_token", customer_token)
    _add_to_cart(client, sample_product.id)
    create_resp = client.post("/api/v1/orders", json={
        "shipping_address": {"city": "Mumbai"},
        "billing_address": {"city": "Mumbai"},
    })
    order_id = create_resp.json()["id"]
    response = client.post(f"/api/v1/orders/{order_id}/pay")
    assert response.status_code == 200
    data = response.json()
    assert "razorpay_order_id" in data
    assert data["currency"] == "INR"


def test_order_uses_role_price(client, dealer_token, sample_product):
    """Dealer orders should use dealer_price."""
    client.cookies.set("access_token", dealer_token)
    _add_to_cart(client, sample_product.id, 1)
    response = client.post("/api/v1/orders", json={
        "shipping_address": {"city": "Mumbai"},
        "billing_address": {"city": "Mumbai"},
    })
    assert response.status_code == 201
    # dealer_price is 3500, with 18% GST
    subtotal = float(response.json()["subtotal"])
    assert subtotal == 3500.0
