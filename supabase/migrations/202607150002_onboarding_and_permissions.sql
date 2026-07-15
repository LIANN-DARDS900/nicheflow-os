create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_organization_role(target_organization_id uuid, allowed_roles public.organization_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.workspace_organization_id(target_workspace_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.workspaces where id = target_workspace_id;
$$;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.has_organization_role(uuid, public.organization_role[]) from public;
revoke all on function public.workspace_organization_id(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.has_organization_role(uuid, public.organization_role[]) to authenticated;
grant execute on function public.workspace_organization_id(uuid) to authenticated;

drop policy if exists "members read memberships" on public.organization_members;
drop policy if exists "organizations read by members" on public.organizations;
drop policy if exists "workspaces read by members" on public.workspaces;
drop policy if exists "sources read by members" on public.sources;
drop policy if exists "topics read by members" on public.topics;

create policy "members read organization team"
on public.organization_members for select
using (public.is_organization_member(organization_id));

create policy "owners and admins manage organization team"
on public.organization_members for all
using (public.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "organizations read by members"
on public.organizations for select
using (public.is_organization_member(id));

create policy "owners and admins update organizations"
on public.organizations for update
using (public.has_organization_role(id, array['owner', 'admin']::public.organization_role[]))
with check (public.has_organization_role(id, array['owner', 'admin']::public.organization_role[]));

create policy "workspaces read by members"
on public.workspaces for select
using (public.is_organization_member(organization_id));

create policy "owners and admins create workspaces"
on public.workspaces for insert
with check (public.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "owners and admins update workspaces"
on public.workspaces for update
using (public.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "sources read by members"
on public.sources for select
using (public.is_organization_member(public.workspace_organization_id(workspace_id)));

create policy "editors manage sources"
on public.sources for all
using (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]))
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]));

create policy "topics read by members"
on public.topics for select
using (public.is_organization_member(public.workspace_organization_id(workspace_id)));

create policy "editors manage topics"
on public.topics for all
using (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]))
with check (public.has_organization_role(public.workspace_organization_id(workspace_id), array['owner', 'admin', 'editor']::public.organization_role[]));

create or replace function public.create_organization_with_workspace(
  organization_name text,
  organization_slug text,
  workspace_name text,
  workspace_slug text,
  workspace_market text default 'Morocco',
  workspace_niche text default 'Digital infrastructure',
  workspace_language text default 'en'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  new_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if length(trim(organization_name)) < 2 or length(trim(workspace_name)) < 2 then
    raise exception 'Organization and workspace names are required.';
  end if;

  if organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or workspace_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Slugs may contain lowercase letters, numbers and single hyphens only.';
  end if;

  insert into public.organizations (name, slug, created_by)
  values (trim(organization_name), organization_slug, auth.uid())
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization_id, auth.uid(), 'owner');

  insert into public.workspaces (organization_id, name, slug, market, niche, language)
  values (new_organization_id, trim(workspace_name), workspace_slug, trim(workspace_market), trim(workspace_niche), trim(workspace_language))
  returning id into new_workspace_id;

  return new_workspace_id;
end;
$$;

revoke all on function public.create_organization_with_workspace(text, text, text, text, text, text, text) from public;
grant execute on function public.create_organization_with_workspace(text, text, text, text, text, text, text) to authenticated;
