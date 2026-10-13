
// ==========================================
// CARDIOSIM - SIMULADOR CARDIACO EDUCATIVO
// ==========================================

"use strict";

const $ = (id) => document.getElementById(id);

const latasInput = $("latas");
const duracaoInput = $("duracao");
const bpmInput = $("bpmInicial");
const canvas = $("grafico");
const ctx = canvas.getContext("2d");

const botaoIniciar = $("iniciar");
const botaoReiniciar = $("reiniciar");

let temporizador = null;
let indiceAtual = 0;
let tempos = [];
let dados = [];

const TOTAL_PONTOS = 49;

// Lê as configurações selecionadas.
function configuracao() {
    return {
        latas: Number(latasInput.value),
        duracao: Number(duracaoInput.value),
        bpmInicial: Number(bpmInput.value)
    };
}

// Modelo matemático hipotético.
// Não representa uma resposta clínica real.
function calcularBpm(hora, latas, bpmInicial) {
    const aumento =
        latas *
        8 *
        (1 - Math.exp(-hora / 0.5)) *
        Math.exp(-hora / 2.5);

    return Math.round(bpmInicial + aumento);
}

function formatarNumero(numero) {
    return numero.toLocaleString("pt-BR", {
        maximumFractionDigits: 1
    });
}

// Para a animação, se estiver ativa.
function pararTemporizador() {
    if (temporizador !== null) {
        clearInterval(temporizador);
        temporizador = null;
    }
}

// Atualiza os textos dos controles.
function atualizarRotulos() {
    const c = configuracao();

    $("valorLatas").textContent =
        `${c.latas} ${c.latas === 1 ? "lata" : "latas"}`;

    $("valorDuracao").textContent =
        `${c.duracao} ${c.duracao === 1 ? "hora" : "horas"}`;

    $("valorBpmInicial").textContent =
        `${c.bpmInicial} BPM`;
}

// Gera os dados para o gráfico.
function gerarDados() {
    const c = configuracao();

    tempos = Array.from(
        { length: TOTAL_PONTOS },
        (_, i) => c.duracao * i / (TOTAL_PONTOS - 1)
    );

    dados = tempos.map(hora =>
        calcularBpm(hora, c.latas, c.bpmInicial)
    );
}

// Desenha o gráfico diretamente no Canvas.
function desenharGrafico() {
    const area = canvas.getBoundingClientRect();

    if (area.width <= 0 || area.height <= 0 || dados.length === 0) {
        return;
    }

    const escala = Math.min(window.devicePixelRatio || 1, 2);
    const largura = area.width;
    const altura = area.height;

    canvas.width = Math.round(largura * escala);
    canvas.height = Math.round(altura * escala);

    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    ctx.clearRect(0, 0, largura, altura);

    const margem = {
        esquerda: 49,
        direita: 15,
        topo: 18,
        baixo: 43
    };

    const graficoLargura =
        largura - margem.esquerda - margem.direita;

    const graficoAltura =
        altura - margem.topo - margem.baixo;

    const c = configuracao();

    // Escala vertical.
    const menorValor = Math.min(c.bpmInicial, ...dados);
    const maiorValor = Math.max(c.bpmInicial, ...dados);

    let minY = Math.max(
        0,
        Math.floor((menorValor - 10) / 10) * 10
    );

    let maxY = Math.ceil(
        (maiorValor + 10) / 10
    ) * 10;

    // Evita uma escala sem amplitude.
    if (maxY <= minY) {
        maxY = minY + 20;
    }

    // Converte índice em posição horizontal.
    function x(i) {
        return margem.esquerda +
            (i / (dados.length - 1)) * graficoLargura;
    }

    // Valores maiores ficam em cima.
    function y(valor) {
        return margem.topo +
            ((maxY - valor) / (maxY - minY)) * graficoAltura;
    }

    // Fundo.
    ctx.fillStyle = "#0d1729";
    ctx.fillRect(0, 0, largura, altura);

    // Eixo vertical: linhas e valores em ordem correta.
    const passos = 4;

    ctx.font = "11px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= passos; i++) {
        const proporcao = i / passos;

        const valor =
            maxY - (maxY - minY) * proporcao;

        const posY =
            margem.topo + proporcao * graficoAltura;

        ctx.beginPath();
        ctx.moveTo(margem.esquerda, posY);
        ctx.lineTo(largura - margem.direita, posY);

        ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";

        ctx.fillText(
            String(Math.round(valor)),
            margem.esquerda - 9,
            posY
        );
    }

    // Linha horizontal do BPM inicial.
    ctx.save();

    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(margem.esquerda, y(c.bpmInicial));
    ctx.lineTo(largura - margem.direita, y(c.bpmInicial));
    ctx.stroke();

    ctx.restore();

    // Área preenchida sob a curva.
    ctx.beginPath();

    ctx.moveTo(
        x(0),
        margem.topo + graficoAltura
    );

    dados.forEach((valor, i) => {
        ctx.lineTo(x(i), y(valor));
    });

    ctx.lineTo(
        x(dados.length - 1),
        margem.topo + graficoAltura
    );

    ctx.closePath();
    ctx.fillStyle = "rgba(45, 212, 191, 0.12)";
    ctx.fill();

    // Linha principal do gráfico.
    ctx.beginPath();

    dados.forEach((valor, i) => {
        if (i === 0) {
            ctx.moveTo(x(i), y(valor));
        } else {
            ctx.lineTo(x(i), y(valor));
        }
    });

    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Marcador da posição atual.
    const indice = Math.min(indiceAtual, dados.length - 1);
    const pontoX = x(indice);
    const pontoY = y(dados[indice]);

    ctx.beginPath();
    ctx.arc(pontoX, pontoY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#2dd4bf";
    ctx.fill();

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rótulos do eixo horizontal.
    ctx.font = "11px Arial";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = 0; i <= 4; i++) {
        const hora = c.duracao * i / 4;

        const posX =
            margem.esquerda + (i / 4) * graficoLargura;

        ctx.fillText(
            `${formatarNumero(hora)} h`,
            posX,
            margem.topo + graficoAltura + 12
        );
    }
}

// Atualiza os indicadores e o progresso.
function atualizarIndicadores() {
    const c = configuracao();

    const indice = Math.min(indiceAtual, dados.length - 1);
    const bpmAtual = dados[indice] ?? c.bpmInicial;
    const horaAtual = tempos[indice] ?? 0;

    const percentual =
        c.duracao > 0 ? horaAtual / c.duracao * 100 : 0;

    $("bpm").textContent = bpmAtual;
    $("tempo").textContent = formatarNumero(horaAtual);

    $("situacao").textContent =
        "Valor hipotético do modelo";

    $("progressoTexto").textContent =
        `${Math.round(percentual)}% concluído`;

    $("progressoBarra").style.width =
        `${percentual}%`;

    desenharGrafico();
}

// Atualiza tudo quando um slider é movido.
function atualizarCenario() {
    pararTemporizador();

    indiceAtual = 0;

    atualizarRotulos();
    gerarDados();
    atualizarIndicadores();

    botaoIniciar.disabled = false;
    botaoIniciar.textContent = "Iniciar simulação";

    $("mensagem").textContent =
        "Cenário atualizado. Inicie para animar o tempo.";
}

// Avança a simulação.
function avancarTempo() {
    if (indiceAtual >= tempos.length - 1) {
        pararTemporizador();

        botaoIniciar.disabled = false;
        botaoIniciar.textContent = "Iniciar simulação";

        $("mensagem").textContent =
            "Simulação concluída. Os valores são hipotéticos.";

        return;
    }

    indiceAtual++;

    atualizarIndicadores();

    if (indiceAtual >= tempos.length - 1) {
        pararTemporizador();

        botaoIniciar.disabled = false;
        botaoIniciar.textContent = "Iniciar simulação";

        $("mensagem").textContent =
            "Simulação concluída. Os valores são hipotéticos.";
    }
}

// Botão iniciar.
function iniciarSimulacao() {
    if (temporizador !== null) {
        return;
    }

    if (indiceAtual >= tempos.length - 1) {
        indiceAtual = 0;
        atualizarIndicadores();
    }

    botaoIniciar.disabled = true;
    botaoIniciar.textContent = "Simulação em andamento";

    $("mensagem").textContent =
        "Avançando no tempo simulado...";

    temporizador = setInterval(avancarTempo, 500);
}

// Botão reiniciar.
function reiniciarSimulacao() {
    pararTemporizador();

    indiceAtual = 0;

    atualizarRotulos();
    gerarDados();
    atualizarIndicadores();

    botaoIniciar.disabled = false;
    botaoIniciar.textContent = "Iniciar simulação";

    $("mensagem").textContent =
        "Simulação reiniciada com os parâmetros atuais.";
}

// Eventos dos controles.
latasInput.addEventListener("input", atualizarCenario);
duracaoInput.addEventListener("input", atualizarCenario);
bpmInput.addEventListener("input", atualizarCenario);

// Eventos dos botões.
botaoIniciar.addEventListener("click", iniciarSimulacao);
botaoReiniciar.addEventListener("click", reiniciarSimulacao);

// Redesenha ao redimensionar a janela.
window.addEventListener("resize", desenharGrafico);

// Inicialização.
atualizarCenario();
