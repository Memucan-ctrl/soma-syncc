"""
SomaSync — Admin Router
System health, feature flags, and monitoring endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class FeatureFlags(BaseModel):
    ai_enabled: bool = True
    flashcards_enabled: bool = True
    ocr_enabled: bool = True
    dev_tracker_enabled: bool = True
    timetable_enabled: bool = True
    maintenance_mode: bool = False


class HealthDetail(BaseModel):
    api: str = "operational"
    auth: str = "moodle_token_flow"
    version: str = "0.2.0"


# In-memory feature flags (could be moved to Supabase/Redis)
_flags = FeatureFlags()


@router.get("/health")
async def admin_health():
    """Detailed system health check."""
    return {
        "status": "healthy",
        "api": "operational",
        "auth": "moodle_token_flow",
        "version": "0.2.0",
        "services": {
            "moodle_sync": "active",
            "ai_engine": "active" if _flags.ai_enabled else "disabled",
            "ocr_service": "active" if _flags.ocr_enabled else "disabled",
        },
    }


@router.get("/settings")
async def get_settings():
    """Get current feature flags."""
    return _flags.model_dump()


@router.post("/settings")
async def update_settings(flags: FeatureFlags):
    """Update feature flags."""
    global _flags
    _flags = flags
    return {"status": "updated", "flags": _flags.model_dump()}


@router.get("/stats")
async def get_stats():
    """Basic usage statistics."""
    return {
        "status": "ok",
        "note": "Connect Supabase or PostHog for full analytics",
        "flags": _flags.model_dump(),
    }
