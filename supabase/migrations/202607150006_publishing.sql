create type public.publishing_destination_type as enum ('wordpress', 'webhook', 'export');
create type public.publishing_job_status as enum ('queued', 'publishing', 'published', 'failed', 'cancelled');

create table public.publishing_destinations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  destination_type public.publishing_destination_type not null,
  base_url text,
  configuration jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table public.publishing_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid not null references public.content_documents(id) on delete cascade,
  destination_id uuid references public.publishing_destinations(id) on delete set null,
  status public.publishing_job_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  external_id text,
  external_url text,
  error_message text,
  requested_by uuid not null default auth.uid() references public.profiles(id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index publishing_destinations_workspace_idx on public.publishing_destinations(workspace_id, is_active, created_at desc);
create index publishing_jobs_workspace_status_idx on public.publishing_jobs(workspace_id, status, created_at desc);
create index publishing_jobs_document_idx on public.publishing_jobs(document_id, created_at desc);

create trigger publishing_destinations_touch_updated_at before update on public.publishing_destinations
for each row execute procedure public.touch_updated_at();

alter table public.publishing_destinations enable row level security;
alter table public.publishing_jobs enable row level security;

create policy "publishing destinations read by members" on public.publishing_destinations for select
using (public.is_organization_member(public.workspace_organization_id(workspace_id)));
create policy "admins manage publishing destinations" on public.publishing_destinations for all
using (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin']::public.organization_role[]))
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin']::public.organization_role[]));

create policy "publishing jobs read by members" on public.publishing_jobs for select
using (public.is_organization_member(public.workspace_organization_id(workspace_id)));
create policy "editors create publishing jobs" on public.publishing_jobs for insert
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]));
create policy "admins update publishing jobs" on public.publishing_jobs for update
using (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin']::public.organization_role[]))
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin']::public.organization_role[]));
