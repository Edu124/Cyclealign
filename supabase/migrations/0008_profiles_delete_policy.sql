-- Lets a user delete their own profile row (cycle_logs/daily_logs already had
-- this). Needed so "Delete my account" in-app can actually remove personal
-- data, not just sign the user out locally.

drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete" on public.profiles for delete using (auth.uid() = id);
