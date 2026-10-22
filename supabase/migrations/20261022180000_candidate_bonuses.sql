-- Bonus data is private to the candidate owner and cascades with candidate/job deletion.
create table public.candidate_interviews (
  candidate_id uuid primary key references public.candidates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  plan jsonb, answers jsonb not null default '{}'::jsonb, evaluation jsonb,
  status text not null default 'generating' check (status in ('generating','draft','evaluating','ready','error')),
  error text, model text, updated_at timestamptz not null default now()
);
create table public.candidate_background_checks (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  profile_url text not null, profile_confirmed_at timestamptz not null,
  report jsonb not null, checked_at timestamptz not null default now(),
  review_status text not null default 'pending' check (review_status in ('pending','reviewed','followup')),
  review_note text not null default '', reviewed_at timestamptz,
  unique (candidate_id, profile_url)
);
create index interviews_owner on public.candidate_interviews(user_id);
create index background_owner_candidate on public.candidate_background_checks(user_id, candidate_id);
alter table public.candidate_interviews enable row level security;
alter table public.candidate_background_checks enable row level security;
create policy interview_owner on public.candidate_interviews for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (select 1 from public.candidates c where c.id = candidate_id and c.user_id = auth.uid()));
create policy background_owner on public.candidate_background_checks for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (select 1 from public.candidates c where c.id = candidate_id and c.user_id = auth.uid()));
revoke all on public.candidate_interviews, public.candidate_background_checks from anon;
grant select, insert, update, delete on public.candidate_interviews, public.candidate_background_checks to authenticated;
