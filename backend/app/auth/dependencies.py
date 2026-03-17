import logging
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth.jwt import decode_token
from app.database import get_db
from app.models.user import User, UserRole, DealerProfile

logger = logging.getLogger(__name__)


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
) -> User:
    """Extract user from HTTP-only cookie JWT."""
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    payload = decode_token(access_token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    user = (
        db.query(User)
        .options(joinedload(User.dealer_profile))
        .filter(User.id == int(user_id))
        .first()
    )
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive"
        )
    return user


async def get_optional_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Get user if authenticated, None otherwise. Used for public endpoints with role-based responses."""
    if not access_token:
        return None
    payload = decode_token(access_token)
    if not payload or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    user = (
        db.query(User)
        .options(joinedload(User.dealer_profile))
        .filter(User.id == int(user_id))
        .first()
    )
    if not user or not user.is_active:
        return None
    return user


def require_role(*roles: UserRole):
    """Dependency factory that checks user has one of the required roles."""

    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return user

    return role_checker


def require_approved_dealer(user: User = Depends(get_current_user)) -> User:
    """Require user is an approved dealer or admin."""
    if user.role == UserRole.admin:
        return user
    if user.role != UserRole.dealer:
        raise HTTPException(status_code=403, detail="Dealer access required")
    if not user.dealer_profile or not user.dealer_profile.is_approved:
        raise HTTPException(status_code=403, detail="Dealer account not yet approved")
    return user
