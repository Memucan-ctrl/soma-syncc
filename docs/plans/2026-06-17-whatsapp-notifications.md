# WhatsApp Notifications & AI Study Alerts Implementation Plan

**Goal:** Integrate a premium Twilio WhatsApp Notification & AI Study Alerts system in the backend and frontend of SomaSync. Since the backend is stateless, user phone numbers and options are managed via client-side state (localStorage) and supplied dynamically in payloads.

**Architecture:**
1. Create a lightweight WhatsApp messaging service in the backend using `httpx.AsyncClient` targeting the Twilio Messages REST API directly.
2. Build two stateless endpoints: `/api/notifications/test-whatsapp` for verification and `/api/notifications/alert` which formats AI updates or scans deadlines and delivers alerts via WhatsApp.
3. Build a premium, glassmorphic settings card on the frontend dashboard to input a phone number and enable alerts, storing preferences in `localStorage`.

**Tech Stack:** FastAPI, Pydantic, HTTPX, React, Framer Motion, Lucide Icons

---

### Integration Contracts & Rules

1. **Phone Number Normalization Contract**:
   - The **frontend** must send raw numbers only (e.g. `+2547...` or `+1...`), without the `whatsapp:` prefix.
   - The **backend** (`whatsapp_service.py`) is responsible for normalizing the number by adding the `whatsapp:` prefix (e.g. checking if it starts with `whatsapp:` and prefixing it if missing) before POSTing to Twilio.
2. **Naming Alignment**:
   - All references, folder names, parameters, variables, and UI controls must be strictly WhatsApp-themed.
   - Frontend service functions must be named `sendTestWhatsapp` and `triggerAlertWhatsapp`. The dashboard component must call `triggerAlertWhatsapp` and avoid any deprecated legacy naming schemes.
3. **Import Safety**:
   - When importing the new notifications router in `backend/main.py`, append `notifications` to the existing imports block to avoid modifying the format of existing imports.

---

### Task 1: Create Backend WhatsApp Service

**Files:**
- Create: `backend/app/services/whatsapp_service.py`

**Step 1: Write the service implementation**
Write `backend/app/services/whatsapp_service.py` to communicate directly with Twilio:
```python
import httpx
from app.config import get_settings

async def send_whatsapp_via_twilio(to_phone: str, body: str) -> dict:
    """
    Sends a WhatsApp message using Twilio's HTTP API directly with httpx.
    """
    settings = get_settings()
    if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_phone_number:
        raise ValueError("Twilio credentials are not fully configured in the environment settings.")
        
    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
    auth = (settings.twilio_account_sid, settings.twilio_auth_token)
    
    # Format phone numbers as whatsapp:+<number>
    to_whatsapp = to_phone if to_phone.startswith("whatsapp:") else f"whatsapp:{to_phone}"
    from_whatsapp = settings.twilio_phone_number if settings.twilio_phone_number.startswith("whatsapp:") else f"whatsapp:{settings.twilio_phone_number}"
    
    data = {
        "To": to_whatsapp,
        "From": from_whatsapp,
        "Body": body
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, data=data, auth=auth)
        response.raise_for_status()
        return response.json()
```

**Step 2: Commit**
```bash
git add backend/app/services/whatsapp_service.py
git commit -m "feat: implement Twilio direct WhatsApp HTTP service"
```

---

### Task 2: Create Notifications Router

**Files:**
- Create: `backend/app/routers/notifications.py`

**Step 1: Write notifications router**
Create the router file to handle test WhatsApp messages and compiled study alerts:
```python
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
                urgent_deadlines.append(f"{e.name} (in {int(diff_hours)}h)")
                
        if urgent_deadlines:
            urgent_msg = f"SomaSync URGENT: You have pending deadlines in the next 48 hours:\n" + "\n".join(urgent_deadlines[:2])
            try:
                await send_whatsapp_via_twilio(payload.phone_number, urgent_msg)
                sent_items.append("urgent_deadlines")
            except Exception as e:
                print(f"[!] Failed to send urgent WhatsApp alert: {e}")
                
    return {"status": "success", "sent": sent_items}
```

**Step 2: Commit**
```bash
git add backend/app/routers/notifications.py
git commit -m "feat: implement notifications endpoints using WhatsApp"
```

---

### Task 3: Register Router in Backend

**Files:**
- Modify: `backend/main.py`

**Step 1: Include notifications router in main.py**
Open `backend/main.py`, find the existing router imports, and append `notifications` to that import statement.
Then register the router:
```python
app.include_router(notifications.router)
```

**Step 2: Commit**
```bash
git add backend/main.py
git commit -m "feat: register notifications router in app root"
```

---

### Task 4: Implement Frontend API Methods

**Files:**
- Modify: `frontend/src/services/api.js`

**Step 1: Export sendTestWhatsapp and triggerAlertWhatsapp**
```javascript
export async function sendTestWhatsapp(phoneNumber) {
  return apiFetch("/notifications/test-whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phoneNumber }),
  });
}

export async function triggerAlertWhatsapp(phoneNumber, weeklyEnabled, urgentEnabled, courses, events) {
  return apiFetch("/notifications/alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone_number: phoneNumber,
      weekly_summary_enabled: weeklyEnabled,
      urgent_deadline_enabled: urgentEnabled,
      courses,
      events,
    }),
  });
}
```

**Step 2: Commit**
```bash
git add frontend/src/services/api.js
git commit -m "feat: add frontend api services for notifications"
```

---

### Task 5: Add WhatsApp Settings Card to Frontend Dashboard

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`

**Step 1: Design and embed the Settings card**
Embed a beautiful glassmorphic card on the dashboard allowing options configuration.
It should:
- Read/write to browser's `localStorage` to save phone number, weekly preferences, and urgent alerts settings.
- Support a test WhatsApp click.
- Instantly send a trigger request on save if the settings were changed, so the user receives immediate confirmation.
- Use `triggerAlertWhatsapp` and avoid any legacy calls.

**Step 2: Commit**
```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: integrate premium WhatsApp settings card on Dashboard"
```
