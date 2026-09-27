from fastapi import APIRouter
from app.api.v1.deviations import router as deviations_router

api_router = APIRouter()
api_router.include_router(deviations_router, tags=["deviations"])
api_router.include_router(deviations_router, prefix="/ai", tags=["ai"])