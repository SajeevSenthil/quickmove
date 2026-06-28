from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BrokerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    city: str
    regions_covered: Optional[List[str]] = []
    property_types: Optional[List[str]] = []
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    current_active_count: Optional[int] = 0
    capacity_limit: Optional[int] = 10
    avg_response_time_hours: Optional[float] = 24.0
    rating: Optional[float] = 4.0
    is_active: Optional[bool] = True


class BrokerCreate(BrokerBase):
    pass


class BrokerResponse(BrokerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
