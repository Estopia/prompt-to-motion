-- MotionForge: Initial schema for SaaS (profiles, usage, subscriptions, projects, api_keys)
-- Run in Supabase SQL Editor or via: supabase db push

-- Profiles: extended user data (synced from auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Plan enum for subscription tier
create type public.plan_id as enum ('free', 'starter', 'pro', 'team');

-- Subscriptions: Stripe sync
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_id public.plan_id not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Usage events: generations and renders for metering
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('generation', 'render')),
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_events_user_created
  on public.usage_events (user_id, created_at desc);

-- API keys: for programmatic access (hash stored only)
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_keys_key_prefix on public.api_keys (key_prefix);

-- Projects: saved animations
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled',
  code text not null,
  duration_in_frames int not null default 150,
  fps int not null default 30,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_updated
  on public.projects (user_id, updated_at desc);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.subscriptions (user_id, plan_id)
  values (new.id, 'free');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;
alter table public.api_keys enable row level security;
alter table public.projects enable row level security;

-- Profiles: user can read/update own
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Subscriptions: user can read own
create policy "Users can view own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);

-- Usage events: user can read own; insert only via service role (API)
create policy "Users can view own usage"
  on public.usage_events for select using (auth.uid() = user_id);

-- API keys: user can manage own
create policy "Users can view own api_keys"
  on public.api_keys for select using (auth.uid() = user_id);
create policy "Users can insert own api_keys"
  on public.api_keys for insert with check (auth.uid() = user_id);
create policy "Users can delete own api_keys"
  on public.api_keys for delete using (auth.uid() = user_id);

-- Projects: user can CRUD own
create policy "Users can view own projects"
  on public.projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects"
  on public.projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects"
  on public.projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects"
  on public.projects for delete using (auth.uid() = user_id);
