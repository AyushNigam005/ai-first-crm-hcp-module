"""Tool 2: Edit Interaction — parse correction instructions, update DB, regenerate summary."""
from datetime import datetime

from sqlalchemy.orm import Session

from app.llm.groq_client import safe_json_completion
from app.prompts.prompts import EDIT_EXTRACTION_PROMPT

# Formats we accept for a follow-up date coming back from the LLM extraction step.
_DATE_FORMATS = (
    "%Y-%m-%d",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M:%S",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%m/%d/%Y",
)


def _parse_date(value: str):
    """Best-effort parse of a date string into a datetime object.

    SQLAlchemy's SQLite DateTime column only accepts real datetime/date
    objects (not strings), so raw LLM output must be converted before it's
    assigned to the model. Returns None if the value can't be parsed.
    """
    value = value.strip()
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def run(state: dict, db: Session, interaction_id: int) -> dict:
    from app.models.models import Interaction, SentimentEnum, OutcomeEnum

    message = state["message"]
    changes = safe_json_completion(EDIT_EXTRACTION_PROMPT, message)

    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        state["reply"] = f"No interaction found with id {interaction_id}."
        return state

    if changes.get("products_discussed"):
        interaction.products_discussed = changes["products_discussed"]
    if changes.get("notes"):
        interaction.notes = changes["notes"]
    if changes.get("follow_up_date"):
        parsed_date = _parse_date(str(changes["follow_up_date"]))
        if parsed_date:
            interaction.follow_up_date = parsed_date
    if changes.get("outcome"):
        try:
            interaction.outcome = OutcomeEnum(changes["outcome"])
        except ValueError:
            pass
    if changes.get("sentiment"):
        try:
            interaction.sentiment = SentimentEnum(changes["sentiment"])
        except ValueError:
            pass

    # Regenerate a short summary reflecting the update.
    interaction.summary = (
        f"Updated interaction for HCP #{interaction.hcp_id}: "
        f"{interaction.notes or interaction.products_discussed or 'details updated'}."
    )

    db.commit()
    db.refresh(interaction)

    state["db_result"] = interaction
    state["reply"] = f"Interaction #{interaction.id} updated successfully."
    return state