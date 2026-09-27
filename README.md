# 🧪 AI-Powered Deviation Intake Module

> An intelligent deviation management system for pharmaceutical (API) manufacturing — turning unstructured deviation reports into structured, review-ready records using AI.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?logo=langchain&logoColor=white)](https://www.langchain.com/langgraph)
[![Groq](https://img.shields.io/badge/Groq-F55036?logo=groq&logoColor=white)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

---

## 📋 Overview

In API (Active Pharmaceutical Ingredient) manufacturing, a **deviation** — any departure from an approved process parameter, procedure, or specification — must be documented, assessed for impact, and investigated as part of GMP compliance.

This project replaces slow, manual deviation logging with an **AI-assisted intake workflow**:

```
Deviation report (text / email / PDF)
        │
        ▼
   AI Extraction  ───────►  Structured "Log Deviation" form
        │
        ▼
AI Impact & Severity Assessment  ───►  Critical / Major / Minor + reasoning
        │
        ▼
   Human Review & Edit
        │
        ▼
     Save to Database
```

The user pastes or uploads a raw deviation report, the **AI Copilot** extracts and structures the data directly into the form, recommends a severity classification with justification, and the quality team reviews and edits before submitting — reducing manual data entry while keeping a human firmly in the loop for the final call.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Extraction** | Parses free-text, email, PDF, or DOCX deviation reports into structured fields |
| ⚠️ **Impact & Severity Assessment** | AI classifies deviations as **Critical / Major / Minor** with a short, defensible reasoning statement |
| ✅ **Human-in-the-loop Review** | Every AI-populated field is editable; an Accept/Reject pattern lets reviewers confirm or override AI suggestions before saving |
| 🗂️ **Full CRUD** | Create, view, update, and delete deviation records, with status tracking (Draft → Submitted → Under Investigation → Closed) |
| 🗑️ **Safe Delete** | Hover-to-reveal delete control with confirmation, to prevent accidental record loss |
| 💬 **AI Copilot Chat** | Conversational assistant for root cause analysis, CAPA (Corrective & Preventive Action) suggestions, and regulatory guidance |
| 🔍 **Auto-generated Deviation IDs** | Each record gets a traceable ID (e.g., `DEV-2026-00001`) |

---

## 🏗️ Architecture

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│   React + Redux      │  REST   │   FastAPI Backend     │  SQL    │   PostgreSQL      │
│   Frontend            │◄──────►│   (Python)             │◄──────►│   Database         │
│                       │  JSON   │                        │         │                   │
│  • Log Deviation form │         │  • REST API layer      │         │  • deviations table│
│  • AI Copilot panel   │         │  • LangGraph workflow  │         │                   │
│  • Deviation list     │         │  • Groq LLM calls      │         │                   │
└─────────────────────┘         └───────────┬────────────┘         └─────────────────┘
                                             │
                                             ▼
                                   ┌───────────────────┐
                                   │   Groq API          │
                                   │  (openai/gpt-oss-120b)│
                                   └───────────────────┘
```

**AI workflow (LangGraph StateGraph):**

```
START → extract_fields → assess_severity → END
```

1. **`extract_fields`** — Extracts structured deviation data (title, batch number, product, process step, equipment, description, dates, reporter, etc.) from raw unstructured text. Returns strict JSON; leaves fields empty rather than hallucinating when information isn't present in the source text.
2. **`assess_severity`** — Takes the extracted fields and classifies severity (Critical / Major / Minor) with a concise, factor-based justification, in the style of a pharmaceutical quality risk assessment.

---

## 🛠️ Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) (Python) — REST API layer
- [PostgreSQL](https://www.postgresql.org/) (production) / SQLite (local dev)
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM
- [LangGraph](https://www.langchain.com/langgraph) + [Groq](https://groq.com/) — AI orchestration & inference
- [Pydantic v2](https://docs.pydantic.dev/) — request/response validation

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/) — state management
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Lucide React](https://lucide.dev/) — icons

---

## 📁 Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── ai/            # LangGraph AI workflow (extraction + severity nodes)
│   │   ├── api/v1/        # REST endpoint routers
│   │   ├── core/          # App configuration, settings
│   │   ├── db/            # Database session & engine setup
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic layer
│   │   └── main.py        # FastAPI app entrypoint
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/    # DeviationForm, AIPanel, DeviationList
    │   ├── store/         # Redux slices
    │   └── services/      # API client (axios/fetch wrapper)
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (local install, or a free hosted instance via [Neon](https://neon.tech) / [Supabase](https://supabase.com))
- A [Groq API key](https://console.groq.com)

### 1. Clone the repository

```bash
git clone https://github.com/sumit-kumar-guptaa/-AI-Powered-Deviation-Intake-Module.git
cd -AI-Powered-Deviation-Intake-Module
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv

# Activate virtual environment
source .venv/bin/activate        # macOS/Linux
.venv\Scripts\activate           # Windows

pip install -r requirements.txt
```

Create a `.env` file inside `backend/` (see [Environment Variables](#-environment-variables) below), then run:

```bash
python -m uvicorn app.main:app --port 8000 --reload
```

The API will be available at **http://localhost:8000** (interactive docs at `http://localhost:8000/docs`).

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## 🔐 Environment Variables

Create a `.env` file in `backend/`:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/deviation_db

# Groq API
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# App secret
SECRET_KEY=your_secret_key_here
```

> **Note on `GROQ_MODEL`:** Groq periodically deprecates models. If extraction calls start failing with a `model_decommissioned` error, check [console.groq.com/docs/models](https://console.groq.com/docs/models) for the current recommended model and update this value — no other code changes are needed.

---

## 📡 API Endpoints

### Deviations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/deviations` | Create a new deviation record |
| `GET` | `/api/v1/deviations` | List all deviations |
| `GET` | `/api/v1/deviations/{id}` | Get a single deviation by ID |
| `PATCH` | `/api/v1/deviations/{id}` | Update an existing deviation |
| `DELETE` | `/api/v1/deviations/{id}` | Delete a deviation |

### AI

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ai/extract` | Extract structured fields from raw text |
| `POST` | `/api/v1/ai/extract-file` | Extract structured fields from an uploaded file (PDF/DOCX) |
| `POST` | `/api/v1/ai/assess-impact` | Get AI severity classification + reasoning |
| `POST` | `/api/v1/ai/chat` | Conversational AI Copilot (root cause, CAPA, regulatory guidance) |

Full interactive API documentation is auto-generated by FastAPI at `/docs` once the backend is running.

---

## 🧭 Workflow Walkthrough

1. **Input** — Paste a deviation email/report as text, or upload a PDF/DOCX in the AI Copilot panel.
2. **Extract** — Click "Extract with AI." The backend runs the LangGraph pipeline against Groq, returning structured fields.
3. **Auto-fill** — The Log Deviation form on the left populates automatically; AI-filled fields are visually marked.
4. **Assess** — The AI Copilot displays a recommended severity (Critical / Major / Minor) with a short justification.
5. **Review** — The reviewer edits any field as needed; AI-filled indicators clear once a field is manually edited.
6. **Save** — Submitting persists the record to PostgreSQL with an auto-generated Deviation ID (e.g., `DEV-2026-00001`) and a status of `Submitted`.

---

## 🗺️ Roadmap / Possible Extensions

- [ ] Role-based access control (QA reviewer vs. operator vs. admin)
- [ ] Audit trail / version history per deviation
- [ ] Export deviation reports to PDF
- [ ] Configurable severity taxonomy per site/product line
- [ ] OCR support for scanned deviation forms

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙋 Author

**Sumit Kumar Gupta**
Built as part of the AIVOA.AI AI Product Engineer Challenge.