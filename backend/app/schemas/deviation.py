from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DeviationStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    CLOSED = "CLOSED"


class DeviationSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    MAJOR = "MAJOR"
    MINOR = "MINOR"


class DeviationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    batch_number: Optional[str] = Field(None, max_length=100)
    product_name: Optional[str] = Field(None, max_length=255)
    process_step: Optional[str] = Field(None, max_length=255)
    equipment_id: Optional[str] = Field(None, max_length=100)
    deviation_date: Optional[datetime] = None
    reported_by: Optional[str] = Field(None, max_length=255)
    status: DeviationStatus = DeviationStatus.DRAFT
    severity: Optional[DeviationSeverity] = None
    impact_assessment: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None


class DeviationCreate(DeviationBase):
    pass


class DeviationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    batch_number: Optional[str] = Field(None, max_length=100)
    product_name: Optional[str] = Field(None, max_length=255)
    process_step: Optional[str] = Field(None, max_length=255)
    equipment_id: Optional[str] = Field(None, max_length=100)
    deviation_date: Optional[datetime] = None
    reported_by: Optional[str] = Field(None, max_length=255)
    status: Optional[DeviationStatus] = None
    severity: Optional[DeviationSeverity] = None
    impact_assessment: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None


class DeviationResponse(DeviationBase):
    id: int
    deviation_number: str
    reported_date: datetime
    created_at: datetime
    updated_at: datetime
    ai_extracted_data: Optional[Dict[str, Any]] = None
    ai_impact_reason: Optional[str] = None
    ai_severity_recommendation: Optional[DeviationSeverity] = None

    model_config = ConfigDict(from_attributes=True)


class DeviationListResponse(BaseModel):
    items: List[DeviationResponse]
    total: int


class AIExtractionRequest(BaseModel):
    text: str = Field(..., min_length=1)
    file_content: Optional[str] = None
    file_name: Optional[str] = None


class AIExtractionResponse(BaseModel):
    extracted_data: Dict[str, Any]
    confidence: float = Field(..., ge=0, le=1)


class AImpactAssessmentRequest(BaseModel):
    deviation_data: Dict[str, Any]


class AImpactAssessmentResponse(BaseModel):
    severity: DeviationSeverity
    impact_assessment: str
    reason: str
    confidence: float = Field(..., ge=0, le=1)


class AIChatRequest(BaseModel):
    message: str
    deviation_context: Optional[Dict[str, Any]] = None


class AIChatResponse(BaseModel):
    response: str
    suggested_actions: Optional[List[str]] = None