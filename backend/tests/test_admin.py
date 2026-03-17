from app.models.user import DealerProfile, User, UserRole
from app.auth.jwt import hash_password


def test_admin_stats(client, admin_token, test_customer, sample_product):
    client.cookies.set("access_token", admin_token)
    response = client.get("/api/v1/admin/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_products" in data
    assert "total_orders" in data
    assert "total_revenue" in data


def test_admin_list_users(client, admin_token, test_customer, test_dealer):
    client.cookies.set("access_token", admin_token)
    response = client.get("/api/v1/admin/users")
    assert response.status_code == 200
    assert len(response.json()) >= 2


def test_admin_approve_dealer(client, admin_token, db):
    # Create unapproved dealer
    user = User(
        email="pending@test.com",
        hashed_password=hash_password("password123"),
        full_name="Pending Dealer",
        role=UserRole.dealer,
        is_active=True,
    )
    db.add(user)
    db.flush()
    profile = DealerProfile(
        user_id=user.id,
        company_name="Pending Corp",
        dealer_id="DLR-9999",
        is_approved=False,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    client.cookies.set("access_token", admin_token)
    response = client.post(f"/api/v1/admin/dealers/{profile.id}/approve")
    assert response.status_code == 200
    db.refresh(profile)
    assert profile.is_approved is True


def test_admin_reject_dealer(client, admin_token, db):
    user = User(
        email="reject@test.com",
        hashed_password=hash_password("password123"),
        full_name="Reject Dealer",
        role=UserRole.dealer,
        is_active=True,
    )
    db.add(user)
    db.flush()
    profile = DealerProfile(
        user_id=user.id,
        company_name="Reject Corp",
        dealer_id="DLR-8888",
        is_approved=False,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    client.cookies.set("access_token", admin_token)
    response = client.post(f"/api/v1/admin/dealers/{profile.id}/reject")
    assert response.status_code == 200


def test_admin_forbidden_customer(client, customer_token):
    client.cookies.set("access_token", customer_token)
    response = client.get("/api/v1/admin/stats")
    assert response.status_code == 403


def test_admin_list_orders(client, admin_token):
    client.cookies.set("access_token", admin_token)
    response = client.get("/api/v1/admin/orders")
    assert response.status_code == 200


def test_admin_moderate_product(client, admin_token, sample_product, db):
    client.cookies.set("access_token", admin_token)
    response = client.put(
        f"/api/v1/admin/products/{sample_product.id}",
        params={"is_active": False},
    )
    assert response.status_code == 200
    db.refresh(sample_product)
    assert sample_product.is_active is False
