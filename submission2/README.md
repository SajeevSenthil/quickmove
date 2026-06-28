# QuickMove — AI Broker Allocation (Submission 2)

An end-to-end AI-powered tool that automates broker allocation for QuickMove relocation operations. Ops executives upload a customer requirement document; Gemini extracts structured requirements, filters and ranks brokers, and presents top-3 recommendations for one-click human approval. Once approved, an n8n automation sends a professional assignment email to the broker.

---

## Architecture

```
Customer .docx → FastAPI → Gemini (extraction) → Structured Profile
                         → SQL filter (city, active, capacity)
                         → Gemini (ranking) → Top 3 recommendations
                         → Human approval (Next.js dashboard)
                         → n8n webhook → Email to broker
                         → DB update (workload, status)
```

---

## Quick Start (Local — no Docker needed)

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)

### 1 — Backend

```bash
cd submission2/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here
# For demo mode (no API key needed): set DEMO_MODE=true

# Seed broker data
python seed_data.py

# Create a sample test document (optional)
python create_sample_doc.py

# Start the API
uvicorn app.main:app --reload
# API runs at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 2 — Frontend

```bash
cd submission2/frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Default: NEXT_PUBLIC_API_URL=http://localhost:8000

# Start dev server
npm run dev
# App runs at http://localhost:3000
```

### 3 — Test the full flow

1. Open `http://localhost:3000`
2. Click **New Request** and upload `sample_docs/arjun_mehta_requirement.docx`
3. Review the AI-extracted customer profile
4. Click **Profile Looks Good — Find Brokers**
5. Review the top-3 AI recommendations with scores and reasoning
6. Enter your name, set a deadline, and click **Approve & Assign**
7. Check the Assignments dashboard for the result

---

## Demo Mode (no Gemini key needed)

Set `DEMO_MODE=true` in `backend/.env` to use hardcoded AI responses. You can test the full UI including extraction, recommendations, and approval without an API key.

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | Next.js 14, TypeScript, Tailwind CSS |
| Backend      | FastAPI, SQLAlchemy                 |
| AI           | Gemini 2.5 Flash                    |
| Database     | SQLite (dev) / PostgreSQL (prod)    |
| Automation   | n8n (broker email notification)     |
| Doc Parsing  | python-docx                         |

---

## API Endpoints

| Method | Path                                    | Description                       |
|--------|-----------------------------------------|-----------------------------------|
| POST   | `/customers/upload`                     | Upload .docx, extract profile     |
| GET    | `/customers`                            | List all customers                |
| GET    | `/customers/{id}`                       | Get customer                      |
| PATCH  | `/customers/{id}`                       | Edit extracted profile            |
| GET    | `/customers/{id}/recommendations`       | AI broker recommendations         |
| GET    | `/brokers`                              | List brokers (filter by city)     |
| POST   | `/assignments`                          | Create assignment                 |
| GET    | `/assignments`                          | List all assignments              |
| POST   | `/assignments/{id}/approve`             | Approve + trigger notification    |
| POST   | `/assignments/{id}/reject`              | Reject assignment                 |

Full interactive docs: `http://localhost:8000/docs`

---

## n8n Automation Setup

1. Run n8n: `docker run -it --rm -p 5678:5678 docker.n8n.io/n8nio/n8n`
2. Import `n8n/workflow.json`
3. Add SMTP credentials (Gmail, SendGrid, etc.)
4. Activate the workflow
5. Set `N8N_WEBHOOK_URL=http://localhost:5678/webhook/broker-assignment` in `backend/.env`

Without n8n, assignments still get approved and broker workload still updates — only the email notification is skipped (the UI shows a warning).

---

## Running with Docker

```bash
# Copy and configure environment
cp backend/.env.example .env
# Edit .env and set GEMINI_API_KEY

docker-compose up --build
```

Services start at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- n8n: `http://localhost:5678`

---

## Human-in-the-Loop Design

AI is responsible for:
- Extracting structured data from unstructured documents
- Filtering eligible brokers by city, capacity, and availability
- Ranking and reasoning about broker suitability

The ops executive retains full control:
- Reviews and can edit the AI-extracted profile before proceeding
- Sees AI reasoning for each recommendation
- Must explicitly approve before any broker receives information
- Can override AI suggestions and select manually
- Sets the response deadline

No broker receives customer details without explicit human approval.
