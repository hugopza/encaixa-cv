-- Encaja. Run once in Supabase SQL editor. No service-role key is required.
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null, department text not null default '', location text not null default '',
  description text not null, criteria jsonb not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  job_id uuid not null,
  name text not null, email text, resume_text text not null, filename text,
  content_hash text not null,
  status text not null default 'pending' check (status in ('pending','analyzing','ready','error')),
  stage text not null default 'review' check (stage in ('review','shortlist','rejected')),
  score integer check (score between 0 and 100), analysis jsonb, error text, model text,
  analyzed_at timestamptz, analysis_started_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (job_id, user_id) references public.jobs(id, user_id) on delete cascade,
  unique (job_id, content_hash)
);
create index jobs_owner on public.jobs(user_id);
create index candidates_owner_job on public.candidates(user_id, job_id);
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
create policy jobs_owner on public.jobs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy candidates_owner on public.candidates for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.jobs, public.candidates from anon;
grant select, insert, update, delete on public.jobs, public.candidates to authenticated;
