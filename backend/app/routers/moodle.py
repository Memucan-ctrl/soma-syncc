"""
SomaSync — Moodle Sync Bridge Router
Handles all communication with the Zetech University Moodle REST API.
Uses the server-stored token for all requests — no token exposure to frontend.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import httpx
from app.config import get_settings

router = APIRouter(prefix="/api/moodle", tags=["Moodle Sync Bridge"])

settings = get_settings()
MOODLE_BASE = settings.moodle_base_url
WS_TOKEN = settings.moodle_ws_token
USER_ID = settings.moodle_user_id


# ─── Internal Helpers ─────────────────────────────────────────────────────────

async def _moodle_call(wsfunction: str, params: dict | None = None) -> dict | list:
    """
    Execute a Moodle Web Service call using server-stored token.
    """
    payload = {
        "wstoken": WS_TOKEN,
        "wsfunction": wsfunction,
        "moodlewsrestformat": "json",
    }
    if params:
        payload.update(params)

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(MOODLE_BASE, params=payload)
        response.raise_for_status()
        data = response.json()

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

@router.get("/profile")
async def get_profile():
    """
    Fetch the authenticated user's profile and site info.
    Moodle Function: core_webservice_get_site_info
    """
    data = await _moodle_call("core_webservice_get_site_info")
    return {
        "status": "ok",
        "profile": {
            "userid": data.get("userid"),
            "username": data.get("username"),
            "firstname": data.get("firstname"),
            "lastname": data.get("lastname"),
            "fullname": data.get("fullname"),
            "sitename": data.get("sitename"),
            "siteurl": data.get("siteurl"),
            "userpictureurl": data.get("userpictureurl"),
            "lang": data.get("lang"),
        },
    }


@router.get("/my-courses")
async def get_my_courses():
    """
    Fetch the authenticated user's enrolled courses.
    Moodle Function: core_enrol_get_users_courses
    """
    data = await _moodle_call(
        "core_enrol_get_users_courses",
        {"userid": str(USER_ID)},
    )
    courses = []
    if isinstance(data, list):
        for c in data:
            courses.append({
                "id": c.get("id"),
                "shortname": c.get("shortname"),
                "fullname": c.get("fullname"),
                "displayname": c.get("displayname"),
                "categoryid": c.get("category"),
                "progress": c.get("progress"),
                "completed": c.get("completed"),
                "hidden": c.get("hidden"),
                "startdate": c.get("startdate"),
                "enddate": c.get("enddate"),
                "lastaccess": c.get("lastaccess"),
                "isfavourite": c.get("isfavourite"),
                "overviewfiles": c.get("overviewfiles", []),
            })
    return {"status": "ok", "courses": courses, "count": len(courses)}


@router.get("/assignments")
async def get_assignments(course_ids: str = Query("", description="Comma-separated course IDs (optional)")):
    """
    Fetch assignments from enrolled courses.
    Moodle Function: mod_assign_get_assignments
    """
    params = {}
    if course_ids:
        for i, cid in enumerate(course_ids.split(",")):
            params[f"courseids[{i}]"] = cid.strip()

    data = await _moodle_call("mod_assign_get_assignments", params)
    return {"status": "ok", "data": data}


@router.get("/upcoming")
async def get_upcoming_events():
    """
    Fetch upcoming action events (deadlines) sorted by time.
    Moodle Function: core_calendar_get_action_events_by_timesort
    """
    import time
    now = int(time.time())
    data = await _moodle_call(
        "core_calendar_get_action_events_by_timesort",
        {"timesortfrom": str(now), "limitnum": "20"},
    )
    events = data.get("events", []) if isinstance(data, dict) else []
    return {"status": "ok", "events": events, "count": len(events)}


@router.get("/calendar")
async def get_calendar_events():
    """
    Fetch calendar events for the current month.
    Moodle Function: core_calendar_get_calendar_monthly_view
    """
    import time
    from datetime import datetime
    now = datetime.now()
    data = await _moodle_call(
        "core_calendar_get_calendar_monthly_view",
        {"year": str(now.year), "month": str(now.month)},
    )
    return {"status": "ok", "data": data}


@router.get("/grades")
async def get_grades():
    """
    Fetch grade overview for all courses.
    Moodle Function: gradereport_overview_get_course_grades
    """
    data = await _moodle_call(
        "gradereport_overview_get_course_grades",
        {"userid": str(USER_ID)},
    )
    return {"status": "ok", "data": data}


@router.get("/course/{course_id}/contents")
async def get_course_contents(course_id: int):
    """
    Fetch the content/sections of a specific course.
    Moodle Function: core_course_get_contents
    """
    data = await _moodle_call(
        "core_course_get_contents",
        {"courseid": str(course_id)},
    )
    return {"status": "ok", "sections": data}


@router.get("/course/{course_id}/completion")
async def get_course_completion(course_id: int):
    """
    Fetch the completion status for a course.
    Moodle Function: core_completion_get_activities_completion_status
    """
    data = await _moodle_call(
        "core_completion_get_activities_completion_status",
        {"courseid": str(course_id), "userid": str(USER_ID)},
    )
    return {"status": "ok", "data": data}


@router.get("/recent-courses")
async def get_recent_courses():
    """
    Fetch recently accessed courses.
    Moodle Function: core_course_get_recent_courses
    """
    data = await _moodle_call(
        "core_course_get_recent_courses",
        {"userid": str(USER_ID), "limit": "10"},
    )
    return {"status": "ok", "courses": data}


@router.get("/notifications")
async def get_notifications():
    """
    Fetch popup notifications.
    Moodle Function: message_popup_get_popup_notifications
    """
    data = await _moodle_call(
        "message_popup_get_popup_notifications",
        {"useridto": str(USER_ID), "limit": "10"},
    )
    return {"status": "ok", "data": data}
