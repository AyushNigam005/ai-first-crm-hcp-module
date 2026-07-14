"""Conversational AI endpoint: routes messages through the LangGraph agent."""
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, ChatHistory, Interaction, OutcomeEnum, SentimentEnum
from app.schemas.schemas import ChatRequest, ChatResponse, ConfirmInteractionRequest, InteractionOut
from app.core.security import get_current_user
from app.graph.agent_graph import compiled_chat_graph
from app.graph.tools import (
    edit_interaction_tool, view_history_tool, suggest_next_action_tool, generate_summary_tool,
)
from app.services.hcp_service import get_or_create_hcp
from app.services.audit import log_action

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
def send_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    state = {
        "session_id": payload.session_id,
        "user_id": current_user.id,
        "message": payload.message,
    }

    # Run through the compiled LangGraph: classify_intent -> routed node.
    result_state = compiled_chat_graph.invoke(state)
    intent = result_state.get("intent", "log_interaction")

    # Tools needing runtime DB/args are executed here with the graph's
    # classified intent driving the branch (still using the same tool
    # node functions the graph itself calls for log_interaction).
    if intent == "view_history":
        result_state = view_history_tool.run(result_state, db, doctor_name=None)
        result_state["tool_used"] = "view_history"
    elif intent == "suggest_next_action":
        result_state["reply"] = (
            "To suggest a next action I need a specific doctor — open their profile and "
            "ask me there, or mention the doctor's name."
        )
        result_state["tool_used"] = "suggest_next_action"
    elif intent == "generate_followup_summary":
        result_state["reply"] = (
            "To generate a follow-up summary I need a specific doctor — open their profile "
            "and ask me there, or mention the doctor's name."
        )
        result_state["tool_used"] = "generate_followup_summary"
    elif intent == "edit_interaction":
        result_state["reply"] = (
            "Tell me which logged interaction to edit (or open it from the doctor's timeline) "
            "and what should change."
        )
        result_state["tool_used"] = "edit_interaction"
    # log_interaction already fully handled inside the compiled graph

    # Persist the raw chat turn for history/audit.
    db.add(ChatHistory(
        user_id=current_user.id, session_id=payload.session_id, role="user",
        content=payload.message, intent=intent,
        extracted_data=json.dumps(result_state.get("extracted", {})),
    ))
    db.add(ChatHistory(
        user_id=current_user.id, session_id=payload.session_id, role="assistant",
        content=result_state.get("reply", ""), intent=intent,
    ))
    db.commit()

    return ChatResponse(
        intent=intent,
        reply=result_state.get("reply", ""),
        extracted=result_state.get("extracted") or None,
        tool_used=result_state.get("tool_used", intent),
        requires_confirmation=result_state.get("requires_confirmation", False),
    )


@router.post("/confirm", response_model=InteractionOut)
def confirm_interaction(
    payload: ConfirmInteractionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """User confirms the AI-extracted interaction draft; persist it for real."""
    extracted = payload.extracted
    hcp = get_or_create_hcp(
        db, name=extracted.doctor_name or "Unknown Doctor",
        specialty=extracted.specialty, hospital=extracted.hospital, city=extracted.city,
    )

    try:
        outcome = OutcomeEnum(extracted.outcome) if extracted.outcome else OutcomeEnum.NEUTRAL
    except ValueError:
        outcome = OutcomeEnum.NEUTRAL
    try:
        sentiment = SentimentEnum(extracted.sentiment) if extracted.sentiment else SentimentEnum.NEUTRAL
    except ValueError:
        sentiment = SentimentEnum.NEUTRAL

    interaction = Interaction(
        hcp_id=hcp.id,
        created_by=current_user.id,
        products_discussed=", ".join(extracted.products) if extracted.products else None,
        notes=extracted.summary,
        summary=extracted.summary,
        sentiment=sentiment,
        outcome=outcome,
        source="chat",
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    log_action(db, current_user.id, "interaction.create.chat", "interaction", interaction.id)
    return interaction


@router.post("/edit/{interaction_id}")
def edit_via_chat(
    interaction_id: int,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    state = {"message": payload.message, "session_id": payload.session_id}
    state = edit_interaction_tool.run(state, db, interaction_id)
    return {"reply": state["reply"]}


@router.get("/next-action/{hcp_id}")
def next_action(
    hcp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    state = suggest_next_action_tool.run({}, db, hcp_id)
    return {"reply": state["reply"], "detail": state.get("db_result")}


@router.get("/followup-summary/{hcp_id}")
def followup_summary(
    hcp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    state = generate_summary_tool.run({}, db, hcp_id)
    return {"reply": state["reply"], "report": state.get("db_result")}
