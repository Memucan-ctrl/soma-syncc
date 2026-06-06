"""
SomaSync — Azure Document Intelligence OCR Router
Handles uploading of whiteboard pictures, PDF notes, Office documents, and extracts text.
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
    Upload an image, PDF, plain text, or Microsoft Office document (Word, PowerPoint, Excel)
    to perform OCR or text extraction analysis.
    """
    filename = file.filename
    filename_lower = filename.lower()
    content_type = file.content_type or ""

    # Check if plain text/code file
    is_plain_text = (
        content_type.startswith("text/") 
        or filename_lower.endswith((".txt", ".md", ".json", ".csv", ".xml", ".html", ".htm", ".js", ".jsx", ".py", ".css"))
    )

    # Check Azure supported extensions
    azure_supported = filename_lower.endswith((
        ".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".heif", ".heic",
        ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls"
    ))

    is_document_content = (
        content_type.startswith("image/") 
        or content_type == "application/pdf"
        or content_type.startswith("application/vnd.openxmlformats-officedocument")
        or content_type.startswith("application/msword")
        or content_type.startswith("application/vnd.ms-")
    )

    if not (is_plain_text or azure_supported or is_document_content):
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file format. Please upload an image, PDF, text file, "
                "or Microsoft Office document (Word, PowerPoint, Excel)."
            )
        )

    try:
        file_bytes = await file.read()

        # Local parsing for plain text files (extremely fast and 100% accurate fallback)
        if is_plain_text:
            text_content = file_bytes.decode("utf-8", errors="ignore")
            return {
                "status": "success",
                "filename": filename,
                "text": text_content,
                "detail": "Plain text file parsed locally."
            }

        try:
            # Try parsing with OCRService (local parsing first, then Azure OCR)
            extracted_text = OCRService.extract_text(file_bytes, filename=filename)
            return {
                "status": "success",
                "filename": filename,
                "text": extracted_text,
                "detail": "Parsed successfully."
            }
        except ValueError as val_err:
            # If keys are missing and we needed Azure, fall back to mock
            endpoint = os.environ.get("AZURE_DOC_INTELLIGENCE_ENDPOINT")
            key = os.environ.get("AZURE_DOC_INTELLIGENCE_KEY")
            
            if not endpoint or not key:
                if filename_lower.endswith((".txt", ".md")):
                    mock_text = "### [Local Text File Content]\n\nThis is the content of the text file."
                elif "whiteboard" in filename_lower or "board" in filename_lower or filename_lower.endswith((".png", ".jpg", ".jpeg")):
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
                        "### [Azure OCR Mock Result: Document Notes Analysis]\n\n"
                        f"**Extracted Document Text from {filename}**:\n"
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
                    "filename": filename,
                    "text": mock_text,
                    "detail": "Running in preview mode (Azure keys not set in environment)."
                }
            raise val_err

    except Exception as e:
        # Graceful fallback to prevent errors during live presentation
        return {
            "status": "fallback",
            "filename": filename,
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
    and perform Azure Document Intelligence OCR analysis or local text parsing.
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

        filename = payload.file_url.split("/")[-1].split("?")[0] or "moodle_file.pdf"
        filename_lower = filename.lower()

        # Check if plain text
        is_plain_text = filename_lower.endswith((".txt", ".md", ".json", ".csv", ".xml", ".html", ".htm", ".js", ".jsx", ".py", ".css"))
        
        if is_plain_text:
            text_content = file_bytes.decode("utf-8", errors="ignore")
            return {
                "status": "success",
                "filename": filename,
                "text": text_content,
                "detail": "Plain text file parsed locally."
            }

        try:
            # Try parsing with OCRService
            extracted_text = OCRService.extract_text(file_bytes, filename=filename)
            return {
                "status": "success",
                "filename": filename,
                "text": extracted_text,
                "detail": "Parsed successfully."
            }
        except ValueError as val_err:
            endpoint = os.environ.get("AZURE_DOC_INTELLIGENCE_ENDPOINT")
            key = os.environ.get("AZURE_DOC_INTELLIGENCE_KEY")
            
            if not endpoint or not key:
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
            raise val_err

    except Exception as e:
        filename = payload.file_url.split("/")[-1].split("?")[0] or "moodle_file.pdf"
        return {
            "status": "fallback",
            "filename": filename,
            "text": f"### [Azure Document Intelligence OCR Parser Fallback]\nFailed to process online: {str(e)}\n\n(Local fallback triggered to ensure smooth demo navigation.)",
            "detail": f"Azure API Error: {str(e)}"
        }
