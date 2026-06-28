-- CycleAlign — initial schema
-- Run this in Supabase: Dashboard → SQL Editor → New query → paste → Run
-- Safe to run multiple times (all statements use IF NOT EXISTS / OR REPLACE).

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid        primary key references auth.users on delete cascade,
  name            text        not null default '',
  email           text,
  gender          text,
  birth_date      date,
  avg_cycle_length integer    not null default 28,
  avg_period_length integer   not null default 5,
  user_role       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- ── cycle_logs ────────────────────────────────────────────────────────────────
create table if not exists public.cycle_logs (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references auth.users on delete cascade,
  start_date  date        not null,
  end_date    date,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, start_date)
);

alter table public.cycle_logs enable row level security;

drop policy if exists "cycle_logs_select" on public.cycle_logs;
drop policy if exists "cycle_logs_insert" on public.cycle_logs;
drop policy if exists "cycle_logs_update" on public.cycle_logs;
drop policy if exists "cycle_logs_delete" on public.cycle_logs;

create policy "cycle_logs_select" on public.cycle_logs for select using (auth.uid() = user_id);
create policy "cycle_logs_insert" on public.cycle_logs for insert with check (auth.uid() = user_id);
create policy "cycle_logs_update" on public.cycle_logs for update using (auth.uid() = user_id);
create policy "cycle_logs_delete" on public.cycle_logs for delete using (auth.uid() = user_id);

create index if not exists cycle_logs_user_date_idx on public.cycle_logs (user_id, start_date desc);

-- ── daily_logs ────────────────────────────────────────────────────────────────
create table if not exists public.daily_logs (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references auth.users on delete cascade,
  date_iso    text        not null,  -- yyyy-mm-dd
  energy      integer     check (energy between 1 and 5),
  mood        text,
  win         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, date_iso)
);

alter table public.daily_logs enable row level security;

drop policy if exists "daily_logs_select" on public.daily_logs;
drop policy if exists "daily_logs_insert" on public.daily_logs;
drop policy if exists "daily_logs_update" on public.daily_logs;
drop policy if exists "daily_logs_delete" on public.daily_logs;

create policy "daily_logs_select" on public.daily_logs for select using (auth.uid() = user_id);
create policy "daily_logs_insert" on public.daily_logs for insert with check (auth.uid() = user_id);
create policy "daily_logs_update" on public.daily_logs for update using (auth.uid() = user_id);
create policy "daily_logs_delete" on public.daily_logs for delete using (auth.uid() = user_id);

create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, date_iso desc);

-- ── subscriptions ─────────────────────────────────────────────────────────────
-- Client can only READ. Writes are done by the service-role webhook only.
-- This prevents users bypassing payment by writing tier='premium' themselves.
create table if not exists public.subscriptions (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references auth.users on delete cascade unique,
  tier                text        not null default 'free' check (tier in ('free', 'premium')),
  plan                text        check (plan in ('monthly', 'annual')),
  expiry_date         date,
  razorpay_payment_id text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select" on public.subscriptions;

create policy "subscriptions_select" on public.subscriptions for select using (auth.uid() = user_id);
-- No insert/update/delete policies for users — only service role can write.

-- ── Auto-provision on signup ──────────────────────────────────────────────────
-- Creates a blank profile + free subscription row the moment a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, tier)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── updated_at auto-stamp ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at    on public.profiles;
drop trigger if exists daily_logs_updated_at  on public.daily_logs;
drop trigger if exists subscriptions_updated_at on public.subscriptions;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger daily_logs_updated_at
  before update on public.daily_logs
  for each row execute procedure public.set_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();
