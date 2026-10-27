-- Estrutura de apoio ao envio e agendamento de notificações push.
alter table public.notificacoes
  add column if not exists push_sent_at timestamptz;

create index if not exists notificacoes_push_pendente_idx
  on public.notificacoes (user_id, created_at)
  where push_sent_at is null;

create index if not exists dividas_user_vencimento_aberta_idx
  on public.dividas (user_id, vencimento)
  where paga = false;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
