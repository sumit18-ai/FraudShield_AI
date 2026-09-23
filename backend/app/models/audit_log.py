from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from ..core.database import Base


class AuditLog(Base):
    """Persistent, append-only audit trail for compliance and forensic analysis."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_code = Column(String(32), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    actor = Column(String(255), nullable=False, index=True)
    role = Column(String(64), nullable=False)
    ip_address = Column(String(64), nullable=True)
    action = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False)
    details = Column(Text, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": f"AUD-{self.id:04d}",
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC") if self.timestamp else None,
            "actor": self.actor,
            "role": self.role,
            "ip": self.ip_address,
            "action": self.action,
            "status": self.status,
            "details": self.details,
        }
