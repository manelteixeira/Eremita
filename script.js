const botaoNovaDivida = document.getElementById("btnNovaDivida");
const formularioDivida = document.getElementById("formularioDivida");
const botaoCancelar = document.getElementById("btnCancelar");
const botaoCadastrar = document.getElementById("btnCadastrar");
const listaDividas = document.getElementById("listaDividas");

const elementoTotalDividas = document.getElementById("totalDividas");
const elementoTotalEmAberto = document.getElementById("totalEmAberto");
const elementoTotalPagas = document.getElementById("totalPagas");

let totalDividas = 0;
let totalEmAberto = 0;
let totalPagas = 0;

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

dividasIniciais.forEach(function (divida) {
  dividas.push(divida);
});

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

    atualizarResumo();

    botaoPagar.textContent = "✓ Paga";

    botaoPagar.disabled = true;
  });

  // Botão excluir
  botaoExcluir.addEventListener("click", function () {

    const indice = dividas.indexOf(divida);

    dividas.splice(indice, 1);

    atualizarResumo();

    elementoDivida.remove();
  });

  // Atualizar total de dívidas
  totalDividas += divida.valor;

  elementoTotalDividas.textContent = `R$ ${totalDividas.toFixed(2)}`;

  // Atualizar total em aberto
  totalEmAberto += divida.valor;

  elementoTotalEmAberto.textContent = `R$ ${totalEmAberto.toFixed(2)}`;
}

// Criar as dívidas iniciais
dividasIniciais.forEach(function (divida) {
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

  criarDivida(novaDivida);

  atualizarResumo();
});
