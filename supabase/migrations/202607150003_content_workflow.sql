create type public.raw_item_status as enum ('discovered', 'normalized', 'duplicate', 'scored', 'rejected', 'promoted');
create type public.brief_status as enum ('draft', 'ready', 'archived');
create type public.document_status as enum ('brief', 'draft', 'review', 'changes_requested', 'approved', 'scheduled', 'published', 'archived');
create type public.approval_status as enum ('pending', 'approved', 'changes_requested', 'cancelled');
create type public.workflow_run_status as enum ('queued', 'running', 'completed', 'failed', 'cancelled');

alter table public.sources
  add column if not exists domain text,
  add column if not exists coverage_pillar text,
  add column if not exists fetch_interval_minutes integer not null default 360 check (fetch_interval_minutes between 15 and 10080),
  add column if not exists last_fetched_at timestamptz,
  add column if not exists last_success_at timestamptz,
  add column if not exists last_error text,
  add column if not exists item_count integer not null default 0 check (item_count >= 0),
  add column if not exists updated_at timestamptz not null default now();

alter table public.topics
  add column if not exists source_id uuid references public.sources(id) on delete set null,
  add column if not exists freshness_score smallint check (freshness_score between 0 and 100),
  add column if not exists authority_score smallint check (authority_score between 0 and 100),
  add column if not exists rationale jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table public.raw_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  external_id text not null,
  title text not null,
  url text not null,
  summary text not null default '',
  author text,
  published_at timestamptz,
  content_hash text,
  status public.raw_item_status not null default 'discovered',
  normalized_payload jsonb not null default '{}'::jsonb,
  discovered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create unique index raw_items_source_url_unique on public.raw_items(source_id, url);
create index raw_items_workspace_status_idx on public.raw_items(workspace_id, status, discovered_at desc);
create index raw_items_source_published_idx on public.raw_items(source_id, published_at desc);

create table public.content_briefs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  objective text not null default '',
  audience text not null default '',
  primary_keyword text not null default '',
  secondary_keywords text[] not null default '{}',
  search_intent text not null default 'informational',
  outline jsonb not null default '[]'::jsonb,
  source_references jsonb not null default '[]'::jsonb,
  status public.brief_status not null default 'draft',
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_briefs_workspace_status_idx on public.content_briefs(workspace_id, status, updated_at desc);

create table public.content_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brief_id uuid references public.content_briefs(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  slug text not null,
  excerpt text not null default '',
  body_markdown text not null default '',
  meta_title text not null default '',
  meta_description text not null default '',
  primary_keyword text not null default '',
  search_intent text not null default 'informational',
  seo_score smallint not null default 0 check (seo_score between 0 and 100),
  word_count integer not null default 0 check (word_count >= 0),
  status public.document_status not null default 'brief',
  owner_id uuid not null default auth.uid() references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index content_documents_workspace_status_idx on public.content_documents(workspace_id, status, updated_at desc);

create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.content_documents(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  title text not null,
  body_markdown text not null,
  meta_title text not null default '',
  meta_description text not null default '',
  change_summary text not null default '',
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid not null references public.content_documents(id) on delete cascade,
  requested_by uuid not null default auth.uid() references public.profiles(id),
  reviewer_id uuid references public.profiles(id),
  status public.approval_status not null default 'pending',
  note text not null default '',
  decision_note text not null default '',
  requested_at timestamptz not null default now(),
  decided_at timestamptz
);

create unique index approval_requests_open_document_unique
  on public.approval_requests(document_id)
  where status = 'pending';
create index approval_requests_workspace_status_idx on public.approval_requests(workspace_id, status, requested_at desc);

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('manual', 'schedule', 'webhook', 'system')),
  status public.workflow_run_status not null default 'queued',
  input_count integer not null default 0 check (input_count >= 0),
  opportunity_count integer not null default 0 check (opportunity_count >= 0),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);

create index workflow_runs_workspace_created_idx on public.workflow_runs(workspace_id, created_at desc);

create table public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  step_key text not null,
  step_order smallint not null check (step_order > 0),
  status public.workflow_run_status not null default 'queued',
  input_count integer not null default 0 check (input_count >= 0),
  output_count integer not null default 0 check (output_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  unique (run_id, step_key)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sources_touch_updated_at before update on public.sources
for each row execute procedure public.touch_updated_at();
create trigger topics_touch_updated_at before update on public.topics
for each row execute procedure public.touch_updated_at();
create trigger raw_items_touch_updated_at before update on public.raw_items
for each row execute procedure public.touch_updated_at();
create trigger content_briefs_touch_updated_at before update on public.content_briefs
for each row execute procedure public.touch_updated_at();
create trigger content_documents_touch_updated_at before update on public.content_documents
for each row execute procedure public.touch_updated_at();

alter table public.raw_items enable row level security;
alter table public.content_briefs enable row level security;
alter table public.content_documents enable row level security;
alter table public.content_versions enable row level security;
alter table public.approval_requests enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_steps enable row level security;

create policy "raw items read by members" on public.raw_items for select
using (public.is_organization_member(public.workspace_organization_id(workspace_id)));
create policy "editors manage raw items" on public.raw_items for all
using (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]))
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]));

create policy "briefs read by members" on public.content_briefs for select
using (public.is_organization_member(public.workspace_organization_id(workspace_id)));
create policy "editors manage briefs" on public.content_briefs for all
using (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]))
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]));

create policy "documents read by members" on public.content_documents for select
using (public.is_organization_member(public.workspace_organization_id(workspace_id)));
create policy "editors manage documents" on public.content_documents for all
using (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]))
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]));

create policy "versions read by members" on public.content_versions for select
using (
  exists (
    select 1 from public.content_documents document
    where document.id = document_id
      and public.is_organization_member(public.workspace_organization_id(document.workspace_id))
  )
);
create policy "editors create versions" on public.content_versions for insert
with check (
  exists (
    select 1 from public.content_documents document
    where document.id = document_id
      and public.has_organization_role(public.workspace_organization_id(document.workspace_id), array['owner', 'admin', 'editor']::public.organization_role[])
  )
);

create policy "approvals read by members" on public.approval_requests for select
using (public.is_organization_member(public.workspace_organization_id(workspace_id)));
create policy "editors request approvals" on public.approval_requests for insert
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]));
create policy "reviewers decide approvals" on public.approval_requests for update
using (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'reviewer']::public.organization_role[]))
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'reviewer']::public.organization_role[]));

create policy "workflow runs read by members" on public.workflow_runs for select
using (public.is_organization_member(public.workspace_organization_id(workspace_id)));
create policy "editors manage workflow runs" on public.workflow_runs for all
using (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]))
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]));

create policy "workflow steps read by members" on public.workflow_steps for select
using (
  exists (
    select 1 from public.workflow_runs run
    where run.id = run_id
      and public.is_organization_member(public.workspace_organization_id(run.workspace_id))
  )
);
create policy "editors manage workflow steps" on public.workflow_steps for all
using (
  exists (
    select 1 from public.workflow_runs run
    where run.id = run_id
      and public.has_organization_role(public.workspace_organization_id(run.workspace_id), array['owner', 'admin', 'editor']::public.organization_role[])
  )
)
with check (
  exists (
    select 1 from public.workflow_runs run
    where run.id = run_id
      and public.has_organization_role(public.workspace_organization_id(run.workspace_id), array['owner', 'admin', 'editor']::public.organization_role[])
  )
);
