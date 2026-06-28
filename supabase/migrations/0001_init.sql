-- CycleAlign initial schema
-- Run in the Supabase SQL editor (or via the Supabase CLI).
-- Every table is owner-scoped via Row Level Security.

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  name              text not null,
  gender            text not null default 'prefer_not_to_say',
  birth_date        date,
  avg_cycle_length  int  not null default 28,
  avg_period_length int  not null default 5,
  -- Life-context role (Screen 2). Changes display copy only, never logic.
  user_role         text,
  created_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- cycle_logs: one row per recorded period start
-- ---------------------------------------------------------------------------
create table if not exists public.cycle_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  start_date  date not null,
  end_date    date,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists cycle_logs_user_start_idx
  on public.cycle_logs (user_id, start_date desc);

alter table public.cycle_logs enable row level security;

create policy "cycle_logs_select_own"
  on public.cycle_logs for select
  using (auth.uid() = user_id);

create policy "cycle_logs_insert_own"
  on public.cycle_logs for insert
  with check (auth.uid() = user_id);

create policy "cycle_logs_update_own"
  on public.cycle_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cycle_logs_delete_own"
  on public.cycle_logs for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- symptom_logs: optional daily symptom / mood entries (scaffolded for later)
-- ---------------------------------------------------------------------------
create table if not exists public.symptom_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  log_date  date not null,
  type      text not null,
  severity  int,
  mood      text,
  created_at timestamptz not null default now()
);

create index if not exists symptom_logs_user_date_idx
  on public.symptom_logs (user_id, log_date desc);

alter table public.symptom_logs enable row level security;

create policy "symptom_logs_select_own"
  on public.symptom_logs for select
  using (auth.uid() = user_id);

create policy "symptom_logs_insert_own"
  on public.symptom_logs for insert
  with check (auth.uid() = user_id);

create policy "symptom_logs_update_own"
  on public.symptom_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "symptom_logs_delete_own"
  on public.symptom_logs for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- daily_logs: one Quick Log per user per day (Component E)
-- ---------------------------------------------------------------------------
create table if not exists public.daily_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  log_date   date not null,
  energy     int,            -- 1..5
  mood       text,           -- mood key
  win        text,           -- max 60 chars (enforced client-side)
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.daily_logs enable row level security;

create policy "daily_logs_select_own" on public.daily_logs for select using (auth.uid() = user_id);
create policy "daily_logs_insert_own" on public.daily_logs for insert with check (auth.uid() = user_id);
create policy "daily_logs_update_own" on public.daily_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_logs_delete_own" on public.daily_logs for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- tasks: user tasks shown on the dashboard (Component D)
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  category   text not null,
  task_date  date not null,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_date_idx on public.tasks (user_id, task_date);

alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create a stub profile row when a new auth user signs up.
-- The app then fills in the details during onboarding via an update.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'Friend'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
