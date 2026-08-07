# Nivaran — Community Redressal Planner

Nivaran is a local-first, multilingual civic grievance workflow for the synthetic Samanvay Nagar municipality. It preserves resident reports while making AI-assisted triage, human review, routing, SLA escalation, and auditability visible end to end.

## Run locally

1. Copy `.env.example` to `.env`, set a strong `JWT_SECRET`, and provide `OPENAI_API_KEY` for complaint triage/assistant plus `SARVAM_API_KEY` for Indic voice translation.
2. Run `docker compose up --build`.
3. Open `http://localhost:3000` and use the seeded demo accounts shown on the login page.

Without OpenAI credentials, complaints remain persisted and enter an honest manual-review state. Without Sarvam credentials, typed reporting remains available and voice returns a clear unavailable response.

For development without Docker, the API automatically uses `data/nivaran.db` and creates/seeds it on startup:

```powershell
cd apps/api
python -m uvicorn app.main:app --reload --port 8000
```

Run `python -m app.worker` in a second terminal for AI triage and SLA processing, then run `pnpm dev` from `apps/web`. Docker Compose continues to use PostgreSQL with pgvector.

The stack starts PostgreSQL with pgvector, the FastAPI service, a persistent database-backed worker/SLA evaluator, and the standalone Next.js application. API documentation is available at `http://localhost:8000/docs`; readiness is exposed at `http://localhost:8000/ready`.

## Product walkthrough

Use the seeded complaint `NVR-26-104827` with tracking PIN `4827`. The reviewer workspace shows the privacy-safe multilingual report, duplicate cluster, route factors, and human override boundary. Assign Water Supply as primary and Roads & Public Works as supporting, then use the admin escalation screen to run a controlled breach through the same SLA evaluator used by the worker. The resident timeline, notifications, audit log, analytics, and reproducible evaluation view all read persisted workflow data when the API is running.

`/lite` is text-first and excludes map and analytics dependencies. The SMS simulator has been removed; telecom delivery can be added later through a real adapter. The resident workspace includes manual intake and a session-memory assistant limited to filing complaints. GPS and map selections are reverse-geocoded into readable, editable addresses.

## Verification

From `apps/api`, run `pytest -q`. From `apps/web`, run `pnpm lint`, `pnpm test`, and `pnpm build`. Regenerate the TypeScript API contract with `pnpm types:api` from `apps/web` after changing FastAPI routes or schemas.

## Demo accounts

See [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md) for every role and department login.

All municipality, ward, department, SLA, complaint, and evaluation records are synthetic.
