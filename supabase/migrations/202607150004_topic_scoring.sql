alter table public.topics
  add column if not exists raw_item_id uuid references public.raw_items(id) on delete set null;

create unique index if not exists topics_raw_item_unique
  on public.topics(raw_item_id)
  where raw_item_id is not null;

create index if not exists topics_workspace_score_idx
  on public.topics(workspace_id, relevance_score desc, created_at desc);
