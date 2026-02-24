# Research Pilot — Full Deployment Guide

This document covers everything needed to deploy **Research Pilot** from scratch to production
using **Vercel** (frontend) and **Railway** (backend + PostgreSQL + Redis).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Google OAuth Setup](#3-google-oauth-setup)
4. [Vercel Deployment (Frontend)](#4-vercel-deployment-frontend)
5. [Railway Deployment (Backend)](#5-railway-deployment-backend)
6. [Wire Vercel ↔ Railway Together](#6-wire-vercel--railway-together)
7. [Database Migrations (Alembic)](#7-database-migrations-alembic)
8. [Grant Admin Access](#8-grant-admin-access)
9. [Optional: PostHog Analytics](#9-optional-posthog-analytics)
10. [Optional: Sentry Error Tracking](#10-optional-sentry-error-tracking)
11. [Environment Variable Reference](#11-environment-variable-reference)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| Docker | any | https://docker.com (for local DB/Redis) |
| Git | any | https://git-scm.com |
| Railway CLI | latest | `npm install -g @railway/cli` |
| Vercel CLI | latest | `npm install -g vercel` |

You need **at least one** LLM API key:
- [OpenAI](https://platform.openai.com/api-keys) — `sk-...`
- [Google Gemini](https://aistudio.google.com/app/apikey) — `AIza...`
- [Mistral](https://console.mistral.ai/) — recommended
- [Groq](https://console.groq.com/keys) — fastest, free tier available

---

## 2. Local Development Setup

### 2.1 Clone & bootstrap

```bash
git clone https://github.com/Ryz3nPlayZ/researchstaging.git
cd researchstaging
./setup.sh            # creates .venv, installs backend deps, copies .env.template → .env
```

### 2.2 Configure backend environment

Edit `backend/.env` and fill in at minimum:

```dotenv
DATABASE_URL=postgresql+asyncpg://research_user:research_pass@localhost:5432/research_pilot
REDIS_URL=redis://localhost:6379/0

# At least one LLM key
OPENAI_API_KEY=sk-...
# OR
GEMINI_API_KEY=AIza...

ENVIRONMENT=development
JWT_SECRET_KEY=dev-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000
```

### 2.3 Start local services

```bash
./docker-start.sh     # starts PostgreSQL + Redis via Docker
./run-all.sh          # starts backend (:8000) + frontend (:3000)
```

> On first run, `run-all.sh` automatically runs `alembic upgrade head` and installs all npm deps.

### 2.4 Enable dev auth (optional, no Google needed locally)

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_DEV_AUTH=true
NEXT_PUBLIC_API_URL=http://localhost:8000
```

With `NEXT_PUBLIC_DEV_AUTH=true` the login page shows an email/name form — no Google OAuth
required for local testing.

---

## 3. Google OAuth Setup

You need this for production. Skip for local dev if using `NEXT_PUBLIC_DEV_AUTH=true`.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or use an existing one)
3. **APIs & Services → OAuth consent screen**
   - User type: External
   - App name: Research Pilot (or your name)
   - Scopes: add `email`, `profile`, `openid`
4. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorised redirect URIs — add **both**:
     ```
     http://localhost:3000/auth/callback
     https://YOUR_VERCEL_URL/auth/callback
     ```
     (Replace `YOUR_VERCEL_URL` once Vercel is deployed — e.g. `researchstaging.vercel.app`)
5. Copy the **Client ID** and **Client Secret** — you'll need them in Railway env vars.

---

## 4. Vercel Deployment (Frontend)

### 4.1 Import repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `Ryz3nPlayZ/researchstaging`
3. **Framework Preset**: Next.js (auto-detected)
4. **Root Directory**: `frontend`
5. **Install Command**: leave blank (`.npmrc` handles `--legacy-peer-deps` automatically)
6. **Build Command**: `npm run build` (default)
7. **Output Directory**: leave blank (standalone is configured in `next.config.ts`)

### 4.2 Environment variables (Vercel)

Add these on the Vercel project **Settings → Environment Variables** screen:

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | Required even without PostHog key |
| `NEXT_PUBLIC_API_URL` | `https://YOUR_RAILWAY_URL` | Add **after** Railway is deployed |
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` | Add after PostHog account created |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://...@sentry.io/...` | Add after Sentry project created |

> **Do not add** `NEXT_PUBLIC_DEV_AUTH` to Vercel — its absence means real Google OAuth is used.

### 4.3 Deploy

Click **Deploy**. First deploy takes ~2-3 minutes.

Note the assigned URL: `https://researchstaging.vercel.app` (or similar).

---

## 5. Railway Deployment (Backend)

### 5.1 Create Railway project

```bash
railway login
railway init   # creates new project, give it a name e.g. "research-pilot"
```

Or create at [railway.app/new](https://railway.app/new) and link via CLI.

### 5.2 Add database plugins

In the Railway dashboard for your project:
- Click **+ New** → **Database** → **PostgreSQL**  
  → Railway auto-sets `DATABASE_URL` env var
- Click **+ New** → **Database** → **Redis**  
  → Railway auto-sets `REDIS_URL` env var

### 5.3 Set all backend environment variables

```bash
# Core
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO
railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)

# CORS — must include your Vercel URL
railway variables set CORS_ORIGINS=https://researchstaging.vercel.app

# Google OAuth
railway variables set GOOGLE_CLIENT_ID=your_client_id_here
railway variables set GOOGLE_CLIENT_SECRET=your_client_secret_here
railway variables set GOOGLE_REDIRECT_URI=https://researchstaging.vercel.app/auth/callback

# LLM providers (add whichever you have)
railway variables set OPENAI_API_KEY=sk-...
railway variables set GEMINI_API_KEY=AIza...
railway variables set MISTRAL_API_KEY=...
railway variables set GROQ_API_KEY=gsk_...
railway variables set OPENROUTER_API_KEY=sk-or-...

# LLM model config
railway variables set OPENAI_MODEL=gpt-4.1-mini
railway variables set GEMINI_MODEL_PRIMARY=gemini-2.5-flash
railway variables set GEMINI_MODEL_FALLBACK_1=gemini-2.5-flash-lite
railway variables set GEMINI_MODEL_FALLBACK_2=gemini-3.0-flash-preview
railway variables set MISTRAL_MODEL=mistral-large-3
railway variables set GROQ_MODEL=llama-3.3-70b-versatile

# Literature APIs
railway variables set SEMANTIC_SCHOLAR_API_KEY=...
railway variables set UNPAYWALL_EMAIL=your@email.com
railway variables set OPENALEX_API_KEY=...
railway variables set CORE_API_KEY=...
railway variables set SPRINGER_NATURE_API_KEY=...

# Optional: Sentry backend DSN
railway variables set SENTRY_DSN=https://...@sentry.io/...
```

> **DATABASE_URL** and **REDIS_URL** are automatically set by the Railway plugins — do not override them.

### 5.4 Deploy backend

```bash
railway up
```

Railway reads `railway.toml` which:
- Builds `backend/Dockerfile`
- Runs `alembic upgrade head && uvicorn server:app --host 0.0.0.0 --port $PORT` on start

After deploy, note the generated Railway URL:  
`https://research-pilot-production.up.railway.app` (example)

---

## 6. Wire Vercel ↔ Railway Together

Now that both are deployed, connect them:

### 6.1 Add Railway URL to Vercel

In Vercel **Settings → Environment Variables**:
```
NEXT_PUBLIC_API_URL = https://YOUR_RAILWAY_URL
```

Then trigger a redeploy: **Deployments → ⋯ → Redeploy**.

### 6.2 Confirm Google redirect URI

In Google Cloud Console, make sure your OAuth credential includes:
```
https://YOUR_VERCEL_URL/auth/callback
```

Verify on Railway:
```bash
railway variables set GOOGLE_REDIRECT_URI=https://YOUR_VERCEL_URL/auth/callback
```

### 6.3 Test the full auth flow

1. Visit `https://YOUR_VERCEL_URL/login`
2. Click "Continue with Google"
3. Complete OAuth — should redirect to `/onboarding` (first login) or `/dashboard`

---

## 7. Database Migrations (Alembic)

### 7.1 Generate the initial migration (do this once locally)

```bash
cd backend
source ../.venv/bin/activate

# Point alembic at your local DB
alembic revision --autogenerate -m "initial_schema"

# Review the generated file in backend/alembic/versions/
# Commit it to git
git add alembic/versions/
git commit -m "chore: add initial alembic migration"
git push staging main
```

After pushing, Railway will automatically run `alembic upgrade head` on next deploy.

### 7.2 Future schema changes

```bash
# After modifying any model in backend/database/models.py
alembic revision --autogenerate -m "describe your change"
# Review → commit → push → Railway applies automatically
```

### 7.3 Run migrations manually against production DB

```bash
DATABASE_URL=postgresql+asyncpg://... alembic upgrade head
```

Or via Railway:
```bash
railway run alembic upgrade head
```

---

## 8. Grant Admin Access

After the first user logs in (creates their account), grant them admin:

```bash
# Locally (adjust to your venv path)
.venv/bin/python backend/scripts/make_admin.py user@example.com

# Or via Railway
railway run python backend/scripts/make_admin.py user@example.com
```

The admin dashboard is then accessible at `/admin`.

---

## 9. Optional: PostHog Analytics

1. Create account at [posthog.com](https://posthog.com) (free tier available)
2. Create a project → copy the **Project API Key** (`phc_...`)
3. Add to Vercel env vars:
   ```
   NEXT_PUBLIC_POSTHOG_KEY = phc_...
   NEXT_PUBLIC_POSTHOG_HOST = https://us.i.posthog.com
   ```
4. Redeploy Vercel.

Events automatically tracked:
- `user_signed_up` — first login
- `user_signed_in` — subsequent logins
- `onboarding_completed` — finished onboarding flow

---

## 10. Optional: Sentry Error Tracking

1. Create account at [sentry.io](https://sentry.io) (free tier available)
2. Create **two projects**: one **Next.js**, one **Python**

**Frontend DSN** (Next.js project):
```
NEXT_PUBLIC_SENTRY_DSN = https://...@sentry.io/...   # → Vercel
```

**Backend DSN** (Python project):
```
SENTRY_DSN = https://...@sentry.io/...               # → Railway
```

Redeploy both after adding these vars.

---

## 11. Environment Variable Reference

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ prod | Railway backend URL |
| `NEXT_PUBLIC_POSTHOG_HOST` | ✅ | `https://us.i.posthog.com` |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional | PostHog project key |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | Sentry frontend DSN |
| `NEXT_PUBLIC_DEV_AUTH` | dev only | `true` enables mock login |

### Backend (Railway)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ auto | Set by Railway Postgres plugin |
| `REDIS_URL` | ✅ auto | Set by Railway Redis plugin |
| `ENVIRONMENT` | ✅ | `production` |
| `JWT_SECRET_KEY` | ✅ | Random 32-byte hex secret |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed origins |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | ✅ | `https://YOUR_VERCEL_URL/auth/callback` |
| `OPENAI_API_KEY` | one required | OpenAI key |
| `GEMINI_API_KEY` | one required | Gemini key |
| `MISTRAL_API_KEY` | one required | Mistral key |
| `GROQ_API_KEY` | one required | Groq key |
| `OPENAI_MODEL` | recommended | `gpt-4.1-mini` |
| `GEMINI_MODEL_PRIMARY` | recommended | `gemini-2.5-flash` |
| `GEMINI_MODEL_FALLBACK_1` | recommended | `gemini-2.5-flash-lite` |
| `GEMINI_MODEL_FALLBACK_2` | recommended | `gemini-3.0-flash-preview` |
| `MISTRAL_MODEL` | recommended | `mistral-large-3` |
| `GROQ_MODEL` | recommended | `llama-3.3-70b-versatile` |
| `SEMANTIC_SCHOLAR_API_KEY` | optional | Literature search |
| `UNPAYWALL_EMAIL` | optional | PDF access |
| `OPENALEX_API_KEY` | optional | Literature search |
| `CORE_API_KEY` | optional | Literature search |
| `SPRINGER_NATURE_API_KEY` | optional | Literature search |
| `SENTRY_DSN` | optional | Sentry backend DSN |
| `LOG_LEVEL` | optional | `INFO` (default) |
| `MAX_TASK_RETRIES` | optional | `3` (default) |

---

## 12. Troubleshooting

### Vercel build fails with ERESOLVE (peer deps)

A `.npmrc` file in `frontend/` sets `legacy-peer-deps=true` automatically.
If you still see this error, verify that `.npmrc` is committed to the repo.

### "Cannot connect to backend" on frontend

- Confirm `NEXT_PUBLIC_API_URL` is set in Vercel and points to the correct Railway URL (no trailing slash)
- Check that `CORS_ORIGINS` on Railway includes your Vercel URL exactly

### Google OAuth "redirect_uri_mismatch"

The redirect URI in Google Cloud Console must **exactly** match `GOOGLE_REDIRECT_URI` on Railway,
including `https://` and `/auth/callback` (no trailing slash).

### Tasks stuck in RUNNING state

1. Check Railway logs: `railway logs`
2. Verify Redis is running: Railway dashboard → Redis plugin → Metrics
3. Inspect stuck tasks:
   ```sql
   SELECT id, status, task_type FROM tasks WHERE status = 'RUNNING';
   ```

### Database connection refused on Railway

Railway auto-injects `DATABASE_URL` with the internal URL when using the Postgres plugin.
Do not override `DATABASE_URL` manually in Railway env vars.

### Alembic "Target database is not up to date"

```bash
railway run alembic upgrade head
```

### Admin dashboard returns 403

The logged-in user does not have `is_admin=true`. Run:
```bash
railway run python backend/scripts/make_admin.py your@email.com
```

### Port conflicts locally

```bash
# Kill backend (port 8000)
lsof -ti:8000 | xargs kill -9

# Kill frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

### Reset local database (⚠ deletes all data)

```bash
sudo -u postgres psql -c "DROP DATABASE research_pilot;"
sudo -u postgres psql -c "CREATE DATABASE research_pilot;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE research_pilot TO research_user;"
# Restart backend — tables are auto-created in development mode
```
