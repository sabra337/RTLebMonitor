-- Arabic display fields and queue-friendly index for translation jobs
alter table public.news_items
  add column if not exists title_ar text,
  add column if not exists summary_ar text;

create index if not exists idx_news_items_pending_ar_translation
  on public.news_items (published_at desc)
  where title_ar is null or summary_ar is null;
