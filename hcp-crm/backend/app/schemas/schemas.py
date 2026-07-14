"""Pydantic request/response schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


# ---------- Auth ----------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- HCP ----------
class HCPCreate(BaseModel):
    name: str
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class HCPOut(HCPCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Interaction ----------
class InteractionCreate(BaseModel):
    hcp_name: str
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    city: Optional[str] = None
    visit_date: Optional[datetime] = None
    products_discussed: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    outcome: Optional[str] = "neutral"


class InteractionUpdate(BaseModel):
    products_discussed: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    outcome: Optional[str] = None
    sentiment: Optional[str] = None


class InteractionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    hcp_id: int
    visit_date: datetime
    products_discussed: Optional[str]
    notes: Optional[str]
    summary: Optional[str]
    sentiment: str
    outcome: str
    follow_up_date: Optional[datetime]
    source: str
    created_at: datetime


# ---------- Chat / Agent ----------
class ChatRequest(BaseModel):
    message: str
    session_id: str


class ExtractedInteraction(BaseModel):
    doctor_name: Optional[str] = None
    hospital: Optional[str] = None
    specialty: Optional[str] = None
    city: Optional[str] = None
    products: List[str] = []
    follow_up: Optional[str] = None
    sentiment: Optional[str] = None
    outcome: Optional[str] = None
    summary: Optional[str] = None


class ChatResponse(BaseModel):
    intent: str
    reply: str
    extracted: Optional[ExtractedInteraction] = None
    tool_used: str
    requires_confirmation: bool = False


class ConfirmInteractionRequest(BaseModel):
    session_id: str
    extracted: ExtractedInteraction
