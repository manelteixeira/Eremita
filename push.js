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
  const header = document.querySelector(".cabeçalho");
  const tema = document.getElementById("btnTema");
  if (!header || !tema) return null;

  botaoPush = document.createElement("button");
  botaoPush.type = "button";
  botaoPush.className = "btn-push-notificacoes";
  botaoPush.textContent = "Ativar push";
  botaoPush.setAttribute("aria-label", "Ativar notificações push");
  botaoPush.style.cssText = "border:1px solid currentColor;border-radius:10px;padding:8px 10px;background:transparent;color:inherit;cursor:pointer;font:inherit;font-size:.85rem";
  botaoPush.addEventListener("click", alternarPush);
  header.insertBefore(botaoPush, tema);
  return botaoPush;
}

async function atualizarEstadoBotao() {
  if (!botaoPush || !userPushAtual) return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    botaoPush.textContent = "Push indisponível";
    botaoPush.disabled = true;
    botaoPush.title = "Este navegador não oferece suporte a notificações push.";
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    botaoPush.textContent = subscription ? "Push ativo" : "Ativar push";
    botaoPush.setAttribute("aria-label", subscription ? "Desativar notificações push" : "Ativar notificações push");
    botaoPush.title = subscription ? "Clique para desativar notificações push neste dispositivo." : "Receba alertas de vencimento neste dispositivo.";
  } catch (error) {
    console.error("Não foi possível verificar o estado do push:", error);
  }
}

async function alternarPush() {
  if (!userPushAtual || !botaoPush) return;
  if (!VAPID_PUBLIC_KEY) {
    mostrarMensagem("As notificações push ainda precisam ser configuradas. Falta definir VITE_VAPID_PUBLIC_KEY no ambiente de produção.");
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
      botaoPush.textContent = "Ativar push";
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

    botaoPush.textContent = "Push ativo";
    mostrarMensagem("Pronto! Este dispositivo está inscrito para receber notificações push do Eremita.");
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
  botaoPush?.remove();
  botaoPush = null;
}