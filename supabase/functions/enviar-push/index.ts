import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const response = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Método não permitido." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return response({ error: "Autenticação necessária." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT");

  if (!supabaseUrl || !anonKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error("Configuração de push incompleta no ambiente da função.");
    return response({ error: "Envio push não configurado." }, 503);
  }

  let body: { dedupeKeys?: unknown };
  try {
    body = await request.json();
  } catch {
    return response({ error: "JSON inválido." }, 400);
  }

  const dedupeKeys = Array.isArray(body.dedupeKeys)
    ? [...new Set(body.dedupeKeys.filter((key): key is string => typeof key === "string" && key.length > 0))].slice(0, 50)
    : [];
  if (!dedupeKeys.length) return response({ sent: 0, message: "Nenhuma notificação pendente." });

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return response({ error: "Sessão inválida." }, 401);

  const { data: notifications, error: notificationsError } = await supabase
    .from("notificacoes")
    .select("id,user_id,titulo,mensagem,dedupe_key,push_sent_at")
    .eq("user_id", user.id)
    .in("dedupe_key", dedupeKeys)
    .is("push_sent_at", null);

  if (notificationsError) {
    console.error("Erro ao buscar notificações pendentes:", notificationsError.message);
    return response({ error: "Não foi possível buscar notificações." }, 500);
  }
  if (!notifications?.length) return response({ sent: 0 });

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth_key")
    .eq("user_id", user.id);

  if (subscriptionsError) {
    console.error("Erro ao buscar inscrições push:", subscriptionsError.message);
    return response({ error: "Não foi possível buscar dispositivos inscritos." }, 500);
  }
  if (!subscriptions?.length) return response({ sent: 0, message: "Nenhum dispositivo inscrito." });

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  let sent = 0;
  const failures: string[] = [];

  for (const notification of notifications) {
    let sentForNotification = false;
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
        }, JSON.stringify({
          title: notification.titulo,
          body: notification.mensagem,
          tag: notification.dedupe_key,
          url: "/",
        }));
        sent += 1;
        sentForNotification = true;
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete()
            .eq("user_id", user.id).eq("id", subscription.id);
        } else {
          console.error("Falha no envio push:", statusCode || "sem status");
          failures.push(notification.id);
        }
      }
    }

    if (sentForNotification) {
      const { error: updateError } = await supabase.from("notificacoes")
        .update({ push_sent_at: new Date().toISOString() })
        .eq("user_id", user.id).eq("id", notification.id);
      if (updateError) console.error("Push enviado, mas não foi possível marcar o estado:", updateError.message);
    }
  }

  return response({ sent, failedNotifications: [...new Set(failures)].length });
});