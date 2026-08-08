-- Hunar Naqsha · Supabase schema (Mohalla Mind)
-- Run in Supabase SQL Editor if MCP apply_migration times out.

create extension if not exists "pgcrypto";

create table if not exists public.zones (
  id text primary key,
  display_name text not null,
  urdu_name text,
  description text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text,
  role text not null check (role in ('resident','worker')),
  zone_id text references public.zones(id),
  worker_id text,
  favorites jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id),
  name text not null,
  title text,
  skill_category text not null,
  zone_id text references public.zones(id),
  availability text,
  bio text,
  photo_url text,
  rating numeric default 0,
  completed_jobs int default 0,
  is_active boolean default true,
  available_this_week boolean default true,
  verified boolean default false,
  tags jsonb default '[]'::jsonb,
  services jsonb default '[]'::jsonb,
  portfolio jsonb default '[]'::jsonb,
  lat double precision,
  lng double precision,
  registered_at timestamptz default now()
);

create table if not exists public.needs (
  id uuid primary key default gen_random_uuid(),
  skill_category text not null,
  description text not null,
  budget_range text,
  urgency text,
  zone_id text references public.zones(id),
  resident_name text,
  resident_user_id uuid references public.app_users(id),
  status text not null default 'open',
  matched_at timestamptz,
  matched_bid_id uuid,
  job_done boolean default false,
  job_done_at timestamptz,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  need_id uuid references public.needs(id) on delete cascade,
  worker_id uuid references public.workers(id),
  price_rs numeric not null,
  timeline_days int,
  note text,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.zone_status (
  id uuid primary key default gen_random_uuid(),
  zone_id text references public.zones(id),
  skill_category text not null,
  gap_level text not null,
  open_needs_count int default 0,
  registered_workers_count int default 0,
  bid_response_rate numeric default 0,
  season_flag text,
  ai_reasoning text,
  ai_action text,
  confidence text,
  confidence_why text,
  agent_source text,
  community_handled boolean default false,
  last_analyzed timestamptz default now(),
  unique(zone_id, skill_category)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  zone_id text references public.zones(id),
  skill_category text not null,
  gap_level text not null,
  reasoning text,
  action text,
  confidence text,
  confidence_why text,
  agent_source text,
  whatsapp_notice text,
  is_active boolean default true,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references public.workers(id),
  need_id uuid,
  bid_id uuid,
  stars int check (stars between 1 and 5),
  comment text,
  reviewer_name text,
  reviewer_zone text,
  rated_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  need_id uuid references public.needs(id) on delete cascade,
  sender_user_id uuid references public.app_users(id),
  sender_role text,
  sender_name text,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete cascade,
  type text,
  title text,
  body text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.seasonal_context (
  id serial primary key,
  season_name text not null,
  start_date date not null,
  end_date date not null,
  affected_skills jsonb not null,
  demand_multiplier numeric default 1
);

create table if not exists public.ai_history (
  id uuid primary key default gen_random_uuid(),
  zone_id text,
  skill_category text,
  gap_level text,
  reasoning text,
  action text,
  confidence text,
  confidence_why text,
  agent_source text,
  created_at timestamptz default now()
);

alter table public.zones enable row level security;
alter table public.app_users enable row level security;
alter table public.workers enable row level security;
alter table public.needs enable row level security;
alter table public.bids enable row level security;
alter table public.zone_status enable row level security;
alter table public.alerts enable row level security;
alter table public.ratings enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.seasonal_context enable row level security;
alter table public.ai_history enable row level security;

drop policy if exists zones_read on public.zones;
create policy zones_read on public.zones for select using (true);
drop policy if exists workers_read on public.workers;
create policy workers_read on public.workers for select using (true);
drop policy if exists needs_read on public.needs;
create policy needs_read on public.needs for select using (true);
drop policy if exists alerts_read on public.alerts;
create policy alerts_read on public.alerts for select using (true);
drop policy if exists zone_status_read on public.zone_status;
create policy zone_status_read on public.zone_status for select using (true);
drop policy if exists ratings_read on public.ratings;
create policy ratings_read on public.ratings for select using (true);
drop policy if exists seasonal_read on public.seasonal_context;
create policy seasonal_read on public.seasonal_context for select using (true);
drop policy if exists ai_history_read on public.ai_history;
create policy ai_history_read on public.ai_history for select using (true);

-- Seed demo zones
insert into public.zones (id, display_name, urdu_name, description, lat, lng) values
  ('Z1','Gali 1–2','گلی ۱–۲','Residential lanes near park',31.4832,74.3318),
  ('Z2','Gali 3–4','گلی ۳–۴','Dense home-worker pocket',31.4808,74.3365),
  ('Z3','Gali 5–7','گلی ۵–۷','Demo critical shortage zone',31.4785,74.3412),
  ('Z4','Gali 8–9','گلی ۸–۹','Quieter residential edge',31.4762,74.346),
  ('Z5','Main Market Area','مین بازار','Shops + foot traffic',31.4815,74.3505),
  ('Z6','Back Streets','پچھلی گلیاں','Inner mohalla streets',31.485,74.3388)
on conflict (id) do update set
  display_name = excluded.display_name,
  lat = excluded.lat,
  lng = excluded.lng;

insert into public.seasonal_context (season_name, start_date, end_date, affected_skills, demand_multiplier) values
  ('pre-eid-fitr-2026','2026-03-10','2026-03-31','["Tailoring & Stitching","Baking & Home Food","Beautician"]'::jsonb,3),
  ('exam-season-2026','2026-02-15','2026-05-15','["Home Tutoring"]'::jsonb,2),
  ('ramadan-2026','2026-02-28','2026-03-29','["Baking & Home Food","Cleaning"]'::jsonb,1.8)
on conflict do nothing;
