-- 27fall Track - Supabase schema + Row Level Security (RLS)
-- Supabase 控制台 -> SQL Editor -> 粘贴本文件 -> Run
-- 效果：两张表按 user_id 隔离，每个登录用户只能读写自己的数据。

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists offers_user_uni on public.offers (user_id);
create unique index if not exists reviews_user_uni on public.reviews (user_id);

alter table public.offers    enable row level security;
alter table public.reviews   enable row level security;

drop policy if exists "offers_select_own" on public.offers;
create policy "offers_select_own" on public.offers for select using (auth.uid() = user_id);
drop policy if exists "offers_insert_own" on public.offers;
create policy "offers_insert_own" on public.offers for insert with check (auth.uid() = user_id);
drop policy if exists "offers_update_own" on public.offers;
create policy "offers_update_own" on public.offers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "offers_delete_own" on public.offers;
create policy "offers_delete_own" on public.offers for delete using (auth.uid() = user_id);

drop policy if exists "reviews_select_own" on public.reviews;
create policy "reviews_select_own" on public.reviews for select using (auth.uid() = user_id);
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id);
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);
