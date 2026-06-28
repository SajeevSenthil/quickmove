from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AssignmentCreate(BaseModel):
    customer_id: int
    broker_id: int
    ai_score: Optional[float] = None
    ai_reasoning: Optional[str] = None
    deadline: Optional[str] = None


class AssignmentApprove(BaseModel):
    approved_by: str
    deadline: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: int
    customer_id: int
    broker_id: int
    ai_score: Optional[float]
    ai_reasoning: Optional[str]
    status: str
    deadline: Optional[str]
    approved_by: Optional[str]
    approval_timestamp: Optional[datetime]
    assigned_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True
