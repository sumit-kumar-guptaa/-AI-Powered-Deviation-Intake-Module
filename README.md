# AI-Powered Deviation Intake Module

A pharmaceutical deviation management system with AI-powered extraction, impact assessment, and human review workflow.

## Features

- **AI Extraction**: Extract structured data from deviation reports (text, PDF, DOCX, Email)
- **Impact Assessment**: AI-powered severity classification (Critical/Major/Minor) with reasoning
- **Human Review**: Interactive review panel with Accept/Reject for each AI-suggested field
- **Full CRUD**: Create, read, update, delete deviations with status tracking
- **Delete**: Hover-to-reveal delete with confirmation
- **Real-time Chat**: AI Copilot for root cause analysis, CAPA suggestions, regulatory guidance

## Tech Stack

**Backend:**
- FastAPI (Python)
- PostgreSQL (production) / SQLite (dev)
- SQLAlchemy ORM
- LangGraph + Groq (AI workflow)
- Pydantic v2

**Frontend:**
- React 18 + Vite
- Redux Toolkit
- Tailwind CSS
- Lucide React icons

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── ai/           # LangGraph AI workflow
│   │   ├── api/v1/       # REST endpoints
│   │   ├── core/         # Configuration
│   │   ├── db/           # Database session
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/   # DeviationForm, AIPanel, DeviationList
    │   ├── store/        # Redux slices
    │   └── services/     # API client
    └── package.json
```

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
# Set GROQ_API_KEY in .env
python -m uvicorn app.main:app --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## API Endpoints

- `POST /api/v1/deviations` - Create deviation
- `GET /api/v1/deviations` - List deviations
- `GET /api/v1/deviations/{id}` - Get deviation
- `PATCH /api/v1/deviations/{id}` - Update deviation
- `DELETE /api/v1/deviations/{id}` - Delete deviation
- `POST /api/v1/ai/extract` - Extract from text
- `POST /api/v1/ai/extract-file` - Extract from file
- `POST /api/v1/ai/assess-impact` - AI impact assessment
- `POST /api/v1/ai/chat` - AI Copilot chat

## Environment Variables

Create `.env` in backend:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
SECRET_KEY=your_secret_key
```