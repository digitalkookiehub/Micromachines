def test_list_products_anonymous(client, sample_product):
    """Anonymous users should see customer_price only, no dealer fields."""
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 1
    product = items[0]
    assert product["price"] == 4995.0
    assert product["tax_label"] == "Inclusive of all taxes"
    assert "mrp" not in product
    assert "savings_percent" not in product
    assert "savings_amount" not in product
    assert "is_dealer" not in product


def test_list_products_dealer(client, dealer_token, sample_product):
    """Approved dealers should see dealer_price, mrp, savings."""
    client.cookies.set("access_token", dealer_token)
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    items = response.json()["items"]
    product = items[0]
    assert product["price"] == 3500.0
    assert product["mrp"] == 4995.0
    assert product["savings_amount"] == 1495.0
    assert product["is_dealer"] is True
    assert "tax_label" not in product


def test_price_isolation_critical(client, customer_token, sample_product):
    """CRITICAL: Customer API response must NEVER contain dealer_price or savings."""
    client.cookies.set("access_token", customer_token)
    response = client.get("/api/v1/products")
    items = response.json()["items"]
    product = items[0]
    assert product["price"] == 4995.0
    assert "dealer_price" not in product
    assert "mrp" not in product
    assert "savings_percent" not in product
    assert "savings_amount" not in product
    assert "is_dealer" not in product


def test_get_product_by_slug(client, sample_product):
    response = client.get("/api/v1/products/logitech-g502")
    assert response.status_code == 200
    assert response.json()["name"] == "Logitech G502"


def test_get_product_not_found(client):
    response = client.get("/api/v1/products/nonexistent-slug")
    assert response.status_code == 404


def test_create_product_dealer(client, dealer_token):
    client.cookies.set("access_token", dealer_token)
    response = client.post("/api/v1/products", json={
        "name": "Razer DeathAdder",
        "brand": "Razer",
        "sku": "RAZ-DA-001",
        "hsn_code": "84716060",
        "category": "mouse",
        "description": "Ergonomic gaming mouse",
        "customer_price": 3999.0,
        "dealer_price": 2800.0,
        "stock_quantity": 100,
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Razer DeathAdder"


def test_create_product_customer_forbidden(client, customer_token):
    client.cookies.set("access_token", customer_token)
    response = client.post("/api/v1/products", json={
        "name": "Forbidden Product",
        "brand": "Test",
        "sku": "TEST-001",
        "hsn_code": "84716060",
        "category": "mouse",
        "customer_price": 1000.0,
        "dealer_price": 800.0,
    })
    assert response.status_code == 403


def test_create_product_duplicate_sku(client, dealer_token, sample_product):
    client.cookies.set("access_token", dealer_token)
    response = client.post("/api/v1/products", json={
        "name": "Duplicate SKU",
        "brand": "Test",
        "sku": "LOG-G502-001",
        "hsn_code": "84716060",
        "category": "mouse",
        "customer_price": 1000.0,
        "dealer_price": 800.0,
    })
    assert response.status_code == 409


def test_update_product_owner(client, dealer_token, sample_product):
    client.cookies.set("access_token", dealer_token)
    response = client.put(f"/api/v1/products/{sample_product.id}", json={
        "name": "Updated G502",
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Updated G502"


def test_update_product_non_owner(client, customer_token, sample_product):
    client.cookies.set("access_token", customer_token)
    response = client.put(f"/api/v1/products/{sample_product.id}", json={
        "name": "Hacked",
    })
    assert response.status_code == 403


def test_delete_product_soft(client, dealer_token, sample_product, db):
    client.cookies.set("access_token", dealer_token)
    response = client.delete(f"/api/v1/products/{sample_product.id}")
    assert response.status_code == 200
    db.refresh(sample_product)
    assert sample_product.is_active is False
