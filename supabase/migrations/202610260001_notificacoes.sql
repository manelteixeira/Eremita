-- Eremita: notificações internas e inscrições de push.
-- Aplicar no Supabase SQL Editor após revisar este arquivo.

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  divida_id bigint references public.dividas(id) on delete set null,
  tipo text not null check (tipo in ('vence_em_breve', 'vence_hoje', 'atrasada', 'sistema')),
  titulo text not null,
  mensagem text not null,
  dedupe_key text not null,
  lida_em timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index if not exists notificacoes_user_created_idx
  on public.notificacoes (user_id, created_at desc);

alter table public.notificacoes enable row level security;

drop policy if exists "Usuários veem suas notificações" on public.notificacoes;
create policy "Usuários veem suas notificações"
  on public.notificacoes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Usuários criam suas notificações" on public.notificacoes;
create policy "Usuários criam suas notificações"
  on public.notificacoes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários atualizam suas notificações" on public.notificacoes;
create policy "Usuários atualizam suas notificações"
  on public.notificacoes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários excluem suas notificações" on public.notificacoes;
create policy "Usuários excluem suas notificações"
  on public.notificacoes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- A tabela de inscrições fica preparada para a etapa de push.
-- O navegador só poderá gerir inscrições pertencentes ao usuário autenticado.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Usuários veem suas inscrições push" on public.push_subscriptions;
create policy "Usuários veem suas inscrições push"
  on public.push_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Usuários criam suas inscrições push" on public.push_subscriptions;
create policy "Usuários criam suas inscrições push"
  on public.push_subscriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários atualizam suas inscrições push" on public.push_subscriptions;
create policy "Usuários atualizam suas inscrições push"
  on public.push_subscriptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários excluem suas inscrições push" on public.push_subscriptions;
create policy "Usuários excluem suas inscrições push"
  on public.push_subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);
