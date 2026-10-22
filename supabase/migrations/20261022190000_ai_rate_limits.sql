-- Atomic, persistent limits shared by every server instance. Count accepted attempts,
-- including provider failures. Each accepted operation can make at most two model calls.
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  released_at timestamptz
);
create index ai_usage_owner_time on public.ai_usage(user_id, created_at);
create index ai_usage_time on public.ai_usage(created_at);
alter table public.ai_usage enable row level security;
-- No direct table privileges; callers cannot erase counters or release another user.
revoke all on public.ai_usage from anon, authenticated;

create or replace function public.acquire_ai_budget()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  checked_now timestamptz := clock_timestamp();
  day_start timestamptz;
  lease uuid;
  expiry timestamptz;
  attempts bigint;
  oldest timestamptz;
begin
  if caller is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  -- Serialize all reservations to enforce the global ceiling without race conditions.
  perform pg_catalog.pg_advisory_xact_lock(742019001::bigint);
  checked_now := clock_timestamp();
  day_start := date_trunc('day', checked_now at time zone 'UTC') at time zone 'UTC';
  delete from public.ai_usage where created_at < checked_now - interval '30 days';
  select max(expires_at) into expiry from public.ai_usage
    where user_id = caller and released_at is null and expires_at > checked_now;
  if expiry is not null then
    return jsonb_build_object('allowed', false, 'reason', 'concurrent', 'retry_after', greatest(1, ceil(extract(epoch from expiry - checked_now))::int));
  end if;
  select count(*), min(created_at) into attempts, oldest from public.ai_usage where user_id = caller and created_at > checked_now - interval '1 hour';
  if attempts >= 10 then
    return jsonb_build_object('allowed', false, 'reason', 'hourly', 'retry_after', greatest(1, ceil(extract(epoch from oldest + interval '1 hour' - checked_now))::int));
  end if;
  select count(*) into attempts from public.ai_usage where user_id = caller and created_at >= day_start;
  if attempts >= 30 then
    return jsonb_build_object('allowed', false, 'reason', 'daily', 'retry_after', greatest(1, ceil(extract(epoch from day_start + interval '1 day' - checked_now))::int));
  end if;
  select count(*) into attempts from public.ai_usage where created_at >= day_start;
  if attempts >= 100 then
    return jsonb_build_object('allowed', false, 'reason', 'global', 'retry_after', greatest(1, ceil(extract(epoch from day_start + interval '1 day' - checked_now))::int));
  end if;
  insert into public.ai_usage(user_id, created_at, expires_at)
    values (caller, checked_now, checked_now + interval '3 minutes') returning id into lease;
  return jsonb_build_object('allowed', true, 'lease_id', lease);
end;
$$;

create or replace function public.release_ai_budget(request_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.ai_usage set released_at = clock_timestamp()
    where id = request_id and user_id = auth.uid() and released_at is null;
$$;
revoke all on function public.acquire_ai_budget() from public, anon;
revoke all on function public.release_ai_budget(uuid) from public, anon;
grant execute on function public.acquire_ai_budget() to authenticated;
grant execute on function public.release_ai_budget(uuid) to authenticated;
