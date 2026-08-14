const botaoNovaDivida = document.getElementById("btnNovaDivida");
const formularioDivida = document.getElementById("formularioDivida");

const telaLogin = document.querySelector(".login");
const telaPainel = document.querySelector(".painel");

const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("password");
const emailCorreto = "emanuel@eremita.com";
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

telaPainel.style.display = "none";

botaoEntrar.addEventListener("click", function (event) {
  event.preventDefault();

  if (
    campoEmail.value === emailCorreto &&
    campoSenha.value === senhaCorreta
  ) {
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
    vencimento: "10/08/2026",
    paga: false,
  },
  {
    nome: "Faculdade",
    valor: 500,
    vencimento: "15/08/2026",
    paga: false,
  },
];

// dívidas que realmente estão sendo utilizadas pelo sistema
const dividas = [];

function atualizarResumo() {
  let total = 0;
  let emAberto = 0;
  let pagas = 0;

  dividas.forEach(function (divida) {
    total += divida.valor;

    if (divida.paga === false) {
      emAberto += divida.valor;
    } else {
      pagas += divida.valor;
    }
  });

  elementoTotalDividas.textContent = `R$ ${total.toFixed(2)}`;

  elementoTotalEmAberto.textContent = `R$ ${emAberto.toFixed(2)}`;

  elementoTotalPagas.textContent = `R$ ${pagas.toFixed(2)}`;
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

// Abrir formulário
botaoNovaDivida.addEventListener("click", function () {
  formularioDivida.style.display = "block";
});

// Fechar formulário
botaoCancelar.addEventListener("click", function () {
  formularioDivida.style.display = "none";
});

// Criar dívida
function criarDivida(divida) {
  // Criar elemento HTML
  const elementoDivida = document.createElement("div");

  elementoDivida.classList.add("divida");

  elementoDivida.innerHTML = `
        <div>
            <h3>${divida.nome}</h3>
            <p>Vencimento: ${divida.vencimento}</p>
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
                <button type="button" class="btnExcluir">Excluir</button>
            </div>
        </div>
    `;

  // Colocar a dívida na tela
  listaDividas.appendChild(elementoDivida);

  // Encontrar os botões
  const botaoPagar = elementoDivida.querySelector(".btnPagar");
  const botaoExcluir = elementoDivida.querySelector(".btnExcluir");

  // Botão pagar
  botaoPagar.addEventListener("click", function () {
    console.log("Dívida paga!");

    divida.paga = true;

    salvarDividas();

    atualizarResumo();

    botaoPagar.textContent = "✓ Paga";

    botaoPagar.disabled = true;
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

// Criar as dívidas iniciais
carregarDividas();

dividas.forEach(function (divida) {
  criarDivida(divida);
});

atualizarResumo();

// Cadastrar nova dívida
botaoCadastrar.addEventListener("click", function () {
  const nomeDivida = document.getElementById("nome-divida").value;

  const valorDivida = Number(document.getElementById("valor-divida").value);

  const vencimentoDivida = document.getElementById("vencimento-divida").value;

  const novaDivida = {
    nome: nomeDivida,
    valor: valorDivida,
    vencimento: vencimentoDivida,
    paga: false,
  };

  dividas.push(novaDivida);

  salvarDividas();

  criarDivida(novaDivida);

  atualizarResumo();
});
