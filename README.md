# QuickMove — AI Broker Allocation System
### Submission 2 — AI Ops Engineer Assignment

---

## Overview

QuickMove operations teams currently manage relocations through WhatsApp, Google Sheets, and spreadsheets. Every new request requires an ops executive to manually read customer requirements, search broker databases, contact brokers individually, and track responses — a process that is slow, repetitive, and does not scale.

This submission automates the **Broker Allocation** workflow within Phase 2 (Apartment Discovery and Shortlisting). The system accepts a customer requirement document, uses an LLM to extract structured data, filters and ranks eligible brokers using AI reasoning, presents recommendations to the ops executive for approval, and automatically notifies the assigned broker via email.

The design follows a **Human-in-the-Loop** approach. AI handles extraction, filtering, and ranking. The operations executive reviews every recommendation and must explicitly approve before any broker receives customer information.

Live deployment:
- Frontend: https://quickmove-theta.vercel.app
- Backend API: https://quickmove.onrender.com
- API Docs: https://quickmove.onrender.com/docs

---

## System Architecture

```mermaid
flowchart TD
    OPS[Operations Executive]
    BROKER[Property Broker]

    subgraph Frontend ["Frontend — Next.js on Vercel"]
        UPLOAD[Upload Page\n.docx upload and profile review]
        DASHBOARD[Dashboard\nRequests and Brokers tabs]
        RECPAGE[Recommendations Page\nAI scores and approve button]
        ASSIGNMENTS[Assignments Page\nStatus tracking]
    end

    subgraph Backend ["Backend — FastAPI on Render"]
        DOCPARSE[Document Parser\npython-docx]
        EXTRACT[Requirement Extraction\nGemini 2.5 Flash]
        FILTER[SQL Broker Filter\ncity, capacity, active status]
        RANKER[Broker Ranking\nGemini 2.5 Flash]
        APPROVER[Approval Handler\nassignment and workload update]
        EMAILSVC[Email Service\nResend HTTPS API]
    end

    subgraph Storage ["Storage — Neon PostgreSQL"]
        CUSTDB[(Customers)]
        BROKERDB[(Brokers)]
        ASSIGNDB[(Assignments)]
    end

    GEMINI[Gemini 2.5 Flash\nGoogle AI]
    RESEND[Resend\nHTTPS Email API]

    OPS --> UPLOAD
    UPLOAD -->|POST .docx| DOCPARSE
    DOCPARSE --> EXTRACT
    EXTRACT -->|structured profile| CUSTDB
    CUSTDB --> FILTER
    BROKERDB --> FILTER
    FILTER -->|eligible brokers| RANKER
    RANKER -->|top 3 with scores| RECPAGE
    OPS --> RECPAGE
    RECPAGE -->|approve| APPROVER
    APPROVER --> ASSIGNDB
    APPROVER --> BROKERDB
    APPROVER --> EMAILSVC
    EMAILSVC --> RESEND
    RESEND -->|assignment email| BROKER
    EXTRACT <-->|LLM call| GEMINI
    RANKER <-->|LLM call| GEMINI
    OPS --> DASHBOARD
    OPS --> ASSIGNMENTS
```

---

## Workflow

### Workflow 1 — Customer Requirement Extraction

The ops executive uploads a `.docx` file containing a customer relocation request. The backend extracts plain text using `python-docx` and passes it to Gemini 2.5 Flash with a structured prompt. The model returns a JSON object with fields including city, budget range, preferred localities, apartment type, furnished status, parking, pets, office location, move date, and special requirements. The extracted profile is saved to the database and displayed for the ops executive to review before proceeding.

### Workflow 2 — Broker Recommendation Engine

The system runs a two-stage matching process. In the first stage, a SQL query filters brokers by city match, active status, and available capacity. In the second stage, the filtered broker list and the full customer profile are sent to Gemini 2.5 Flash. The model evaluates each broker across locality coverage, budget compatibility, apartment type expertise, current workload ratio, average response time, and historical rating. It returns the top three brokers ranked by score out of 100, each with a plain-English reasoning explanation.

### Workflow 3 — Operations Approval

The recommendations page shows the ops executive the extracted customer profile alongside the three ranked broker cards. Each card displays the broker's score, rating, workload, budget range, covered regions, and AI reasoning. The executive enters their name and an optional response deadline, then clicks Approve. No broker receives any customer data without this explicit approval step.

### Workflow 4 — Automated Broker Notification

On approval, the backend updates the assignment status, increments the broker's active workload count, and sends an email to the broker via the Resend API over HTTPS. The email contains full customer requirements, the response deadline, and next-step instructions. The assignment status is updated to "notified" on successful delivery.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS | Operations dashboard UI |
| Backend | FastAPI, Python 3.11 | REST API and workflow orchestration |
| ORM | SQLAlchemy 2.0 | Database access layer |
| AI | Gemini 2.5 Flash via google-genai | Requirement extraction and broker ranking |
| Database | PostgreSQL via Neon | Persistent storage for customers, brokers, assignments |
| Email | Resend HTTPS API | Broker assignment notifications |
| Document Parsing | python-docx | Extract text from .docx customer requirement files |
| Validation | Pydantic v2 | Request and response schema enforcement |
| Frontend Hosting | Vercel | Automatic CI/CD from GitHub |
| Backend Hosting | Render (free tier) | Python web service deployment |
| Automation (optional) | n8n | Alternative webhook-based notification workflow |

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Gemini API key from `aistudio.google.com/app/apikey` (free tier is sufficient)

### Backend

```bash
cd submission2/backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env and set GEMINI_API_KEY
# Alternatively, set DEMO_MODE=true to skip the API key entirely

python seed_data.py             # Seeds 12 sample brokers across Bengaluru, Hyderabad, Mumbai, Pune
python create_sample_doc.py     # Generates sample_docs/arjun_mehta_requirement.docx for testing

uvicorn app.main:app --reload
# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### Frontend

```bash
cd submission2/frontend

npm install

cp .env.local.example .env.local
# Default value: NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# App available at http://localhost:3000
```

### Demo Mode

Set `DEMO_MODE=true` in `backend/.env` to run the full UI without a Gemini API key. All AI responses use hardcoded sample data so the complete workflow can be demonstrated without any external API calls.

---

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes (or DEMO_MODE=true) | Google AI Studio API key for Gemini 2.5 Flash |
| `DATABASE_URL` | No | Defaults to SQLite. Use a PostgreSQL connection string in production |
| `DEMO_MODE` | No | Set to `true` to bypass all AI calls with mock responses |
| `RESEND_API_KEY` | No | Resend API key for HTTPS email delivery |
| `RESEND_TEST_RECIPIENT` | No | Overrides all broker email recipients (required on Resend free tier without a domain) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS allowed origins. Defaults to localhost. Must include the Vercel URL in production |
| `SMTP_USER` | No | Gmail address for local SMTP. Does not work on Render free tier |
| `SMTP_PASSWORD` | No | 16-character Gmail App Password |

### Frontend (.env.local)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL. Use the Render service URL in production |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/customers/upload` | Upload .docx file and extract customer profile via Gemini |
| GET | `/customers` | List all customers ordered by creation date |
| GET | `/customers/{id}` | Get a single customer by ID |
| PATCH | `/customers/{id}` | Update an extracted customer profile |
| GET | `/customers/{id}/recommendations` | Get AI-ranked broker recommendations for a customer |
| GET | `/brokers` | List brokers with optional `?city=` filter |
| POST | `/brokers` | Create a new broker |
| PATCH | `/brokers/{id}` | Update broker fields including active/inactive toggle |
| POST | `/assignments` | Create a pending assignment record |
| GET | `/assignments` | List all assignments with status |
| POST | `/assignments/{id}/approve` | Approve assignment, update workload, and trigger email notification |
| POST | `/assignments/{id}/reject` | Reject a pending assignment |

---

## Deployment

### Database — Neon (free PostgreSQL)

Create a free project at `neon.tech`. No credit card required. Copy the connection string (format: `postgresql://user:pass@host/db?sslmode=require`) and set it as `DATABASE_URL` in Render.

### Backend — Render

- Root Directory: `submission2/backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `bash start.sh`
- Instance Type: Free

Environment variables to set in the Render dashboard:

| Key | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `GEMINI_API_KEY` | Google AI Studio key |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_TEST_RECIPIENT` | Your email (for testing without a verified domain) |
| `DEMO_MODE` | false |
| `ALLOWED_ORIGINS` | Vercel frontend URL |

### Frontend — Vercel

- Import the GitHub repository
- Root Directory: `submission2/frontend`
- Set `NEXT_PUBLIC_API_URL` to the Render service URL
- `NEXT_PUBLIC_` variables are embedded at build time in Next.js. Updating them requires a redeploy.

---

## Human-in-the-Loop Design

| Responsibility | Owner |
|---|---|
| Extracting structured data from unstructured documents | AI (Gemini) |
| Filtering brokers by city, capacity, and availability | System (SQL) |
| Scoring and ranking brokers with reasoning | AI (Gemini) |
| Generating broker notification email content | System (template) |
| Reviewing and editing the extracted customer profile | Ops Executive |
| Approving or rejecting broker recommendations | Ops Executive |
| Setting the broker response deadline | Ops Executive |
| Overriding AI selection with a manual broker choice | Ops Executive |

No broker receives customer information without an explicit approval action from an operations executive. Every AI recommendation includes a plain-English reasoning statement explaining the score.

---

## Known Limitations

### SMTP Email Does Not Work on Render Free Tier

During local development, Gmail SMTP on port 587 works correctly because the local machine can make outbound TCP connections to `smtp.gmail.com`. On Render's free tier, all outbound connections on ports 25, 465, and 587 are blocked at the infrastructure level. This is a deliberate restriction imposed by Render to prevent spam abuse from free-tier servers.

The same `smtplib` code that succeeds locally fails on Render with `[Errno 101] Network is unreachable` because the TCP handshake to the SMTP server never completes.

The solution is to use an email provider whose API communicates over HTTPS on port 443, which Render does not restrict. This project uses the Resend API (`api.resend.com`), which accepts email delivery requests as standard HTTPS POST requests. No SMTP connection is made.

### Resend Free Tier Requires Domain Verification for External Recipients

Resend's free tier without a verified sending domain restricts outbound email to the account's own registered email address. Any attempt to send to a different address returns HTTP 403 with the message: "You can only send testing emails to your own email address."

This restriction exists because Resend cannot confirm that a sender is authorised to send on behalf of a domain unless that domain's DNS records have been verified. Without this check, the service would be usable for sending unsolicited emails from arbitrary addresses.

The `RESEND_TEST_RECIPIENT` environment variable in this project works around this restriction by redirecting all notification emails to a single verified address. The email body includes the original intended broker email so the content can be confirmed during testing.

To remove this restriction and send directly to broker email addresses:

1. Go to `resend.com/domains` and add a custom domain
2. Add the DNS TXT, MX, and DKIM records provided by Resend to your domain registrar
3. Once verified, update `EMAIL_FROM` in the environment to `ops@yourdomain.com`
4. Remove `RESEND_TEST_RECIPIENT` from the Render environment variables

After domain verification, emails are delivered directly to any recipient with no restrictions.
