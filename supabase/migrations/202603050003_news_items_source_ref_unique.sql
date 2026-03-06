-- Allow upsert on news_items by (source, source_ref) for idempotent RSS ingest
-- Remove duplicates first (keep newest by published_at)
delete from public.news_items
where id in (
  select id from (
    select id, row_number() over (partition by source, source_ref order by published_at desc nulls last) as rn
    from public.news_items
  ) t
  where t.rn > 1
);

alter table public.news_items
  add constraint news_items_source_source_ref_key unique (source, source_ref);
