import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.api.routes import router as core_router
from app.api.auth import router as auth_router
from app.core import model_engine, explainer
from app.core.database import init_db


# ---------------------------------------------------------------------------
# Lifespan Context Manager (replaces deprecated @app.on_event("startup"))
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs startup logic before yield; teardown after yield."""
    init_db()          # Create DB tables if they don't exist
    model_engine.load_models()
    if model_engine.model is not None:
        explainer.init_explainer(model_engine.model)
    yield
    # Teardown (graceful shutdown hooks can go here)


app = FastAPI(
    title="FraudShield AI — Real-Time Financial Fraud Intelligence & Explainable AI Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# ---------------------------------------------------------------------------
# 1. Security & OWASP Headers Middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            "connect-src 'self' *; "
            "frame-ancestors 'none';"
        )
        return response


app.add_middleware(SecurityHeadersMiddleware)


# ---------------------------------------------------------------------------
# 2. Dynamic CORS — production origins from env var, never wildcard in prod
# ---------------------------------------------------------------------------
_is_production = os.getenv("ENV", "development").lower() == "production"
_allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")

if _allowed_origins_env and _allowed_origins_env != "*":
    origins = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]
elif not _is_production:
    # Development: allow common local dev origins
    origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
else:
    # Production with no explicit origin list — fail closed; no CORS access
    origins = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-KEY"],
)


# ---------------------------------------------------------------------------
# 3. Mount Application Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(core_router)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8008))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)