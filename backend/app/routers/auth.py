import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.models.user import DealerProfile, RefreshToken, User, UserRole
from app.schemas.auth import (
    LoginResponse,
    MessageResponse,
    RegisterRequest,
    UpdateProfileRequest,
    UserResponse,
)
from app.utils import generate_dealer_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_SETTINGS = {
    "httponly": True,
    "samesite": "lax",
    "secure": settings.COOKIE_SECURE,
    "path": "/",
}


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new customer or dealer account."""
    # role is client-supplied; admin must never be self-assignable over the API.
    if req.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin accounts cannot be self-registered")

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        phone=req.phone,
        role=req.role,
    )
    db.add(user)
    db.flush()

    if req.role == UserRole.dealer:
        if not req.company_name:
            raise HTTPException(status_code=400, detail="Company name required for dealer registration")
        dealer_count = db.query(DealerProfile).count()
        dealer_profile = DealerProfile(
            user_id=user.id,
            company_name=req.company_name,
            dealer_id=generate_dealer_id(dealer_count + 1),
            gst_number=req.gst_number,
            is_approved=False,
        )
        db.add(dealer_profile)

    db.commit()
    db.refresh(user)
    logger.info("User registered: %s (role=%s)", user.email, user.role.value)
    return user


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    response: Response,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login and set JWT as HTTP-only cookie."""
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token_str = create_refresh_token({"sub": str(user.id)})

    # Store the token that is actually handed to the browser, so /refresh can
    # look it up and honour revocation.
    db_refresh = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(db_refresh)
    db.commit()

    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **COOKIE_SETTINGS,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        **COOKIE_SETTINGS,
    )

    logger.info("User logged in: %s", user.email)
    return LoginResponse(message="Login successful", user=UserResponse.model_validate(user))


@router.post("/refresh", response_model=MessageResponse)
async def refresh_access_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    """Refresh access token using the refresh_token HTTP-only cookie."""
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    stored = (
        db.query(RefreshToken)
        .filter(RefreshToken.token == refresh_token, RefreshToken.revoked.is_(False))
        .first()
    )
    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    expires_at = stored.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token({"sub": str(user.id)})
    response.set_cookie(
        key="access_token",
        value=new_access,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **COOKIE_SETTINGS,
    )
    return MessageResponse(message="Token refreshed")


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout: revoke tokens and clear cookies."""
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id, RefreshToken.revoked == False
    ).update({"revoked": True})
    db.commit()

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    logger.info("User logged out: %s", user.email)
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return user


@router.put("/me", response_model=UserResponse)
async def update_me(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    if req.full_name is not None:
        user.full_name = req.full_name
    if req.phone is not None:
        user.phone = req.phone
    if req.company_name is not None:
        user.company_name = req.company_name
    if req.logo_url is not None:
        user.logo_url = req.logo_url
    db.commit()
    db.refresh(user)
    return user
