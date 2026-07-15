create extension if not exists pgcrypto;

create type public.organization_role as enum ('owner', 'admin', 'editor', 'reviewer', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  market text not null default 'Morocco',
  niche text not null default 'Digital infrastructure',
  language text not null default 'en',
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  url text not null,
  source_type text not null check (source_type in ('rss', 'atom', 'url', 'sitemap', 'manual')),
  status text not null default 'active' check (status in ('active', 'paused', 'error')),
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  pillar text,
  relevance_score smallint check (relevance_score between 0 and 100),
  status text not null default 'discovered' check (status in ('discovered', 'qualified', 'rejected', 'brief_ready', 'draft_ready', 'approved', 'published')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.workspaces enable row level security;
alter table public.sources enable row level security;
alter table public.topics enable row level security;

create policy "profiles read own" on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "members read memberships" on public.organization_members for select using (user_id = auth.uid());
create policy "organizations read by members" on public.organizations for select using (
  exists (select 1 from public.organization_members m where m.organization_id = id and m.user_id = auth.uid())
);
create policy "workspaces read by members" on public.workspaces for select using (
  exists (select 1 from public.organization_members m where m.organization_id = organization_id and m.user_id = auth.uid())
);
create policy "sources read by members" on public.sources for select using (
  exists (select 1 from public.workspaces w join public.organization_members m on m.organization_id = w.organization_id where w.id = workspace_id and m.user_id = auth.uid())
);
create policy "topics read by members" on public.topics for select using (
  exists (select 1 from public.workspaces w join public.organization_members m on m.organization_id = w.organization_id where w.id = workspace_id and m.user_id = auth.uid())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
