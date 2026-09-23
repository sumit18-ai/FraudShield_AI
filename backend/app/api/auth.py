from fastapi import APIRouter, HTTPException, Depends, Request, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import secrets
from ..core.security import (
    USERS_DB, DEMO_PERSONAS, API_KEYS_DB, AUDIT_TRAIL,
    hash_password, verify_password, create_access_token,
    get_current_user, require_role, record_audit_event, get_client_ip,
    check_rate_limit, lookup_api_key, store_api_key
)

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])


class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    persona: Optional[str] = None  # 'soc_analyst', 'compliance_officer', 'admin'


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Optional[str] = "soc_analyst"
    department: Optional[str] = "Fraud Operations"


class ApiKeyCreateRequest(BaseModel):
    partner_name: str
    rate_limit: Optional[int] = 500


@router.get("/personas")
def get_available_personas():
    """Returns public demo personas for seamless 1-click evaluation."""
    return {
        "personas": [
            {
                "id": "soc_analyst",
                "name": "Sarah Chen, CISSP",
                "title": "Senior SOC Fraud Analyst",
                "email": "analyst@fraudshield.ai",
                "role": "soc_analyst",
                "description": "Full access to live transaction stream, graph intelligence, and risk scoring.",
                "badge": "Operations"
            },
            {
                "id": "compliance_officer",
                "name": "Marcus Vance, CAMS",
                "title": "Lead Risk & Compliance Officer",
                "email": "compliance@fraudshield.ai",
                "role": "compliance_officer",
                "description": "Specialized in TreeSHAP explanations, FCRA compliance cards, and model drift audits.",
                "badge": "Audit & Risk"
            },
            {
                "id": "admin",
                "name": "Dr. Elena Rostova",
                "title": "Chief Information Security Officer & MLOps Lead",
                "email": "admin@fraudshield.ai",
                "role": "admin",
                "description": "Full administrative control, federated model updates, synthetic drift spikes, and API keys.",
                "badge": "Executive / MLOps"
            }
        ]
    }


@router.post("/login")
def login(req: LoginRequest, request: Request):
    """Authenticates via credentials OR instant 1-click persona selection."""
    client_ip = get_client_ip(request)
    check_rate_limit(f"auth_login_{client_ip}", max_requests=30, window_seconds=60)

    # 1. Persona Fast-Track Login
    if req.persona and req.persona in DEMO_PERSONAS:
        persona = DEMO_PERSONAS[req.persona]
        token = create_access_token({"sub": persona["email"], "role": persona["role"], "name": persona["name"]})
        record_audit_event(
            actor=persona["email"],
            role=persona["role"],
            ip=client_ip,
            action="LOGIN_SUCCESS_PERSONA",
            status="SUCCESS",
            details=f"Fast-track demo session established as {persona['name']} ({persona['role']})"
        )
        return {"access_token": token, "token_type": "bearer", "user": persona}

    # 2. Standard Email/Password Login
    if not req.email or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either valid email and password OR a demo persona must be provided."
        )

    user = USERS_DB.get(req.email.lower().strip())
    if not user or not verify_password(req.password, user["hashed_password"]):
        record_audit_event(
            actor=str(req.email),
            role="unauthenticated",
            ip=client_ip,
            action="LOGIN_FAILED",
            status="FAILURE",
            details="Invalid email or password attempt"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token({"sub": user["email"], "role": user["role"], "name": user["name"]})
    record_audit_event(
        actor=user["email"],
        role=user["role"],
        ip=client_ip,
        action="LOGIN_SUCCESS_CREDENTIALS",
        status="SUCCESS",
        details="User authenticated successfully via password credentials"
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "title": user.get("title", "Analyst"),
            "department": user.get("department", "SOC"),
            "permissions": user.get("permissions", [])
        }
    }


@router.post("/register")
def register(req: RegisterRequest, request: Request):
    client_ip = get_client_ip(request)
    check_rate_limit(f"auth_reg_{client_ip}", max_requests=10, window_seconds=60)

    clean_email = req.email.lower().strip()
    if clean_email in USERS_DB:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered.")

    valid_role = req.role if req.role in ["soc_analyst", "compliance_officer", "admin"] else "soc_analyst"
    # Self-registration cannot grant admin role
    if valid_role == "admin":
        valid_role = "soc_analyst"

    new_user = {
        "id": f"usr_{secrets.token_hex(4)}",
        "email": clean_email,
        "name": req.name.strip(),
        "role": valid_role,
        "title": f"Custom {valid_role.replace('_', ' ').title()}",
        "department": req.department.strip() if req.department else "Fraud Operations",
        "permissions": DEMO_PERSONAS.get(valid_role, DEMO_PERSONAS["soc_analyst"])["permissions"],
        "hashed_password": hash_password(req.password),
        "created_at": "2025-01-10T08:00:00Z"
    }
    USERS_DB[clean_email] = new_user

    token = create_access_token({"sub": new_user["email"], "role": new_user["role"], "name": new_user["name"]})
    record_audit_event(
        actor=new_user["email"],
        role=new_user["role"],
        ip=client_ip,
        action="USER_REGISTERED",
        status="SUCCESS",
        details=f"New public user registered with role {new_user['role']}"
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "name": new_user["name"],
            "role": new_user["role"],
            "title": new_user["title"],
            "department": new_user["department"],
            "permissions": new_user["permissions"]
        }
    }


@router.get("/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": user}


@router.get("/audit-logs")
def get_audit_logs(user: Dict[str, Any] = Depends(require_role(["compliance_officer", "admin"]))):
    """Returns immutable audit logs for compliance officers and system administrators."""
    return {
        "count": len(AUDIT_TRAIL),
        "audit_logs": AUDIT_TRAIL
    }


@router.get("/api-keys")
def list_api_keys(user: Dict[str, Any] = Depends(require_role(["admin"]))):
    """
    Returns registered external banking API keys (Admin only).
    Raw keys are NEVER returned — only partner metadata and masked previews.
    """
    keys = []
    for hashed_key, v in API_KEYS_DB.items():
        # Show only first 8 chars of hash as a non-reversible reference ID
        preview = f"fs_key_...{hashed_key[-6:]}"
        keys.append({
            "key_ref": preview,
            "partner_name": v["partner_name"],
            "role": v["role"],
            "permissions": v.get("permissions", []),
            "rate_limit_per_min": v["rate_limit_per_min"],
            "is_active": v["is_active"]
        })
    return {"api_keys": keys}


@router.post("/api-keys")
def create_api_key(req: ApiKeyCreateRequest, request: Request, user: Dict[str, Any] = Depends(require_role(["admin"]))):
    """
    Generates a new programmatic API key for external core banking integration.
    The raw key is returned ONCE and must be stored securely by the caller.
    It is NEVER stored in plaintext on the server.
    """
    raw_key = f"fs_live_{secrets.token_urlsafe(32)}"
    store_api_key(raw_key, req.partner_name, req.rate_limit or 500)

    record_audit_event(
        actor=user["email"],
        role=user["role"],
        ip=get_client_ip(request),
        action="API_KEY_CREATED",
        status="SUCCESS",
        details=f"Generated API key for partner '{req.partner_name}'"
    )
    return {
        "message": "API Key generated successfully. Store it securely — it will NOT be shown again.",
        "api_key": raw_key,      # Shown ONCE at creation only
        "partner_name": req.partner_name,
        "rate_limit_per_min": req.rate_limit or 500,
        "role": "api_client",
        "permissions": ["analyze_transactions", "read_telemetry"]
    }
