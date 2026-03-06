-- Enable RLS and basic policies for public access patterns

-- Internal tables: no public access
alter table if exists public.telegram_inbox enable row level security;
alter table if exists public.rss_inbox enable row level security;
alter table if exists public.incident_messages enable row level security;

-- Frontend-facing tables: read-only for anon
alter table if exists public.incidents enable row level security;
alter table if exists public.news_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'incidents' and policyname = 'Anon select active incidents'
  ) then
    create policy "Anon select active incidents"
      on public.incidents
      for select
      to anon
      using (status != 'EXPIRED');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'news_items' and policyname = 'Anon select news items'
  ) then
    create policy "Anon select news items"
      on public.news_items
      for select
      to anon
      using (true);
  end if;
end
$$;

