-- Run in Supabase SQL Editor (safe to re-run). Enable Email auth + configure site/redirect URLs.
create table if not exists public.bingo_games (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  game jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists bingo_games_owner_date on public.bingo_games(user_id,updated_at desc);
alter table public.bingo_games enable row level security;
drop policy if exists "Players may read own bingo games" on public.bingo_games;
create policy "Players may read own bingo games" on public.bingo_games for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Players may insert own bingo games" on public.bingo_games;
create policy "Players may insert own bingo games" on public.bingo_games for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Players may update own bingo games" on public.bingo_games;
create policy "Players may update own bingo games" on public.bingo_games for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Players may delete own bingo games" on public.bingo_games;
create policy "Players may delete own bingo games" on public.bingo_games for delete to authenticated using ((select auth.uid()) = user_id);
