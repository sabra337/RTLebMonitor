-- News display: category (Lebanon / Regional / Worldwide), source label, English translation
alter table public.news_items
  add column if not exists category text,
  add column if not exists source_label text,
  add column if not exists title_en text,
  add column if not exists summary_en text;

create index if not exists idx_news_items_category on public.news_items (category) where category is not null;

-- Backfill source_label for existing RSS items from rss_sources
update public.news_items ni
set source_label = rs.name
from public.rss_inbox ri
join public.rss_sources rs on rs.id = ri.source_id
where ni.source = 'RSS'
  and (ni.source_ref = ri.guid or ni.source_ref = ri.link)
  and (ni.source_label is null or ni.source_label = '');

-- Default category for rows that don't have it
update public.news_items set category = 'WORLDWIDE' where category is null;
