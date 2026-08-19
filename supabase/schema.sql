-- ONYX FIT v0.1 — run once in Supabase SQL Editor
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "read own state" on public.user_state;
create policy "read own state" on public.user_state
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "insert own state" on public.user_state;
create policy "insert own state" on public.user_state
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own state" on public.user_state;
create policy "update own state" on public.user_state
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_user_state_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_state_updated_at on public.user_state;
create trigger user_state_updated_at
before update on public.user_state
for each row execute function public.set_user_state_updated_at();
