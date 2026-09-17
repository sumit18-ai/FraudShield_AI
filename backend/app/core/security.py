import os
import time
import hashlib
import hmac
import jwt
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import HTTPException, Security, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Cryptographic Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fraudshield-enterprise-airgap-secret-key-prod-9942e8")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days session

security_bearer = HTTPBearer(auto_error=False)

# Salt for password hashing
SALT = os.getenv("HASH_SALT", "fs_salt_99812_x")

def hash_password(password: str) -> str:
    return hashlib.sha256((password + SALT).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hmac.compare_digest(hash_password(plain_password), hashed_password)

# Pre-seeded enterprise personas for immediate testing and public evaluation
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

# In-memory User Database (pre-seeded with demo accounts + allows self-registration)
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

# Pre-registered API keys for programmatic external banking systems
API_KEYS_DB = {
    "fs_live_banking_partner_key_889": {
        "partner_name": "Apex Global Clearing & Settlement",
        "role": "api_client",
        "rate_limit_per_min": 500,
        "is_active": True
    },
    "fs_demo_webhook_key_771": {
        "partner_name": "Nordic Card Consortium",
        "role": "api_client",
        "rate_limit_per_min": 200,
        "is_active": True
    }
}

# In-Memory Sliding-Window Rate Limiter
REQUEST_HISTORY: Dict[str, List[float]] = {}

def check_rate_limit(identifier: str, max_requests: int = 120, window_seconds: int = 60):
    """
    Sliding-window in-memory rate limiter per IP or User ID.
    """
    now = time.time()
    timestamps = REQUEST_HISTORY.setdefault(identifier, [])
    
    # Remove timestamps older than window
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

# In-Memory Immutable Audit Trail Ring Buffer (Up to 1000 entries)
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
    """
    Appends an event to the security audit trail.
    """
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
    AUDIT_TRAIL.insert(0, entry) # Most recent first
    if len(AUDIT_TRAIL) > 1000:
        AUDIT_TRAIL.pop()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> Optional[Dict[str, Any]]:
    """
    Extracts current authenticated user or API key if provided. Returns None if unauthenticated.
    """
    # 1. Check for programmatic X-API-KEY header
    api_key = request.headers.get("X-API-KEY")
    if api_key and api_key in API_KEYS_DB:
        key_info = API_KEYS_DB[api_key]
        return {
            "id": f"api_{api_key[:10]}",
            "email": f"{key_info['partner_name'].lower().replace(' ', '_')}@partner.api",
            "name": key_info["partner_name"],
            "role": "admin", # API keys have programmatic administrative scoring rights
            "department": "Automated Banking Integration",
            "is_api_key": True
        }

    # 2. Check for Bearer JWT token
    token = None
    if credentials:
        token = credentials.credentials
    else:
        # Fallback to query param or raw Authorization header
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
    """
    Strict dependency requiring a valid active session.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide a valid Bearer token or select a demo persona.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user

def require_role(allowed_roles: List[str]):
    """
    Role-Based Access Control (RBAC) Dependency Factory.
    """
    async def role_checker(
        request: Request,
        user: Optional[Dict[str, Any]] = Security(get_current_user_optional)
    ) -> Dict[str, Any]:
        # For public demo evaluation, if user is unauthenticated, allow soc_analyst level read access
        if not user:
            if "soc_analyst" in allowed_roles or "public_guest" in allowed_roles:
                return DEMO_PERSONAS["soc_analyst"]
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication required for this operation. Required role(s): {', '.join(allowed_roles)}",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user_role = user.get("role", "")
        if user_role not in allowed_roles and "admin" != user_role:
            record_audit_event(
                actor=user.get("email", "unknown"),
                role=user_role,
                ip=get_client_ip(request),
                action="RBAC_ACCESS_DENIED",
                status="FORBIDDEN",
                details=f"User attempted unauthorized action requiring {allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied. Your role '{user_role}' lacks permissions for this action. Required role(s): {', '.join(allowed_roles)}."
            )
        return user

    return role_checker
