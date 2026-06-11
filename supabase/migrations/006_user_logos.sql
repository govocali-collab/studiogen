-- User logos: server-side storage for cross-device logo sync
create table if not exists public.user_logos (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        not null references auth.users(id) on delete cascade,
  name                text        not null default 'Logo',
  storage_path        text        not null,
  public_url          text        not null,
  remembered_size     numeric,
  remembered_position text,
  created_at          timestamptz default now()
);

grant all on table public.user_logos to authenticated;
grant all on table public.user_logos to service_role;

alter table public.user_logos enable row level security;

create policy "Users can manage their own logos"
  on public.user_logos for all
  using (auth.uid() = user_id);

-- Storage bucket for logo images (public)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Users can upload their own logos"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own logos"
  on storage.objects for update
  using (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own logos"
  on storage.objects for delete
  using (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public logo read access"
  on storage.objects for select
  using (bucket_id = 'logos');
