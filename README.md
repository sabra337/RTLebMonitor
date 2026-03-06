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

## Components

- Supabase SQL migrations under `supabase/migrations`
- Supabase Edge Function for Telegram ingestion under `supabase/functions/ingest-telegram`
- Vercel-compatible API routes for cron processing and RSS ingestion under `api/`
- Telegram MTProto listener worker under `telegram-listener/`

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


