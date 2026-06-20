"""
SomaSync — Study Intelligence Router
Generates customized study plans and weekly insights based on course load and Moodle deadlines.
"""

import os
import json
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import google.generativeai as genai
from app.routers.moodle import extract_token, get_userid

router = APIRouter(prefix="/api/ai", tags=["Study Intelligence"])


class CourseInfo(BaseModel):
    id: int
    fullname: str
    shortname: str | None = None
    progress: float | None = None


class DeadlineEvent(BaseModel):
    id: int
    name: str
    timesort: int
    course: CourseInfo | None = None


class StudyPlanRequest(BaseModel):
    courses: list[CourseInfo]
    events: list[DeadlineEvent]


class TimetableEvent(BaseModel):
    id: str | None = None
    title: str
    time: str
    endTime: str
    category: str
    notes: str
    reminder_enabled: bool = True
    reminder_lead_time_mins: int = 60


class StudyPlanResponse(BaseModel):
    events: dict[str, list[TimetableEvent]]


class WeeklySummaryRequest(BaseModel):
    courses: list[CourseInfo]
    events: list[DeadlineEvent]


class WeeklySummaryResponse(BaseModel):
    summary: str


@router.post("/study-plan", response_model=StudyPlanResponse)
async def generate_study_plan(payload: StudyPlanRequest):
    """
    Generate an optimized weekly study plan structured as daily timetable slots.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        # High-fidelity mock study planner populated with course-specific slots
        mock_plan = {
            "Mon": [
                {
                    "id": "mon_rev_1",
                    "title": "Revision: " + (payload.courses[0].shortname.split("M26")[0] if payload.courses else "Core Topics"),
                    "time": "08:30",
                    "endTime": "10:30",
                    "category": "revision",
                    "notes": "Focus on foundational concepts and previous assignment reviews.",
                    "reminder_enabled": True,
                    "reminder_lead_time_mins": 60
                },
                {
                    "id": "mon_study_2",
                    "title": "Study Session",
                    "time": "14:00",
                    "endTime": "15:30",
                    "category": "study",
                    "notes": "Work on upcoming deadline prep.",
                    "reminder_enabled": True,
                    "reminder_lead_time_mins": 60
                }
            ],
            "Tue": [
                {
                    "id": "tue_lab_1",
                    "title": "Practice Lab: " + (payload.courses[1].shortname.split("M26")[0] if len(payload.courses) > 1 else "Skills Prep"),
                    "time": "10:00",
                    "endTime": "12:00",
                    "category": "lab",
                    "notes": "Implement sample code or exercises.",
                    "reminder_enabled": True,
                    "reminder_lead_time_mins": 60
                }
            ],
            "Wed": [
                {
                    "id": "wed_group_1",
                    "title": "Group Discussion",
                    "time": "09:00",
                    "endTime": "11:00",
                    "category": "group",
                    "notes": "Review tough sections with peers.",
                    "reminder_enabled": True,
                    "reminder_lead_time_mins": 60
                }
            ],
            "Thu": [
                {
                    "id": "thu_study_1",
                    "title": "Deep Study",
                    "time": "15:00",
                    "endTime": "17:00",
                    "category": "study",
                    "notes": "Uninterrupted reading and flashcard review.",
                    "reminder_enabled": True,
                    "reminder_lead_time_mins": 60
                }
            ],
            "Fri": [
                {
                    "id": "fri_rev_1",
                    "title": "Revision: General",
                    "time": "14:00",
                    "endTime": "16:00",
                    "category": "revision",
                    "notes": "Wrap up week's lecture concepts.",
                    "reminder_enabled": True,
                    "reminder_lead_time_mins": 60
                }
            ],
            "Sat": [],
            "Sun": [
                {
                    "id": "sun_prep_1",
                    "title": "Weekly Prep",
                    "time": "10:00",
                    "endTime": "11:00",
                    "category": "break",
                    "notes": "Organize schedules for the next week.",
                    "reminder_enabled": True,
                    "reminder_lead_time_mins": 60
                }
            ]
        }
        return StudyPlanResponse(events=mock_plan)

    try:
        genai.configure(api_key=api_key)
        
        courses_desc = "\n".join([f"- {c.fullname} ({c.shortname})" for c in payload.courses])
        deadlines_desc = "\n".join([f"- {e.name} (due {e.timesort})" for e in payload.events])
        
        prompt = (
            "You are an academic planner assistant.\n"
            f"Here are the user's enrolled courses:\n{courses_desc}\n\n"
            f"Here are their upcoming deadlines:\n{deadlines_desc}\n\n"
            "Generate an optimized, structured weekly study plan matching these inputs. "
            "Return ONLY a valid JSON object matching this schema:\n"
            "{\n"
            "  \"Mon\": [ { \"id\": \"unique_string\", \"title\": \"...\", \"time\": \"HH:MM\", \"endTime\": \"HH:MM\", \"category\": \"study|revision|lab|group|break\", \"notes\": \"...\", \"reminder_enabled\": true, \"reminder_lead_time_mins\": 60 } ],\n"
            "  \"Tue\": [], ... (etc for Mon, Tue, Wed, Thu, Fri, Sat, Sun)\n"
            "}\n"
            "Important instructions:\n"
            "1. Each event MUST have a unique string value for \"id\" (e.g. \"mon_study_1\", \"tue_revision_2\", or random format).\n"
            "2. Ensure \"reminder_enabled\" defaults to true and \"reminder_lead_time_mins\" to 60.\n"
            "3. Choose study categories wisely. Notes should include tips for preparing for the specific deadlines. "
            "4. Ensure times are between 00:00 and 23:59. Do NOT include markdown styling or any other text than raw JSON."
        )
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        
        # Parse output
        import re
        raw_text = response.text.strip()
        json_match = re.search(r'\{[\s\S]*\}', raw_text)
        if json_match:
            data = json.loads(json_match.group(0))
        else:
            # strip backticks if any
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            data = json.loads(raw_text.strip())
            
        # Ensure all days are represented
        for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
            if day not in data:
                data[day] = []
            else:
                # Add default fields if they are missing
                import uuid
                for event in data[day]:
                    if "id" not in event or not event["id"]:
                        event["id"] = f"{day.lower()}_{uuid.uuid4().hex[:6]}"
                    if "reminder_enabled" not in event:
                        event["reminder_enabled"] = True
                    if "reminder_lead_time_mins" not in event:
                        event["reminder_lead_time_mins"] = 60
                
        return StudyPlanResponse(events=data)
    except Exception as e:
        # Fallback to mock if AI fails or output is malformed
        print(f"[!] AI Study Plan failed: {e}")
        return StudyPlanResponse(events={
            "Mon": [], "Tue": [], "Wed": [], "Thu": [], "Fri": [], "Sat": [], "Sun": []
        })


@router.post("/weekly-summary", response_model=WeeklySummaryResponse)
async def generate_weekly_summary(payload: WeeklySummaryRequest):
    """
    Generate a personalized weekly learning intelligence summary.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        # High fidelity mock summary
        mock_summary = (
            "### 📊 Weekly Study Intelligence Summary\n\n"
            "You are currently enrolled in **" + str(len(payload.courses)) + " active courses** "
            "with **" + str(len(payload.events)) + " upcoming deadlines** sync'd from Moodle.\n\n"
            "#### 💡 Recommendations for this week:\n"
            "- **Prioritize revisions** on courses with lower progress percentages.\n"
            "- Spend 2-3 hours preparing for your next deadlines early in the week to avoid cramming.\n"
            "- Practice flashcards at least once a day using the *Study Lab* active recall tool."
        )
        return WeeklySummaryResponse(summary=mock_summary)

    try:
        genai.configure(api_key=api_key)
        
        courses_desc = "\n".join([f"- {c.fullname} (Progress: {c.progress or 0}%)" for c in payload.courses])
        deadlines_desc = "\n".join([f"- {e.name}" for e in payload.events])
        
        prompt = (
            "You are a study performance coach.\n"
            f"Here are the student's courses and progress:\n{courses_desc}\n\n"
            f"Here are their upcoming deadlines:\n{deadlines_desc}\n\n"
            "Provide a highly personalized, encouraging, and actionable weekly study intelligence summary (about 150-200 words). "
            "Highlight which course needs focus based on progress, remind them of deadlines, and suggest active recall strategies. "
            "Use Markdown headers and bullet points. Keep it engaging."
        )
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return WeeklySummaryResponse(summary=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")

@router.get("/events", response_model=StudyPlanResponse)
async def get_events(authorization: str = Header(...)):
    """
    Get the persisted weekly study plan events for the authenticated Moodle user.
    """
    try:
        token = extract_token(authorization)
        userid = await get_userid(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
        
    file_path = os.path.join(STORAGE_DIR, f"events_{userid}.json")
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Ensure all days are represented
            for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
                if day not in data:
                    data[day] = []
            return StudyPlanResponse(events=data)
        except Exception as e:
            print(f"[!] Error reading events_{userid}.json: {e}")
            
    # Default return if no file exists
    return StudyPlanResponse(events={
        "Mon": [], "Tue": [], "Wed": [], "Thu": [], "Fri": [], "Sat": [], "Sun": []
    })

@router.post("/events")
async def save_events(payload: StudyPlanResponse, authorization: str = Header(...)):
    """
    Persist weekly study plan events for the authenticated Moodle user.
    """
    try:
        token = extract_token(authorization)
        userid = await get_userid(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
        
    os.makedirs(STORAGE_DIR, exist_ok=True)
    file_path = os.path.join(STORAGE_DIR, f"events_{userid}.json")
    try:
        # Convert Pydantic models to dict/JSON
        serialized_data = {day: [event.dict() for event in events_list] for day, events_list in payload.events.items()}
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(serialized_data, f, indent=2, ensure_ascii=False)
        return {"status": "success", "message": "Events saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save events: {str(e)}")
