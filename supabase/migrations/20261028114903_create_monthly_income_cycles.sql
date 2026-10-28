create table if not exists public.ciclos_renda_mensal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mes_inicio date not null,
  valor numeric not null check (valor > 0),
  confirmado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, mes_inicio)
);

alter table public.ciclos_renda_mensal enable row level security;

create policy "Users can view own monthly income cycles"
on public.ciclos_renda_mensal for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own monthly income cycles"
on public.ciclos_renda_mensal for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own monthly income cycles"
on public.ciclos_renda_mensal for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own monthly income cycles"
on public.ciclos_renda_mensal for delete to authenticated
using ((select auth.uid()) = user_id);
