# Application Workflow Tracker

## Quick Start (Docker)

```bash
git clone https://github.com/MartinMurithi/Application-Workflow-Tracker
cd app-workflow-tracker
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **API Docs (Swagger)**: http://localhost:8000/api/docs

Migrations run automatically on backend startup. No manual steps needed.

---

## Manual Setup (without Docker)

### Backend

```bash
cd backend

## Create a virtual environment
Windows: python -m venv .venv
macOS / Linux: python3 -m venv .venv

## Activate the environment
Windows (Command Prompt): .venv\Scripts\activate
Windows (PowerShell): .\.venv\Scripts\Activate.ps1
macOS / Linux source: .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your local DB credentials

python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit VITE_API_URL if needed
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | (dev value) | Django secret key. Change in production. |
| `DEBUG` | `True` | Django debug mode |
| `ALLOWED_HOSTS` | `localhost,...` | Comma-separated allowed hostnames |
| `DB_NAME` | `apptracker` | PostgreSQL database name |
| `DB_USER` | `apptracker` | PostgreSQL user |
| `DB_PASSWORD` | `apptracker` | PostgreSQL password |
| `DB_HOST` | `db` | PostgreSQL host (`db` for Docker, `localhost` for local) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated allowed CORS origins |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | Base URL for the API. Use `http://localhost:8000/api` for local dev without proxy. |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Backend framework | Django 5 |
| API layer | Django Ninja (OpenAPI/Swagger built-in) |
| Database | PostgreSQL 16 |
| Frontend | React 18 + Vite |
| Styling | TailwindCSS 3 |
| Infra | Docker + Docker Compose |

---

## Role Handling

**Design decision: `X-Role` header approach**

This project uses a simple `X-Role: applicant | reviewer` HTTP header to differentiate roles, rather than a full authentication system.

**Why this approach:**

- The header approach keeps the codebase lean — reviewers can be simulated by changing one header
- In a real system, this header would be set by an upstream auth gateway (e.g. after JWT validation), not by the client
- It maps cleanly to Django Ninja's request inspection without any middleware overhead

**In the frontend**, role is stored in `localStorage` and toggled via the UI switcher in the top nav. This simulates switching between an applicant and a reviewer session.

**In the backend**, every request inspects `request.headers.get("X-Role", "applicant")`. Reviewer-only endpoints (start review, decision) return `403` if the role is not `reviewer`.

---

## Workflow State Machine

```
DRAFT
  │
  ▼ (applicant: submit)
SUBMITTED
  │
  ▼ (reviewer: start-review)
UNDER REVIEW
  ├──▶ APPROVED       (immutable)
  ├──▶ REJECTED       (immutable)
  └──▶ NEED MORE INFO
           │
           ▼ (applicant: edit + resubmit)
        SUBMITTED  (loops back)
```

All transitions are enforced **server-side** in `applications/services.py`. The frontend reflects available actions based on status but cannot bypass server validation.

---

## API Reference

The full interactive API is available at `http://localhost:8000/api/docs` (Swagger UI via Django Ninja).

### Applicant Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/applications` | Create a draft application |
| `GET` | `/api/applications` | List all applications |
| `GET` | `/api/applications/{id}` | Get single application |
| `PUT` | `/api/applications/{id}` | Edit draft or need-more-info |
| `POST` | `/api/applications/{id}/submit` | Submit a draft |
| `POST` | `/api/applications/{id}/resubmit` | Resubmit after more info |

### Reviewer Endpoints (require `X-Role: reviewer`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/applications/{id}/start-review` | Move submitted → under review |
| `POST` | `/api/applications/{id}/decision` | Approve / reject / request more info |

**Decision payload:**
```json
{
  "decision": "approved | rejected | need_more_info",
  "comment": "Required if rejected or need_more_info"
}
```

---

## Project Structure

```
app-workflow-tracker/
├── backend/
│   ├── core/                    # Django project (settings, urls, wsgi, middleware)
│   ├── applications/
│   │   ├── models.py            # Application model + enums + state machine helpers
│   │   ├── services.py          # Business logic / workflow enforcement
│   │   ├── schemas.py           # Django Ninja request/response schemas
│   │   ├── api.py               # API endpoints (thin layer, delegates to services)
│   │   └── migrations/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── entrypoint.sh            # DB wait + migrate + gunicorn
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Fetch wrapper with role header
│   │   ├── hooks/useRole.jsx    # Role context (localStorage + React context)
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Top nav, role switcher
│   │   │   └── StatusBadge.jsx  # Colored status pill
│   │   ├── pages/
│   │   │   ├── ApplicationList.jsx    # Table view with search/filter
│   │   │   ├── ApplicationForm.jsx    # Create + edit form (shared)
│   │   │   └── ApplicationDetail.jsx  # Detail + workflow action panel
│   │   └── utils/status.js      # Color maps, formatters
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Design Decisions

1. **Service layer over fat models / fat views**: Business logic lives in `ApplicationService` (stateless class methods). Models remain pure Django ORM. API endpoints are thin dispatchers.

2. **Django Ninja over DRF**: Ninja provides native Pydantic schemas, OpenAPI docs, and a cleaner async-ready API surface — less boilerplate than DRF serializers for this scope.

3. **No `contrib.auth`**: Removed Django's full auth stack since we're not using sessions or the admin. Reduces installed apps and migration surface.

4. **Custom CORS middleware**: No third-party package needed for a simple `Access-Control-Allow-Origin: *` development setup.

5. **`tracking_number` generation**: Uses `APP-{YEAR}-{6-char-alphanum}` format, generated at model save time with a uniqueness retry loop. Simple and human-readable.

---

## What I'd Improve With More Time

- **Real authentication**: JWT-based auth with separate User model, role assigned to user record, not header
- **Pagination**: `/applications` endpoint should return paginated results with cursor or page-based pagination
- **Filtering at API level**: Push status/search filters to the database query rather than client-side
- **Test suite**: Unit tests for `ApplicationService` (workflow edge cases), integration tests for all API endpoints
- **Frontend error boundary**: Global React error boundary with proper fallback UI
