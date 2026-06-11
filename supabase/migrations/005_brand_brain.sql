-- Brand Brain: priority services, transformation goals, and example posts
alter table public.profiles
  add column if not exists priority_services text[],
  add column if not exists transformation_goals text[],
  add column if not exists brand_examples text[];
