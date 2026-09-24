-- PRAKABÁ V1 — Convite de usuários para uma organização existente.
--
-- O convite é emitido via Supabase Auth Admin API (supabase.auth.admin.
-- inviteUserByEmail + updateUserById), que grava organization_id/role/
-- full_name em app_metadata. Diferente de user_metadata, app_metadata só
-- pode ser escrito pela service role — o usuário convidado não consegue
-- alterá-lo, então é seguro confiar nesses valores ao aceitar o convite.

create or replace function public.accept_invitation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role public.user_role;
  v_full_name text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'user already belongs to an organization';
  end if;

  v_org_id := nullif(auth.jwt() -> 'app_metadata' ->> 'organization_id', '')::uuid;
  v_role := nullif(auth.jwt() -> 'app_metadata' ->> 'role', '')::public.user_role;
  v_full_name := auth.jwt() -> 'app_metadata' ->> 'full_name';

  if v_org_id is null or v_role is null or v_full_name is null then
    raise exception 'missing invitation data';
  end if;

  if not exists (select 1 from public.organizations where id = v_org_id and active) then
    raise exception 'organization not found';
  end if;

  insert into public.profiles (id, organization_id, full_name, role, active)
  values (auth.uid(), v_org_id, v_full_name, v_role, true);

  return v_org_id;
end;
$$;

grant execute on function public.accept_invitation() to authenticated;
