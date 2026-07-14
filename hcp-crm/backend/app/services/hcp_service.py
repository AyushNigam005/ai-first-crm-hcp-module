"""Shared logic for finding-or-creating an HCP from loosely structured data."""
from sqlalchemy.orm import Session
from app.models.models import HCP


def get_or_create_hcp(db: Session, name: str, specialty: str | None = None,
                       hospital: str | None = None, city: str | None = None) -> HCP:
    if not name:
        name = "Unknown Doctor"

    hcp = db.query(HCP).filter(HCP.name.ilike(name)).first()
    if hcp:
        # Backfill any newly-learned details without overwriting existing data.
        hcp.specialty = hcp.specialty or specialty
        hcp.hospital = hcp.hospital or hospital
        hcp.city = hcp.city or city
        db.commit()
        db.refresh(hcp)
        return hcp

    hcp = HCP(name=name, specialty=specialty, hospital=hospital, city=city)
    db.add(hcp)
    db.commit()
    db.refresh(hcp)
    return hcp
