"""
SomaSync — Main FastAPI Application
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, moodle, ai, ocr


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[*] SomaSync backend starting up...")
    yield
    print("[*] SomaSync backend shutting down...")


class StripPrefixMiddleware:
    def __init__(self, app, prefix: str):
        self.app = app
        self.prefix = prefix.rstrip("/")

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            path = scope.get("path", "")
            if path.startswith(self.prefix):
                scope["path"] = path[len(self.prefix):] or "/"
                scope["root_path"] = self.prefix
        await self.app(scope, receive, send)


app = FastAPI(
    title="SomaSync API",
    description="Edutech backend — Moodle Auth, Sync, AI Pipelines",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(StripPrefixMiddleware, prefix="/_/backend")

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(moodle.router)
app.include_router(ai.router)
app.include_router(ocr.router)


@app.get("/", tags=["System"])
async def root():
    return {"service": "SomaSync API", "status": "operational", "version": "0.2.0"}


@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "auth": "moodle_token_flow"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
