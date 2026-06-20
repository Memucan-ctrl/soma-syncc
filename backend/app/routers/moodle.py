"""
SomaSync — Moodle Sync Bridge Router
All routes extract the user's token from the Authorization header.
No credentials are stored server-side — each student authenticates individually.
"""

from fastapi import APIRouter, HTTPException, Header, Query
import httpx
import time
from datetime import datetime

router = APIRouter(prefix="/api/moodle", tags=["Moodle Sync Bridge"])

MOODLE_BASE = "https://elearning.zetech.ac.ke/webservice/rest/server.php"


# ─── Helpers ──────────────────────────────────────────────────────────────────

# In-memory cache for user IDs
_token_userid_cache = {}


def _extract_token(authorization: str) -> str:
    """Extract token from 'Bearer <token>' header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization format. Use: Bearer <token>")
    return parts[1]


def extract_token(authorization: str) -> str:
    """Public helper to extract token."""
    return _extract_token(authorization)


async def _moodle_call(token: str, wsfunction: str, params: dict | None = None) -> dict | list:
    """Execute a Moodle Web Service call using the user's token."""
    payload = {
        "wstoken": token,
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


async def _get_userid(token: str) -> int:
    """Get the user ID from the token via site info, cached."""
    if token in _token_userid_cache:
        return _token_userid_cache[token]
    data = await _moodle_call(token, "core_webservice_get_site_info")
    userid = data.get("userid")
    if userid:
        _token_userid_cache[token] = userid
    return userid


async def get_userid(token: str) -> int:
    """Public helper to get user ID, cached."""
    return await _get_userid(token)


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/profile")
async def get_profile(authorization: str = Header(...)):
    token = _extract_token(authorization)
    data = await _moodle_call(token, "core_webservice_get_site_info")
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
        },
    }


@router.get("/my-courses")
async def get_my_courses(authorization: str = Header(...)):
    token = _extract_token(authorization)
    userid = await _get_userid(token)
    data = await _moodle_call(token, "core_enrol_get_users_courses", {"userid": str(userid)})
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
async def get_assignments(
    authorization: str = Header(...),
    course_ids: str = Query("", description="Comma-separated course IDs"),
):
    token = _extract_token(authorization)
    params = {}
    if course_ids:
        for i, cid in enumerate(course_ids.split(",")):
            params[f"courseids[{i}]"] = cid.strip()
    data = await _moodle_call(token, "mod_assign_get_assignments", params)
    return {"status": "ok", "data": data}


@router.get("/upcoming")
async def get_upcoming_events(authorization: str = Header(...)):
    token = _extract_token(authorization)
    now = int(time.time())
    data = await _moodle_call(
        token,
        "core_calendar_get_action_events_by_timesort",
        {"timesortfrom": str(now), "limitnum": "20"},
    )
    events = data.get("events", []) if isinstance(data, dict) else []
    return {"status": "ok", "events": events, "count": len(events)}


@router.get("/calendar")
async def get_calendar_events(authorization: str = Header(...)):
    token = _extract_token(authorization)
    now = datetime.now()
    data = await _moodle_call(
        token,
        "core_calendar_get_calendar_monthly_view",
        {"year": str(now.year), "month": str(now.month)},
    )
    return {"status": "ok", "data": data}


@router.get("/grades")
async def get_grades(authorization: str = Header(...)):
    token = _extract_token(authorization)
    userid = await _get_userid(token)
    data = await _moodle_call(
        token,
        "gradereport_overview_get_course_grades",
        {"userid": str(userid)},
    )
    return {"status": "ok", "data": data}


@router.get("/course/{course_id}/contents")
async def get_course_contents(course_id: int, authorization: str = Header(...)):
    token = _extract_token(authorization)
    data = await _moodle_call(token, "core_course_get_contents", {"courseid": str(course_id)})
    return {"status": "ok", "sections": data}


@router.get("/recent-courses")
async def get_recent_courses(authorization: str = Header(...)):
    token = _extract_token(authorization)
    userid = await _get_userid(token)
    data = await _moodle_call(token, "core_course_get_recent_courses", {"userid": str(userid), "limit": "10"})
    return {"status": "ok", "courses": data}


@router.get("/notifications")
async def get_notifications(authorization: str = Header(...)):
    token = _extract_token(authorization)
    userid = await _get_userid(token)
    data = await _moodle_call(
        token,
        "message_popup_get_popup_notifications",
        {"useridto": str(userid), "limit": "10"},
    )
    return {"status": "ok", "data": data}
