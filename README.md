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

```
## Tech Stack

| Layer | Choice |
|---|---|
| Backend framework | Django |
| API layer | Django Ninja (OpenAPI/Swagger built-in) |
| Database | PostgreSQL |
| Frontend | React + Vite |
| Styling | TailwindCSS 3 |
| Infra | Docker + Docker Compose |

---

## Role Handling

**Design decision: `X-Role` header approach**

The project uses a simple `X-Role: applicant | reviewer` HTTP header to differentiate roles, rather than a full authentication system.

**In the frontend**, role is stored in `localStorage` and toggled via the UI switcher in the top nav. This simulates switching between an applicant and a reviewer session.

**In the backend**, every request inspects `request.headers.get("X-Role", "applicant")`. Reviewer-only endpoints (start review, decision) return `403` if the role is not `reviewer`.

All transitions are enforced **server-side** in `applications/services.py`. The frontend reflects available actions based on status but cannot bypass server validation.

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
- **Email notifications**: Send emails on submission confirmation, decision, and more-info requests
- **Test suite**: Unit tests for `ApplicationService` (workflow edge cases), integration tests for all API endpoints
- **Optimistic UI updates**: Update local state immediately on action, revert on failure
