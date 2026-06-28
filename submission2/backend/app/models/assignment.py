from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    broker_id = Column(Integer, ForeignKey("brokers.id"), nullable=False)
    ai_score = Column(Float)
    ai_reasoning = Column(Text)
    # pending_approval | approved | rejected | notified
    status = Column(String, default="pending_approval")
    deadline = Column(String)
    approved_by = Column(String)
    approval_timestamp = Column(DateTime)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="assignments")
    broker = relationship("Broker", back_populates="assignments")
