import { supabase } from "./supabase.js";
import { sincronizarNotificacoes } from "./notificacoes.js";
import "./animacoes/animated-gradient.js";

// Registra o service worker ao abrir o app, não apenas ao ativar o push.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Não foi possível registrar o service worker:", error);
    });
  });
}

// =========================
// ELEMENTOS DA INTERFACE
// =========================

const telaLanding = document.querySelector(".landing");
const telaLogin = document.querySelector(".login");
const telaPainel = document.querySelector(".painel");
const authLivro = document.querySelector(".auth-livro");

const botaoComecar = document.getElementById("btnComecar");
const botaoLoginLanding = document.getElementById("btnLoginLanding");
const botaoCriarConta = document.getElementById("btnCriarConta");
const botaoVoltarLogin = document.getElementById("btnVoltarLogin");

const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("password");
const botaoMostrarSenha = document.getElementById("mostrarSenha");
const botaoEntrar = document.getElementById("btnEntrar");
const mensagemErro = document.getElementById("mensagemErro");

const nomeCadastro = document.getElementById("nomeCadastro");
const emailCadastro = document.getElementById("emailCadastro");
const senhaCadastro = document.getElementById("senhaCadastro");
const confirmarSenhaCadastro = document.getElementById(
  "confirmarSenhaCadastro",
);
const botaoCadastrarUsuario = document.getElementById("btnCadastrarUsuario");
const mensagemCadastro = document.getElementById("mensagemCadastro");

const botaoSair = document.getElementById("btnSair");
const botaoTema = document.getElementById("btnTema");

const botaoMenuMobile = document.getElementById("btnMenuMobile");
const estruturaPainel = document.querySelector(".estrutura-painel");
const overlayMenu = document.getElementById("overlayMenu");

const botaoNovaDivida = document.getElementById("btnNovaDivida");
const formularioDivida = document.getElementById("formularioDivida");
const botaoCancelar = document.getElementById("btnCancelar");
const botaoCadastrar = document.getElementById("btnCadastrar");

const nomeDivida = document.getElementById("nome-divida");
const valorDivida = document.getElementById("valor-divida");
const vencimentoDivida = document.getElementById("vencimento-divida");

const listaDividas = document.getElementById("listaDividas");
const botoesFiltro = document.querySelectorAll(".filtro");
const botaoModoExcluirDividas = document.getElementById("btnModoExcluirDividas");
const controlesExclusaoDividas = document.getElementById("controlesExclusaoDividas");
const selecionarTodasDividas = document.getElementById("selecionarTodasDividas");
const contadorDividasSelecionadas = document.getElementById("contadorDividasSelecionadas");
const botaoExcluirDividasSelecionadas = document.getElementById("btnExcluirDividasSelecionadas");
const botaoCancelarExclusaoDividas = document.getElementById("btnCancelarExclusaoDividas");

const elementoTotalDividas = document.getElementById("totalDividas");
const elementoTotalEmAberto = document.getElementById("totalEmAberto");
const elementoTotalPagas = document.getElementById("totalPagas");
const elementoTotalAtrasadas = document.getElementById("totalAtrasadas");
const elementoQuantidadeAtrasadas = document.getElementById(
  "quantidadeAtrasadas",
);
const elementoProximosVencimentos = document.getElementById(
  "proximosVencimentos",
);
const nomeUsuario = document.getElementById("nomeUsuario");
const elementoRendaMensal = document.getElementById("rendaMensal");
const botaoEditarRenda = document.getElementById("btnEditarRenda");
const formularioRenda = document.getElementById("formularioRenda");
const valorRenda = document.getElementById("valorRenda");
const botaoSalvarRenda = document.getElementById("btnSalvarRenda");
const dialogoCicloMensal = document.getElementById("dialogoCicloMensal");
const formularioCicloMensal = document.getElementById("formularioCicloMensal");
const valorNovoCiclo = document.getElementById("valorNovoCiclo");
const mesNovoCiclo = document.getElementById("mesNovoCiclo");
const mensagemCicloMensal = document.getElementById("mensagemCicloMensal");
const botaoConfirmarCiclo = document.getElementById("btnConfirmarCiclo");
const elementoSaldoMensal = document.getElementById("saldoMensal");
const textoSituacao = document.getElementById("textoSituacao");
const mensagemSituacao = document.getElementById("mensagemSituacao");

const botaoEsqueciSenha = document.getElementById("btnEsqueciSenha");

const formularioLogin = document.getElementById("formLogin");

const formularioRedefinirSenha = document.getElementById("formRedefinirSenha");

const novaSenha = document.getElementById("novaSenha");
const confirmarNovaSenha = document.getElementById("confirmarNovaSenha");

const mensagemRedefinirSenha = document.getElementById(
  "mensagemRedefinirSenha",
);

// =========================
// ESTADO
// =========================

const dividas = [];
let filtroAtual = "pendentes";
let dividaEditando = null;
let modoExclusaoDividas = false;
const dividasSelecionadas = new Set();
let rendaMensal = 0;
let mesCicloAtual = "";
const tabelaRenda = "renda_mensal";
const tabelaCiclosRenda = "ciclos_renda_mensal";

// =========================
// NAVEGAÇÃO
// =========================

function mostrarLanding() {
  telaLanding.style.display = "flex";
  telaLogin.style.display = "none";
  telaPainel.style.display = "none";
  authLivro.classList.remove("cadastro-aberto");
}

function mostrarLogin() {
  telaLanding.style.display = "none";
  telaLogin.style.display = "block";
  telaPainel.style.display = "none";
  authLivro.classList.remove("cadastro-aberto");
}

function mostrarCadastro() {
  telaLanding.style.display = "none";
  telaLogin.style.display = "block";
  telaPainel.style.display = "none";
  authLivro.classList.add("cadastro-aberto");
}

function navegarPara(tela) {
  history.pushState({ tela }, "", `#${tela}`);

  if (tela === "cadastro") {
    mostrarCadastro();
    return;
  }

  if (tela === "login") {
    mostrarLogin();
    return;
  }

  mostrarLanding();
}

botaoComecar.addEventListener("click", function () {
  navegarPara("cadastro");
});

botaoLoginLanding.addEventListener("click", function () {
  navegarPara("login");
});

window.addEventListener("popstate", function (event) {
  if (event.state?.tela === "cadastro") {
    mostrarCadastro();
    return;
  }

  if (event.state?.tela === "login") {
    mostrarLogin();
    return;
  }

  mostrarLanding();
});

history.replaceState({ tela: "landing" }, "", "#inicio");

// =========================
// TEMA
// =========================

const temaSalvo = localStorage.getItem("tema");

if (temaSalvo === "escuro") {
  document.body.classList.add("dark-mode");
  botaoTema.textContent = "☀️";
  botaoTema.setAttribute("aria-label", "Ativar modo claro");
}

botaoTema.addEventListener("click", function () {
  const modoEscuro = document.body.classList.toggle("dark-mode");

  botaoTema.textContent = modoEscuro ? "☀️" : "🌙";
  botaoTema.setAttribute(
    "aria-label",
    modoEscuro ? "Ativar modo claro" : "Ativar modo escuro",
  );

  localStorage.setItem("tema", modoEscuro ? "escuro" : "claro");
});

// =========================
// AUTENTICAÇÃO
// =========================

botaoMostrarSenha.addEventListener("click", function () {
  const mostrandoSenha = campoSenha.type === "text";

  campoSenha.type = mostrandoSenha ? "password" : "text";
  botaoMostrarSenha.textContent = mostrandoSenha ? "👁" : "🙈";
  botaoMostrarSenha.setAttribute(
    "aria-label",
    mostrandoSenha ? "Mostrar senha" : "Ocultar senha",
  );
});

botaoEntrar.addEventListener("click", async function (event) {
  event.preventDefault();
  mensagemErro.textContent = "";

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    console.error("Erro ao entrar:", error);
    mensagemErro.textContent = "Email ou senha incorretos.";
    return;
  }

  const nome = data.user.user_metadata?.nome || data.user.email;
  nomeUsuario.textContent = `Olá, ${nome}!`;

  dividas.length = 0;
  await carregarDividasSupabase();
  await carregarRenda();
  await verificarCicloMensal();
  atualizarResumo();

  telaLogin.style.display = "none";
  telaPainel.style.display = "block";
});

botaoCriarConta.addEventListener("click", function () {
  navegarPara("cadastro");
  mensagemErro.textContent = "";
});

botaoVoltarLogin.addEventListener("click", function () {
  navegarPara("login");
  mensagemCadastro.textContent = "";
});

botaoCadastrarUsuario.addEventListener("click", async function () {
  const nome = nomeCadastro.value.trim();
  const email = emailCadastro.value.trim();
  const senha = senhaCadastro.value;
  const confirmarSenha = confirmarSenhaCadastro.value;

  mensagemCadastro.textContent = "";

  if (!nome) {
    mensagemCadastro.textContent = "Digite seu nome.";
    return;
  }

  if (!email) {
    mensagemCadastro.textContent = "Digite seu email.";
    return;
  }

  if (senha.length < 6) {
    mensagemCadastro.textContent = "A senha deve ter pelo menos 6 caracteres.";
    return;
  }

  if (senha !== confirmarSenha) {
    mensagemCadastro.textContent = "As senhas não coincidem.";
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        nome,
      },
    },
  });

  if (error) {
    console.error("Erro ao criar usuário:", error);
    mensagemCadastro.textContent = error.message;
    return;
  }

  mensagemCadastro.textContent =
    "Conta criada com sucesso! Você já pode entrar.";

  nomeCadastro.value = "";
  emailCadastro.value = "";
  senhaCadastro.value = "";
  confirmarSenhaCadastro.value = "";
});

botaoSair.addEventListener("click", async function () {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Erro ao sair:", error);
    return;
  }

  dividas.length = 0;
  listaDividas.innerHTML = "";
  atualizarResumo();
  atualizarProximosVencimentos();
  atualizarGraficoDividas();

  telaPainel.style.display = "none";
  telaLogin.style.display = "block";
});

// =========================
// MENU MOBILE
// =========================

function fecharMenu() {
  estruturaPainel.classList.remove("menu-aberto");
  botaoMenuMobile.textContent = "☰";
  botaoMenuMobile.setAttribute("aria-label", "Abrir menu");
}

botaoMenuMobile.addEventListener("click", function () {
  const menuAberto = estruturaPainel.classList.toggle("menu-aberto");

  botaoMenuMobile.textContent = menuAberto ? "✕" : "☰";
  botaoMenuMobile.setAttribute(
    "aria-label",
    menuAberto ? "Fechar menu" : "Abrir menu",
  );
});

overlayMenu.addEventListener("click", fecharMenu);

// =========================
// NAVEGAÇÃO DO MENU
// =========================

const itensMenu = document.querySelectorAll(".item-menu");

itensMenu.forEach(function (item) {
  item.addEventListener("click", function (event) {
    const destino = item.getAttribute("href");

    if (!destino || destino === "#") {
      return;
    }

    event.preventDefault();

    const secao = document.querySelector(destino);

    if (!secao) {
      return;
    }

    secao.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    itensMenu.forEach(function (itemMenu) {
      itemMenu.classList.remove("ativo");
    });

    item.classList.add("ativo");

    fecharMenu();
  });
});

// =========================
// RESUMO FINANCEIRO
// =========================

function atualizarResumo() {
  let total = 0;
  let emAberto = 0;
  let pagas = 0;
  let atrasadas = 0;
  let quantidadeAtrasadas = 0;

  dividas.forEach(function (divida) {
    total += divida.valor;

    if (divida.paga) {
      pagas += divida.valor;
      return;
    }

    if (estaAtrasada(divida)) {
      atrasadas += divida.valor;
      quantidadeAtrasadas++;
    } else {
      emAberto += divida.valor;
    }
  });

  elementoTotalDividas.textContent = formatarMoeda(total);
  elementoTotalEmAberto.textContent = formatarMoeda(emAberto);
  elementoTotalPagas.textContent = formatarMoeda(pagas);
  elementoTotalAtrasadas.textContent = formatarMoeda(atrasadas);

  elementoQuantidadeAtrasadas.textContent = `${quantidadeAtrasadas} ${
    quantidadeAtrasadas === 1 ? "dívida" : "dívidas"
  }`;

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const totalCompromissos = dividas.reduce(function (acumulado, divida) {
    // O saldo do ciclo considera apenas dívidas não pagas com vencimento neste mês.
    // Dívidas antigas continuam no histórico/lista, mas não consomem novamente o salário do novo ciclo.
    if (divida.paga || !divida.vencimento) return acumulado;

    const [ano, mes, dia] = divida.vencimento.split("-").map(Number);
    const vencimento = new Date(ano, mes - 1, dia);
    const venceNesteMes = vencimento >= primeiroDiaMes && vencimento <= ultimoDiaMes;

    return venceNesteMes ? acumulado + Number(divida.valor) : acumulado;
  }, 0);

  const saldo = rendaMensal - totalCompromissos;

  elementoSaldoMensal.textContent = `Saldo após dívidas: ${formatarMoeda(saldo)}`;

  if (rendaMensal <= 0) {
    textoSituacao.textContent = "Sua situação";
    mensagemSituacao.textContent = "Cadastre sua renda mensal.";
  } else if (saldo < 0) {
    textoSituacao.textContent = "Atenção";
    mensagemSituacao.textContent =
      "As dívidas informadas ultrapassam sua renda.";
  } else {
    textoSituacao.textContent = "Saldo disponível";
    mensagemSituacao.textContent = `Você tem ${formatarMoeda(saldo)} disponíveis após as dívidas.`;
  }
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// =========================
// GRÁFICO — COMPROMISSOS
// =========================

function atualizarGraficoDividas() {
  const grafico = document.getElementById("graficoDividas");

  if (!grafico) {
    return;
  }

  grafico.innerHTML = "";

  if (dividas.length === 0) {
    grafico.innerHTML = `
      <div class="grafico-vazio">
        Cadastre dívidas para visualizar sua evolução.
      </div>
    `;

    return;
  }

  const hoje = new Date();
  const meses = [];

  for (let i = 0; i < 6; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);

    meses.push({
      ano: data.getFullYear(),
      mes: data.getMonth(),
      nome: data
        .toLocaleDateString("pt-BR", {
          month: "short",
        })
        .replace(".", ""),
      valor: 0,
    });
  }

  dividas.forEach(function (divida) {
    const [ano, mes] = divida.vencimento.split("-").map(Number);

    const mesEncontrado = meses.find(function (item) {
      return item.ano === ano && item.mes === mes - 1;
    });

    if (mesEncontrado) {
      mesEncontrado.valor += Number(divida.valor);
    }
  });

  const valores = meses.map((mes) => mes.valor);
  const maiorValor = Math.max(...valores, 1);

  const largura = 640;
  const altura = 220;
  const margemTopo = 24;
  const margemInferior = 12;

  const alturaUtil = altura - margemTopo - margemInferior;

  const pontos = meses.map(function (mes, indice) {
    const x =
      meses.length === 1
        ? largura / 2
        : (indice / (meses.length - 1)) * largura;

    const y = margemTopo + (1 - mes.valor / maiorValor) * alturaUtil;

    return {
      ...mes,
      x,
      y,
    };
  });

  function criarCaminho(pontos) {
    if (pontos.length === 0) {
      return "";
    }

    if (pontos.length === 1) {
      return `M${pontos[0].x} ${pontos[0].y}`;
    }

    let caminho = `M${pontos[0].x} ${pontos[0].y}`;

    for (let i = 1; i < pontos.length - 1; i++) {
      const anterior = pontos[i - 1];
      const atual = pontos[i];
      const proximo = pontos[i + 1];

      const entradaX = atual.x - anterior.x;
      const entradaY = atual.y - anterior.y;

      const saidaX = proximo.x - atual.x;
      const saidaY = proximo.y - atual.y;

      const entradaTamanho = Math.hypot(entradaX, entradaY) || 1;

      const saidaTamanho = Math.hypot(saidaX, saidaY) || 1;

      const raio = Math.min(2.5, entradaTamanho / 2, saidaTamanho / 2);

      const bx = atual.x - (entradaX / entradaTamanho) * raio;

      const by = atual.y - (entradaY / entradaTamanho) * raio;

      const ax = atual.x + (saidaX / saidaTamanho) * raio;

      const ay = atual.y + (saidaY / saidaTamanho) * raio;

      caminho += `
        L${bx.toFixed(2)} ${by.toFixed(2)}
        Q${atual.x.toFixed(2)} ${atual.y.toFixed(2)}
        ${ax.toFixed(2)} ${ay.toFixed(2)}
      `;
    }

    const ultimo = pontos[pontos.length - 1];

    caminho += ` L${ultimo.x} ${ultimo.y}`;

    return caminho;
  }

  const caminho = criarCaminho(pontos);

  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  const baseY = altura - margemInferior;

  const area = `
    ${caminho}
    L${ultimo.x} ${baseY}
    L${primeiro.x} ${baseY}
    Z
  `;

  grafico.innerHTML = `
    <div class="grafico-spell">
      <div class="grafico-area">
        <svg
          class="grafico-svg"
          viewBox="0 0 ${largura} ${altura}"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="gradienteGrafico"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                class="grafico-gradiente-inicio"
              />
              <stop
                offset="100%"
                class="grafico-gradiente-fim"
              />
            </linearGradient>
          </defs>

          <path
            d="${area}"
            class="grafico-preenchimento"
          ></path>

          <path
            d="${caminho}"
            class="grafico-linha"
          ></path>
        </svg>

        <div class="grafico-cursor"></div>
        <div class="grafico-ponto"></div>
        <div class="grafico-tooltip"></div>
      </div>

      <div class="grafico-labels">
        ${meses
          .map(
            (mes, indice) => `
              <span
                data-indice="${indice}"
              >
                ${mes.nome}
              </span>
            `,
          )
          .join("")}
      </div>
    </div>
  `;

  const areaGrafico = grafico.querySelector(".grafico-area");
  const cursor = grafico.querySelector(".grafico-cursor");
  const ponto = grafico.querySelector(".grafico-ponto");
  const tooltip = grafico.querySelector(".grafico-tooltip");

  const labels = grafico.querySelectorAll(".grafico-labels span");

  let indiceAtivo = pontos.length - 1;

  function atualizarPonto(indice) {
    const pontoAtual = pontos[indice];

    if (!pontoAtual) {
      return;
    }

    indiceAtivo = indice;

    const porcentagemX = (pontoAtual.x / largura) * 100;

    const porcentagemY = (pontoAtual.y / altura) * 100;

    cursor.style.left = `${porcentagemX}%`;
    ponto.style.left = `${porcentagemX}%`;
    ponto.style.top = `${porcentagemY}%`;

    tooltip.classList.remove("tooltip-esquerda");

    if (porcentagemX > 55) {
      tooltip.classList.add("tooltip-esquerda");
    }

    tooltip.style.left = `${porcentagemX}%`;
    tooltip.style.top = `${porcentagemY}%`;

    tooltip.innerHTML = `
      <strong>${pontoAtual.nome}</strong>

      <div class="tooltip-conteudo">
        <span class="tooltip-indicador"></span>

        <span>Compromissos</span>

        <b>${formatarMoeda(pontoAtual.valor)}</b>
      </div>
    `;

    labels.forEach(function (label, labelIndex) {
      label.classList.toggle("ativo", labelIndex === indice);
    });
  }

  areaGrafico.addEventListener("mousemove", function (evento) {
    const rect = areaGrafico.getBoundingClientRect();

    const posicao = (evento.clientX - rect.left) / rect.width;

    const indice = Math.round(posicao * (pontos.length - 1));

    atualizarPonto(Math.max(0, Math.min(pontos.length - 1, indice)));
  });

  areaGrafico.addEventListener("mouseleave", function () {
    atualizarPonto(indiceAtivo);
  });

  atualizarPonto(indiceAtivo);
}

// =========================
// SUPABASE — DÍVIDAS
// =========================

async function carregarDividasSupabase() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("Nenhum usuário está logado.");
    return;
  }

  const { data, error } = await supabase
    .from("dividas")
    .select("*")
    .eq("user_id", user.id)
    .order("vencimento", { ascending: true });

  if (error) {
    console.error("Erro ao carregar dívidas do Supabase:", error);
    return;
  }

  dividas.length = 0;
  dividas.push(...data);

  atualizarListaDividas();
  atualizarResumo();
  atualizarProximosVencimentos();
  atualizarGraficoDividas();
}

function obterMesAtual() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatarMesCiclo(mes) {
  const [ano, numeroMes] = mes.split("-").map(Number);
  return new Date(ano, numeroMes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long", year: "numeric",
  });
}

async function carregarRenda() {
  const { data, error } = await supabase.from(tabelaRenda).select("valor").single();
  if (error && error.code !== "PGRST116") {
    console.error("Erro ao carregar renda:", error);
    return;
  }
  rendaMensal = data ? Number(data.valor) : 0;
  elementoRendaMensal.textContent = formatarMoeda(rendaMensal);
}

async function verificarCicloMensal() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  mesCicloAtual = obterMesAtual();

  const { data, error } = await supabase.from(tabelaCiclosRenda)
    .select("valor, mes_inicio")
    .eq("user_id", user.id)
    .eq("mes_inicio", mesCicloAtual)
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar ciclo mensal:", error);
    alert("Não foi possível verificar o ciclo financeiro deste mês. Tente novamente.");
    return;
  }
  if (data) {
    rendaMensal = Number(data.valor);
    elementoRendaMensal.textContent = formatarMoeda(rendaMensal);
    return;
  }

  mesNovoCiclo.textContent = formatarMesCiclo(mesCicloAtual);
  valorNovoCiclo.value = rendaMensal > 0 ? rendaMensal.toFixed(2) : "";
  mensagemCicloMensal.textContent = rendaMensal > 0
    ? "Confirme sua renda ou ajuste o valor para este novo mês."
    : "Informe sua renda para começar a organizar o orçamento deste mês.";
  dialogoCicloMensal.showModal();
  valorNovoCiclo.focus();
}

async function confirmarCicloMensal(valor) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from(tabelaCiclosRenda).upsert({
    user_id: user.id,
    mes_inicio: mesCicloAtual || obterMesAtual(),
    valor,
    confirmado_em: new Date().toISOString(),
  }, { onConflict: "user_id,mes_inicio" });
  if (error) {
    console.error("Erro ao iniciar ciclo mensal:", error);
    return false;
  }

  return await salvarRenda(valor);
}

async function salvarRenda(valor) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { error } = await supabase.from(tabelaRenda).upsert(
    {
      user_id: user.id,
      valor,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    console.error("Erro ao salvar renda:", error);
    return false;
  }

  rendaMensal = Number(valor);
  return true;
}

// =========================
// STATUS DAS DÍVIDAS
// =========================

function estaAtrasada(divida) {
  if (divida.paga) {
    return false;
  }

  const [ano, mes, dia] = divida.vencimento.split("-").map(Number);
  const vencimento = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);

  return vencimento < hoje;
}

function obterStatus(divida) {
  if (divida.paga) {
    return {
      texto: "Paga",
      classe: "status-paga",
    };
  }

  if (estaAtrasada(divida)) {
    return {
      texto: "Atrasada",
      classe: "status-atrasada",
    };
  }

  return {
    texto: "Em aberto",
    classe: "status-aberta",
  };
}

function deveMostrarDivida(divida) {
  return filtroAtual === "pagas" ? Boolean(divida.paga) : !divida.paga;
}

// =========================
// PRÓXIMOS VENCIMENTOS
// =========================

function atualizarProximosVencimentos() {
  const dividasPendentes = [...dividas]
    .filter((divida) => !divida.paga)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  if (dividasPendentes.length === 0) {
    elementoProximosVencimentos.innerHTML = "<p>Nenhum vencimento próximo.</p>";

    return;
  }

  elementoProximosVencimentos.innerHTML = "";

  dividasPendentes.slice(0, 3).forEach(function (divida) {
    const atrasada = estaAtrasada(divida);
    const item = document.createElement("div");

    item.classList.add("item-vencimento");

    item.innerHTML = `
      <div class="info-vencimento">
        <strong>${divida.nome}</strong>
        <span>Vencimento: ${formatarData(divida.vencimento)}</span>
      </div>

      <div class="valor-vencimento">
        <strong>${formatarMoeda(divida.valor)}</strong>
        <span class="${atrasada ? "vencimento-atrasado" : "vencimento-aberto"}">
          ${atrasada ? "Atrasada" : "Em aberto"}
        </span>
      </div>
    `;

    elementoProximosVencimentos.appendChild(item);
  });
}

// =========================
// LISTA DE DÍVIDAS
// =========================

function atualizarListaDividas() {
  listaDividas.innerHTML = "";
  const visiveis = [...dividas]
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
    .filter(deveMostrarDivida);
  visiveis.forEach(criarDivida);
  atualizarControlesExclusaoDividas(visiveis);
}

function atualizarControlesExclusaoDividas(visiveis = dividas.filter(deveMostrarDivida)) {
  if (!controlesExclusaoDividas) return;
  controlesExclusaoDividas.hidden = !modoExclusaoDividas;
  botaoModoExcluirDividas.hidden = modoExclusaoDividas;
  const ids = visiveis.map((d) => String(d.id));
  const selecionadasVisiveis = ids.filter((id) => dividasSelecionadas.has(id)).length;
  selecionarTodasDividas.checked = ids.length > 0 && selecionadasVisiveis === ids.length;
  selecionarTodasDividas.indeterminate = selecionadasVisiveis > 0 && selecionadasVisiveis < ids.length;
  contadorDividasSelecionadas.textContent = dividasSelecionadas.size + " selecionada(s)";
  botaoExcluirDividasSelecionadas.disabled = dividasSelecionadas.size === 0;
}

function sairModoExclusaoDividas() {
  modoExclusaoDividas = false;
  dividasSelecionadas.clear();
  atualizarListaDividas();
}

function criarDivida(divida) {
  const status = obterStatus(divida);
  const elementoDivida = document.createElement("div");

  elementoDivida.classList.add("divida");

  if (divida.paga) {
    elementoDivida.classList.add("paga");
  }

  elementoDivida.innerHTML = `
    ${modoExclusaoDividas ? `<label class="checkbox-divida"><input type="checkbox" class="selecionar-divida" aria-label="Selecionar dívida" ${dividasSelecionadas.has(String(divida.id)) ? "checked" : ""}></label>` : ""}
    <div>
      <h3>${divida.nome}</h3>
      <p>Vencimento: ${formatarData(divida.vencimento)}</p>
      <p class="status-divida">
        Status:
        <span class="${status.classe}">${status.texto}</span>
      </p>
    </div>

    <div>
      <strong>${formatarMoeda(divida.valor)}</strong>

      <div class="acoes-dividas">
        <button
          type="button"
          class="btnPagar"
          ${divida.paga ? "disabled" : ""}
        >
          ${divida.paga ? "✓ Paga" : "Pagar"}
        </button>

        <button type="button" class="btnEditar" ${modoExclusaoDividas ? "hidden" : ""}>Editar</button>
        <button type="button" class="btnExcluir" ${modoExclusaoDividas ? "hidden" : ""}>Excluir</button>
      </div>
    </div>
  `;

  listaDividas.appendChild(elementoDivida);

  const botaoPagar = elementoDivida.querySelector(".btnPagar");
  const botaoEditar = elementoDivida.querySelector(".btnEditar");
  const botaoExcluir = elementoDivida.querySelector(".btnExcluir");
  const elementoStatus = elementoDivida.querySelector(".status-divida span");
  const checkboxDivida = elementoDivida.querySelector(".selecionar-divida");
  if (checkboxDivida) checkboxDivida.addEventListener("change", () => {
    const id = String(divida.id);
    if (checkboxDivida.checked) dividasSelecionadas.add(id);
    else dividasSelecionadas.delete(id);
    atualizarControlesExclusaoDividas();
  });

  botaoPagar.addEventListener("click", async function () {
    const { data, error } = await supabase
      .from("dividas")
      .update({ paga: true })
      .eq("id", divida.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao pagar dívida:", error);
      alert("Erro ao marcar a dívida como paga.");
      return;
    }

    divida.paga = data.paga;

    elementoStatus.textContent = "Paga";
    elementoStatus.classList.remove("status-atrasada", "status-aberta");
    elementoStatus.classList.add("status-paga");

    botaoPagar.textContent = "✓ Paga";
    botaoPagar.disabled = true;
    elementoDivida.classList.add("paga");

    atualizarResumo();
    atualizarProximosVencimentos();
    await sincronizarNotificacoes();
  });

  botaoEditar.addEventListener("click", function () {
    dividaEditando = divida;

    nomeDivida.value = divida.nome;
    valorDivida.value = divida.valor;
    vencimentoDivida.value = divida.vencimento;

    formularioDivida.style.display = "block";

    formularioDivida.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    nomeDivida.focus();
  });

  botaoExcluir.addEventListener("click", async function () {
    const confirmar = confirm(
      `Tem certeza que deseja excluir a dívida "${divida.nome}"?`,
    );

    if (!confirmar) {
      return;
    }

    const { error } = await supabase
      .from("dividas")
      .delete()
      .eq("id", divida.id);

    if (error) {
      console.error("Erro ao excluir dívida:", error);
      alert("Erro ao excluir a dívida.");
      return;
    }

    const indice = dividas.indexOf(divida);

    if (indice !== -1) {
      dividas.splice(indice, 1);
    }

    atualizarListaDividas();
    atualizarResumo();
    atualizarProximosVencimentos();
    atualizarGraficoDividas();
    await sincronizarNotificacoes();
  });
}

// =========================
// FORMULÁRIO DE DÍVIDA
// =========================

function limparFormularioDivida() {
  nomeDivida.value = "";
  valorDivida.value = "";
  vencimentoDivida.value = "";
  dividaEditando = null;
}

function fecharFormularioDivida() {
  formularioDivida.style.display = "none";
  limparFormularioDivida();
}

botaoNovaDivida.addEventListener("click", function () {
  limparFormularioDivida();
  formularioDivida.style.display = "block";
  formularioDivida.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

botaoCancelar.addEventListener("click", fecharFormularioDivida);

botaoCadastrar.addEventListener("click", async function (event) {
  event.preventDefault();

  const nome = nomeDivida.value.trim();
  const valor = Number(valorDivida.value);
  const vencimento = vencimentoDivida.value;

  if (!nome) {
    alert("Digite o nome da dívida.");
    return;
  }

  if (valor <= 0) {
    alert("Digite um valor maior que zero.");
    return;
  }

  if (!vencimento) {
    alert("Informe o vencimento da dívida.");
    return;
  }

  if (dividaEditando) {
    await editarDivida(nome, valor, vencimento);
    return;
  }

  await cadastrarDivida(nome, valor, vencimento);
});

async function editarDivida(nome, valor, vencimento) {
  const { data, error } = await supabase
    .from("dividas")
    .update({
      nome,
      valor,
      vencimento,
    })
    .eq("id", dividaEditando.id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao editar dívida:", error);
    alert("Erro ao editar a dívida.");
    return;
  }

  Object.assign(dividaEditando, data);

  atualizarListaDividas();
  atualizarResumo();
  atualizarProximosVencimentos();
  atualizarGraficoDividas();
  fecharFormularioDivida();
  await sincronizarNotificacoes();
}

async function cadastrarDivida(nome, valor, vencimento) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Usuário não encontrado.");
    return;
  }

  const novaDivida = {
    nome,
    valor,
    vencimento,
    paga: false,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("dividas")
    .insert([novaDivida])
    .select()
    .single();

  if (error) {
    console.error("Erro ao cadastrar dívida:", error);
    alert("Erro ao cadastrar a dívida.");
    return;
  }

  dividas.push(data);

  atualizarListaDividas();
  atualizarResumo();
  atualizarProximosVencimentos();
  atualizarGraficoDividas();
  fecharFormularioDivida();
  await sincronizarNotificacoes();
}

// =========================
// FILTROS
// =========================

botoesFiltro.forEach(function (botao) {
  botao.addEventListener("click", function () {
    filtroAtual = botao.dataset.filtro;
    dividasSelecionadas.clear();

    botoesFiltro.forEach(function (botaoFiltro) {
      botaoFiltro.classList.remove("ativo");
    });

    botao.classList.add("ativo");
    atualizarListaDividas();
  });
});

botaoModoExcluirDividas.addEventListener("click", function () {
  modoExclusaoDividas = true;
  dividasSelecionadas.clear();
  atualizarListaDividas();
});
botaoCancelarExclusaoDividas.addEventListener("click", sairModoExclusaoDividas);
selecionarTodasDividas.addEventListener("change", function () {
  const ids = dividas.filter(deveMostrarDivida).map((d) => String(d.id));
  ids.forEach((id) => selecionarTodasDividas.checked ? dividasSelecionadas.add(id) : dividasSelecionadas.delete(id));
  atualizarListaDividas();
});
botaoExcluirDividasSelecionadas.addEventListener("click", async function () {
  const ids = [...dividasSelecionadas];
  if (!ids.length) return;
  if (!confirm("Tem certeza que deseja excluir " + ids.length + " dívida(s) selecionada(s)? Essa ação não pode ser desfeita.")) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { alert("Sua sessão expirou. Entre novamente."); return; }
  botaoExcluirDividasSelecionadas.disabled = true;
  const { error } = await supabase.from("dividas").delete().eq("user_id", user.id).in("id", ids.map(Number));
  if (error) {
    console.error("Erro ao excluir dívidas selecionadas:", error);
    alert("Não foi possível excluir as dívidas selecionadas. Tente novamente.");
    atualizarControlesExclusaoDividas();
    return;
  }
  for (let i = dividas.length - 1; i >= 0; i--) {
    if (dividasSelecionadas.has(String(dividas[i].id))) dividas.splice(i, 1);
  }
  sairModoExclusaoDividas();
  atualizarResumo();
  atualizarProximosVencimentos();
  atualizarGraficoDividas();
  await sincronizarNotificacoes();
});

// =========================
// RENDA MENSAL
// =========================

botaoEditarRenda.addEventListener("click", function () {
  valorRenda.value = rendaMensal || "";
  formularioRenda.style.display = "flex";
  valorRenda.focus();
});

botaoSalvarRenda.addEventListener("click", async function () {
  const valor = Number(valorRenda.value);
  if (valor <= 0) {
    alert("Digite uma renda maior que zero.");
    return;
  }
  const sucesso = await salvarRenda(valor);
  if (!sucesso) {
    alert("Erro ao salvar a renda.");
    return;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { error } = await supabase.from(tabelaCiclosRenda).upsert({
      user_id: user.id, mes_inicio: obterMesAtual(), valor,
      confirmado_em: new Date().toISOString(),
    }, { onConflict: "user_id,mes_inicio" });
    if (error) console.error("Erro ao atualizar renda do ciclo atual:", error);
  }
  elementoRendaMensal.textContent = formatarMoeda(rendaMensal);
  atualizarResumo();
  formularioRenda.style.display = "none";
});

formularioCicloMensal.addEventListener("submit", async function (event) {
  event.preventDefault();
  const valor = Number(valorNovoCiclo.value);
  if (!Number.isFinite(valor) || valor <= 0) {
    mensagemCicloMensal.textContent = "Informe uma renda maior que zero.";
    valorNovoCiclo.focus();
    return;
  }
  botaoConfirmarCiclo.disabled = true;
  botaoConfirmarCiclo.textContent = "Salvando...";
  const sucesso = await confirmarCicloMensal(valor);
  botaoConfirmarCiclo.disabled = false;
  botaoConfirmarCiclo.textContent = "Confirmar início do mês";
  if (!sucesso) {
    mensagemCicloMensal.textContent = "Não foi possível salvar o ciclo. Tente novamente.";
    return;
  }
  rendaMensal = valor;
  elementoRendaMensal.textContent = formatarMoeda(rendaMensal);
  atualizarResumo();
  dialogoCicloMensal.close();
});

// =========================
// RECUPERAÇÃO DE SENHA
// =========================

// Mostra a mensagem de recuperação e solicita o envio do link.
botaoEsqueciSenha.addEventListener("click", async function () {
  const email = campoEmail.value.trim();

  // O email precisa ser informado antes de solicitar o link.
  if (!email) {
    mensagemErro.textContent =
      "Digite seu email no campo acima para receber o link de recuperação.";

    campoEmail.focus();
    return;
  }

  mensagemErro.textContent = "";
  botaoEsqueciSenha.disabled = true;

  try {
    // O link retornará para esta mesma página.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });

    if (error) {
      console.error("Erro ao solicitar recuperação:", error);

      mensagemErro.textContent =
        "Não foi possível solicitar a recuperação. Tente novamente.";

      return;
    }

    // Mensagem genérica para não revelar se o email está cadastrado.
    mensagemErro.textContent =
      "Se houver uma conta associada a esse email, você receberá um link para redefinir sua senha.";
  } catch (error) {
    // Trata erros inesperados de conexão ou execução.
    console.error("Erro inesperado na recuperação:", error);

    mensagemErro.textContent =
      "Ocorreu um erro. Verifique sua conexão e tente novamente.";
  } finally {
    // Reativa o botão mesmo se ocorrer um erro.
    botaoEsqueciSenha.disabled = false;
  }
});

// Detecta quando o usuário retorna pelo link de recuperação.
supabase.auth.onAuthStateChange(function (event) {
  if (event !== "PASSWORD_RECOVERY") return;

  // Abre a tela de autenticação e fecha a animação de cadastro.
  mostrarLogin();

  // Esconde o login e exibe apenas a redefinição de senha.
  formularioLogin.hidden = true;
  formularioRedefinirSenha.hidden = false;

  // Ativa o estilo que amplia o cartão para os novos campos.
  authLivro.classList.add("redefinicao-aberta");

  // Limpa campos e mensagens anteriores.
  mensagemErro.textContent = "";
  mensagemRedefinirSenha.textContent = "";

  novaSenha.value = "";
  confirmarNovaSenha.value = "";

  // Leva o foco ao primeiro campo.
  novaSenha.focus();
});

// Valida e salva a nova senha.
formularioRedefinirSenha.addEventListener("submit", async function (event) {
  event.preventDefault();

  const senha = novaSenha.value;
  const confirmacao = confirmarNovaSenha.value;

  mensagemRedefinirSenha.textContent = "";

  // Confere o tamanho mínimo exigido pela interface.
  if (senha.length < 6) {
    mensagemRedefinirSenha.textContent =
      "A senha deve ter pelo menos 6 caracteres.";
    return;
  }

  // Evita salvar quando os dois campos forem diferentes.
  if (senha !== confirmacao) {
    mensagemRedefinirSenha.textContent = "As senhas não coincidem.";
    confirmarNovaSenha.focus();
    return;
  }

  const botaoSalvar = formularioRedefinirSenha.querySelector(
    'button[type="submit"]',
  );

  // Evita envios repetidos enquanto a senha é atualizada.
  botaoSalvar.disabled = true;

  try {
    const { error } = await supabase.auth.updateUser({
      password: senha,
    });

    if (error) {
      console.error("Erro ao redefinir senha:", error);

      mensagemRedefinirSenha.textContent =
        "Não foi possível alterar a senha. Solicite um novo link e tente novamente.";

      return;
    }

    // Encerra a sessão de recuperação após alterar a senha.
    const { error: erroSaida } = await supabase.auth.signOut();

    if (erroSaida) {
      console.error("Erro ao encerrar sessão:", erroSaida);
    }

    // Restaura a interface para o login normal.
    formularioRedefinirSenha.hidden = true;
    formularioLogin.hidden = false;

    authLivro.classList.remove("redefinicao-aberta");

    // Limpa os campos sensíveis.
    novaSenha.value = "";
    confirmarNovaSenha.value = "";
    campoSenha.value = "";

    mensagemErro.textContent =
      "Senha alterada com sucesso! Entre com sua nova senha.";

    mensagemRedefinirSenha.textContent = "";

    navegarPara("login");
    campoEmail.focus();
  } catch (error) {
    console.error("Erro inesperado ao alterar senha:", error);

    mensagemRedefinirSenha.textContent =
      "Ocorreu um erro. Verifique sua conexão e tente novamente.";
  } finally {
    // Reativa o botão independentemente do resultado.
    botaoSalvar.disabled = false;
  }
});


// Navegação da tela de configurações.
const linkConfiguracoes = document.getElementById("linkConfiguracoes");
const secaoConfiguracoes = document.getElementById("configuracoes");
const botaoVoltarPainel = document.getElementById("btnVoltarPainel");
const conteudoPainel = document.querySelector(".conteudo-painel");
const secoesPainel = conteudoPainel ? [...conteudoPainel.children].filter((item) => item !== secaoConfiguracoes) : [];
function mostrarConfiguracoes(abrir) {
  if (!secaoConfiguracoes) return;
  secaoConfiguracoes.hidden = !abrir;
  secoesPainel.forEach((secao) => { secao.hidden = abrir; });
  if (abrir) {
    secaoConfiguracoes.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
linkConfiguracoes?.addEventListener("click", (event) => {
  event.preventDefault();
  mostrarConfiguracoes(true);
});
botaoVoltarPainel?.addEventListener("click", () => mostrarConfiguracoes(false));
