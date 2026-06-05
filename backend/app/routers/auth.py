"""
SomaSync — Authentication Router
Handles Moodle login via Zetech's token endpoint.
Any student can authenticate with their school credentials.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

MOODLE_TOKEN_URL = "https://elearning.zetech.ac.ke/login/token.php"
MOODLE_BASE_URL = "https://elearning.zetech.ac.ke/webservice/rest/server.php"


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    profile: dict


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    """
    Authenticate a student against Zetech Moodle.
    1. Calls Moodle's token endpoint with username/password
    2. Fetches user profile with the obtained token
    3. Returns token + profile to the frontend
    """
    # Step 1: Get token from Moodle
    async with httpx.AsyncClient(timeout=20.0) as client:
        token_resp = await client.get(
            MOODLE_TOKEN_URL,
            params={
                "username": payload.username,
                "password": payload.password,
                "service": "moodle_mobile_app",
            },
        )
        token_resp.raise_for_status()
        token_data = token_resp.json()

    if "token" not in token_data:
        error_msg = token_data.get("error", "Invalid credentials")
        raise HTTPException(status_code=401, detail={"error": error_msg})

    ws_token = token_data["token"]

    # Step 2: Fetch profile using the token
    async with httpx.AsyncClient(timeout=15.0) as client:
        profile_resp = await client.get(
            MOODLE_BASE_URL,
            params={
                "wstoken": ws_token,
                "wsfunction": "core_webservice_get_site_info",
                "moodlewsrestformat": "json",
            },
        )
        profile_resp.raise_for_status()
        profile_data = profile_resp.json()

    if "exception" in profile_data:
        raise HTTPException(status_code=502, detail={"error": "Failed to fetch profile"})

    return LoginResponse(
        token=ws_token,
        profile={
            "userid": profile_data.get("userid"),
            "username": profile_data.get("username"),
            "firstname": profile_data.get("firstname"),
            "lastname": profile_data.get("lastname"),
            "fullname": profile_data.get("fullname"),
            "sitename": profile_data.get("sitename"),
            "siteurl": profile_data.get("siteurl"),
            "userpictureurl": profile_data.get("userpictureurl"),
        },
    )
