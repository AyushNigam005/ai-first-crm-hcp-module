"""Production SQLAlchemy models: Users, HCP, Interaction, ChatHistory, AuditLog."""
import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, Index
)
from sqlalchemy.orm import relationship

from app.database.db import Base


class UserRole(str, enum.Enum):
    REP = "rep"
    MANAGER = "manager"
    ADMIN = "admin"


class OutcomeEnum(str, enum.Enum):
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    NEEDS_FOLLOW_UP = "needs_follow_up"
    REQUESTED_LITERATURE = "requested_literature"
    BUSY = "busy"
    NEUTRAL = "neutral"


class SentimentEnum(str, enum.Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.REP, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="created_by_user")
    chat_messages = relationship("ChatHistory", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class HCP(Base):
    """Healthcare Professional (doctor) record."""
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    specialty = Column(String(150), nullable=True)
    hospital = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    interactions = relationship(
        "Interaction", back_populates="hcp", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_hcp_name_city", "name", "city"),
    )


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    visit_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    products_discussed = Column(String(500), nullable=True)  # comma separated
    notes = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)  # AI-generated summary
    sentiment = Column(Enum(SentimentEnum), default=SentimentEnum.NEUTRAL)
    outcome = Column(Enum(OutcomeEnum), default=OutcomeEnum.NEUTRAL)
    follow_up_date = Column(DateTime, nullable=True)
    source = Column(String(20), default="form")  # "form" or "chat"

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hcp = relationship("HCP", back_populates="interactions")
    created_by_user = relationship("User", back_populates="interactions")

    __table_args__ = (
        Index("ix_interaction_hcp_date", "hcp_id", "visit_date"),
    )


class ChatHistory(Base):
    """Raw conversational-AI chat turns tied to a user session."""
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(String(100), index=True, nullable=False)
    role = Column(String(20), nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    intent = Column(String(50), nullable=True)  # detected LangGraph intent
    extracted_data = Column(Text, nullable=True)  # JSON string of extracted entities
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)  # e.g. "interaction.create"
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
