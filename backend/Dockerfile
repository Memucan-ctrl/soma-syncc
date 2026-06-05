# ─── SomaSync Backend ─────────────────────────────────────────────────────────
# Multi-stage production build with minimal footprint

FROM python:3.12-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM python:3.12-slim

LABEL maintainer="SomaSync Team" \
      description="SomaSync Edutech Backend API" \
      version="0.1.0"

# Security: run as non-root
RUN groupadd -r somasync && useradd -r -g somasync -d /app -s /sbin/nologin somasync

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY . .

# Fix ownership
RUN chown -R somasync:somasync /app

USER somasync

# Dynamic port via env variable (default 8000)
ENV PORT=8000
EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen(f'http://localhost:{__import__(\"os\").environ.get(\"PORT\", 8000)}/health')" || exit 1

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 2 --log-level info
