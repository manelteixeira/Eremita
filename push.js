import { supabase } from "./supabase.js";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

let botaoPush = null;
let userPushAtual = null;

function base64UrlParaBytes(valor) {
  const padding = "=".repeat((4 - (valor.length % 4)) % 4);
  const base64 = (valor + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function mostrarMensagem(mensagem) {
  window.alert(mensagem);
}

function montarBotao() {
  if (botaoPush?.isConnected) return botaoPush;
  const settings = document.getElementById("btnAtivarNotificacoes");
  if (!settings) return null;

  botaoPush = document.createElement("button");
  botaoPush.type = "button";
  botaoPush.id = "btnAtivarNotificacoes";
  botaoPush.textContent = "Ativar notificações";
  botaoPush.setAttribute("aria-label", "Ativar notificações");
  botaoPush.addEventListener("click", alternarPush);
  settings.replaceWith(botaoPush);
  return botaoPush;
}

async function atualizarEstadoBotao() {
  if (!botaoPush || !userPushAtual) return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    botaoPush.textContent = "Notificações indisponíveis";
    botaoPush.disabled = true;
    botaoPush.title = "Este navegador não oferece suporte a notificações push.";
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    botaoPush.textContent = subscription ? "Desativar notificações" : "Ativar notificações";
    botaoPush.setAttribute("aria-label", subscription ? "Desativar notificações" : "Ativar notificações");
    botaoPush.title = subscription ? "Clique para desativar as notificações neste dispositivo." : "Receba alertas de vencimento neste dispositivo.";
  } catch (error) {
    console.error("Não foi possível verificar o estado do push:", error);
  }
}

async function alternarPush() {
  if (!userPushAtual || !botaoPush) return;
  if (!VAPID_PUBLIC_KEY) {
    mostrarMensagem("As notificações ainda precisam ser configuradas no servidor. Tente novamente mais tarde.");
    return;
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    mostrarMensagem("Este navegador não oferece suporte a notificações push. Tente no Chrome ou Edge atualizado, em uma conexão HTTPS.");
    return;
  }

  botaoPush.disabled = true;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existente = await registration.pushManager.getSubscription();

    if (existente) {
      const { error } = await supabase.from("push_subscriptions")
        .delete().eq("user_id", userPushAtual.id).eq("endpoint", existente.endpoint);
      if (error) throw error;
      await existente.unsubscribe();
      botaoPush.textContent = "Ativar notificações";
      mostrarMensagem("Notificações push desativadas neste dispositivo.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      mostrarMensagem("A permissão não foi concedida. Você pode ativá-la nas configurações do navegador.");
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlParaBytes(VAPID_PUBLIC_KEY),
    });
    const json = subscription.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: userPushAtual.id,
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh,
      auth_key: json.keys?.auth,
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,endpoint" });

    if (error) {
      await subscription.unsubscribe();
      throw error;
    }

    botaoPush.textContent = "Desativar notificações";
    mostrarMensagem("Pronto! Este dispositivo está configurado para receber notificações do Eremita.");
  } catch (error) {
    console.error("Erro ao configurar notificações push:", error);
    mostrarMensagem("Não foi possível configurar o push. Confira a configuração do Supabase e tente novamente.");
  } finally {
    if (botaoPush) botaoPush.disabled = false;
    await atualizarEstadoBotao();
  }
}

export async function iniciarPush(user) {
  userPushAtual = user;
  montarBotao();
  await atualizarEstadoBotao();
}

export function encerrarPush() {
  userPushAtual = null;
  if (botaoPush) {
    botaoPush.disabled = true;
    botaoPush.textContent = "Entre na sua conta para ativar notificações";
  }
}