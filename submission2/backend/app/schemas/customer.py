from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CustomerBase(BaseModel):
    name: str
    city: str
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    preferred_regions: Optional[List[str]] = []
    apartment_type: Optional[str] = None
    furnished_status: Optional[str] = None
    parking_required: Optional[bool] = False
    pets_allowed: Optional[bool] = False
    office_location: Optional[str] = None
    move_date: Optional[str] = None
    special_requirements: Optional[List[str]] = []


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    preferred_regions: Optional[List[str]] = None
    apartment_type: Optional[str] = None
    furnished_status: Optional[str] = None
    parking_required: Optional[bool] = None
    pets_allowed: Optional[bool] = None
    office_location: Optional[str] = None
    move_date: Optional[str] = None
    special_requirements: Optional[List[str]] = None


class CustomerResponse(CustomerBase):
    id: int
    assignment_status: str
    created_at: datetime

    class Config:
        from_attributes = True
