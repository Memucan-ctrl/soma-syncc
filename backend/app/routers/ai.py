"""
SomaSync — AI Consultation Router
Handles interactive chat sessions for enrolled courses using Gemini Generative AI.
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter(prefix="/api/ai", tags=["AI Consultation"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    course_code: str | None = None
    context: str | None = None
    history: list[ChatMessage] | None = None


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(payload: ChatRequest):
    """
    Generate study consultation responses using Gemini 2.5 Flash with full conversation memory.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        # High-fidelity mock response for local hackathon testing
        course_info = f" ({payload.course_code})" if payload.course_code else ""
        return ChatResponse(
            response=(
                f"[AI Consultation Preview] I am analyzing your request for the course{course_info}.\n\n"
                f"Based on the course syllabus and imported materials, here are key points regarding:\n"
                f'"{payload.message}"\n\n'
                f"1. **Core Concept**: This fits within your core syllabus modules. Make sure you understand the foundational design patterns.\n"
                f"2. **Study Tip**: Review the lab manuals and write a small practice script or circuit description to test your understanding.\n"
                f"3. **Milestone**: This topic relates to your upcoming assignment deadlines. Let me know if you would like me to draft a summary of the next module!"
            )
        )

    try:
        genai.configure(api_key=api_key)
        
        # Configure GenerativeModel with academic tutor persona instruction
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=(
                "You are an elite academic tutor and teaching assistant for university courses.\n"
                "Your tone is professional, encouraging, and highly technical. Use Markdown for formatting.\n"
            )
        )
        
        # Build chat history mapped to Gemini's expected user/model roles
        gemini_history = []
        if payload.history:
            for h in payload.history:
                role = "model" if h.role in ("assistant", "model") else "user"
                gemini_history.append({
                    "role": role,
                    "parts": [h.content]
                })
        
        # Start stateful chat session with the provided conversation history
        chat = model.start_chat(history=gemini_history)
        
        # Prepend optional metadata/notes context to the user's message
        prompt_prefix = ""
        if payload.course_code:
            prompt_prefix += f"[Course context: Enrolled in {payload.course_code}]\n"
        if payload.context:
            prompt_prefix += f"[Materials/Notes context:\n{payload.context}]\n"
        
        full_prompt = f"{prompt_prefix}{payload.message}" if prompt_prefix else payload.message
        
        response = chat.send_message(full_prompt)
        return ChatResponse(response=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
