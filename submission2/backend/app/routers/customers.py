from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.customer import Customer
from ..models.broker import Broker
from ..schemas.customer import CustomerUpdate, CustomerResponse
from ..services.extraction import extract_text_from_bytes, extract_customer_requirements
from ..services.broker_matching import filter_brokers_sql, get_broker_recommendations

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("/upload", response_model=CustomerResponse)
async def upload_customer_requirement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are accepted.")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB).")

    try:
        raw_text = extract_text_from_bytes(content)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read document: {exc}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Document appears to be empty.")

    try:
        extracted = await extract_customer_requirements(raw_text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI extraction failed: {exc}")

    customer = Customer(
        name=extracted.get("name") or "Unknown",
        city=extracted.get("city") or "",
        budget_min=extracted.get("budget_min"),
        budget_max=extracted.get("budget_max"),
        preferred_regions=extracted.get("preferred_regions") or [],
        apartment_type=extracted.get("apartment_type"),
        furnished_status=extracted.get("furnished_status"),
        parking_required=bool(extracted.get("parking_required", False)),
        pets_allowed=bool(extracted.get("pets_allowed", False)),
        office_location=extracted.get("office_location"),
        move_date=extracted.get("move_date"),
        special_requirements=extracted.get("special_requirements") or [],
        raw_text=raw_text,
        assignment_status="pending",
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("", response_model=List[CustomerResponse])
def list_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.created_at.desc()).all()


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return customer


@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, update: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}/recommendations")
async def get_recommendations(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    eligible_brokers = filter_brokers_sql(db, customer)
    if not eligible_brokers:
        return {
            "customer_id": customer_id,
            "recommendations": [],
            "message": f"No active brokers found in {customer.city} with available capacity.",
        }

    try:
        raw_recs = await get_broker_recommendations(customer, eligible_brokers)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Recommendation engine error: {exc}")

    broker_map = {b.id: b for b in eligible_brokers}
    enriched = []
    for rec in raw_recs:
        broker = broker_map.get(rec.get("broker_id"))
        if not broker:
            continue
        enriched.append(
            {
                "broker": {
                    "id": broker.id,
                    "name": broker.name,
                    "email": broker.email,
                    "phone": broker.phone,
                    "city": broker.city,
                    "regions_covered": broker.regions_covered,
                    "property_types": broker.property_types,
                    "budget_min": broker.budget_min,
                    "budget_max": broker.budget_max,
                    "current_active_count": broker.current_active_count,
                    "capacity_limit": broker.capacity_limit,
                    "avg_response_time_hours": broker.avg_response_time_hours,
                    "rating": broker.rating,
                },
                "score": rec.get("score"),
                "reasoning": rec.get("reasoning"),
            }
        )

    return {"customer_id": customer_id, "recommendations": enriched}
