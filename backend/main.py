import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.api.routes import router as core_router
from app.api.auth import router as auth_router
from app.core import model_engine, explainer

app = FastAPI(
    title="FraudShield AI — Real-Time Financial Fraud Intelligence & Explainable AI Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. Advanced Security & OWASP Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# 2. Dynamic CORS Configuration (production domain whitelisting)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount Application Routers
app.include_router(auth_router)
app.include_router(core_router)

@app.on_event("startup")
def startup_event():
    model_engine.load_models()
    if model_engine.model is not None:
        explainer.init_explainer(model_engine.model)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8008))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)