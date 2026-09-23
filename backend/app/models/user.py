from sqlalchemy import Column, String, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(32), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(64), nullable=False, default="soc_analyst")
    title = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    permissions = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "title": self.title or "Analyst",
            "department": self.department or "SOC",
            "permissions": self.permissions or [],
            "is_active": self.is_active,
        }
