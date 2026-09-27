from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.models.deviation import Deviation, DeviationStatus
from app.schemas.deviation import DeviationCreate, DeviationUpdate, DeviationResponse


class DeviationService:
    def __init__(self, db: Session):
        self.db = db
    
    def generate_deviation_number(self) -> str:
        """Generate unique deviation number"""
        year = datetime.now().year
        count = self.db.query(Deviation).filter(
            Deviation.deviation_number.like(f"DEV-{year}-%")
        ).count()
        return f"DEV-{year}-{count + 1:05d}"
    
    def create(self, deviation_data: DeviationCreate, ai_data: Dict[str, Any] = None) -> Deviation:
        deviation = Deviation(
            deviation_number=self.generate_deviation_number(),
            **deviation_data.model_dump(),
            ai_extracted_data=ai_data
        )
        self.db.add(deviation)
        self.db.commit()
        self.db.refresh(deviation)
        return deviation
    
    def get_by_id(self, deviation_id: int) -> Optional[Deviation]:
        return self.db.query(Deviation).filter(Deviation.id == deviation_id).first()
    
    def get_by_number(self, deviation_number: str) -> Optional[Deviation]:
        return self.db.query(Deviation).filter(Deviation.deviation_number == deviation_number).first()
    
    def get_all(self, skip: int = 0, limit: int = 100, status: DeviationStatus = None) -> List[Deviation]:
        query = self.db.query(Deviation)
        if status:
            query = query.filter(Deviation.status == status)
        return query.order_by(desc(Deviation.created_at)).offset(skip).limit(limit).all()
    
    def get_total_count(self, status: DeviationStatus = None) -> int:
        query = self.db.query(Deviation)
        if status:
            query = query.filter(Deviation.status == status)
        return query.count()
    
    def update(self, deviation_id: int, deviation_data: DeviationUpdate) -> Optional[Deviation]:
        deviation = self.get_by_id(deviation_id)
        if not deviation:
            return None
        
        update_data = deviation_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(deviation, field, value)
        
        deviation.updated_at = datetime.now()
        self.db.commit()
        self.db.refresh(deviation)
        return deviation
    
    def update_ai_assessment(self, deviation_id: int, severity: str, impact_assessment: str, reason: str) -> Optional[Deviation]:
        deviation = self.get_by_id(deviation_id)
        if not deviation:
            return None
        
        from app.models.deviation import DeviationSeverity
        deviation.severity = DeviationSeverity(severity)
        deviation.impact_assessment = impact_assessment
        deviation.ai_impact_reason = reason
        deviation.ai_severity_recommendation = DeviationSeverity(severity)
        deviation.updated_at = datetime.now()
        
        self.db.commit()
        self.db.refresh(deviation)
        return deviation
    
    def delete(self, deviation_id: int) -> bool:
        deviation = self.get_by_id(deviation_id)
        if not deviation:
            return False
        self.db.delete(deviation)
        self.db.commit()
        return True