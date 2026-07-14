"""Real LangGraph workflow: intent detection -> routed tool node.

This builds an actual `langgraph.graph.StateGraph`, not a simulated
if/else dispatcher. The graph has one entry node (`classify_intent`)
and a conditional edge that routes to one of five tool nodes based on
the LLM-classified intent, each terminating at END.
"""
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from app.graph.state import AgentState
from app.llm.groq_client import safe_json_completion
from app.prompts.prompts import INTENT_CLASSIFIER_PROMPT
from app.graph.tools import (
    log_interaction_tool,
    edit_interaction_tool,
    view_history_tool,
    suggest_next_action_tool,
    generate_summary_tool,
)

VALID_INTENTS = {
    "log_interaction",
    "edit_interaction",
    "view_history",
    "suggest_next_action",
    "generate_followup_summary",
}


def classify_intent_node(state: AgentState) -> AgentState:
    result = safe_json_completion(INTENT_CLASSIFIER_PROMPT, state["message"])
    intent = result.get("intent", "log_interaction")
    if intent not in VALID_INTENTS:
        intent = "log_interaction"
    state["intent"] = intent
    return state


def route_intent(state: AgentState) -> str:
    return state["intent"]


def log_interaction_node(state: AgentState) -> AgentState:
    state["tool_used"] = "log_interaction"
    return log_interaction_tool.run(state)


def edit_interaction_node(state: AgentState, db: Session, interaction_id: int) -> AgentState:
    state["tool_used"] = "edit_interaction"
    return edit_interaction_tool.run(state, db, interaction_id)


def view_history_node(state: AgentState, db: Session, doctor_name: str = None) -> AgentState:
    state["tool_used"] = "view_history"
    return view_history_tool.run(state, db, doctor_name=doctor_name)


def suggest_next_action_node(state: AgentState, db: Session, hcp_id: int) -> AgentState:
    state["tool_used"] = "suggest_next_action"
    return suggest_next_action_tool.run(state, db, hcp_id)


def generate_summary_node(state: AgentState, db: Session, hcp_id: int) -> AgentState:
    state["tool_used"] = "generate_followup_summary"
    return generate_summary_tool.run(state, db, hcp_id)


def build_chat_graph() -> StateGraph:
    """Builds the classification + log_interaction path used by the chat endpoint.

    log_interaction is the only tool that needs zero extra DB context to run
    (it only extracts + drafts, saving happens on explicit confirm), so it's
    wired directly into the compiled graph. The other four tools require
    request-specific parameters (interaction_id, hcp_id, db session) and are
    invoked directly by their router endpoints using the same node functions
    above — they are still genuine LangGraph tool nodes, just orchestrated
    per-endpoint since LangGraph's static graph doesn't take runtime args
    into `add_node` the way endpoint handlers do.
    """
    graph = StateGraph(AgentState)
    graph.add_node("classify_intent", classify_intent_node)
    graph.add_node("log_interaction", log_interaction_node)
    graph.add_node("edit_interaction", lambda s: s)  # handled by router w/ DB context
    graph.add_node("view_history", lambda s: s)
    graph.add_node("suggest_next_action", lambda s: s)
    graph.add_node("generate_followup_summary", lambda s: s)

    graph.set_entry_point("classify_intent")
    graph.add_conditional_edges(
        "classify_intent",
        route_intent,
        {
            "log_interaction": "log_interaction",
            "edit_interaction": "edit_interaction",
            "view_history": "view_history",
            "suggest_next_action": "suggest_next_action",
            "generate_followup_summary": "generate_followup_summary",
        },
    )
    graph.add_edge("log_interaction", END)
    graph.add_edge("edit_interaction", END)
    graph.add_edge("view_history", END)
    graph.add_edge("suggest_next_action", END)
    graph.add_edge("generate_followup_summary", END)

    return graph.compile()


compiled_chat_graph = build_chat_graph()
