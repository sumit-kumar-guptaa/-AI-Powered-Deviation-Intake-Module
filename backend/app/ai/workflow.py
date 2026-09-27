from typing import TypedDict, Annotated, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from app.core.config import settings
import json
import re


class DeviationState(TypedDict):
    input_text: str
    file_content: Optional[str]
    file_name: Optional[str]
    extracted_data: Dict[str, Any]
    extraction_confidence: float
    severity: Optional[str]
    impact_assessment: Optional[str]
    impact_reason: Optional[str]
    assessment_confidence: float
    error: Optional[str]


def create_llm():
    return ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model_name=settings.GROQ_MODEL,
        temperature=0.1,
    )


EXTRACTION_PROMPT = """You are an AI assistant specialized in pharmaceutical manufacturing deviation intake. 
Extract structured information from the provided deviation report text/email/document.

Extract the following fields and return as JSON:
- title: Brief descriptive title of the deviation
- description: Detailed description of what happened
- batch_number: Batch/lot number if mentioned
- product_name: Product name if mentioned
- process_step: Manufacturing process step where deviation occurred
- equipment_id: Equipment ID if mentioned
- deviation_date: Date of deviation (ISO format YYYY-MM-DD if possible)
- reported_by: Person who reported the deviation
- Any other relevant fields you can identify

Return ONLY valid JSON. If a field is not found, use null. Be precise and concise."""


IMPACT_ASSESSMENT_PROMPT = """You are a pharmaceutical quality assurance expert. Assess the impact and severity of a manufacturing deviation.

Given the deviation details, provide:
1. Severity classification: CRITICAL, MAJOR, or MINOR
2. Impact assessment: Detailed explanation of potential impact on product quality, patient safety, regulatory compliance, and business operations
3. Reason: Brief justification for the severity classification

Consider:
- CRITICAL: Direct impact on product quality/patient safety, regulatory violation, batch failure likely
- MAJOR: Significant impact on quality systems, potential quality impact, regulatory concern
- MINOR: Minimal quality impact, administrative/documentation issue, easily correctable

Return ONLY valid JSON with fields: severity, impact_assessment, reason, confidence (0-1)."""


def extract_information(state: DeviationState) -> DeviationState:
    llm = create_llm()
    
    text = state["input_text"]
    if state["file_content"]:
        text = f"{text}\n\n--- File Content ({state['file_name']}) ---\n{state['file_content']}"
    
    messages = [
        SystemMessage(content=EXTRACTION_PROMPT),
        HumanMessage(content=text)
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            extracted = json.loads(json_match.group())
        else:
            extracted = json.loads(content)
        
        # Clean up null values
        extracted = {k: v for k, v in extracted.items() if v is not None}
        
        state["extracted_data"] = extracted
        state["extraction_confidence"] = 0.85
    except Exception as e:
        state["error"] = f"Extraction failed: {str(e)}"
        state["extracted_data"] = {}
        state["extraction_confidence"] = 0.0
    
    return state


def assess_impact(state: DeviationState) -> DeviationState:
    if state.get("error"):
        return state
    
    llm = create_llm()
    
    deviation_info = state["extracted_data"]
    deviation_info.update({
        "description": state["input_text"]
    })
    
    messages = [
        SystemMessage(content=IMPACT_ASSESSMENT_PROMPT),
        HumanMessage(content=json.dumps(deviation_info, indent=2))
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            assessment = json.loads(json_match.group())
        else:
            assessment = json.loads(content)
        
        state["severity"] = assessment.get("severity", "MINOR")
        state["impact_assessment"] = assessment.get("impact_assessment", "")
        state["impact_reason"] = assessment.get("reason", "")
        state["assessment_confidence"] = assessment.get("confidence", 0.7)
    except Exception as e:
        state["error"] = f"Assessment failed: {str(e)}"
        state["severity"] = "MINOR"
        state["impact_assessment"] = "Assessment unavailable"
        state["impact_reason"] = "AI assessment failed"
        state["assessment_confidence"] = 0.0
    
    return state


def build_workflow():
    workflow = StateGraph(DeviationState)
    
    workflow.add_node("extract", extract_information)
    workflow.add_node("assess", assess_impact)
    
    workflow.set_entry_point("extract")
    workflow.add_edge("extract", "assess")
    workflow.add_edge("assess", END)
    
    return workflow.compile()


deviation_workflow = build_workflow()


async def process_deviation_text(text: str, file_content: str = None, file_name: str = None) -> Dict[str, Any]:
    initial_state = DeviationState(
        input_text=text,
        file_content=file_content,
        file_name=file_name,
        extracted_data={},
        extraction_confidence=0.0,
        severity=None,
        impact_assessment=None,
        impact_reason=None,
        assessment_confidence=0.0,
        error=None
    )
    
    result = await deviation_workflow.ainvoke(initial_state)
    
    return {
        "extracted_data": result["extracted_data"],
        "extraction_confidence": result["extraction_confidence"],
        "severity": result["severity"],
        "impact_assessment": result["impact_assessment"],
        "impact_reason": result["impact_reason"],
        "assessment_confidence": result["assessment_confidence"],
        "error": result["error"]
    }


async def chat_with_ai(message: str, deviation_context: Dict[str, Any] = None) -> Dict[str, Any]:
    llm = create_llm()
    
    system_prompt = """You are an AI assistant for pharmaceutical deviation management. 
Help the user with:
- Clarifying deviation details
- Suggesting root cause analysis approaches
- Recommending corrective/preventive actions
- Explaining regulatory requirements
- Guiding through the deviation process

Be professional, concise, and knowledgeable about GMP/cGMP requirements."""
    
    context_info = ""
    if deviation_context:
        context_info = f"\nCurrent deviation context: {json.dumps(deviation_context, indent=2)}"
    
    messages = [
        SystemMessage(content=system_prompt + context_info),
        HumanMessage(content=message)
    ]
    
    response = await llm.ainvoke(messages)
    
    return {
        "response": response.content,
        "suggested_actions": []
    }