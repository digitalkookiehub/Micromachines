import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.exceptions import AppException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")

app = FastAPI(
    title=f"{settings.APP_NAME} API",
    version="1.0.0",
    description="Dual-pricing e-commerce platform for computer peripherals distributors",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.code},
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "healthy", "app": settings.APP_NAME}


from app.routers import admin, auth, cart, credit, dashboard, invoices, orders, products

app.include_router(auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(cart.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(credit.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
