"""
SomaSync — Azure Document Intelligence OCR Router
Handles uploading of whiteboard pictures, PDF notes, and extracts text using Azure Cognitive Services.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ocr_service import OCRService
import os
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/api/ocr", tags=["Azure OCR & Document Intelligence"])


@router.post("/upload")
async def upload_for_ocr(file: UploadFile = File(...)):
    """
    Upload an image (whiteboard/screenshot) or PDF document to perform OCR analysis.
    Uses Azure Document Intelligence (Form Recognizer).
    """
    # Verify file type
    content_type = file.content_type
    if not content_type or not (
        content_type.startswith("image/") or content_type == "application/pdf"
    ):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload an image or a PDF document.",
        )

    try:
        file_bytes = await file.read()
        
        endpoint = os.environ.get("AZURE_DOC_INTELLIGENCE_ENDPOINT")
        key = os.environ.get("AZURE_DOC_INTELLIGENCE_KEY")
        
        if not endpoint or not key:
            # High-fidelity mock response for local testing and debugging
            filename = file.filename.lower()
            if "whiteboard" in filename or "board" in filename or filename.endswith((".png", ".jpg", ".jpeg")):
                mock_text = (
                    "### [Azure OCR Mock Result: Whiteboard Image Analysis]\n\n"
                    "**Detected Hand-written Text Notes**:\n"
                    "- *Topic*: Database Normalization & 3NF Rules\n"
                    "- *Scribble 1*: 1NF -> Remove repeating groups, define Primary Key\n"
                    "- *Scribble 2*: 2NF -> Meet 1NF + Remove partial dependencies (FK mappings)\n"
                    "- *Scribble 3*: 3NF -> Meet 2NF + Remove transitive dependencies (non-key fields depends only on PK)\n"
                    "- *Diagram*: Course Table (id, shortname, fullname) -> linked to Student Table\n"
                )
            else:
                mock_text = (
                    "### [Azure OCR Mock Result: PDF Notes Analysis]\n\n"
                    "**Extracted Document Text**:\n"
                    "**MODULE 2: STACK & QUEUE DATA STRUCTURES**\n"
                    "A stack is a linear data structure that follows the Last In, First Out (LIFO) principle.\n"
                    "Operations:\n"
                    "1. Push: Add an item to the top of the stack.\n"
                    "2. Pop: Remove and return the top item.\n"
                    "3. Peek/Top: Return the top item without removing it.\n"
                    "Complexity: All basic operations run in O(1) time complexity."
                )
            return {
                "status": "mock",
                "filename": file.filename,
                "text": mock_text,
                "detail": "Running in preview mode (Azure keys not set in environment)."
            }

        extracted_text = OCRService.extract_text(file_bytes)
        return {
            "status": "success",
            "filename": file.filename,
            "text": extracted_text,
            "detail": "Parsed successfully using Azure Document Intelligence."
        }
    except Exception as e:
        # Graceful fallback to prevent errors during live presentation
        return {
            "status": "fallback",
            "filename": file.filename,
            "text": f"### [Azure Document Intelligence OCR Parser Fallback]\nFailed to process online: {str(e)}\n\n(Local fallback triggered to ensure smooth demo navigation.)",
            "detail": f"Azure API Error: {str(e)}"
        }


class MoodleFileOcrRequest(BaseModel):
    file_url: str
    token: str


@router.post("/moodle-file")
async def ocr_moodle_file(payload: MoodleFileOcrRequest):
    """
    Download a file resource from Moodle using the student's token,
    and perform Azure Document Intelligence OCR analysis on it.
    """
    if not payload.file_url or not payload.token:
        raise HTTPException(
            status_code=400,
            detail="Missing file_url or token in request payload."
        )

    try:
        # Download the file from Moodle using the student's token
        async with httpx.AsyncClient(timeout=30.0) as client:
            separator = "&" if "?" in payload.file_url else "?"
            download_url = f"{payload.file_url}{separator}token={payload.token}"
            
            response = await client.get(download_url)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to download Moodle file. Moodle returned status: {response.status_code}"
                )
            file_bytes = response.content

        # Check credentials
        endpoint = os.environ.get("AZURE_DOC_INTELLIGENCE_ENDPOINT")
        key = os.environ.get("AZURE_DOC_INTELLIGENCE_KEY")
        
        filename = payload.file_url.split("/")[-1].split("?")[0] or "moodle_file.pdf"
        
        if not endpoint or not key:
            # Return preview text for offline development
            return {
                "status": "mock",
                "filename": filename,
                "text": (
                    f"### [Azure OCR Mock Result: Moodle File {filename}]\n\n"
                    "**Extracted Note Content**:\n"
                    "This is a high-fidelity mock extraction from the Moodle note file.\n"
                    "Azure Document Intelligence keys were not found in the environment."
                ),
                "detail": "Running in preview mode (Azure keys not set in environment)."
            }

        extracted_text = OCRService.extract_text(file_bytes)
        return {
            "status": "success",
            "filename": filename,
            "text": extracted_text,
            "detail": "Moodle file downloaded and parsed successfully using Azure Document Intelligence."
        }
    except Exception as e:
        filename = payload.file_url.split("/")[-1].split("?")[0] or "moodle_file.pdf"
        return {
            "status": "fallback",
            "filename": filename,
            "text": f"### [Azure Document Intelligence OCR Parser Fallback]\nFailed to process online: {str(e)}\n\n(Local fallback triggered to ensure smooth demo navigation.)",
            "detail": f"Azure API Error: {str(e)}"
        }
