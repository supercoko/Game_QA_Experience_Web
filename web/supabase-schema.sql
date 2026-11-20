begin;

-- Preserve any legacy rows for manual export, and retire the password-based API.
do $$
declare legacy record;
begin
  for legacy in
    select p.oid::regprocedure as signature
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'qa_ping', 'qa_register', 'qa_login', 'qa_sync_progress', 'qa_change_password',
      'qa_admin_list_users', 'qa_admin_manage_user'
    )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', legacy.signature);
  end loop;

  if to_regclass('public.qa_accounts') is not null then
    execute 'revoke all on table public.qa_accounts from public, anon, authenticated';
  end if;
end $$;

create table if not exists public.qa_learning_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('mastered', 'card', 'roadmap', 'card_reset', 'activity')),
  item_id text not null check (char_length(item_id) between 1 and 200),
  value jsonb not null check (octet_length(value::text) <= 32000),
  changed_at bigint not null check (changed_at between 0 and 9007199254740991),
  change_id uuid not null,
  primary key (user_id, kind, item_id)
);

create index if not exists qa_learning_recent_activity
  on public.qa_learning_records (user_id, changed_at desc, change_id desc)
  where kind = 'activity';

alter table public.qa_learning_records enable row level security;
revoke all on public.qa_learning_records from public, anon, authenticated;
grant select, insert, update on public.qa_learning_records to authenticated;

drop policy if exists qa_learning_own_records on public.qa_learning_records;
create policy qa_learning_own_records on public.qa_learning_records
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.qa_exchange_learning(p_account uuid, p_changes jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null or v_user is distinct from p_account then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_changes) is distinct from 'array' then
    raise exception 'Expected an array of changes' using errcode = '22023';
  end if;
  if jsonb_array_length(p_changes) > 100 then
    raise exception 'Expected an array of up to 100 changes' using errcode = '22023';
  end if;

  insert into public.qa_learning_records as existing (user_id, kind, item_id, value, changed_at, change_id)
  select v_user, c.kind, c.item_id, c.value, c.changed_at, c.change_id
  from jsonb_to_recordset(p_changes) as c(kind text, item_id text, value jsonb, changed_at bigint, change_id uuid)
  order by c.kind, c.item_id
  on conflict (user_id, kind, item_id) do update
    set value = excluded.value, changed_at = excluded.changed_at, change_id = excluded.change_id
    where (excluded.changed_at, excluded.change_id) > (existing.changed_at, existing.change_id);

  return coalesce((
    select jsonb_agg(to_jsonb(r) - 'user_id')
    from (
      select * from public.qa_learning_records where user_id = v_user and kind <> 'activity'
      union all
      (select * from public.qa_learning_records where user_id = v_user and kind = 'activity'
       order by changed_at desc, change_id desc limit 200)
    ) r
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.qa_exchange_learning(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.qa_exchange_learning(uuid, jsonb) to authenticated;

create schema if not exists qa_internal;
revoke all on schema qa_internal from public, anon, authenticated;

create table if not exists qa_internal.prep_content (
  singleton boolean primary key default true check (singleton),
  owner_email text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object')
);
alter table qa_internal.prep_content enable row level security;
revoke all on qa_internal.prep_content from public, anon, authenticated;

create or replace function public.qa_get_private_prep()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select p.payload
  from qa_internal.prep_content p
  where exists (
    select 1
    from auth.users u
    join auth.identities i on i.user_id = u.id
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and lower(u.email) = lower(p.owner_email)
      and i.provider = 'github'
      and i.provider_id = '32817968'
      and auth.jwt() #>> '{app_metadata,provider}' = 'github'
  );
$$;

revoke all on function public.qa_get_private_prep() from public, anon, authenticated;
grant execute on function public.qa_get_private_prep() to authenticated;

commit;
