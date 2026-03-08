-- Lock down internal operational tables from API roles.
-- Backend and Edge Functions use the service role, so they bypass these policies.

alter table if exists public.locations enable row level security;
alter table if exists public.rss_sources enable row level security;
alter table if exists public.alert_keywords enable row level security;

revoke all privileges on table public.telegram_inbox from public, anon, authenticated;
revoke all privileges on table public.rss_inbox from public, anon, authenticated;
revoke all privileges on table public.incident_messages from public, anon, authenticated;
revoke all privileges on table public.locations from public, anon, authenticated;
revoke all privileges on table public.rss_sources from public, anon, authenticated;
revoke all privileges on table public.alert_keywords from public, anon, authenticated;
