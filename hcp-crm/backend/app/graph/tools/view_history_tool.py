"""Tool 3: View Interaction History — doctor timeline, search, filters."""
from typing import Optional
from sqlalchemy.orm import Session


def run(state: dict, db: Session, doctor_name: Optional[str] = None, city: Optional[str] = None):
    from app.models.models import HCP, Interaction

    query = db.query(HCP)
    if doctor_name:
        query = query.filter(HCP.name.ilike(f"%{doctor_name}%"))
    if city:
        query = query.filter(HCP.city.ilike(f"%{city}%"))

    hcps = query.all()
    timeline = []
    for hcp in hcps:
        visits = (
            db.query(Interaction)
            .filter(Interaction.hcp_id == hcp.id)
            .order_by(Interaction.visit_date.desc())
            .all()
        )
        timeline.append({
            "hcp": hcp.name,
            "hospital": hcp.hospital,
            "visits": [
                {
                    "date": v.visit_date.isoformat(),
                    "products": v.products_discussed,
                    "outcome": v.outcome.value if v.outcome else None,
                    "summary": v.summary,
                }
                for v in visits
            ],
        })

    state["db_result"] = timeline
    if timeline:
        names = ", ".join(t["hcp"] for t in timeline)
        state["reply"] = f"Found interaction history for: {names}."
    else:
        state["reply"] = "No matching HCP history found."
    return state
