from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class DeviationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    CLOSED = "CLOSED"


class DeviationSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    MAJOR = "MAJOR"
    MINOR = "MINOR"


class Deviation(Base):
    __tablename__ = "deviations"

    id = Column(Integer, primary_key=True, index=True)
    deviation_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    batch_number = Column(String(100), nullable=True)
    product_name = Column(String(255), nullable=True)
    process_step = Column(String(255), nullable=True)
    equipment_id = Column(String(100), nullable=True)
    deviation_date = Column(DateTime, nullable=True)
    reported_by = Column(String(255), nullable=True)
    reported_date = Column(DateTime, default=func.now())
    status = Column(Enum(DeviationStatus), default=DeviationStatus.DRAFT)
    severity = Column(Enum(DeviationSeverity), nullable=True)
    impact_assessment = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    preventive_action = Column(Text, nullable=True)
    ai_extracted_data = Column(JSON, nullable=True)
    ai_impact_reason = Column(Text, nullable=True)
    ai_severity_recommendation = Column(Enum(DeviationSeverity), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Deviation(id={self.id}, deviation_number='{self.deviation_number}', title='{self.title}')>"