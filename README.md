# Lebanon Monitor Backend

Backend implementation for the Lebanon Monitor project.

This backend is designed to:

- Ingest fast **Telegram** signals and contextual **RSS** news
- Process them into structured **alerts** (warnings/strikes) and **news items**
- Stream updates to the frontend via **Supabase Realtime**

## Supabase Project

- **Project name**: RTLebMonitor
- **Project ID**: `kddkyisukkmgfqerebkn`

All database schema and Edge Functions in this repo are intended to be applied to this Supabase project.

## Supabase MCP Setup (Codex)

Use this script to reconfigure and re-login Supabase MCP for Codex:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-supabase-mcp.ps1
```

If your project ref changes:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-supabase-mcp.ps1 -ProjectRef "<new_project_ref>"
```

After login succeeds, restart your Codex session so MCP auth/config reloads.

## Components

- Supabase SQL migrations under `supabase/migrations`
- Supabase Edge Function for Telegram ingestion under `supabase/functions/ingest-telegram`
- Vercel-compatible API routes for cron processing and RSS ingestion under `api/`
- Telegram MTProto listener worker under `telegram-listener/`

## Local Run (Frontend + Backend)

Run both apps together:

```powershell
npm run dev:all
```

- Backend API: `http://localhost:3000`
- Frontend app: `http://localhost:3001`

Set frontend API target in `frontend/.env.local`:

```powershell
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Note: `frontend` reads env files from the `frontend/` folder (not the root `.env`).

See the architecture plan in `.cursor/plans/lebanon-monitor-backend-architecture_a04a790b.plan.md` for full system design.

## Frontend data contracts

- `incidents` (map layer):
  - `id` (uuid)
  - `alert_type` (`WARNING` | `STRIKE`)
  - `status` (`ACTIVE` | `EXPIRED`)
  - `severity` (integer)
  - `confidence` (numeric)
  - `location_name` (text)
  - `geo_point` (PostGIS point) — rendered as Leaflet marker
  - `geo_region` (PostGIS polygon, optional) — rendered as Leaflet polygon
  - `started_at`, `last_update_at`, `expires_at` (timestamps)

- `news_items` (feed):
  - `id` (uuid)
  - `source` (`TELEGRAM` | `RSS`)
  - `source_ref` (text, dedupe key)
  - `title` (optional)
  - `summary` (short text for display)
  - `body` (optional long text)
  - `language` (text)
  - `location_name` (optional text)
  - `alert_type` (optional `WARNING` | `STRIKE`)
  - `incident_id` (optional uuid link to `incidents`)
  - `published_at` (timestamp)


