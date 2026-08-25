# SomaSync 🎓⚡

> Gamified developer dashboard for students. Syncs Moodle assignments and deadlines, maps them to your GitHub commits as progress streaks and answers study questions with an AI assistant trained on your actual syllabus.

🏆 **Winner, GitSync Hackathon 2026 (Zetech University)** · incubated at the **iZET Innovation, Entrepreneurship & Technology Hub**
🌐 **Live:** [somasync.tech](https://somasync.tech)

## What it does
- **Moodle sync:** pulls live assignments, deadlines and course data from the Moodle REST API
- **Gamified streaks:** maps coursework deadlines to your GitHub commit activity so progress stays visible
- **AI study assistant:** RAG over real course materials. Syllabus OCR via Azure Document Intelligence, embeddings in Supabase pgvector, answers via Gemini 2.5 Flash
- **Production deployment:** Dockerized FastAPI backend on Azure, Vercel frontend

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
- **Backend**: FastAPI (async), httpx, Pydantic v2, Docker
- **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons
- **AI**: Gemini 2.5 Flash (RAG), Azure Document Intelligence (syllabus OCR)
- **Database**: Supabase (PostgreSQL + pgvector)
- **LMS**: Moodle REST API
- **Infra**: Azure (backend), Vercel (frontend)

## Team
Built with Grace Kamure and Samuel Kangethe at the GitSync Hackathon, Zetech University.

## License
MIT
