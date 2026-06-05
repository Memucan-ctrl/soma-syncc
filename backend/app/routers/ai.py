"""
SomaSync — AI Consultation Router
Handles interactive chat sessions for enrolled courses using Gemini Generative AI.
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter(prefix="/api/ai", tags=["AI Consultation"])


class ChatRequest(BaseModel):
    message: str
    course_code: str | None = None
    context: str | None = None


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(payload: ChatRequest):
    """
    Generate study consultation responses using Gemini 2.5 Flash.
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
        # Use gemini-1.5-flash or gemini-2.5-flash
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        system_instruction = (
            "You are an elite academic tutor and teaching assistant for university courses.\n"
            "Your tone is professional, encouraging, and highly technical. Use Markdown for formatting.\n"
        )
        
        prompt = system_instruction
        if payload.course_code:
            prompt += f"The student is asking about the course: {payload.course_code}.\n"
        if payload.context:
            prompt += f"Here is the context of the course materials and notes: {payload.context}\n"
        prompt += f"User query: {payload.message}\n"

        response = model.generate_content(prompt)
        return ChatResponse(response=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
