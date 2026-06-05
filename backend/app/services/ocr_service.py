import os
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient

class OCRService:
    @staticmethod
    def extract_text(file_content: bytes) -> str:
        """
        Extract text from file bytes (PDF, Image, etc.) using Azure Document Intelligence.
        """
        endpoint = os.environ.get("AZURE_DOC_INTELLIGENCE_ENDPOINT")
        key = os.environ.get("AZURE_DOC_INTELLIGENCE_KEY")

        if not endpoint or not key:
            raise ValueError("Azure Document Intelligence credentials are not configured in environment.")

        # Initialize Azure Document Analysis Client
        client = DocumentAnalysisClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(key)
        )

        # Use prebuilt-read for general text and OCR layout extraction
        poller = client.begin_analyze_document(
            model_id="prebuilt-read",
            document=file_content
        )
        result = poller.result()

        # Return the compiled string content
        return result.content or ""
