from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Broker(Base):
    __tablename__ = "brokers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    city = Column(String, nullable=False)
    regions_covered = Column(JSON, default=list)
    property_types = Column(JSON, default=list)
    budget_min = Column(Integer)
    budget_max = Column(Integer)
    current_active_count = Column(Integer, default=0)
    capacity_limit = Column(Integer, default=10)
    avg_response_time_hours = Column(Float, default=24.0)
    rating = Column(Float, default=4.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship("Assignment", back_populates="broker")
