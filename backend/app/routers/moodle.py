"""
SomaSync — Moodle Sync Bridge Router
Handles all communication with the Zetech University Moodle REST API.
Provides endpoints for fetching courses, assignments, calendar events, and grades.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import httpx
from app.config import get_settings

router = APIRouter(prefix="/api/moodle", tags=["Moodle Sync Bridge"])

settings = get_settings()

MOODLE_BASE = settings.moodle_base_url


# ─── Schemas ──────────────────────────────────────────────────────────────────

class MoodleTokenPayload(BaseModel):
    wstoken: str


class MoodleSyncResponse(BaseModel):
    status: str
    function: str
    data: list | dict
    record_count: int | None = None


# ─── Internal Helpers ─────────────────────────────────────────────────────────

async def _moodle_call(wstoken: str, wsfunction: str, params: dict | None = None) -> dict | list:
    """
    Execute a Moodle Web Service call.
    Uses httpx async client for non-blocking IO.
    """
    payload = {
        "wstoken": wstoken,
        "wsfunction": wsfunction,
        "moodlewsrestformat": "json",
    }
    if params:
        payload.update(params)

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(MOODLE_BASE, params=payload)
        response.raise_for_status()
        data = response.json()

    # Moodle returns errors as JSON objects with 'exception' key
    if isinstance(data, dict) and "exception" in data:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "Moodle API Error",
                "exception": data.get("exception"),
                "message": data.get("message"),
                "errorcode": data.get("errorcode"),
            },
        )
    return data


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/courses", response_model=MoodleSyncResponse)
async def get_courses(wstoken: str = Query(..., description="Moodle Web Service token")):
    """
    Fetch all courses visible to the authenticated user.
    Moodle Function: core_course_get_courses
    """
    data = await _moodle_call(wstoken, "core_course_get_courses")
    return MoodleSyncResponse(
        status="synced",
        function="core_course_get_courses",
        data=data,
        record_count=len(data) if isinstance(data, list) else 1,
    )


@router.get("/assignments", response_model=MoodleSyncResponse)
async def get_assignments(
    wstoken: str = Query(..., description="Moodle Web Service token"),
    course_ids: str = Query("", description="Comma-separated course IDs (optional)"),
):
    """
    Fetch assignments from enrolled courses.
    Moodle Function: mod_assign_get_assignments
    """
    params = {}
    if course_ids:
        for i, cid in enumerate(course_ids.split(",")):
            params[f"courseids[{i}]"] = cid.strip()

    data = await _moodle_call(wstoken, "mod_assign_get_assignments", params)
    courses = data.get("courses", []) if isinstance(data, dict) else data
    return MoodleSyncResponse(
        status="synced",
        function="mod_assign_get_assignments",
        data=data,
        record_count=len(courses),
    )


@router.get("/calendar", response_model=MoodleSyncResponse)
async def get_calendar_events(
    wstoken: str = Query(..., description="Moodle Web Service token"),
):
    """
    Fetch upcoming calendar events for the user.
    Moodle Function: core_calendar_get_calendar_events
    """
    params = {"events[eventids][0]": "0", "options[userevents]": "1", "options[siteevents]": "1"}
    data = await _moodle_call(wstoken, "core_calendar_get_calendar_events", params)
    events = data.get("events", []) if isinstance(data, dict) else data
    return MoodleSyncResponse(
        status="synced",
        function="core_calendar_get_calendar_events",
        data=data,
        record_count=len(events),
    )


@router.get("/grades", response_model=MoodleSyncResponse)
async def get_grades(
    wstoken: str = Query(..., description="Moodle Web Service token"),
    course_id: int = Query(..., description="Moodle Course ID"),
    user_id: int = Query(..., description="Moodle User ID"),
):
    """
    Fetch grade overview for a specific course.
    Moodle Function: gradereport_overview_get_course_grades
    """
    params = {"courseid": str(course_id), "userid": str(user_id)}
    data = await _moodle_call(wstoken, "gradereport_overview_get_course_grades", params)
    return MoodleSyncResponse(
        status="synced",
        function="gradereport_overview_get_course_grades",
        data=data,
    )


@router.post("/test-connection")
async def test_moodle_connection(payload: MoodleTokenPayload):
    """
    Test connectivity to the Moodle API using a provided token.
    Returns the first 3 courses as a proof of life.
    """
    data = await _moodle_call(payload.wstoken, "core_course_get_courses")
    preview = data[:3] if isinstance(data, list) else data
    return {
        "status": "connected",
        "moodle_endpoint": MOODLE_BASE,
        "courses_found": len(data) if isinstance(data, list) else 1,
        "preview": preview,
    }
