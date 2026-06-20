import os
import json
import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timedelta, timezone

# Import reminder_worker module
from app.services import reminder_worker

# A mock datetime helper class that inherits from datetime
class MockDatetime(datetime):
    _mock_now = None

    @classmethod
    def now(cls, tz=None):
        if cls._mock_now is not None:
            if tz is not None:
                return cls._mock_now.astimezone(tz)
            return cls._mock_now
        return super().now(tz)


@pytest.fixture
def temp_storage(tmp_path):
    # Set up a temporary storage directory
    temp_dir = tmp_path / "storage"
    temp_dir.mkdir()
    
    # Patch STORAGE_DIR and REGISTRY_FILE in the worker
    with patch("app.services.reminder_worker.STORAGE_DIR", str(temp_dir)), \
         patch("app.services.reminder_worker.REGISTRY_FILE", str(temp_dir / "sent_reminders.json")):
        yield temp_dir


@pytest.mark.asyncio
async def test_check_and_send_reminders_trigger(temp_storage):
    # Setup test event for user "user123"
    userid = "user123"
    events_data = {
        "Mon": [
            {
                "id": "evt-1",
                "title": "Database Systems",
                "time": "09:00",
                "endTime": "11:00",
                "category": "lecture",
                "notes": "Bring notes",
                "reminder_enabled": True,
                "reminder_lead_time_mins": 60
            }
        ]
    }
    
    with open(temp_storage / f"events_{userid}.json", "w", encoding="utf-8") as f:
        json.dump(events_data, f)
        
    # Setup settings for user "user123"
    settings_data = {
        "phone_number": "+254712345678",
        "study_alerts_enabled": True
    }
    
    with open(temp_storage / f"settings_{userid}.json", "w", encoding="utf-8") as f:
        json.dump(settings_data, f)
        
    # Set mock now to Mon at 08:00 (which is exactly 60 mins before 09:00)
    # 2026-06-22 is a Monday.
    nairobi_tz = timezone(timedelta(hours=3))
    mock_now = datetime(2026, 6, 22, 8, 0, 0, tzinfo=nairobi_tz)
    
    MockDatetime._mock_now = mock_now
    
    with patch("app.services.reminder_worker.datetime", MockDatetime), \
         patch("app.services.reminder_worker.send_whatsapp_via_twilio", new_callable=AsyncMock) as mock_send:
         
        await reminder_worker.check_and_send_reminders()
        
        # Verify WhatsApp send was called
        mock_send.assert_called_once()
        args, kwargs = mock_send.call_args
        assert args[0] == "+254712345678"
        assert "Database Systems" in args[1]
        assert "09:00" in args[1]
        
        # Verify deduplication registry was written
        sent_file = temp_storage / "sent_reminders.json"
        assert sent_file.exists()
        with open(sent_file, "r") as f:
            sent_data = json.load(f)
        
        expected_key = "user123:evt-1:2026-06-22:09:00"
        assert expected_key in sent_data


@pytest.mark.asyncio
async def test_check_and_send_reminders_already_sent(temp_storage):
    # Setup test event for user "user123"
    userid = "user123"
    events_data = {
        "Mon": [
            {
                "id": "evt-1",
                "title": "Database Systems",
                "time": "09:00",
                "endTime": "11:00",
                "category": "lecture",
                "notes": "Bring notes",
                "reminder_enabled": True,
                "reminder_lead_time_mins": 60
            }
        ]
    }
    with open(temp_storage / f"events_{userid}.json", "w", encoding="utf-8") as f:
        json.dump(events_data, f)
        
    settings_data = {
        "phone_number": "+254712345678",
        "study_alerts_enabled": True
    }
    with open(temp_storage / f"settings_{userid}.json", "w", encoding="utf-8") as f:
        json.dump(settings_data, f)
        
    # Pre-populate sent registry
    expected_key = "user123:evt-1:2026-06-22:09:00"
    with open(temp_storage / "sent_reminders.json", "w", encoding="utf-8") as f:
        json.dump([expected_key], f)
        
    nairobi_tz = timezone(timedelta(hours=3))
    mock_now = datetime(2026, 6, 22, 8, 0, 0, tzinfo=nairobi_tz)
    MockDatetime._mock_now = mock_now
    
    with patch("app.services.reminder_worker.datetime", MockDatetime), \
         patch("app.services.reminder_worker.send_whatsapp_via_twilio", new_callable=AsyncMock) as mock_send:
         
        await reminder_worker.check_and_send_reminders()
        
        # Verify WhatsApp send was NOT called (since registry already has it)
        mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_check_and_send_reminders_disabled_settings(temp_storage):
    # Setup test event for user "user123"
    userid = "user123"
    events_data = {
        "Mon": [
            {
                "id": "evt-1",
                "title": "Database Systems",
                "time": "09:00",
                "endTime": "11:00",
                "category": "lecture",
                "notes": "Bring notes",
                "reminder_enabled": True,
                "reminder_lead_time_mins": 60
            }
        ]
    }
    with open(temp_storage / f"events_{userid}.json", "w", encoding="utf-8") as f:
        json.dump(events_data, f)
        
    # Alerts disabled globally in user settings
    settings_data = {
        "phone_number": "+254712345678",
        "study_alerts_enabled": False
    }
    with open(temp_storage / f"settings_{userid}.json", "w", encoding="utf-8") as f:
        json.dump(settings_data, f)
        
    nairobi_tz = timezone(timedelta(hours=3))
    mock_now = datetime(2026, 6, 22, 8, 0, 0, tzinfo=nairobi_tz)
    MockDatetime._mock_now = mock_now
    
    with patch("app.services.reminder_worker.datetime", MockDatetime), \
         patch("app.services.reminder_worker.send_whatsapp_via_twilio", new_callable=AsyncMock) as mock_send:
         
        await reminder_worker.check_and_send_reminders()
        mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_check_and_send_reminders_disabled_event(temp_storage):
    # Setup test event with reminder_enabled = False
    userid = "user123"
    events_data = {
        "Mon": [
            {
                "id": "evt-1",
                "title": "Database Systems",
                "time": "09:00",
                "endTime": "11:00",
                "category": "lecture",
                "notes": "Bring notes",
                "reminder_enabled": False,
                "reminder_lead_time_mins": 60
            }
        ]
    }
    with open(temp_storage / f"events_{userid}.json", "w", encoding="utf-8") as f:
        json.dump(events_data, f)
        
    settings_data = {
        "phone_number": "+254712345678",
        "study_alerts_enabled": True
    }
    with open(temp_storage / f"settings_{userid}.json", "w", encoding="utf-8") as f:
        json.dump(settings_data, f)
        
    nairobi_tz = timezone(timedelta(hours=3))
    mock_now = datetime(2026, 6, 22, 8, 0, 0, tzinfo=nairobi_tz)
    MockDatetime._mock_now = mock_now
    
    with patch("app.services.reminder_worker.datetime", MockDatetime), \
         patch("app.services.reminder_worker.send_whatsapp_via_twilio", new_callable=AsyncMock) as mock_send:
         
        await reminder_worker.check_and_send_reminders()
        mock_send.assert_not_called()
