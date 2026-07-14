"""Tool 5: Generate Follow-up Summary — structured CRM report from interaction history."""
import json
from sqlalchemy.orm import Session

from app.llm.groq_client import safe_json_completion
from app.prompts.prompts import FOLLOWUP_SUMMARY_PROMPT


def run(state: dict, db: Session, hcp_id: int) -> dict:
    from app.models.models import Interaction

    visits = (
        db.query(Interaction)
        .filter(Interaction.hcp_id == hcp_id)
        .order_by(Interaction.visit_date.desc())
        .limit(5)
        .all()
    )
    if not visits:
        state["reply"] = "No interaction history available to summarize."
        return state

    history_payload = json.dumps([
        {
            "date": v.visit_date.isoformat(),
            "products": v.products_discussed,
            "notes": v.notes,
            "outcome": v.outcome.value if v.outcome else None,
        }
        for v in visits
    ])

    report = safe_json_completion(FOLLOWUP_SUMMARY_PROMPT, history_payload)
    state["db_result"] = report
    state["reply"] = "Follow-up summary report generated."
    return state
