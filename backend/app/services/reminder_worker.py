"""
SomaSync — Background Study Reminder Daemon
Polls user study planners every 60 seconds, evaluates notifications and lead times
relative to Nairobi Time (UTC+3), and dispatches alerts via Twilio WhatsApp exactly once.
"""

import os
import json
import glob
import asyncio
from datetime import datetime, timedelta, timezone
from app.services.whatsapp_service import send_whatsapp_via_twilio

# Storage directory under backend/app/storage
STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage"))
REGISTRY_FILE = os.path.join(STORAGE_DIR, "sent_reminders.json")

WEEKDAYS = {
    "Mon": 0,
    "Tue": 1,
    "Wed": 2,
    "Thu": 3,
    "Fri": 4,
    "Sat": 5,
    "Sun": 6
}


def load_sent_registry() -> set:
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return set(data)
        except Exception as e:
            print(f"[Worker] Error reading sent registry: {e}")
    return set()


def save_sent_registry(registry: set):
    try:
        os.makedirs(STORAGE_DIR, exist_ok=True)
        with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
            json.dump(list(registry), f, indent=2)
    except Exception as e:
        print(f"[Worker] Error saving sent registry: {e}")


async def check_and_send_reminders():
    nairobi_tz = timezone(timedelta(hours=3))
    nairobi_now = datetime.now(nairobi_tz)
    
    # Load sent registry
    sent_registry = load_sent_registry()
    registry_updated = False
    
    # Find all events_*.json files
    pattern = os.path.join(STORAGE_DIR, "events_*.json")
    event_files = glob.glob(pattern)
    
    for file_path in event_files:
        filename = os.path.basename(file_path)
        # Extract userid from events_{userid}.json
        try:
            userid = filename.split("_")[1].split(".")[0]
        except Exception:
            continue
            
        # Load user settings
        settings_path = os.path.join(STORAGE_DIR, f"settings_{userid}.json")
        if not os.path.exists(settings_path):
            continue
            
        try:
            with open(settings_path, "r", encoding="utf-8") as f:
                settings = json.load(f)
        except Exception as e:
            print(f"[Worker] Failed to load settings for user {userid}: {e}")
            continue
            
        phone = settings.get("phone_number", "")
        alerts_enabled = settings.get("study_alerts_enabled", True)
        
        if not phone or not alerts_enabled:
            # User hasn't registered phone or disabled reminders
            continue
            
        # Load events
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                events_data = json.load(f)
        except Exception as e:
            print(f"[Worker] Failed to load events for user {userid}: {e}")
            continue
            
        # Check all days
        for day_name, events in events_data.items():
            if day_name not in WEEKDAYS:
                continue
            w_event = WEEKDAYS[day_name]
            w_now = nairobi_now.weekday()
            diff_days = w_event - w_now
            
            for event in events:
                event_id = event.get("id")
                enabled = event.get("reminder_enabled", True)
                lead_time = event.get("reminder_lead_time_mins", 60)
                time_str = event.get("time", "")
                
                if not event_id or not enabled or not time_str:
                    continue
                    
                # Parse event time (HH:MM)
                try:
                    h, m = map(int, time_str.split(":"))
                except Exception:
                    continue
                    
                # Check three occurrences: previous, current, and next week
                for week_offset in [-7, 0, 7]:
                    event_date = nairobi_now.date() + timedelta(days=diff_days + week_offset)
                    try:
                        event_datetime = datetime(
                            year=event_date.year,
                            month=event_date.month,
                            day=event_date.day,
                            hour=h,
                            minute=m,
                            tzinfo=nairobi_tz
                        )
                    except Exception:
                        continue
                        
                    reminder_datetime = event_datetime - timedelta(minutes=lead_time)
                    
                    # Trigger if reminder_datetime is reached, up to 15 mins grace
                    if reminder_datetime <= nairobi_now < reminder_datetime + timedelta(minutes=15):
                        # Registry key format: {userid}:{event_id}:{date_iso}:{time_str}
                        registry_key = f"{userid}:{event_id}:{event_date.isoformat()}:{time_str}"
                        
                        if registry_key not in sent_registry:
                            title = event.get("title", "Study Session")
                            category = event.get("category", "study")
                            notes = event.get("notes", "")
                            
                            # Construct reminder message
                            msg = (
                                f"SomaSync Reminder: \"{title}\" starts in {lead_time} mins (at {time_str})! 📚\n"
                                f"Category: {category.capitalize()}\n"
                            )
                            if notes:
                                msg += f"Notes: {notes}"
                                
                            print(f"[Worker] Sending reminder to {phone}: {registry_key}")
                            try:
                                await send_whatsapp_via_twilio(phone, msg)
                                sent_registry.add(registry_key)
                                registry_updated = True
                            except Exception as ex:
                                print(f"[Worker] Failed to send WhatsApp to {phone}: {ex}")
                                
    if registry_updated:
        save_sent_registry(sent_registry)


async def start_reminder_worker():
    print("[Worker] Background reminder daemon starting up...")
    # Add a short delay to let server initialize completely
    await asyncio.sleep(5)
    print("[Worker] Background reminder daemon running.")
    while True:
        try:
            await check_and_send_reminders()
        except Exception as e:
            print(f"[Worker] Error in reminder check loop: {e}")
        await asyncio.sleep(60)
