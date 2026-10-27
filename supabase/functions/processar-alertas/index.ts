import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:suporte@eremita.app";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return json({ error: "Não autorizado." }, 401);
  }
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Configuração do Supabase incompleta." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today.getTime() + 86400000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const { data: debts, error: debtError } = await supabase
    .from("dividas")
    .select("id,user_id,nome,vencimento")
    .eq("paga", false)
    .gte("vencimento", todayStr)
    .lte("vencimento", tomorrowStr);

  if (debtError) {
    console.error("Falha ao consultar dívidas:", debtError.message);
    return json({ error: "Não foi possível consultar os vencimentos." }, 500);
  }

  const pushConfigured = Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);
  if (pushConfigured) {
    try {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    } catch (error) {
      console.error("Configuração VAPID inválida:", String(error));
      return json({ error: "As chaves de notificação estão inválidas." }, 500);
    }
  }

  let created = 0;
  let pushSent = 0;
  let pushFailed = 0;
  let subscriptionsWithoutPush = 0;

  for (const debt of debts ?? []) {
    const due = new Date(`${debt.vencimento}T00:00:00.000Z`);
    const daysLeft = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (daysLeft !== 0 && daysLeft !== 1) continue;

    const datePt = due.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    const title = daysLeft === 0 ? "Vencimento hoje" : "Vencimento amanhã";
    const message = daysLeft === 0
      ? `"${debt.nome}" vence hoje (${datePt}).`
      : `"${debt.nome}" vence amanhã (${datePt}).`;
    const dedupeKey = `vencimento:${debt.id}:${debt.vencimento}:${daysLeft}`;

    const { data: inserted, error: insertError } = await supabase
      .from("notificacoes")
      .upsert({
        user_id: debt.user_id,
        divida_id: debt.id,
        tipo: "vencimento_proximo",
        titulo: title,
        mensagem: message,
        dedupe_key: dedupeKey,
      }, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .select("id,user_id,titulo,mensagem");

    if (insertError) {
      console.error("Falha ao criar alerta:", insertError.message);
      continue;
    }
    if (!inserted?.length) continue;
    created += inserted.length;

    if (!pushConfigured) {
      subscriptionsWithoutPush += inserted.length;
      continue;
    }

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth_key")
      .eq("user_id", debt.user_id);

    if (subError) {
      console.error("Falha ao consultar inscrições push:", subError.message);
      pushFailed += inserted.length;
      continue;
    }

    for (const notification of inserted) {
      for (const sub of subscriptions ?? []) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          }, JSON.stringify({
            title: notification.titulo,
            body: notification.mensagem,
            url: "/",
            notificationId: notification.id,
          }));
          pushSent += 1;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          } else {
            console.error("Falha ao enviar push:", statusCode ?? "desconhecido");
            pushFailed += 1;
          }
        }
      }
    }
  }

  return json({
    ok: true,
    debtsChecked: debts?.length ?? 0,
    notificationsCreated: created,
    pushSent,
    pushFailed,
    pushConfigured,
    skippedPushBecauseNotConfigured: subscriptionsWithoutPush,
  });
});
