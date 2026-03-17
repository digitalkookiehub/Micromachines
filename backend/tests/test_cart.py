def test_get_empty_cart(client, customer_token):
    client.cookies.set("access_token", customer_token)
    response = client.get("/api/v1/cart")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["subtotal"] == 0


def test_add_to_cart(client, customer_token, sample_product):
    client.cookies.set("access_token", customer_token)
    response = client.post("/api/v1/cart/items", json={
        "product_id": sample_product.id,
        "quantity": 2,
    })
    assert response.status_code == 201
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2
    # Customer gets customer_price
    assert data["items"][0]["price"] == 4995.0


def test_add_duplicate_product(client, customer_token, sample_product):
    client.cookies.set("access_token", customer_token)
    client.post("/api/v1/cart/items", json={"product_id": sample_product.id, "quantity": 1})
    response = client.post("/api/v1/cart/items", json={"product_id": sample_product.id, "quantity": 2})
    assert response.status_code == 201
    data = response.json()
    assert data["items"][0]["quantity"] == 3


def test_update_cart_item(client, customer_token, sample_product):
    client.cookies.set("access_token", customer_token)
    add_resp = client.post("/api/v1/cart/items", json={"product_id": sample_product.id, "quantity": 1})
    item_id = add_resp.json()["items"][0]["id"]
    response = client.put(f"/api/v1/cart/items/{item_id}", json={"quantity": 5})
    assert response.status_code == 200
    assert response.json()["items"][0]["quantity"] == 5


def test_remove_cart_item(client, customer_token, sample_product):
    client.cookies.set("access_token", customer_token)
    add_resp = client.post("/api/v1/cart/items", json={"product_id": sample_product.id, "quantity": 1})
    item_id = add_resp.json()["items"][0]["id"]
    response = client.delete(f"/api/v1/cart/items/{item_id}")
    assert response.status_code == 200
    assert len(response.json()["items"]) == 0


def test_cart_price_role_based(client, dealer_token, sample_product):
    """Dealer should see dealer_price in cart."""
    client.cookies.set("access_token", dealer_token)
    response = client.post("/api/v1/cart/items", json={
        "product_id": sample_product.id,
        "quantity": 1,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["items"][0]["price"] == 3500.0
