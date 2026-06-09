-- ============================================================
-- La Station Beauté — subscription fields
-- Run this in the Supabase SQL editor.
-- Safe to run on an existing project (uses IF NOT EXISTS / IF NOT EXISTS guards).
-- ============================================================

-- 1. Profiles table (create if it doesn't exist yet, e.g. from a different project)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Add subscription columns (idempotent)
alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists subscription_tier text not null default 'starter',
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists billing_period_start timestamptz,
  add column if not exists billing_period_end timestamptz,
  add column if not exists generations_used integer not null default 0;

-- 3. Post history (Pro users only)
create table if not exists public.post_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  fb_content text not null,
  ig_content text,
  content_type text not null,
  tone text not null,
  length text not null,
  details text,
  created_at timestamptz default now()
);

-- 4. Row-Level Security
alter table public.profiles enable row level security;
alter table public.post_history enable row level security;

-- Profiles: users can only read/update their own row
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can view own profile'
  ) then
    create policy "Users can view own profile"
      on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

-- Post history: users can only read/insert their own rows
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'post_history' and policyname = 'Users can view own history'
  ) then
    create policy "Users can view own history"
      on public.post_history for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'post_history' and policyname = 'Users can insert own history'
  ) then
    create policy "Users can insert own history"
      on public.post_history for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 5. Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, subscription_tier, subscription_status, generations_used)
  values (new.id, new.email, 'starter', 'trialing', 0)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Updated_at auto-update
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
