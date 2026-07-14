"""Shared state schema passed between LangGraph nodes."""
from typing import Optional, TypedDict, Any


class AgentState(TypedDict, total=False):
    session_id: str
    user_id: int
    message: str
    intent: str
    tool_used: str
    extracted: dict
    reply: str
    requires_confirmation: bool
    db_result: Any
