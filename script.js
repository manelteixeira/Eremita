import { supabase } from "./supabase.js";

const botaoNovaDivida = document.getElementById("btnNovaDivida");
const formularioDivida = document.getElementById("formularioDivida");

const telaLogin = document.querySelector(".login");
const telaPainel = document.querySelector(".painel");

const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("password");
const emailCorreto = "claudioemanuel0208@gmail.com";
const senhaCorreta = "123456";
const mensagemErro = document.getElementById("mensagemErro");

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
const botoesFiltro = document.querySelectorAll(".filtro");

let filtroAtual = "todas";

let dividaEditando = null;

telaPainel.style.display = "none";

botaoEntrar.addEventListener("click", function (event) {
  event.preventDefault();

  if (campoEmail.value === emailCorreto && campoSenha.value === senhaCorreta) {
    telaLogin.style.display = "none";
    telaPainel.style.display = "block";
  } else {
    mensagemErro.textContent = "Email ou senha incorretos.";
  }
});

botaoSair.addEventListener("click", function () {
  telaPainel.style.display = "none";
  telaLogin.style.display = "block";
});

// Dívidas iniciais
const dividasIniciais = [
  {
    nome: "Internet",
    valor: 100,
    vencimento: "2026-08-10",
    paga: false,
  },
  {
    nome: "Faculdade",
    valor: 500,
    vencimento: "2026-08-15",
    paga: false,
  },
];

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

function salvarDividas() {
  const dados = JSON.stringify(dividas);

  localStorage.setItem("dividas", dados);
}

function carregarDividas() {
  const dados = localStorage.getItem("dividas");

  if (dados) {
    const dividasSalvas = JSON.parse(dados);

    dividasSalvas.forEach(function (divida) {
      dividas.push(divida);
    });
  } else {
    dividasIniciais.forEach(function (divida) {
      dividas.push(divida);
    });
  }
}

async function carregarDividasSupabase() {
  const { data, error } = await supabase
    .from("dividas")
    .select("*")
    .order("vencimento", { ascending: true });

  if (error) {
    console.error("Erro ao carregar dívidas do Supabase:", error);
    return;
  }

  console.log("Dívidas carregadas do Supabase:", data);

  data.forEach(function (divida) {
    dividas.push(divida);
  });

  atualizarListaDividas();
  atualizarResumo();
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
  botaoPagar.addEventListener("click", function () {
    console.log("Dívida paga!");

    divida.paga = true;

    elementoStatus.textContent = "Status: Paga";

    elementoStatus.classList.remove("status-atrasada", "status-aberta");
    elementoStatus.classList.add("status-paga");

    salvarDividas();

    atualizarResumo();

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
  botaoExcluir.addEventListener("click", function () {
    const indice = dividas.indexOf(divida);

    dividas.splice(indice, 1);

    salvarDividas();

    atualizarResumo();

    elementoDivida.remove();
  });

  // Atualizar total de dívidas
  atualizarResumo();
}

// Carregar dívidas do Supabase
carregarDividasSupabase();

// console.log("Internet atrasada?", estaAtrasada(dividas[0]));
// console.log("Faculdade atrasada?", estaAtrasada(dividas[1]));

// ordenarPorVencimento(dividas).forEach(function (divida) {
//   criarDivida(divida);
// });

// atualizarResumo();

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

  dividaEditando = null;

  formularioDivida.style.display = "none";

  document.getElementById("nome-divida").value = "";
  document.getElementById("valor-divida").value = "";
  document.getElementById("vencimento-divida").value = "";

  return;
}

  const novaDivida = {
    nome: nomeDivida,
    valor: valorDivida,
    vencimento: vencimentoDivida,
    paga: false,
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
async function testarSupabase() {
  const { data, error } = await supabase.from("dividas").select("*").limit(1);

  if (error) {
    console.error("ERRO AO CONECTAR COM SUPABASE:", error);
    return;
  }

  console.log("SUPABASE CONECTADO COM SUCESSO!");
  console.log("Dados encontrados:", data);
}

testarSupabase();
