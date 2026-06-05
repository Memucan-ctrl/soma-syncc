"""
SomaSync — Main FastAPI Application
Entry point for the async backend server.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import moodle


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    print("🚀 SomaSync backend starting up...")
    print(f"   Environment: {settings.environment}")
    print(f"   Moodle Endpoint: {settings.moodle_base_url}")
    yield
    print("🛑 SomaSync backend shutting down...")


app = FastAPI(
    title="SomaSync API",
    description="Elite Edutech backend — Moodle Sync, AI Pipelines, Gamified Workflows",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite dev server
        "http://localhost:3000",    # Alt React dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Router Registration ─────────────────────────────────────────────────────
app.include_router(moodle.router)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["System"])
async def root():
    return {
        "service": "SomaSync API",
        "status": "operational",
        "version": "0.1.0",
    }


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.environment,
        "services": {
            "moodle": {
                "endpoint": settings.moodle_base_url,
                "token_configured": bool(settings.moodle_ws_token),
            },
            "supabase": {
                "url_configured": bool(settings.supabase_url),
                "key_configured": bool(settings.supabase_key),
            },
            "gemini": {
                "key_configured": bool(settings.gemini_api_key),
            },
            "azure_doc_intelligence": {
                "endpoint_configured": bool(settings.azure_doc_intelligence_endpoint),
            },
        },
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
