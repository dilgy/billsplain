-- BillSplain Database Schema v1
-- Run this in Supabase SQL Editor

-- ============================================
-- USERS & PROFILES
-- ============================================

-- Extends Supabase auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  phone text,
  business_url text not null,
  business_name text,
  zip_code text not null,
  industry text,
  sub_industry text,
  services text[], -- array of detected services
  business_summary text, -- agent-generated summary
  tier text not null default 'free' check (tier in ('free', 'pro', 'enterprise')),
  alert_email boolean not null default true,
  alert_sms boolean not null default false,
  alert_frequency text not null default 'realtime' check (alert_frequency in ('realtime', 'daily', 'weekly')),
  profile_raw jsonb, -- full agent-generated profile (markdown + structured)
  analyses_used_this_month integer not null default 0,
  profile_rebuilds_this_month integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- States the business operates in
create table public.monitored_states (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  state_code text not null, -- e.g. 'TX', 'CA'
  is_home_state boolean not null default false,
  created_at timestamptz not null default now(),
  unique(profile_id, state_code)
);

-- ============================================
-- REPRESENTATIVES
-- ============================================

create table public.representatives (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  title text, -- e.g. 'U.S. House', 'TX Senate'
  party text, -- 'D', 'R', 'I'
  state_code text not null,
  district text, -- e.g. 'TX-30', 'District 23'
  level text not null check (level in ('federal', 'state')),
  chamber text check (chamber in ('house', 'senate')),
  phone text,
  office_address text,
  photo_url text,
  committees text[], -- array of committee names
  external_id text, -- ID from civic info API
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Link users to their reps
create table public.profile_representatives (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  representative_id uuid references public.representatives(id) on delete cascade not null,
  relationship text not null default 'constituent' check (relationship in ('constituent', 'monitored')),
  created_at timestamptz not null default now(),
  unique(profile_id, representative_id)
);

-- ============================================
-- AGENCIES & DEPARTMENTS
-- ============================================

create table public.agencies (
  id uuid default gen_random_uuid() primary key,
  name text not null, -- e.g. 'DOT'
  full_name text not null, -- e.g. 'Department of Transportation'
  level text not null check (level in ('federal', 'state')),
  state_code text, -- null for federal
  created_at timestamptz not null default now(),
  unique(name, level, state_code)
);

create table public.profile_agencies (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  relevance_score integer default 50, -- 0-100
  created_at timestamptz not null default now(),
  unique(profile_id, agency_id)
);

-- ============================================
-- TOPICS
-- ============================================

create table public.topics (
  id uuid default gen_random_uuid() primary key,
  name text not null unique, -- e.g. 'Trucking Regulations'
  category text, -- e.g. 'Transportation', 'Labor'
  created_at timestamptz not null default now()
);

create table public.profile_topics (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  topic_id uuid references public.topics(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(profile_id, topic_id)
);

-- ============================================
-- BILLS & LEGISLATION
-- ============================================

create table public.bills (
  id uuid default gen_random_uuid() primary key,
  external_id text not null unique, -- e.g. 'HR-4521', 'SB-892'
  title text not null,
  summary text, -- plain english summary
  full_text_url text,
  level text not null check (level in ('federal', 'state')),
  state_code text, -- null for federal
  chamber text check (chamber in ('house', 'senate')),
  status text, -- 'introduced', 'in_committee', 'passed_committee', 'floor_vote', 'passed', 'signed', 'vetoed'
  sponsor_name text,
  sponsor_external_id text,
  committee text,
  introduced_date date,
  last_action_date date,
  last_action_text text,
  topics text[], -- matched topic names
  raw_data jsonb, -- full API response
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for efficient bill matching
create index idx_bills_level_state on public.bills(level, state_code);
create index idx_bills_status on public.bills(status);
create index idx_bills_last_action on public.bills(last_action_date desc);

-- ============================================
-- VOTES
-- ============================================

create table public.votes (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references public.bills(id) on delete cascade not null,
  representative_id uuid references public.representatives(id) on delete cascade not null,
  vote text not null check (vote in ('yea', 'nay', 'abstain', 'not_voting')),
  vote_date date,
  created_at timestamptz not null default now(),
  unique(bill_id, representative_id)
);

-- ============================================
-- IMPACT ANALYSES
-- ============================================

create table public.impact_analyses (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  bill_id uuid references public.bills(id) on delete cascade not null,
  impact_level text not null check (impact_level in ('low', 'medium', 'high')),
  summary text not null, -- plain english
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  talking_point text, -- for click-to-call
  raw_analysis jsonb, -- full LLM response
  created_at timestamptz not null default now(),
  unique(profile_id, bill_id)
);

-- ============================================
-- NOTIFICATIONS / ALERTS
-- ============================================

create table public.alerts (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('bill_alert', 'vote_alert', 'digest', 'profile_ready')),
  channel text not null check (channel in ('email', 'sms')),
  subject text,
  body_preview text,
  bill_id uuid references public.bills(id) on delete set null,
  impact_analysis_id uuid references public.impact_analyses(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  sent_at timestamptz,
  external_id text, -- message ID from Resend/Twilio
  created_at timestamptz not null default now()
);

create index idx_alerts_profile_status on public.alerts(profile_id, status);
create index idx_alerts_created on public.alerts(created_at desc);

-- ============================================
-- LETTERS
-- ============================================

create table public.letters (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  representative_id uuid references public.representatives(id) on delete cascade not null,
  bill_id uuid references public.bills(id) on delete set null,
  body text not null, -- the letter content
  status text not null default 'draft' check (status in ('draft', 'approved', 'sending', 'sent', 'failed')),
  postgrid_id text, -- PostGrid tracking ID
  cost_cents integer, -- actual cost
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.monitored_states enable row level security;
alter table public.profile_representatives enable row level security;
alter table public.profile_agencies enable row level security;
alter table public.profile_topics enable row level security;
alter table public.impact_analyses enable row level security;
alter table public.alerts enable row level security;
alter table public.letters enable row level security;

-- Users can only see their own data
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can view own states"
  on public.monitored_states for select using (profile_id = auth.uid());
create policy "Users can manage own states"
  on public.monitored_states for all using (profile_id = auth.uid());

create policy "Users can view own reps"
  on public.profile_representatives for select using (profile_id = auth.uid());

create policy "Users can view own agencies"
  on public.profile_agencies for select using (profile_id = auth.uid());

create policy "Users can view own topics"
  on public.profile_topics for select using (profile_id = auth.uid());

create policy "Users can view own analyses"
  on public.impact_analyses for select using (profile_id = auth.uid());

create policy "Users can view own alerts"
  on public.alerts for select using (profile_id = auth.uid());

create policy "Users can view own letters"
  on public.letters for select using (profile_id = auth.uid());
create policy "Users can manage own letters"
  on public.letters for all using (profile_id = auth.uid());

-- Public read for bills, reps, agencies, topics (shared data)
alter table public.bills enable row level security;
create policy "Bills are publicly readable"
  on public.bills for select using (true);

alter table public.representatives enable row level security;
create policy "Reps are publicly readable"
  on public.representatives for select using (true);

alter table public.agencies enable row level security;
create policy "Agencies are publicly readable"
  on public.agencies for select using (true);

alter table public.topics enable row level security;
create policy "Topics are publicly readable"
  on public.topics for select using (true);

alter table public.votes enable row level security;
create policy "Votes are publicly readable"
  on public.votes for select using (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger bills_updated_at
  before update on public.bills
  for each row execute function public.handle_updated_at();

create trigger representatives_updated_at
  before update on public.representatives
  for each row execute function public.handle_updated_at();

-- Reset monthly counters (run via cron on 1st of each month)
create or replace function public.reset_monthly_counters()
returns void as $$
begin
  update public.profiles
  set analyses_used_this_month = 0,
      profile_rebuilds_this_month = 0;
end;
$$ language plpgsql;
