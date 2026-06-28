from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    budget_min = Column(Integer)
    budget_max = Column(Integer)
    preferred_regions = Column(JSON, default=list)
    apartment_type = Column(String)
    furnished_status = Column(String)
    parking_required = Column(Boolean, default=False)
    pets_allowed = Column(Boolean, default=False)
    office_location = Column(String)
    move_date = Column(String)
    special_requirements = Column(JSON, default=list)
    raw_text = Column(Text)
    assignment_status = Column(String, default="pending")  # pending | assigned | notified
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship("Assignment", back_populates="customer")
