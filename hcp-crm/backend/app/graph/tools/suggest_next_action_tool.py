"""Tool 4: Suggest Next Action — AI recommendation based on latest outcome/sentiment."""
from sqlalchemy.orm import Session

from app.llm.groq_client import safe_json_completion
from app.prompts.prompts import NEXT_ACTION_PROMPT


def run(state: dict, db: Session, hcp_id: int) -> dict:
    from app.models.models import Interaction

    latest = (
        db.query(Interaction)
        .filter(Interaction.hcp_id == hcp_id)
        .order_by(Interaction.visit_date.desc())
        .first()
    )
    if not latest:
        state["reply"] = "No prior interactions found for this HCP; log a visit first."
        return state

    payload = (
        f"outcome: {latest.outcome.value}, sentiment: {latest.sentiment.value}, "
        f"notes: {latest.notes or ''}"
    )
    suggestion = safe_json_completion(NEXT_ACTION_PROMPT, payload)

    state["db_result"] = suggestion
    state["reply"] = suggestion.get(
        "action", "Follow up with the doctor to confirm next steps."
    )
    return state
