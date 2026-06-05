# SomaSync

> Elite Edutech Platform — Gamified Technical Workflows, Moodle Sync, AI-Powered Study Management

## Architecture

```
soma-sync/
├── backend/           # Async FastAPI (Python 3.12)
│   ├── app/
│   │   ├── config.py          # Pydantic Settings
│   │   └── routers/
│   │       └── moodle.py      # Moodle Sync Bridge
│   ├── main.py                # FastAPI entrypoint
│   ├── Dockerfile             # Multi-stage production build
│   ├── .dockerignore          # Strict exclusion rules
│   └── requirements.txt       # Python dependencies
├── frontend/          # React + Vite + Tailwind + Framer Motion
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page-level views
│   │   └── App.jsx            # Root application
│   └── package.json
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env        # Fill in your keys
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack
- **Backend**: FastAPI, httpx, Pydantic v2, Supabase
- **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons
- **AI**: Gemini 2.5 Flash, Azure Document Intelligence
- **Database**: Supabase (PostgreSQL + pgvector)
- **LMS**: Zetech Moodle REST API

## License
MIT
