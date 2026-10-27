# Configuração do Web Push

A implementação exige configuração manual de chaves e implantação no projeto Supabase. Nunca coloque a chave privada VAPID no frontend ou no GitHub.

## 1. Gerar as chaves VAPID

Em uma máquina com Node.js, execute:

```bash
npx web-push generate-vapid-keys
```

Guarde a chave pública e a privada. Não compartilhe a chave privada.

## 2. Configurar o frontend na Vercel

Adicione a variável de ambiente:

- `VITE_VAPID_PUBLIC_KEY`: chave pública VAPID.

Configure-a em todos os ambientes Vercel que serão usados (Preview e Production) e faça um novo deploy.

## 3. Configurar os segredos do Supabase

Com o Supabase CLI conectado ao projeto correto, execute:

```bash
supabase secrets set VAPID_PUBLIC_KEY="SUA_CHAVE_PUBLICA" VAPID_PRIVATE_KEY="SUA_CHAVE_PRIVADA" VAPID_SUBJECT="mailto:SEU_EMAIL_DE_CONTATO"
supabase functions deploy enviar-push
```

Use a mesma chave pública configurada em `VITE_VAPID_PUBLIC_KEY`. Nunca adicione `VAPID_PRIVATE_KEY` à Vercel ou a arquivos versionados.

## 4. Aplicar a migration

Aplique `supabase/migrations/202610270001_push_envio.sql` no projeto Supabase antes de testar. Ela adiciona `push_sent_at`, que evita reenvios a cada sincronização.

## 5. Testar

1. Abra o app em HTTPS no navegador compatível.
2. Entre na conta e clique em **Ativar push**.
3. Permita notificações quando o navegador perguntar.
4. Com uma dívida de teste vencendo hoje, em até 3 dias ou atrasada, abra/atualize o app para disparar a sincronização.
5. Confira se a notificação aparece no dispositivo. Evite usar dívidas reais no teste.

O envio é acionado pela sincronização do app. Para criar e enviar alertas novos mesmo quando o app não é aberto, será necessário configurar uma rotina agendada no backend como etapa adicional.