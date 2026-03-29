-- Replace the permissive open policy with per-user RLS scoped to auth.uid()

drop policy if exists "Allow all for default user" on crm_store;

-- Each user can only read and write their own rows
create policy "Users can manage their own data"
  on crm_store
  for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
