import { supabase } from "./supabase.js";
import { iniciarPush, encerrarPush } from "./push.js";
import "./notificacoes.css";

let userAtual = null;
let falhaGeracao = null;
let modoSelecaoNotificacoes = false;
const notificacoesSelecionadas = new Set();
let container, botao, painel, contador, lista, marcarTodas, botaoModoExcluir, controlesExclusao, selecionarTodas, excluirSelecionadas, cancelarSelecao;

const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const dataLocal = (s) => { const [a,m,d] = s.split("-").map(Number); return new Date(a,m-1,d); };
const dataBR = (s) => dataLocal(s).toLocaleDateString("pt-BR");
const diasEntre = (alvo, hoje) => Math.round((dataLocal(alvo)-dataLocal(hoje))/86400000);
const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt !== undefined) n.textContent = txt;
  return n;
};

function montar() {
  if (container) return;
  const header = document.querySelector(".cabeçalho");
  const tema = document.getElementById("btnTema");
  if (!header || !tema) return;

  container = el("div","eremita-notificacoes");
  botao = el("button","btn-notificacoes");
  botao.type = "button";
  botao.setAttribute("aria-label","Abrir notificações");
  botao.setAttribute("aria-expanded","false");
  botao.append(el("span","icone-notificacoes","🔔"));
  contador = el("span","contador-notificacoes","0");
  contador.hidden = true;
  botao.append(contador);

  painel = el("section","painel-notificacoes");
  painel.hidden = true;
  painel.setAttribute("aria-label","Notificações");
  painel.setAttribute("role","dialog");
  painel.setAttribute("aria-modal","false");
  const topo = el("div","cabecalho-notificacoes");
  topo.append(el("h2","","Notificações"));
  marcarTodas = el("button","marcar-todas-lidas","Marcar lidas");
  marcarTodas.type = "button";
  botaoModoExcluir = el("button","modo-excluir-notificacoes","Excluir notificações");
  botaoModoExcluir.type = "button";
  controlesExclusao = el("div","controles-exclusao-notificacoes");
  controlesExclusao.hidden = true;
  selecionarTodas = el("input");
  selecionarTodas.type = "checkbox";
  const labelTodas = el("label","selecionar-todas-notificacoes","Selecionar todas");
  labelTodas.prepend(selecionarTodas);
  excluirSelecionadas = el("button","confirmar-exclusao-notificacoes","Excluir selecionadas");
  excluirSelecionadas.type = "button";
  excluirSelecionadas.disabled = true;
  cancelarSelecao = el("button","cancelar-selecao-notificacoes","Cancelar");
  cancelarSelecao.type = "button";
  controlesExclusao.append(labelTodas,excluirSelecionadas,cancelarSelecao);
  topo.append(marcarTodas,botaoModoExcluir);
  lista = el("div","lista-notificacoes");
  painel.append(topo,controlesExclusao,lista);
  container.append(botao,painel);
  header.insertBefore(container,tema);

  botao.addEventListener("click", async () => {
    const abrir = painel.hidden;
    painel.hidden = !abrir;
    botao.setAttribute("aria-expanded",String(abrir));
    if (abrir) {
      painel.classList.remove("painel-fechando");
      await sincronizarNotificacoes();
    }
  });
  botaoModoExcluir.addEventListener("click", () => {
    modoSelecaoNotificacoes = true;
    notificacoesSelecionadas.clear();
    atualizarControlesSelecao();
    void carregar();
  });
  cancelarSelecao.addEventListener("click", () => {
    modoSelecaoNotificacoes = false;
    notificacoesSelecionadas.clear();
    atualizarControlesSelecao();
    void carregar();
  });
  selecionarTodas.addEventListener("change", () => {
    lista.querySelectorAll(".selecionar-notificacao").forEach((checkbox) => {
      if (selecionarTodas.checked) notificacoesSelecionadas.add(checkbox.dataset.id);
      else notificacoesSelecionadas.delete(checkbox.dataset.id);
      checkbox.checked = selecionarTodas.checked;
    });
    atualizarControlesSelecao();
  });
  excluirSelecionadas.addEventListener("click", async () => {
    const ids = [...notificacoesSelecionadas];
    if (!userAtual || !ids.length) return;
    if (!window.confirm("Excluir " + ids.length + " notificação(ões) selecionada(s)? As dívidas não serão alteradas.")) return;
    excluirSelecionadas.disabled = true;
    const { error } = await supabase.from("notificacoes").delete().eq("user_id",userAtual.id).in("id",ids);
    if (error) {
      console.error("Erro ao excluir notificações selecionadas:",error);
      window.alert("Não foi possível excluir as notificações. Tente novamente.");
      atualizarControlesSelecao();
      return;
    }
    notificacoesSelecionadas.clear();
    modoSelecaoNotificacoes = false;
    await carregar();
  });
  marcarTodas.addEventListener("click", async () => {
    if (!userAtual) return;
    const { error } = await supabase.from("notificacoes")
      .update({lida_em:new Date().toISOString()})
      .eq("user_id",userAtual.id).is("lida_em",null);
    if (error) console.error("Erro ao marcar notificações:",error);
    await carregar();
  });
  document.addEventListener("click",(event) => {
    if (container && !container.contains(event.target)) {
      painel.hidden = true;
      botao.setAttribute("aria-expanded","false");
    }
  });
}

async function gerarAlertas(userId) {
  falhaGeracao = null;
  const { data: debts, error } = await supabase.from("dividas")
    .select("id,nome,vencimento,paga").eq("user_id",userId)
    .eq("paga",false).not("vencimento","is",null);
  if (error) {
    falhaGeracao = { etapa: "buscar dívidas", error };
    console.error("Erro ao verificar vencimentos:", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    return;
  }

  const hoje = hojeISO();
  const alertas = [];
  for (const d of debts ?? []) {
    const dias = diasEntre(d.vencimento,hoje);
    let tipo,titulo,mensagem,chave;
    if (dias < 0) {
      tipo="atrasada"; titulo="Dívida em atraso";
      mensagem=`"${d.nome}" venceu em ${dataBR(d.vencimento)}.`;
      chave=`divida:${d.id}:atrasada:${d.vencimento}`;
    } else if (dias === 0) {
      tipo="vence_hoje"; titulo="Vencimento hoje";
      mensagem=`"${d.nome}" vence hoje.`;
      chave=`divida:${d.id}:hoje:${d.vencimento}`;
    } else if (dias <= 3) {
      tipo="vence_em_breve"; titulo="Vencimento próximo";
      mensagem=`"${d.nome}" vence em ${dias} ${dias===1?"dia":"dias"} (${dataBR(d.vencimento)}).`;
      chave=`divida:${d.id}:proxima:${d.vencimento}`;
    } else continue;

    alertas.push({user_id:userId,divida_id:d.id,tipo,titulo,mensagem,dedupe_key:chave});
  }
  if (!alertas.length) return;
  const { error: insertError } = await supabase.from("notificacoes")
    .upsert(alertas,{onConflict:"user_id,dedupe_key",ignoreDuplicates:true});
  if (insertError) {
    falhaGeracao = { etapa: "salvar alertas", error: insertError };
    console.error("Erro ao salvar alertas:", { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint });
    return;
  }

  // A função de backend só envia notificações ainda não enviadas e pertencentes ao usuário autenticado.
  const { error: pushError } = await supabase.functions.invoke("enviar-push", {
    body: { dedupeKeys: alertas.map((alerta) => alerta.dedupe_key) },
  });
  if (pushError) console.warn("Push indisponível ou ainda não configurado:", pushError.message);
}

function atualizarControlesSelecao() {
  if (!controlesExclusao) return;
  controlesExclusao.hidden = !modoSelecaoNotificacoes;
  botaoModoExcluir.hidden = modoSelecaoNotificacoes;
  marcarTodas.hidden = modoSelecaoNotificacoes;
  excluirSelecionadas.disabled = notificacoesSelecionadas.size === 0;
  excluirSelecionadas.textContent = "Excluir selecionadas (" + notificacoesSelecionadas.size + ")";
}

async function carregar() {
  if (!userAtual || !lista) return;
  lista.replaceChildren(el("p","estado-notificacoes","Carregando…"));
  const {data,error} = await supabase.from("notificacoes")
    .select("id,titulo,mensagem,tipo,lida_em,created_at")
    .eq("user_id",userAtual.id).order("created_at",{ascending:false}).limit(20);
  if (error) {
    console.error("Erro ao carregar notificações:", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    const detalhe = [error.code ? `Código: ${error.code}` : "", error.message || "Erro sem mensagem"].filter(Boolean).join(" — ");
    lista.replaceChildren(el("p","estado-notificacoes",`Falha ao carregar: ${detalhe}`));
    return;
  }
  if (falhaGeracao) {
    const e = falhaGeracao.error;
    const detalhe = [e.code ? `Código: ${e.code}` : "", e.message || "Erro sem mensagem"].filter(Boolean).join(" — ");
    lista.replaceChildren(el("p","estado-notificacoes",`Falha ao ${falhaGeracao.etapa}: ${detalhe}`));
    return;
  }
  const items = data ?? [];
  const unread = items.filter(x => !x.lida_em).length;
  contador.textContent = unread > 9 ? "9+" : String(unread);
  contador.hidden = unread === 0;
  marcarTodas.disabled = unread === 0;
  lista.replaceChildren();
  atualizarControlesSelecao();
  if (!items.length) {
    lista.append(el("p","estado-notificacoes","Você está em dia. Nenhuma notificação por aqui."));
    return;
  }
  for (const item of items) {
    const row = el("article",`item-notificacao${item.lida_em ? " notificacao-lida" : ""}`);
    if (modoSelecaoNotificacoes) {
      const checkbox = el("input","selecionar-notificacao");
      checkbox.type = "checkbox";
      checkbox.dataset.id = item.id;
      checkbox.checked = notificacoesSelecionadas.has(item.id);
      checkbox.setAttribute("aria-label","Selecionar notificação: " + item.titulo);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) notificacoesSelecionadas.add(item.id);
        else notificacoesSelecionadas.delete(item.id);
        atualizarControlesSelecao();
      });
      row.append(checkbox);
    }
    const body = el("div","texto-notificacao");
    body.append(el("strong","titulo-notificacao",item.titulo));
    body.append(el("p","mensagem-notificacao",item.mensagem));
    body.append(el("time","data-notificacao",new Date(item.created_at).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})));
    row.append(body);
    const actions = el("div","acoes-notificacao");
    if (!modoSelecaoNotificacoes && !item.lida_em) {
      const read = el("button","marcar-notificacao-lida","Marcar lida");
      read.type = "button";
      read.addEventListener("click",async () => {
        const {error: updateError} = await supabase.from("notificacoes")
          .update({lida_em:new Date().toISOString()})
          .eq("id",item.id).eq("user_id",userAtual.id);
        if (updateError) console.error("Erro ao marcar notificação:",updateError);
        await carregar();
      });
      actions.append(read);
    }
    const remove = el("button","excluir-notificacao","Excluir");
    remove.type = "button";
    remove.hidden = modoSelecaoNotificacoes;
    remove.setAttribute("aria-label",`Excluir notificação: ${item.titulo}`);
    remove.addEventListener("click",async () => {
      if (!userAtual || !window.confirm("Excluir esta notificação? A dívida não será alterada.")) return;
      remove.disabled = true;
      const {error: deleteError} = await supabase.from("notificacoes")
        .delete().eq("id",item.id).eq("user_id",userAtual.id);
      if (deleteError) {
        console.error("Erro ao excluir notificação:",deleteError);
        remove.disabled = false;
        window.alert("Não foi possível excluir a notificação. Tente novamente.");
        return;
      }
      await carregar();
    });
    actions.append(remove);
    row.append(actions);
    lista.append(row);
  }
}

export async function sincronizarNotificacoes() {
  if (!userAtual || !lista) return;
  await gerarAlertas(userAtual.id);
  await carregar();
}

async function iniciar(user) {
  if (userAtual?.id === user.id) return;
  userAtual = user;
  montar();
  if (!container) return;
  await iniciarPush(user);
  await sincronizarNotificacoes();
}
function sair() {
  userAtual = null;
  encerrarPush();
  if (painel) painel.hidden = true;
  if (botao) botao.setAttribute("aria-expanded","false");
  if (contador) { contador.hidden = true; contador.textContent = "0"; }
}

supabase.auth.getSession().then(({data,error}) => {
  if (error) console.error("Erro ao recuperar sessão:",error);
  if (data?.session?.user) void iniciar(data.session.user);
});
supabase.auth.onAuthStateChange((_event,session) => {
  if (session?.user) void iniciar(session.user);
  else sair();
});
