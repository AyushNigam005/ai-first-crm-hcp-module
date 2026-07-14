"""HCP (doctor) CRUD + list/search/filter/pagination."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import HCP, User
from app.schemas.schemas import HCPCreate, HCPOut
from app.core.security import get_current_user

router = APIRouter(prefix="/api/hcps", tags=["hcps"])


@router.get("", response_model=list[HCPOut])
def list_hcps(
    search: Optional[str] = None,
    city: Optional[str] = None,
    specialty: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(HCP)
    if search:
        query = query.filter(HCP.name.ilike(f"%{search}%"))
    if city:
        query = query.filter(HCP.city.ilike(f"%{city}%"))
    if specialty:
        query = query.filter(HCP.specialty.ilike(f"%{specialty}%"))

    return query.offset((page - 1) * page_size).limit(page_size).all()


@router.post("", response_model=HCPOut)
def create_hcp(
    payload: HCPCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hcp = HCP(**payload.model_dump())
    db.add(hcp)
    db.commit()
    db.refresh(hcp)
    return hcp


@router.get("/{hcp_id}", response_model=HCPOut)
def get_hcp(
    hcp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    return hcp
