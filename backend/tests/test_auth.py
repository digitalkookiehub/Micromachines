def test_register_customer(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "new@test.com",
        "password": "password123",
        "full_name": "New User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@test.com"
    assert data["role"] == "customer"


def test_register_dealer(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "newdealer@test.com",
        "password": "password123",
        "full_name": "New Dealer",
        "role": "dealer",
        "company_name": "Dealer Corp",
        "gst_number": "27ABCDE1234F1Z5",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "dealer"
    assert data["dealer_profile"] is not None
    assert data["dealer_profile"]["is_approved"] is False


def test_register_dealer_without_company(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "bad@test.com",
        "password": "password123",
        "full_name": "Bad Dealer",
        "role": "dealer",
    })
    assert response.status_code == 400


def test_register_duplicate_email(client, test_customer):
    response = client.post("/api/v1/auth/register", json={
        "email": "customer@test.com",
        "password": "password123",
        "full_name": "Duplicate",
    })
    assert response.status_code == 409


def test_login_success(client, test_customer):
    response = client.post("/api/v1/auth/login", data={
        "username": "customer@test.com",
        "password": "password123",
    })
    assert response.status_code == 200
    assert "access_token" in response.cookies
    data = response.json()
    assert data["message"] == "Login successful"
    assert data["user"]["email"] == "customer@test.com"


def test_login_wrong_password(client, test_customer):
    response = client.post("/api/v1/auth/login", data={
        "username": "customer@test.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


def test_login_inactive_user(client, db, test_customer):
    test_customer.is_active = False
    db.commit()
    response = client.post("/api/v1/auth/login", data={
        "username": "customer@test.com",
        "password": "password123",
    })
    assert response.status_code == 403


def test_get_me_authorized(client, customer_token):
    client.cookies.set("access_token", customer_token)
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "customer@test.com"


def test_get_me_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_update_profile(client, customer_token):
    client.cookies.set("access_token", customer_token)
    response = client.put("/api/v1/auth/me", json={
        "full_name": "Updated Name",
        "phone": "1234567890",
    })
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"


def test_logout(client, customer_token):
    client.cookies.set("access_token", customer_token)
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"


def test_refresh_reads_cookie(client, test_customer):
    """The refresh token is read from the HTTP-only cookie, not a query param."""
    login = client.post("/api/v1/auth/login", data={
        "username": "customer@test.com",
        "password": "password123",
    })
    assert login.status_code == 200

    response = client.post("/api/v1/auth/refresh")
    assert response.status_code == 200
    assert response.json()["message"] == "Token refreshed"
    assert "access_token" in response.cookies


def test_refresh_without_cookie(client):
    response = client.post("/api/v1/auth/refresh")
    assert response.status_code == 401


def test_refresh_rejected_after_logout(client, test_customer):
    """Logout revokes the stored token so it can no longer buy a new access token."""
    client.post("/api/v1/auth/login", data={
        "username": "customer@test.com",
        "password": "password123",
    })
    assert client.post("/api/v1/auth/logout").status_code == 200

    response = client.post("/api/v1/auth/refresh")
    assert response.status_code == 401


def test_register_cannot_self_assign_admin(client):
    """The role field is client-supplied; admin must not be obtainable via register."""
    response = client.post("/api/v1/auth/register", json={
        "email": "wannabe-admin@test.com",
        "password": "password123",
        "full_name": "Wannabe Admin",
        "role": "admin",
    })
    assert response.status_code == 403
