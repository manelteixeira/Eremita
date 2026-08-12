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

const dividasIniciais = [   
    {
        nome: "Internet",
        valor: 100,
        vencimento: "10/08/2026"
    },

    {
        nome: "Faculdade",
        valor: 500,
        vencimento: "15/08/2026"
    }
];

botaoNovaDivida.addEventListener("click", function () {
  formularioDivida.style.display = "block";
});

botaoCancelar.addEventListener("click", function () {
  formularioDivida.style.display = "none";
});

function criarDivida(nomeDivida, valorDivida, vencimentoDivida) {

    let paga = false;

    const novaDivida = document.createElement("div");

    novaDivida.classList.add("divida");

    novaDivida.innerHTML = `
        <div>
            <h3>${nomeDivida}</h3>
            <p>Vencimento: ${vencimentoDivida}</p>
        </div>

        <div>
            <strong>R$ ${valorDivida}</strong>

            <div class="acoes-divida">
                <button type="button" class="btnPagar">Pagar</button>
                <button type="button" class="btnExcluir">Excluir</button>
            </div>
        </div>
    `;

    listaDividas.appendChild(novaDivida);

    const botaoPagar = novaDivida.querySelector(".btnPagar");
    const botaoExcluir = novaDivida.querySelector(".btnExcluir");


    botaoPagar.addEventListener("click", function () {

        console.log("Dívida paga!");

        paga = true;

        totalEmAberto -= valorDivida;

        elementoTotalEmAberto.textContent =
            `R$ ${totalEmAberto.toFixed(2)}`;

        totalPagas += valorDivida;

        elementoTotalPagas.textContent =
            `R$ ${totalPagas.toFixed(2)}`;

        botaoPagar.textContent = "✓ Paga";

        botaoPagar.disabled = true;
    });


    botaoExcluir.addEventListener("click", function () {

        totalDividas -= valorDivida;

        elementoTotalDividas.textContent =
            `R$ ${totalDividas.toFixed(2)}`;


        if (paga === false) {

            totalEmAberto -= valorDivida;

            elementoTotalEmAberto.textContent =
                `R$ ${totalEmAberto.toFixed(2)}`;

        } else {

            totalPagas -= valorDivida;

            elementoTotalPagas.textContent =
                `R$ ${totalPagas.toFixed(2)}`;
        }


        novaDivida.remove();
    });


    totalDividas += valorDivida;

    elementoTotalDividas.textContent =
        `R$ ${totalDividas.toFixed(2)}`;

    totalEmAberto += valorDivida;

    elementoTotalEmAberto.textContent =
        `R$ ${totalEmAberto.toFixed(2)}`;
}
dividasIniciais.forEach(function(divida) {

    criarDivida(
        divida.nome,
        divida.valor,
        divida.vencimento
    );

});

botaoCadastrar.addEventListener("click", function () {

    const nomeDivida =
        document.getElementById("nome-divida").value;

    const valorDivida =
        Number(document.getElementById("valor-divida").value);

    const vencimentoDivida =
        document.getElementById("vencimento-divida").value;

    criarDivida(nomeDivida, valorDivida, vencimentoDivida);

    document.getElementById("nome-divida").value = "";

    document.getElementById("valor-divida").value = "";

    document.getElementById("vencimento-divida").value = "";
});
