import { supabase } from "./supabase.js";

const botaoNovaDivida = document.getElementById("btnNovaDivida");
const formularioDivida = document.getElementById("formularioDivida");

const botaoMenuMobile = document.getElementById("btnMenuMobile");
const estruturaPainel = document.querySelector(".estrutura-painel");

const telaLogin = document.querySelector(".login");
const telaPainel = document.querySelector(".painel");

const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("password");
const mensagemErro = document.getElementById("mensagemErro");

const botaoMostrarSenha = document.getElementById("mostrarSenha");

const botaoEntrar = document.getElementById("btnEntrar");
const botaoSair = document.getElementById("btnSair");

const botaoCancelar = document.getElementById("btnCancelar");
const botaoCadastrar = document.getElementById("btnCadastrar");
const listaDividas = document.getElementById("listaDividas");

const elementoTotalDividas = document.getElementById("totalDividas");
const elementoTotalEmAberto = document.getElementById("totalEmAberto");
const elementoTotalPagas = document.getElementById("totalPagas");
const elementoTotalAtrasadas = document.getElementById("totalAtrasadas");
const elementoQuantidadeAtrasadas = document.getElementById(
  "quantidadeAtrasadas",
);

const botaoCriarConta = document.getElementById("btnCriarConta");
const formularioCadastro = document.getElementById("formularioCadastro");

const botaoCadastrarUsuario = document.getElementById("btnCadastrarUsuario");

const botaoVoltarLogin = document.getElementById("btnVoltarLogin");

const nomeCadastro = document.getElementById("nomeCadastro");
const emailCadastro = document.getElementById("emailCadastro");
const senhaCadastro = document.getElementById("senhaCadastro");
const confirmarSenhaCadastro = document.getElementById(
  "confirmarSenhaCadastro",
);

const mensagemCadastro = document.getElementById("mensagemCadastro");
const botoesFiltro = document.querySelectorAll(".filtro");

const nomeUsuario = document.getElementById("nomeUsuario");

let filtroAtual = "todas";

let dividaEditando = null;

telaPainel.style.display = "none";

const botaoTema = document.getElementById("btnTema");

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
  document.body.classList.toggle("dark-mode");

  const modoEscuro = document.body.classList.contains("dark-mode");

  if (modoEscuro) {
    botaoTema.textContent = "☀️";
    botaoTema.setAttribute("aria-label", "Ativar modo claro");

    localStorage.setItem("tema", "escuro");
  } else {
    botaoTema.textContent = "🌙";
    botaoTema.setAttribute("aria-label", "Ativar modo escuro");

    localStorage.setItem("tema", "claro");
  }
});

botaoMostrarSenha.addEventListener("click", function () {
  if (campoSenha.type === "password") {
    campoSenha.type = "text";
    botaoMostrarSenha.textContent = "🙈";
    botaoMostrarSenha.setAttribute("aria-label", "Ocultar senha");
  } else {
    campoSenha.type = "password";
    botaoMostrarSenha.textContent = "👁";
    botaoMostrarSenha.setAttribute("aria-label", "Mostrar senha");
  }
});

botaoEntrar.addEventListener("click", async function (event) {
  event.preventDefault();

  mensagemErro.textContent = "";

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: senha,
  });

  if (error) {
    console.error("Erro ao entrar:", error);
    mensagemErro.textContent = "Email ou senha incorretos.";
    return;
  }

  console.log("Usuário conectado:", data.user);

  const nome = data.user.user_metadata?.nome || data.user.email;

  nomeUsuario.textContent = `Olá, ${nome}!`;

  // Limpa qualquer dívida que tenha ficado da sessão anterior
  dividas.length = 0;

  // Carrega somente as dívidas do usuário que acabou de entrar
  await carregarDividasSupabase();

  telaLogin.style.display = "none";
  telaPainel.style.display = "block";
});

botaoSair.addEventListener("click", async function () {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Erro ao sair:", error);
    return;
  }

  // Limpa as dívidas da sessão anterior
  dividas.length = 0;

  listaDividas.innerHTML = "";

  atualizarResumo();

  atualizarProximosVencimentos();

  telaPainel.style.display = "none";
  telaLogin.style.display = "block";

  console.log("Usuário desconectado.");
});
botaoCriarConta.addEventListener("click", function () {
  formularioCadastro.style.display = "block";

  campoEmail.style.display = "none";
  campoEmail.previousElementSibling.style.display = "none";

  campoSenha.style.display = "none";
  campoSenha.parentElement.style.display = "none";
  campoSenha.parentElement.previousElementSibling.style.display = "none";

  botaoEntrar.style.display = "none";
  botaoCriarConta.style.display = "none";

  mensagemErro.textContent = "";
});

botaoVoltarLogin.addEventListener("click", function () {
  formularioCadastro.style.display = "none";

  campoEmail.style.display = "block";
  campoEmail.previousElementSibling.style.display = "block";

  campoSenha.style.display = "block";
  campoSenha.parentElement.style.display = "flex";
  campoSenha.parentElement.previousElementSibling.style.display = "block";
  botaoEntrar.style.display = "block";
  botaoCriarConta.style.display = "block";

  mensagemCadastro.textContent = "";

  nomeCadastro.value = "";
  emailCadastro.value = "";
  senhaCadastro.value = "";
  confirmarSenhaCadastro.value = "";
});

botaoCadastrarUsuario.addEventListener("click", async function () {
  const nome = nomeCadastro.value.trim();
  const email = emailCadastro.value.trim();
  const senha = senhaCadastro.value;
  const confirmarSenha = confirmarSenhaCadastro.value;

  mensagemCadastro.textContent = "";

  if (nome === "") {
    mensagemCadastro.textContent = "Digite seu nome.";
    return;
  }

  if (email === "") {
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

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: senha,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        nome: nome,
      },
    },
  });

  if (error) {
    console.error("Erro ao criar usuário:", error);

    mensagemCadastro.textContent = error.message;
    return;
  }

  console.log("Usuário criado:", data.user);

  mensagemCadastro.textContent =
    "Conta criada com sucesso! Você já pode entrar.";

  nomeCadastro.value = "";
  emailCadastro.value = "";
  senhaCadastro.value = "";
  confirmarSenhaCadastro.value = "";
});
botaoMenuMobile.addEventListener("click", function () {
  estruturaPainel.classList.toggle("menu-aberto");

  const menuAberto = estruturaPainel.classList.contains("menu-aberto");

  botaoMenuMobile.textContent = menuAberto ? "✕" : "☰";

  botaoMenuMobile.setAttribute(
    "aria-label",
    menuAberto ? "Fechar menu" : "Abrir menu",
  );
});

// dívidas que realmente estão sendo utilizadas pelo sistema
const dividas = [];

function atualizarResumo() {
  let total = 0;
  let emAberto = 0;
  let pagas = 0;
  let atrasadas = 0;
  let quantidadeAtrasadas = 0;

  dividas.forEach(function (divida) {
    total += divida.valor;

    if (divida.paga === false) {
      if (estaAtrasada(divida)) {
        atrasadas += divida.valor;
        quantidadeAtrasadas++;
      } else {
        emAberto += divida.valor;
      }
    } else {
      pagas += divida.valor;
    }
  });

  elementoTotalDividas.textContent = `R$ ${total.toFixed(2)}`;

  elementoTotalEmAberto.textContent = `R$ ${emAberto.toFixed(2)}`;

  elementoTotalPagas.textContent = `R$ ${pagas.toFixed(2)}`;

  elementoTotalAtrasadas.textContent = `R$ ${atrasadas.toFixed(2)}`;

  elementoQuantidadeAtrasadas.textContent = `${quantidadeAtrasadas} ${
    quantidadeAtrasadas === 1 ? "dívida" : "dívidas"
  }`;
}

async function carregarDividasSupabase() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("Nenhum usuário está logado.");
    return;
  }
  console.log("USUÁRIO ATUAL:", user.id, user.email);

  const { data, error } = await supabase
    .from("dividas")
    .select("*")
    .eq("user_id", user.id)
    .order("vencimento", { ascending: true });

  if (error) {
    console.error("Erro ao carregar dívidas do Supabase:", error);
    return;
  }

  console.log("Dívidas carregadas do Supabase:", data);

  dividas.length = 0;

  data.forEach(function (divida) {
    dividas.push(divida);
  });

  atualizarListaDividas();
  atualizarResumo();
  atualizarProximosVencimentos();
}

// Abrir formulário
botaoNovaDivida.addEventListener("click", function () {
  formularioDivida.style.display = "block";
});

// Fechar formulário
botaoCancelar.addEventListener("click", function () {
  formularioDivida.style.display = "none";
});

function estaAtrasada(divida) {
  if (divida.paga) {
    return false;
  }

  const partes = divida.vencimento.split("-");

  const ano = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const dia = Number(partes[2]);

  const vencimento = new Date(ano, mes, dia);
  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);

  return vencimento < hoje;
}

function obterStatus(divida) {
  if (divida.paga) {
    return "Paga";
  }

  if (estaAtrasada(divida)) {
    return "Atrasada";
  }

  return "Em aberto";
}

function deveMostrarDivida(divida) {
  if (filtroAtual === "todas") {
    return true;
  }

  if (filtroAtual === "abertas") {
    return !divida.paga && !estaAtrasada(divida);
  }

  if (filtroAtual === "atrasadas") {
    return !divida.paga && estaAtrasada(divida);
  }

  if (filtroAtual === "pagas") {
    return divida.paga;
  }

  return true;
}
function ordenarPorVencimento(lista) {
  return [...lista].sort(function (a, b) {
    return a.vencimento.localeCompare(b.vencimento);
  });
}
function atualizarProximosVencimentos() {
  const elemento = document.getElementById("proximosVencimentos");

  const dividasPendentes = dividas
    .filter(function (divida) {
      return !divida.paga;
    })
    .sort(function (a, b) {
      return a.vencimento.localeCompare(b.vencimento);
    });

  if (dividasPendentes.length === 0) {
    elemento.innerHTML = `
      <p>Nenhum vencimento próximo.</p>
    `;

    return;
  }

  const proximas = dividasPendentes.slice(0, 3);

  elemento.innerHTML = "";

  proximas.forEach(function (divida) {
    const item = document.createElement("div");

    item.classList.add("item-vencimento");

    const status = estaAtrasada(divida) ? "Atrasada" : "Em aberto";

    const classeStatus = estaAtrasada(divida)
      ? "vencimento-atrasado"
      : "vencimento-aberto";

    item.innerHTML = `
      <div class="info-vencimento">
        <strong>${divida.nome}</strong>
        <span>Vencimento: ${divida.vencimento}</span>
      </div>

      <div class="valor-vencimento">
        <strong>R$ ${divida.valor.toFixed(2)}</strong>
        <span class="${classeStatus}">${status}</span>
      </div>
    `;

    elemento.appendChild(item);
  });
}
function atualizarListaDividas() {
  listaDividas.innerHTML = "";

  ordenarPorVencimento(dividas).forEach(function (divida) {
    criarDivida(divida);
  });
}

// Criar dívida
function criarDivida(divida) {
  if (!deveMostrarDivida(divida)) {
    return;
  }
  // Criar elemento HTML
  const elementoDivida = document.createElement("div");

  elementoDivida.classList.add("divida");

  if (divida.paga) {
    elementoDivida.classList.add("paga");
  }

  const status = obterStatus(divida);

  let classeStatus = "";

  if (status === "Paga") {
    classeStatus = "status-paga";
  } else if (status === "Atrasada") {
    classeStatus = "status-atrasada";
  } else {
    classeStatus = "status-aberta";
  }

  elementoDivida.innerHTML = `
        <div>
            <h3>${divida.nome}</h3>
            <p>Vencimento: ${divida.vencimento}</p>
           <p class="status-divida">
              Status: <span class="${classeStatus}">${status}</span>
            </p>
        </div>

        <div>
            <strong>R$ ${divida.valor.toFixed(2)}</strong>

           <div class="acoes-dividas">
    <button 
        type="button" 
        class="btnPagar"
        ${divida.paga ? "disabled" : ""}>
        ${divida.paga ? "✓ Paga" : "Pagar"}
    </button>

    <button type="button" class="btnEditar">Editar</button>

    <button type="button" class="btnExcluir">Excluir</button>
</div>
        </div>
    `;

  // Colocar a dívida na tela
  listaDividas.appendChild(elementoDivida);

  // Encontrar os botões
  const botaoPagar = elementoDivida.querySelector(".btnPagar");
  const botaoEditar = elementoDivida.querySelector(".btnEditar");
  const botaoExcluir = elementoDivida.querySelector(".btnExcluir");
  const elementoStatus = elementoDivida.querySelector(".status-divida");

  // Botão pagar
  botaoPagar.addEventListener("click", async function () {
    console.log("Dívida paga!");

    const { data, error } = await supabase
      .from("dividas")
      .update({
        paga: true,
      })
      .eq("id", divida.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao pagar dívida:", error);
      alert("Erro ao marcar a dívida como paga.");
      return;
    }

    divida.paga = data.paga;

    elementoStatus.textContent = "Status: Paga";

    elementoStatus.classList.remove("status-atrasada", "status-aberta");
    elementoStatus.classList.add("status-paga");

    atualizarResumo();
    atualizarProximosVencimentos();

    botaoPagar.textContent = "✓ Paga";

    botaoPagar.disabled = true;

    elementoDivida.classList.add("paga");
  });
  botaoEditar.addEventListener("click", function () {
    dividaEditando = divida;

    console.log("Editando:", divida);
    console.log("dividaEditando:", dividaEditando);

    document.getElementById("nome-divida").value = divida.nome;
    document.getElementById("valor-divida").value = divida.valor;
    document.getElementById("vencimento-divida").value = divida.vencimento;

    formularioDivida.style.display = "block";
  });

  // Botão excluir
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

    console.log("Dívida excluída do Supabase:", divida);

    const indice = dividas.indexOf(divida);

    if (indice !== -1) {
      dividas.splice(indice, 1);
    }

    atualizarResumo();
    atualizarProximosVencimentos();

    elementoDivida.remove();
  });
}

// Cadastrar nova dívida
botaoCadastrar.addEventListener("click", async function (event) {
  event.preventDefault();

  console.log("BOTÃO CADASTRAR CLICADO");
  console.log("dividaEditando no cadastro:", dividaEditando);

  const nomeDivida = document.getElementById("nome-divida").value;

  const valorDivida = Number(document.getElementById("valor-divida").value);

  const vencimentoDivida = document.getElementById("vencimento-divida").value;

  // Validar nome
  if (nomeDivida === "") {
    alert("Digite o nome da dívida.");
    return;
  }

  // Validar valor
  if (valorDivida <= 0) {
    alert("Digite um valor maior que zero.");
    return;
  }

  // Validar vencimento
  if (vencimentoDivida === "") {
    alert("Informe o vencimento da dívida.");
    return;
  }

  if (dividaEditando !== null) {
    const { data, error } = await supabase
      .from("dividas")
      .update({
        nome: nomeDivida,
        valor: valorDivida,
        vencimento: vencimentoDivida,
      })
      .eq("id", dividaEditando.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao editar dívida:", error);
      alert("Erro ao editar a dívida.");
      return;
    }

    console.log("Dívida editada no Supabase:", data);

    dividaEditando.nome = data.nome;
    dividaEditando.valor = data.valor;
    dividaEditando.vencimento = data.vencimento;

    atualizarListaDividas();
    atualizarResumo();
    atualizarProximosVencimentos();

    dividaEditando = null;

    formularioDivida.style.display = "none";

    document.getElementById("nome-divida").value = "";
    document.getElementById("valor-divida").value = "";
    document.getElementById("vencimento-divida").value = "";

    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const novaDivida = {
    nome: nomeDivida,
    valor: valorDivida,
    vencimento: vencimentoDivida,
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

  console.log("Dívida cadastrada no Supabase:", data);

  dividas.push(data);

  atualizarListaDividas();
  atualizarResumo();

  formularioDivida.style.display = "none";

  document.getElementById("nome-divida").value = "";
  document.getElementById("valor-divida").value = "";
  document.getElementById("vencimento-divida").value = "";
});
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
