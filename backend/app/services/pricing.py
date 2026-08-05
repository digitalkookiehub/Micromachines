"""Single source of truth for the price a given user pays for a product.

Display (catalogue), cart totals and order lines must all agree — whatever a user
is shown is what they are charged. Every one of those paths goes through
`get_effective_price`; never read `dealer_price`/`customer_price` directly.
"""
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from app.models.product import Product
from app.models.user import User, UserRole

TWO_PLACES = Decimal("0.01")


def is_approved_dealer(user: Optional[User]) -> bool:
    """True when the user is a dealer whose account an admin has approved."""
    return bool(
        user
        and user.role == UserRole.dealer
        and user.dealer_profile
        and user.dealer_profile.is_approved
    )


def get_dealer_special_discount(user: Optional[User]) -> Decimal:
    """Extra percentage off the dealer price, negotiated per dealer by an admin."""
    if not is_approved_dealer(user):
        return Decimal("0")
    return Decimal(str(user.dealer_profile.special_discount or 0))


def get_effective_price(product: Product, user: Optional[User] = None) -> Decimal:
    """The unit price `user` pays for `product`.

    Anonymous and customer users pay the customer price (MRP). Approved dealers pay
    the dealer price less their special discount. Admins see and pay dealer price.
    """
    customer_price = Decimal(str(product.customer_price))
    dealer_price = Decimal(str(product.dealer_price))

    if is_approved_dealer(user):
        discount = get_dealer_special_discount(user)
        if discount > 0:
            dealer_price = dealer_price * (Decimal("1") - discount / Decimal("100"))
        return dealer_price.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

    if user and user.role == UserRole.admin:
        return dealer_price.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

    return customer_price.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def sees_dealer_pricing(user: Optional[User]) -> bool:
    """True when the user should be shown dealer pricing and savings figures."""
    return is_approved_dealer(user) or bool(user and user.role == UserRole.admin)
