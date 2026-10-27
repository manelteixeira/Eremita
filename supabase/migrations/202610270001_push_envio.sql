-- Controla o envio de push por notificação para evitar repetições em cada sincronização.
alter table public.notificacoes
  add column if not exists push_sent_at timestamptz;

create index if not exists notificacoes_push_pendente_idx
  on public.notificacoes (user_id, created_at)
  where push_sent_at is null;