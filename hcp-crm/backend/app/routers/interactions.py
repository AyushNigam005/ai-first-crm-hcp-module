"""Structured-form interaction logging + listing + editing."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import Interaction, User, OutcomeEnum
from app.schemas.schemas import InteractionCreate, InteractionOut, InteractionUpdate
from app.core.security import get_current_user
from app.services.hcp_service import get_or_create_hcp
from app.services.audit import log_action

router = APIRouter(prefix="/api/interactions", tags=["interactions"])


@router.post("", response_model=InteractionOut)
def create_interaction(
    payload: InteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hcp = get_or_create_hcp(
        db, name=payload.hcp_name, specialty=payload.specialty,
        hospital=payload.hospital, city=payload.city,
    )

    try:
        outcome = OutcomeEnum(payload.outcome or "neutral")
    except ValueError:
        outcome = OutcomeEnum.NEUTRAL

    interaction = Interaction(
        hcp_id=hcp.id,
        created_by=current_user.id,
        visit_date=payload.visit_date or datetime.utcnow(),
        products_discussed=payload.products_discussed,
        notes=payload.notes,
        follow_up_date=payload.follow_up_date,
        outcome=outcome,
        source="form",
        summary=payload.notes[:280] if payload.notes else None,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    log_action(db, current_user.id, "interaction.create", "interaction", interaction.id)
    return interaction


@router.get("", response_model=list[InteractionOut])
def list_interactions(
    hcp_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Interaction)
    if hcp_id:
        query = query.filter(Interaction.hcp_id == hcp_id)
    query = query.order_by(Interaction.visit_date.desc())
    return query.offset((page - 1) * page_size).limit(page_size).all()


@router.get("/{interaction_id}", response_model=InteractionOut)
def get_interaction(
    interaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@router.patch("/{interaction_id}", response_model=InteractionOut)
def update_interaction(
    interaction_id: int,
    payload: InteractionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field == "outcome" and value:
            value = OutcomeEnum(value)
        if field == "sentiment" and value:
            from app.models.models import SentimentEnum
            value = SentimentEnum(value)
        setattr(interaction, field, value)

    db.commit()
    db.refresh(interaction)
    log_action(db, current_user.id, "interaction.update", "interaction", interaction.id)
    return interaction
