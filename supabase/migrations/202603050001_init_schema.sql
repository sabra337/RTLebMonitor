-- Lebanon Monitor initial schema for RTLebMonitor (kddkyisukkmgfqerebkn)

-- Ensure required extensions exist
create extension if not exists postgis;
create extension if not exists pg_trgm;

-- ============================================================================
-- Enums
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'alert_type') then
    create type alert_type as enum ('WARNING', 'STRIKE');
  end if;

  if not exists (select 1 from pg_type where typname = 'incident_status') then
    create type incident_status as enum ('ACTIVE', 'EXPIRED');
  end if;

  if not exists (select 1 from pg_type where typname = 'processing_status') then
    create type processing_status as enum ('PENDING', 'PROCESSED', 'INVALID', 'ERROR');
  end if;

  if not exists (select 1 from pg_type where typname = 'news_source') then
    create type news_source as enum ('TELEGRAM', 'RSS');
  end if;

  if not exists (select 1 from pg_type where typname = 'alert_keyword_kind') then
    create type alert_keyword_kind as enum ('WARNING', 'STRIKE', 'NEWS_ONLY');
  end if;
end
$$;

-- ============================================================================
-- Raw Telegram inbox
-- ============================================================================

create table if not exists public.telegram_inbox (
  id                bigserial primary key,
  created_at        timestamptz not null default now(),

  source            text not null default 'telegram',
  chat_id           text not null,
  message_id        bigint not null,
  date_utc          timestamptz not null,

  text_ar           text not null,
  text_en           text,

  dedupe_id         text not null,

  forwarded_from    text,
  media_flags       jsonb,
  channel_name      text,

  processing_status processing_status not null default 'PENDING',
  processing_error  text,
  processed_at      timestamptz,

  incident_id       uuid
);

alter table public.telegram_inbox
  add constraint telegram_inbox_dedupe_unique unique (dedupe_id);

create index if not exists idx_telegram_inbox_processing_status_date
  on public.telegram_inbox (processing_status, date_utc);

-- ============================================================================
-- Locations gazetteer
-- ============================================================================

create table if not exists public.locations (
  id           uuid primary key default gen_random_uuid(),
  name_primary text not null,
  name_ar      text,
  name_en      text,
  alt_names    text[] default '{}',
  kind         text not null, -- e.g. TOWN, VILLAGE, DISTRICT, LANDMARK

  point        geography(Point, 4326) not null,
  region_bbox  geography(Polygon, 4326)
);

create index if not exists idx_locations_name_ar on public.locations using gin (name_ar gin_trgm_ops);
create index if not exists idx_locations_name_en on public.locations using gin (name_en gin_trgm_ops);
create index if not exists idx_locations_point on public.locations using gist (point);

-- ============================================================================
-- Incidents / Alerts
-- ============================================================================

create table if not exists public.incidents (
  id             uuid primary key default gen_random_uuid(),

  alert_type     alert_type not null,
  incident_key   text not null,

  location_id    uuid not null references public.locations(id) on delete restrict,
  location_name  text not null,

  started_at     timestamptz not null,
  last_update_at timestamptz not null,
  expires_at     timestamptz not null,

  severity       integer not null,
  confidence     numeric(3,2) not null,
  status         incident_status not null default 'ACTIVE',

  geo_point      geography(Point, 4326) not null,
  geo_region     geography(Polygon, 4326)
);

alter table public.incidents
  add constraint incidents_incident_key_unique unique (incident_key);

create index if not exists idx_incidents_status_expires_at
  on public.incidents (status, expires_at);

create index if not exists idx_incidents_geo_point
  on public.incidents using gist (geo_point);

-- Link between raw messages and incidents

create table if not exists public.incident_messages (
  id                 bigserial primary key,
  incident_id        uuid not null references public.incidents(id) on delete cascade,
  telegram_message_id bigint not null references public.telegram_inbox(id) on delete cascade,
  role               text not null default 'FOLLOWUP' -- PRIMARY / FOLLOWUP
);

create index if not exists idx_incident_messages_incident_id
  on public.incident_messages (incident_id);

create index if not exists idx_incident_messages_telegram_message_id
  on public.incident_messages (telegram_message_id);

-- ============================================================================
-- RSS sources and inbox
-- ============================================================================

create table if not exists public.rss_sources (
  id        bigserial primary key,
  name      text not null,
  url       text not null unique,
  language  text,
  enabled   boolean not null default true
);

create table if not exists public.rss_inbox (
  id           bigserial primary key,
  source_id    bigint not null references public.rss_sources(id) on delete cascade,

  guid         text,
  link         text not null,
  title        text,
  summary      text,
  body         text,
  published_at timestamptz,
  language     text,
  raw          jsonb
);

create unique index if not exists rss_inbox_source_guid_link_unique
  on public.rss_inbox (source_id, coalesce(guid, link));

create index if not exists idx_rss_inbox_published_at
  on public.rss_inbox (published_at);

-- ============================================================================
-- News items (frontend-visible)
-- ============================================================================

create table if not exists public.news_items (
  id            uuid primary key default gen_random_uuid(),

  source        news_source not null,
  source_ref    text not null,

  title         text,
  summary       text not null,
  body          text,

  language      text,
  location_name text,

  alert_type    alert_type,
  incident_id   uuid references public.incidents(id) on delete set null,

  published_at  timestamptz not null default now()
);

create index if not exists idx_news_items_published_at
  on public.news_items (published_at desc);

create index if not exists idx_news_items_source
  on public.news_items (source);

create index if not exists idx_news_items_incident_id
  on public.news_items (incident_id);

-- ============================================================================
-- Alert keywords configuration
-- ============================================================================

create table if not exists public.alert_keywords (
  id       bigserial primary key,
  kind     alert_keyword_kind not null,
  language text not null, -- 'ar', 'en', etc.
  keyword  text not null,
  weight   numeric(4,2) not null default 1.0
);

create index if not exists idx_alert_keywords_kind_language
  on public.alert_keywords (kind, language);

