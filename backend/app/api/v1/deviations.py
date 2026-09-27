from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.db.session import get_db
from app.services.deviation_service import DeviationService
from app.schemas.deviation import (
    DeviationCreate, DeviationUpdate, DeviationResponse, 
    DeviationListResponse, AIExtractionRequest, AIExtractionResponse,
    AImpactAssessmentRequest, AImpactAssessmentResponse,
    AIChatRequest, AIChatResponse
)
from app.ai.workflow import process_deviation_text, chat_with_ai
from app.ai.file_processor import extract_text_from_file
from app.models.deviation import DeviationStatus, DeviationSeverity

router = APIRouter()


@router.post("/deviations", response_model=DeviationResponse)
def create_deviation(deviation: DeviationCreate, db: Session = Depends(get_db)):
    service = DeviationService(db)
    new_deviation = service.create(deviation)
    return new_deviation


@router.get("/deviations", response_model=DeviationListResponse)
def list_deviations(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[DeviationStatus] = None,
    db: Session = Depends(get_db)
):
    service = DeviationService(db)
    items = service.get_all(skip=skip, limit=limit, status=status)
    total = service.get_total_count(status=status)
    return DeviationListResponse(items=items, total=total)


@router.get("/deviations/{deviation_id}", response_model=DeviationResponse)
def get_deviation(deviation_id: int, db: Session = Depends(get_db)):
    service = DeviationService(db)
    deviation = service.get_by_id(deviation_id)
    if not deviation:
        raise HTTPException(status_code=404, detail="Deviation not found")
    return deviation


@router.patch("/deviations/{deviation_id}", response_model=DeviationResponse)
def update_deviation(deviation_id: int, deviation: DeviationUpdate, db: Session = Depends(get_db)):
    service = DeviationService(db)
    updated = service.update(deviation_id, deviation)
    if not updated:
        raise HTTPException(status_code=404, detail="Deviation not found")
    return updated


@router.delete("/deviations/{deviation_id}")
def delete_deviation(deviation_id: int, db: Session = Depends(get_db)):
    service = DeviationService(db)
    if not service.delete(deviation_id):
        raise HTTPException(status_code=404, detail="Deviation not found")
    return {"message": "Deviation deleted successfully"}


@router.post("/ai/extract", response_model=AIExtractionResponse)
async def extract_deviation_info(request: AIExtractionRequest):
    result = await process_deviation_text(
        text=request.text,
        file_content=request.file_content,
        file_name=request.file_name
    )
    
    if result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return AIExtractionResponse(
        extracted_data=result["extracted_data"],
        confidence=result["extraction_confidence"]
    )


@router.post("/ai/extract-file", response_model=AIExtractionResponse)
async def extract_deviation_from_file(
    file: UploadFile = File(...),
    additional_text: str = Form("")
):
    file_content = await file.read()
    
    try:
        extracted_text = extract_text_from_file(file_content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    combined_text = f"{additional_text}\n\n--- File Content ---\n{extracted_text}".strip()
    
    result = await process_deviation_text(
        text=combined_text,
        file_content=extracted_text,
        file_name=file.filename
    )
    
    if result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return AIExtractionResponse(
        extracted_data=result["extracted_data"],
        confidence=result["extraction_confidence"]
    )


@router.post("/ai/assess-impact", response_model=AImpactAssessmentResponse)
async def assess_impact(request: AImpactAssessmentRequest):
    # This uses the same workflow but we can call just the assessment part
    # For now, we'll re-run with the deviation data
    text = json.dumps(request.deviation_data)
    result = await process_deviation_text(text=text)
    
    if result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return AImpactAssessmentResponse(
        severity=result["severity"],
        impact_assessment=result["impact_assessment"],
        reason=result["impact_reason"],
        confidence=result["assessment_confidence"]
    )


@router.post("/ai/chat", response_model=AIChatResponse)
async def chat_with_copilot(request: AIChatRequest):
    result = await chat_with_ai(
        message=request.message,
        deviation_context=request.deviation_context
    )
    return AIChatResponse(
        response=result["response"],
        suggested_actions=result["suggested_actions"]
    )