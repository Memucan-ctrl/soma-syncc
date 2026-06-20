"""
SomaSync — Notifications Router
Handles dispatching test WhatsApp alerts and compiling AI study summaries.
"""

import os
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from app.services.whatsapp_service import send_whatsapp_via_twilio
from app.routers.study_intelligence import CourseInfo, DeadlineEvent

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class TestWhatsappRequest(BaseModel):
    phone_number: str

class AlertRequest(BaseModel):
    phone_number: str
    weekly_summary_enabled: bool = False
    urgent_deadline_enabled: bool = False
    courses: list[CourseInfo]
    events: list[DeadlineEvent]

@router.post("/test-whatsapp")
async def send_test_whatsapp(payload: TestWhatsappRequest):
    """
    Send a basic confirmation WhatsApp to test the connection.
    """
    try:
        msg_body = "SomaSync: Your WhatsApp notifications are successfully activated! 🚀"
        res = await send_whatsapp_via_twilio(payload.phone_number, msg_body)
        return {"status": "success", "sid": res.get("sid")}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": f"Failed to send test WhatsApp: {str(e)}"})

@router.post("/alert")
async def send_study_alerts(payload: AlertRequest):
    """
    Process study alerts and send a compiled summary/deadline warning to the student via WhatsApp.
    """
    sent_items = []
    
    # 1. Weekly intelligence summary
    if payload.weekly_summary_enabled and payload.courses:
        api_key = os.environ.get("GEMINI_API_KEY")
        summary_text = ""
        if api_key:
            try:
                genai.configure(api_key=api_key)
                courses_desc = ", ".join([f"{c.fullname} ({int(c.progress or 0)}%)" for c in payload.courses])
                deadlines_desc = ", ".join([e.name for e in payload.events[:3]])
                
                prompt = (
                    "You are a study coach. Draft a short, encouraging WhatsApp update based on:\n"
                    f"Courses: {courses_desc}\n"
                    f"Upcoming Deadlines: {deadlines_desc}\n"
                    "Keep it under 140 characters, high impact, direct advice."
                )
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(prompt)
                summary_text = response.text.strip()
            except Exception as ex:
                print(f"[!] WhatsApp AI summary failed: {ex}")
                
        if not summary_text:
            summary_text = f"SomaSync: You have {len(payload.courses)} active courses. Keep revising focus topics! 🎯"
            
        try:
            await send_whatsapp_via_twilio(payload.phone_number, summary_text)
            sent_items.append("weekly_summary")
        except Exception as e:
            print(f"[!] Failed to send weekly WhatsApp alert: {e}")

    # 2. Urgent deadline warning (48 hour warnings)
    if payload.urgent_deadline_enabled and payload.events:
        now = time.time()
        urgent_deadlines = []
        for e in payload.events:
            diff_hours = (e.timesort - now) / 3600
            if 0 < diff_hours <= 48:
                urgent_deadlines.append(f"{e.name} (due in {int(diff_hours)}h)")
                
        if urgent_deadlines:
            urgent_msg = f"SomaSync URGENT: You have pending deadlines in the next 48 hours:\n" + "\n".join(urgent_deadlines[:2])
            try:
                await send_whatsapp_via_twilio(payload.phone_number, urgent_msg)
                sent_items.append("urgent_deadlines")
            except Exception as e:
                print(f"[!] Failed to send urgent WhatsApp alert: {e}")
                
    return {"status": "success", "sent": sent_items}
