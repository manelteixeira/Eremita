import { supabase } from "./supabase.js";
import "./animacoes/animated-gradient.js";

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
const elementoSaldoMensal = document.getElementById("saldoMensal");
const textoSituacao = document.getElementById("textoSituacao");
const mensagemSituacao = document.getElementById("mensagemSituacao");

// =========================
// ESTADO
// =========================

const dividas = [];
let filtroAtual = "todas";
let dividaEditando = null;
let rendaMensal = 0;
const tabelaRenda = "renda_mensal";

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
  const saldo = rendaMensal - emAberto - atrasadas;
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
}
async function carregarRenda() {
  const { data, error } = await supabase
    .from(tabelaRenda)
    .select("valor")
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Erro ao carregar renda:", error);
    return;
  }

  rendaMensal = data ? Number(data.valor) : 0;
  elementoRendaMensal.textContent = formatarMoeda(rendaMensal);
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
  switch (filtroAtual) {
    case "abertas":
      return !divida.paga && !estaAtrasada(divida);

    case "atrasadas":
      return !divida.paga && estaAtrasada(divida);

    case "pagas":
      return divida.paga;

    default:
      return true;
  }
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

  [...dividas]
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
    .filter(deveMostrarDivida)
    .forEach(criarDivida);
}

function criarDivida(divida) {
  const status = obterStatus(divida);
  const elementoDivida = document.createElement("div");

  elementoDivida.classList.add("divida");

  if (divida.paga) {
    elementoDivida.classList.add("paga");
  }

  elementoDivida.innerHTML = `
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

        <button type="button" class="btnEditar">Editar</button>
        <button type="button" class="btnExcluir">Excluir</button>
      </div>
    </div>
  `;

  listaDividas.appendChild(elementoDivida);

  const botaoPagar = elementoDivida.querySelector(".btnPagar");
  const botaoEditar = elementoDivida.querySelector(".btnEditar");
  const botaoExcluir = elementoDivida.querySelector(".btnExcluir");
  const elementoStatus = elementoDivida.querySelector(".status-divida span");

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
  });

  botaoEditar.addEventListener("click", function () {
    dividaEditando = divida;

    nomeDivida.value = divida.nome;
    valorDivida.value = divida.valor;
    vencimentoDivida.value = divida.vencimento;

    formularioDivida.style.display = "block";
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
  formularioDivida.style.display = "block";
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
  fecharFormularioDivida();
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
  fecharFormularioDivida();
}

// =========================
// FILTROS
// =========================

botoesFiltro.forEach(function (botao) {
  botao.addEventListener("click", function () {
    filtroAtual = botao.dataset.filtro;

    botoesFiltro.forEach(function (botaoFiltro) {
      botaoFiltro.classList.remove("ativo");
    });

    botao.classList.add("ativo");
    atualizarListaDividas();
  });
});
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

  elementoRendaMensal.textContent = formatarMoeda(rendaMensal);
  atualizarResumo();
  formularioRenda.style.display = "none";
});
