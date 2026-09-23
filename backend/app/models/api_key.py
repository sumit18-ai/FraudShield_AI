from sqlalchemy import Column, String, Integer, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from ..core.database import Base


class ApiKey(Base):
    """
    Stores bcrypt-hashed API keys — the plaintext key is shown ONCE at creation
    and never stored. Verification is done by bcrypt.verify() against this hash.
    """
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hashed_key = Column(String(255), unique=True, nullable=False, index=True)
    partner_name = Column(String(255), nullable=False)
    role = Column(String(64), nullable=False, default="api_client")
    permissions = Column(JSON, nullable=False, default=list)
    rate_limit_per_min = Column(Integer, nullable=False, default=500)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self, include_hash: bool = False) -> dict:
        d = {
            "id": self.id,
            "partner_name": self.partner_name,
            "role": self.role,
            "permissions": self.permissions or [],
            "rate_limit_per_min": self.rate_limit_per_min,
            "is_active": self.is_active,
        }
        if include_hash:
            d["hashed_key"] = self.hashed_key
        return d
