-- Business profile fields for personalized AI post generation
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists business_name text,
  add column if not exists website text,
  add column if not exists service_description text;
