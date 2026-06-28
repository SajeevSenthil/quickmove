from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.assignment import Assignment
from ..models.customer import Customer
from ..models.broker import Broker
from ..schemas.assignment import AssignmentCreate, AssignmentApprove, AssignmentResponse
from ..services.notification import trigger_broker_notification
from ..services.email_sender import send_broker_assignment_email

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("", response_model=AssignmentResponse)
def create_assignment(data: AssignmentCreate, db: Session = Depends(get_db)):
    if not db.query(Customer).filter(Customer.id == data.customer_id).first():
        raise HTTPException(status_code=404, detail="Customer not found.")
    if not db.query(Broker).filter(Broker.id == data.broker_id).first():
        raise HTTPException(status_code=404, detail="Broker not found.")

    assignment = Assignment(
        customer_id=data.customer_id,
        broker_id=data.broker_id,
        ai_score=data.ai_score,
        ai_reasoning=data.ai_reasoning,
        deadline=data.deadline,
        status="pending_approval",
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("", response_model=List[AssignmentResponse])
def list_assignments(db: Session = Depends(get_db)):
    return db.query(Assignment).order_by(Assignment.created_at.desc()).all()


@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    return assignment


@router.post("/{assignment_id}/approve")
async def approve_assignment(
    assignment_id: int,
    data: AssignmentApprove,
    db: Session = Depends(get_db),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    if assignment.status not in ("pending_approval",):
        raise HTTPException(status_code=400, detail=f"Assignment is already '{assignment.status}'.")

    assignment.status = "approved"
    assignment.approved_by = data.approved_by
    assignment.approval_timestamp = datetime.utcnow()
    if data.deadline:
        assignment.deadline = data.deadline

    customer = assignment.customer
    customer.assignment_status = "assigned"

    broker = assignment.broker
    broker.current_active_count = (broker.current_active_count or 0) + 1

    db.commit()

    customer_payload = {
        "id": customer.id,
        "name": customer.name,
        "city": customer.city,
        "budget_min": customer.budget_min,
        "budget_max": customer.budget_max,
        "preferred_regions": customer.preferred_regions,
        "apartment_type": customer.apartment_type,
        "furnished_status": customer.furnished_status,
        "parking_required": customer.parking_required,
        "pets_allowed": customer.pets_allowed,
        "office_location": customer.office_location,
        "move_date": customer.move_date,
        "special_requirements": customer.special_requirements,
    }
    broker_payload = {
        "id": broker.id,
        "name": broker.name,
        "email": broker.email,
        "phone": broker.phone,
    }
    assignment_payload = {
        "id": assignment.id,
        "deadline": assignment.deadline,
        "approved_by": assignment.approved_by,
    }

    # Try direct SMTP first; fall back to n8n webhook
    email_sent = await send_broker_assignment_email(
        customer_payload, broker_payload, assignment_payload
    )
    n8n_sent = False
    if not email_sent:
        n8n_sent = await trigger_broker_notification(
            customer_payload, broker_payload, assignment_payload
        )

    notification_sent = email_sent or n8n_sent

    if notification_sent:
        assignment.status = "notified"
        customer.assignment_status = "notified"
        db.commit()

    db.refresh(assignment)
    return {
        "success": True,
        "assignment_id": assignment.id,
        "status": assignment.status,
        "notification_sent": notification_sent,
        "channel": "email" if email_sent else ("n8n" if n8n_sent else "none"),
    }


@router.post("/{assignment_id}/reject")
def reject_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    assignment.status = "rejected"
    db.commit()
    return {"success": True, "assignment_id": assignment_id, "status": "rejected"}
