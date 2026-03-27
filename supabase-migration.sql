-- Run this in your Supabase SQL editor (Database > SQL Editor > New query)

create table if not exists crm_store (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  key text not null,
  value text not null,
  updated_at timestamptz default now(),
  unique (user_id, key)
);

-- Enable Row Level Security
alter table crm_store enable row level security;

-- Allow all operations for now (tighten once you add Supabase Auth)
create policy "Allow all for default user"
  on crm_store
  for all
  using (true)
  with check (true);

-- Index for fast lookups
create index crm_store_user_key_idx on crm_store (user_id, key);
