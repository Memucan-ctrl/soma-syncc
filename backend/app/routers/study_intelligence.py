"""
SomaSync — Study Intelligence Router
Generates customized study plans and weekly insights based on course load and Moodle deadlines.
"""

import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

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
    title: str
    time: str
    endTime: str
    category: str
    notes: str


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
                {"title": "Revision: " + (payload.courses[0].shortname.split("M26")[0] if payload.courses else "Core Topics"), "time": "08:30", "endTime": "10:30", "category": "revision", "notes": "Focus on foundational concepts and previous assignment reviews."},
                {"title": "Study Session", "time": "14:00", "endTime": "15:30", "category": "study", "notes": "Work on upcoming deadline prep."}
            ],
            "Tue": [
                {"title": "Practice Lab: " + (payload.courses[1].shortname.split("M26")[0] if len(payload.courses) > 1 else "Skills Prep"), "time": "10:00", "endTime": "12:00", "category": "lab", "notes": "Implement sample code or exercises."}
            ],
            "Wed": [
                {"title": "Group Discussion", "time": "09:00", "endTime": "11:00", "category": "group", "notes": "Review tough sections with peers."}
            ],
            "Thu": [
                {"title": "Deep Study", "time": "15:00", "endTime": "17:00", "category": "study", "notes": "Uninterrupted reading and flashcard review."}
            ],
            "Fri": [
                {"title": "Revision: General", "time": "14:00", "endTime": "16:00", "category": "revision", "notes": "Wrap up week's lecture concepts."}
            ],
            "Sat": [],
            "Sun": [
                {"title": "Weekly Prep", "time": "10:00", "endTime": "11:00", "category": "break", "notes": "Organize schedules for the next week."}
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
            "  \"Mon\": [ { \"title\": \"...\", \"time\": \"HH:MM\", \"endTime\": \"HH:MM\", \"category\": \"study|revision|lab|group|break\", \"notes\": \"...\" } ],\n"
            "  \"Tue\": [], ... (etc for Mon, Tue, Wed, Thu, Fri, Sat, Sun)\n"
            "}\n"
            "Choose study categories wisely. Notes should include tips for preparing for the specific deadlines. "
            "Ensure times are between 06:00 and 21:00. Do NOT include markdown styling or any other text than raw JSON."
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
