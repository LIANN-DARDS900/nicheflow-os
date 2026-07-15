alter table public.topics
  add column if not exists raw_item_id uuid references public.raw_items(id) on delete set null;

alter table public.topics
  add constraint topics_raw_item_id_key unique (raw_item_id);

create index if not exists topics_workspace_score_idx
  on public.topics(workspace_id, relevance_score desc, created_at desc);
