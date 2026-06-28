from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..models.broker import Broker
from ..schemas.broker import BrokerCreate, BrokerResponse


class BrokerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    regions_covered: Optional[List[str]] = None
    property_types: Optional[List[str]] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    current_active_count: Optional[int] = None
    capacity_limit: Optional[int] = None
    avg_response_time_hours: Optional[float] = None
    rating: Optional[float] = None
    is_active: Optional[bool] = None

router = APIRouter(prefix="/brokers", tags=["brokers"])


@router.get("", response_model=List[BrokerResponse])
def list_brokers(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Broker)
    if city:
        query = query.filter(Broker.city.ilike(f"%{city}%"))
    return query.order_by(Broker.rating.desc()).all()


@router.post("", response_model=BrokerResponse)
def create_broker(broker: BrokerCreate, db: Session = Depends(get_db)):
    db_broker = Broker(**broker.model_dump())
    db.add(db_broker)
    db.commit()
    db.refresh(db_broker)
    return db_broker


@router.get("/{broker_id}", response_model=BrokerResponse)
def get_broker(broker_id: int, db: Session = Depends(get_db)):
    broker = db.query(Broker).filter(Broker.id == broker_id).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker not found.")
    return broker


@router.patch("/{broker_id}", response_model=BrokerResponse)
def update_broker(broker_id: int, update: BrokerUpdate, db: Session = Depends(get_db)):
    broker = db.query(Broker).filter(Broker.id == broker_id).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker not found.")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(broker, field, value)
    db.commit()
    db.refresh(broker)
    return broker
