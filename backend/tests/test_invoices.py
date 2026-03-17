from decimal import Decimal
from app.services.invoice_generator import calculate_gst


def test_gst_calculation_intra_state():
    """Same state (Maharashtra) -> CGST + SGST."""
    # settings.SELLER_STATE defaults to "Maharashtra"
    result = calculate_gst(
        taxable_amount=Decimal("10000"),
        buyer_state="Maharashtra",
    )
    assert result["cgst"] == Decimal("900.00")
    assert result["sgst"] == Decimal("900.00")
    assert result["igst"] == Decimal("0")
    assert result["total_tax"] == Decimal("1800.00")
    assert result["is_igst"] is False


def test_gst_calculation_inter_state():
    """Different states -> IGST."""
    result = calculate_gst(
        taxable_amount=Decimal("10000"),
        buyer_state="Karnataka",
    )
    assert result["cgst"] == Decimal("0")
    assert result["sgst"] == Decimal("0")
    assert result["igst"] == Decimal("1800.00")
    assert result["total_tax"] == Decimal("1800.00")
    assert result["is_igst"] is True


def test_list_invoices(client, customer_token):
    client.cookies.set("access_token", customer_token)
    response = client.get("/api/v1/invoices")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
