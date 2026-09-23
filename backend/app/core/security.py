import os
import time
import secrets
import jwt
from passlib.context import CryptContext
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import HTTPException, Security, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ---------------------------------------------------------------------------
# Cryptographic Configuration
# ---------------------------------------------------------------------------
_JWT_SECRET_RAW = os.getenv("JWT_SECRET_KEY", "")
_IS_PRODUCTION = os.getenv("ENV", "development").lower() == "production"

if _IS_PRODUCTION and not _JWT_SECRET_RAW:
    raise RuntimeError(
        "FATAL: JWT_SECRET_KEY environment variable is not set. "
        "The application cannot start in production without a secret key."
    )

# In development, use a random ephemeral key so the app still boots.
SECRET_KEY: str = _JWT_SECRET_RAW or secrets.token_hex(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8      # 8-hour access tokens
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7-day refresh tokens

security_bearer = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# Password Hashing — bcrypt via passlib (industry standard, slow by design)
# ---------------------------------------------------------------------------
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt (salted, adaptive cost)."""
    return _pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time bcrypt comparison to prevent timing attacks."""
    return _pwd_context.verify(plain_password, hashed_password)

# ---------------------------------------------------------------------------
# Demo Personas (for public evaluation / 1-click login)
# ---------------------------------------------------------------------------
DEMO_PERSONAS = {
    "soc_analyst": {
        "id": "usr_analyst_01",
        "email": "analyst@fraudshield.ai",
        "name": "Sarah Chen, CISSP",
        "title": "Senior SOC Fraud Analyst",
        "role": "soc_analyst",
        "department": "Security Operations Center",
        "permissions": ["view_dashboard", "analyze_transactions", "view_graph", "manual_override", "read_telemetry"]
    },
    "compliance_officer": {
        "id": "usr_compliance_02",
        "email": "compliance@fraudshield.ai",
        "name": "Marcus Vance, CAMS",
        "title": "Lead Regulatory & Model Risk Auditor",
        "role": "compliance_officer",
        "department": "Model Governance & Risk",
        "permissions": ["view_dashboard", "read_shap_attributions", "view_fcra_cards", "view_drift_metrics", "view_audit_logs"]
    },
    "admin": {
        "id": "usr_admin_03",
        "email": "admin@fraudshield.ai",
        "name": "Dr. Elena Rostova",
        "title": "Chief Information Security Officer & MLOps Lead",
        "role": "admin",
        "department": "Executive Cyber & MLOps Engineering",
        "permissions": [
            "view_dashboard", "analyze_transactions", "view_graph", "manual_override",
            "trigger_drift_spike", "run_federated_round", "manage_api_keys",
            "view_audit_logs", "tune_thresholds", "full_admin"
        ]
    }
}

# ---------------------------------------------------------------------------
# In-Memory User Database (pre-seeded; replace with DB in Phase 2)
# ---------------------------------------------------------------------------
USERS_DB: Dict[str, Dict[str, Any]] = {
    "analyst@fraudshield.ai": {
        **DEMO_PERSONAS["soc_analyst"],
        "hashed_password": hash_password("analyst123"),
        "created_at": "2025-01-10T08:00:00Z"
    },
    "compliance@fraudshield.ai": {
        **DEMO_PERSONAS["compliance_officer"],
        "hashed_password": hash_password("compliance123"),
        "created_at": "2025-01-10T08:00:00Z"
    },
    "admin@fraudshield.ai": {
        **DEMO_PERSONAS["admin"],
        "hashed_password": hash_password("admin123"),
        "created_at": "2025-01-10T08:00:00Z"
    }
}

# ---------------------------------------------------------------------------
# API Key Store — keys stored as bcrypt hashes; raw keys never persisted
# Format: { hashed_key: { partner_name, role, rate_limit_per_min, is_active } }
# Scoped to "api_client" role — NOT admin.
# ---------------------------------------------------------------------------
_SEEDED_KEY_1 = "fs_live_banking_partner_key_889"
_SEEDED_KEY_2 = "fs_demo_webhook_key_771"

API_KEYS_DB: Dict[str, Dict[str, Any]] = {
    _pwd_context.hash(_SEEDED_KEY_1): {
        "partner_name": "Apex Global Clearing & Settlement",
        "role": "api_client",
        "permissions": ["analyze_transactions", "read_telemetry"],
        "rate_limit_per_min": 500,
        "is_active": True
    },
    _pwd_context.hash(_SEEDED_KEY_2): {
        "partner_name": "Nordic Card Consortium",
        "role": "api_client",
        "permissions": ["analyze_transactions"],
        "rate_limit_per_min": 200,
        "is_active": True
    }
}

def lookup_api_key(raw_key: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a raw API key against the stored bcrypt hashes.
    O(n) over stored keys — acceptable for small partner key sets.
    """
    for hashed, info in API_KEYS_DB.items():
        if info.get("is_active") and _pwd_context.verify(raw_key, hashed):
            return info
    return None

def store_api_key(raw_key: str, partner_name: str, rate_limit: int = 500) -> str:
    """
    Hashes and stores a new API key. Returns the hash (not the raw key).
    The raw key must be shown to the user ONCE at creation and never again.
    """
    hashed = _pwd_context.hash(raw_key)
    API_KEYS_DB[hashed] = {
        "partner_name": partner_name,
        "role": "api_client",
        "permissions": ["analyze_transactions", "read_telemetry"],
        "rate_limit_per_min": rate_limit,
        "is_active": True
    }
    return hashed

# ---------------------------------------------------------------------------
# In-Memory Rate Limiter (sliding window per IP/identifier)
# ---------------------------------------------------------------------------
REQUEST_HISTORY: Dict[str, List[float]] = {}

def check_rate_limit(identifier: str, max_requests: int = 120, window_seconds: int = 60):
    """Sliding-window in-memory rate limiter per IP or User ID."""
    now = time.time()
    timestamps = REQUEST_HISTORY.setdefault(identifier, [])
    cutoff = now - window_seconds
    REQUEST_HISTORY[identifier] = [t for t in timestamps if t > cutoff]

    if len(REQUEST_HISTORY[identifier]) >= max_requests:
        retry_after = int(window_seconds - (now - REQUEST_HISTORY[identifier][0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded ({max_requests} req/{window_seconds}s). Anti-abuse protection active.",
            headers={"Retry-After": str(max(1, retry_after))}
        )
    REQUEST_HISTORY[identifier].append(now)

# ---------------------------------------------------------------------------
# Audit Trail (in-memory ring buffer; replace with DB persistence in Phase 2)
# ---------------------------------------------------------------------------
AUDIT_TRAIL: List[Dict[str, Any]] = [
    {
        "id": "AUD-001",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "actor": "system_bootstrap",
        "role": "system",
        "ip": "127.0.0.1",
        "action": "SYSTEM_INITIALIZE",
        "status": "SUCCESS",
        "details": "FraudShield Enterprise Security & Cryptographic Mesh Activated."
    }
]

def record_audit_event(actor: str, role: str, ip: str, action: str, status: str, details: str):
    """Appends an event to the security audit trail (ring buffer, max 1000 entries)."""
    event_id = f"AUD-{len(AUDIT_TRAIL) + 1:04d}"
    entry = {
        "id": event_id,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "actor": actor,
        "role": role,
        "ip": ip,
        "action": action,
        "status": status,
        "details": details
    }
    AUDIT_TRAIL.insert(0, entry)  # Most recent first
    if len(AUDIT_TRAIL) > 1000:
        AUDIT_TRAIL.pop()

# ---------------------------------------------------------------------------
# JWT Token Creation & Validation
# ---------------------------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except Exception:
        return None

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

# ---------------------------------------------------------------------------
# FastAPI Dependencies — Authentication & RBAC
# ---------------------------------------------------------------------------
async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> Optional[Dict[str, Any]]:
    """
    Extracts current authenticated user or API key if provided.
    Returns None if unauthenticated (permissive; use get_current_user for strict).
    """
    # 1. Check for programmatic X-API-KEY header
    raw_api_key = request.headers.get("X-API-KEY")
    if raw_api_key:
        key_info = lookup_api_key(raw_api_key)
        if key_info and key_info.get("is_active"):
            return {
                "id": f"api_{secrets.token_hex(4)}",
                "email": f"{key_info['partner_name'].lower().replace(' ', '_')}@partner.api",
                "name": key_info["partner_name"],
                "role": key_info["role"],          # "api_client" — NOT admin
                "permissions": key_info["permissions"],
                "department": "Automated Banking Integration",
                "is_api_key": True
            }

    # 2. Check for Bearer JWT token
    token = None
    if credentials:
        token = credentials.credentials
    else:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            email = payload["sub"]
            if email in USERS_DB:
                user = USERS_DB[email]
                return {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "role": user["role"],
                    "title": user.get("title", "Analyst"),
                    "department": user.get("department", "SOC"),
                    "permissions": user.get("permissions", [])
                }
    return None

async def get_current_user(
    request: Request,
    user: Optional[Dict[str, Any]] = Security(get_current_user_optional)
) -> Dict[str, Any]:
    """Strict dependency: requires a valid active session or raises 401."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide a valid Bearer token or select a demo persona.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user

def require_role(allowed_roles: List[str]):
    """Role-Based Access Control (RBAC) dependency factory."""
    async def role_checker(
        request: Request,
        user: Optional[Dict[str, Any]] = Security(get_current_user_optional)
    ) -> Dict[str, Any]:
        # For public demo evaluation allow unauthenticated read at soc_analyst level
        if not user:
            if "soc_analyst" in allowed_roles or "public_guest" in allowed_roles:
                return DEMO_PERSONAS["soc_analyst"]
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication required. Required role(s): {', '.join(allowed_roles)}",
                headers={"WWW-Authenticate": "Bearer"}
            )

        user_role = user.get("role", "")
        # Admin bypasses all role checks
        if user_role == "admin" or user_role in allowed_roles:
            return user

        record_audit_event(
            actor=user.get("email", "unknown"),
            role=user_role,
            ip=get_client_ip(request),
            action="RBAC_ACCESS_DENIED",
            status="FORBIDDEN",
            details=f"User attempted unauthorized action requiring roles: {allowed_roles}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied. Your role '{user_role}' lacks permission. Required: {', '.join(allowed_roles)}."
        )
    return role_checker
