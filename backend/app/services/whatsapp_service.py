"""
SomaSync — Twilio WhatsApp Service
Handles direct HTTP connection to Twilio API to dispatch WhatsApp messages.
"""

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
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError:
            try:
                error_detail = response.json()
                error_msg = error_detail.get("message", response.text)
                error_code = error_detail.get("code", "unknown")
                raise ValueError(f"Twilio error {error_code}: {error_msg}")
            except Exception:
                raise ValueError(f"Twilio HTTP {response.status_code}: {response.text}")
        return response.json()
