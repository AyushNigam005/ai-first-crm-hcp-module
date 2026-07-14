"""Tool 1: Log Interaction — summarization, entity/product extraction, sentiment, save."""
from app.llm.groq_client import safe_json_completion
from app.prompts.prompts import ENTITY_EXTRACTION_PROMPT


def run(state: dict) -> dict:
    message = state["message"]
    extracted = safe_json_completion(ENTITY_EXTRACTION_PROMPT, message)

    if not extracted:
        state["reply"] = (
            "I couldn't fully parse that interaction. Could you rephrase, or use the "
            "structured form instead?"
        )
        state["extracted"] = {}
        state["requires_confirmation"] = False
        return state

    state["extracted"] = extracted
    state["requires_confirmation"] = True
    state["reply"] = (
        f"I've drafted an interaction log for Dr. {extracted.get('doctor_name', 'Unknown')}. "
        "Please review the extracted details below and confirm to save."
    )
    return state
