from fastapi import APIRouter, HTTPException, Depends, Request, status, Body
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from ..core.security import (
    USERS_DB, DEMO_PERSONAS, API_KEYS_DB, AUDIT_TRAIL,
    hash_password, verify_password, create_access_token,
    get_current_user, require_role, record_audit_event, get_client_ip,
    check_rate_limit
)
import secrets

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])

class LoginRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    persona: Optional[str] = None # 'soc_analyst', 'compliance_officer', 'admin'

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: Optional[str] = "soc_analyst"
    department: Optional[str] = "Fraud Operations"

class ApiKeyCreateRequest(BaseModel):
    partner_name: str
    rate_limit: Optional[int] = 500

@router.get("/personas")
def get_available_personas():
    """
    Returns public demo personas for seamless 1-click evaluation.
    """
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
    """
    Authenticates via credentials OR instant 1-click persona selection.
    """
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
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": persona
        }

    # 2. Standard Email/Password Login
    if not req.email or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either valid email and password OR a demo persona must be provided."
        )

    user = USERS_DB.get(req.email.lower().strip())
    if not user or not verify_password(req.password, user["hashed_password"]):
        record_audit_event(
            actor=req.email,
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
        details=f"User authenticated successfully via password credentials"
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
    """
    Returns immutable audit logs for compliance officers and system administrators.
    """
    return {
        "count": len(AUDIT_TRAIL),
        "audit_logs": AUDIT_TRAIL
    }

@router.get("/api-keys")
def list_api_keys(user: Dict[str, Any] = Depends(require_role(["admin"]))):
    """
    Returns registered external banking API keys (Admin only).
    """
    keys = []
    for k, v in API_KEYS_DB.items():
        masked_key = f"{k[:10]}...{k[-4:]}"
        keys.append({
            "key_preview": masked_key,
            "raw_key": k,
            "partner_name": v["partner_name"],
            "rate_limit_per_min": v["rate_limit_per_min"],
            "is_active": v["is_active"]
        })
    return {"api_keys": keys}

@router.post("/api-keys")
def create_api_key(req: ApiKeyCreateRequest, user: Dict[str, Any] = Depends(require_role(["admin"]))):
    """
    Generates a new programmatic API key for external core banking integration.
    """
    new_key = f"fs_live_{secrets.token_urlsafe(24)}"
    API_KEYS_DB[new_key] = {
        "partner_name": req.partner_name,
        "role": "api_client",
        "rate_limit_per_min": req.rate_limit or 500,
        "is_active": True
    }
    record_audit_event(
        actor=user["email"],
        role=user["role"],
        ip="internal",
        action="API_KEY_CREATED",
        status="SUCCESS",
        details=f"Generated API key for partner '{req.partner_name}'"
    )
    return {
        "message": "API Key generated successfully. Store it securely.",
        "api_key": new_key,
        "partner_name": req.partner_name,
        "rate_limit_per_min": req.rate_limit or 500
    }
