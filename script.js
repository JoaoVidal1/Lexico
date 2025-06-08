const GAMESTATE = {
    currentPlayer: 'red',
    currentWord: '',
    boxIndex: 1,
    points: { red: 0, blue: 0},
    timer: null,
    countdown: null,
    endTime: null,
    newGame: false,
    continueTurn: true
};

const CONFIG = {
    colors: {
        red : "#ff2b47",
        blue : "#992bff",
        genDisable : "#333333"
    },
    charPattern: /^[a-zA-Z]$/,
    charNotAllowed: /[áâéêíóôúç]/gi,
    maxPoints: 15,
    maxTime: 15,
    lang: document.getElementById('select-lang').value,
    dicio: {
        pt: {},
        en: {}
    },
    links: {
        palavra: {
            pt: `https://www.dicio.com.br/`,
            en: `https://dictionary.cambridge.org/dictionary/english/`
        },
        prefixo: {
            pt: `https://www.dicio.com.br/palavras-comecam-`,
            en: `https://www.merriam-webster.com/wordfinder/classic/begins/all/-1/`
        }
    }
};

const DOM = {
    startForm: document.getElementById('comecar-partida'),
    inputTime: document.getElementById('input-tempo'),
    startBtn: document.getElementById('comecar-partida').querySelector('button'),
    countdown: document.getElementById('countdown'),
    victoryModal: document.getElementById('vitoria-round'),
    victoryDetails: document.getElementById('detalhes-vitoria'),
    firstBox: document.getElementById('char1'),
    charBoxes: document.getElementsByClassName('input-char'),
    validMsg: document.getElementById('char-valido'),
    scoreBar: {
      red: document.getElementById('pontos-red'),
      blue: document.getElementById('pontos-blue'),
    },
    help: document.getElementById("ajuda")
};

let turnTimer;
let countdownInterval;
let endTime;

function novaPartida(event) {
    CONFIG.maxTime = Number(DOM.inputTime.value),
    event.preventDefault();
    DOM.startForm.style.display = 'none';
    resetRound();
}

function resetRound() {
    clearTimeout(turnTimer);
    clearInterval(countdownInterval);
    GAMESTATE.boxIndex = 1;
    GAMESTATE.currentWord = '';
    travarInput();
    for (let box of DOM.charBoxes) {
        box.style.borderColor = CONFIG.colors.genDisable;
        box.value = '';
    }

    
    DOM.firstBox.value = "";
    DOM.firstBox.disabled = false;
    DOM.firstBox.style.borderColor = GAMESTATE.currentPlayer === "red" ? CONFIG.colors.red : CONFIG.colors.blue;
    DOM.firstBox.style.boxShadow = `0px 0px 1dvw ${GAMESTATE.currentPlayer === "red" ? CONFIG.colors.red : CONFIG.colors.blue}`;
    DOM.firstBox.focus();
}

function novaLetra(box) {
    GAMESTATE.boxIndex = box;
    let cBox = document.getElementById(`char${GAMESTATE.boxIndex}`);

    if (!CONFIG.charPattern.test(cBox.value)) {
        document.getElementById(`char-valido`).style.display = 'flex';
        cBox.value = "";
        cBox.disabled = false;
        return;
    }

    travarInput();

    document.getElementById("countdown").style.display = 'block';
    GAMESTATE.continueTurn = true;

    clearTimeout(turnTimer);
    clearInterval(countdownInterval);

    cBox.disabled = true;
    cBox.style.boxShadow = `none`
    GAMESTATE.currentWord += cBox.value.toLowerCase();

    // Trocar jogador ANTES de verificar a palavra
    GAMESTATE.currentPlayer = GAMESTATE.currentPlayer === "red" ? "blue" : "red";
    let newColor = CONFIG.colors[GAMESTATE.currentPlayer];

    verificarPalavra().then(() => {
        if (GAMESTATE.boxIndex < 8 && GAMESTATE.continueTurn) {
            let nBox = document.getElementById(`char${GAMESTATE.boxIndex + 1}`);
            nBox.style.borderColor = newColor;
            nBox.style.boxShadow = `0px 0px 1dvw ${newColor}`
            nBox.disabled = false;
            nBox.focus();
            startTurnTimer();
        }
    });
}

async function verificarPalavra() {
    async function matchWord() {
        return CONFIG.dicio[CONFIG.lang][GAMESTATE.currentWord[0].toLowerCase()].some(word => word === (GAMESTATE.currentWord));
    }

    async function matchPrefix() {
        if (CONFIG.dicio[CONFIG.lang][GAMESTATE.currentWord[0].toLowerCase()].some(word => word.startsWith(GAMESTATE.currentWord))) return true
        else return CONFIG.dicio[CONFIG.lang]["extra"].some(word => word.startsWith(GAMESTATE.currentWord))
    }
    
    // Verificar se a palavra atual é uma palavra completa (jogador perde)
    if (GAMESTATE.currentWord.length >= 5) {
        const palavraExiste = await matchWord();
        
        if (palavraExiste) {
            // Jogador ANTERIOR perde (digitou uma palavra completa)
            const jogadorPerdedor = GAMESTATE.currentPlayer === "red" ? "blue" : "red";
            const vencedor = GAMESTATE.currentPlayer;
            await vitoriaRound(2, vencedor);
            return;
        }
    }
    
    // Verificar se é um prefixo válido (pode continuar)
    const ehPrefixoValido = await matchPrefix();
    
    if (!ehPrefixoValido) {
        // Não é nem palavra nem prefixo válido - jogador ANTERIOR perde
        const jogadorPerdedor = GAMESTATE.currentPlayer === "red" ? "blue" : "red";
        const vencedor = GAMESTATE.currentPlayer;
        await vitoriaRound(1, vencedor);
        return;
    }
    
    // Se chegou no fim das casas sem formar palavra nem prefixo inválido
    if (GAMESTATE.boxIndex >= 8) {
        await vitoriaRound(0, null); // Empate
    }
}

async function vitoriaRound(caso, vencedor) {
    GAMESTATE.continueTurn = false;
    DOM.countdown.style.display = 'none';
    travarInput();
    
    let pontosRodada = 9 - GAMESTATE.boxIndex;
    
    if (caso === 0) {
        // Empate
        DOM.victoryDetails.innerHTML = `Houve um empate<br><span style="color:${GAMESTATE.currentPlayer === "red" ? CONFIG.colors.red : CONFIG.colors.blue}">'${GAMESTATE.currentWord}'</span> não é uma palavra, mas é possível prosseguir a partir dela<br><a id="link-sentido" target="_blank" rel=”noopener noreferrer” href="https://www.dicio.com.br/pesquisa.php?q=${GAMESTATE.currentWord}">Palavras possíveis</a>`;
        document.getElementById("link-sentido").style.color = "#00ffbf";
    } else {
        // Alguém ganhou
        const nomeVencedor = vencedor === "red" ? "VERMELHO" : "AZUL";
        DOM.victoryDetails.innerHTML = `<span id="cor-vitoria">${pontosRodada} PONTOS PARA O ${nomeVencedor}</span><br>`;
        
        // Adicionar pontos ao vencedor
        if (vencedor === "red") {
            GAMESTATE.points.red += pontosRodada;
        } else {
            GAMESTATE.points.blue += pontosRodada;
        }
        
        // Verificar vitória do jogo
        if (GAMESTATE.points.blue > CONFIG.maxPoints || GAMESTATE.points.red > CONFIG.maxPoints) {
            vitoriaJogo();
            return;
        }
        
        // Mensagens específicas por caso
        switch (caso) {
            case 1:
                let previous = GAMESTATE.currentWord.split("").toSpliced(-1).join("");
                console.log(CONFIG.links.prefixo[CONFIG.lang] + previous + (CONFIG.lang === "en" ? '/1' : ""))
                DOM.victoryDetails.innerHTML += `Não é possível continuar a partir de "${GAMESTATE.currentWord}" <br><a id="link-sentido" target="_blank" rel=”noopener noreferrer” href="${CONFIG.links.prefixo[CONFIG.lang] + previous + (CONFIG.lang === "en" ? '/1' : "")}">Palavras que começam por "${previous}"</a>`;
                document.getElementById("link-sentido").style.color = vencedor === "red" ? CONFIG.colors.red : CONFIG.colors.blue;
                break;
            case 2:
                DOM.victoryDetails.innerHTML += `O jogador ${vencedor === "red" ? "azul" : "vermelho"} digitou a palavra <br><a id="link-sentido" target="_blank" rel=”noopener noreferrer” href="${CONFIG.links.palavra[CONFIG.lang] + GAMESTATE.currentWord}">"${GAMESTATE.currentWord}"</a>`;
                document.getElementById("link-sentido").style.color = vencedor === "red" ? CONFIG.colors.red : CONFIG.colors.blue;
                break;
            case 3:
                DOM.victoryDetails.innerHTML += `O jogador anterior demorou demais<br><a id="link-sentido" target="_blank" rel=”noopener noreferrer” href="${CONFIG.lang === "pt" ? `https://www.dicio.com.br/palavras-comecam-${GAMESTATE.currentWord}` : `https://www.merriam-webster.com/wordfinder/classic/begins/all/-1/${GAMESTATE.currentWord}/1`}">Palavras que começam por "${GAMESTATE.currentWord}"</a>`;
                document.getElementById("link-sentido").style.color = vencedor === "red" ? CONFIG.colors.red : CONFIG.colors.blue;
                break;
        }
        
        document.getElementById("cor-vitoria").style.color = vencedor === "red" ? CONFIG.colors.red : CONFIG.colors.blue;
    }
    
    DOM.victoryModal.style.display = "flex";
}

function travarInput() {
    for (let box of DOM.charBoxes) {
        box.disabled = true;
        box.style.boxShadow = 'none';
    }
}

function proximoRound() {
    if (GAMESTATE.newGame) {
        GAMESTATE.newGame = false;
        DOM.victoryModal.style.display = 'flex';
    } else {
    DOM.victoryModal.style.display = 'none';
    DOM.scoreBar.red.style.height = `${GAMESTATE.points.red*100/CONFIG.maxPoints}dvh`;
    DOM.scoreBar.blue.style.height = `${GAMESTATE.points.blue*100/CONFIG.maxPoints}dvh`;
    resetRound();
    }
}

function vitoriaJogo() {
    DOM.victoryDetails.innerHTML = `PARABÉNS JOGADOR <span style="color:${GAMESTATE.points.red  > GAMESTATE.points.blue ? CONFIG.colors.red : CONFIG.colors.blue}">${GAMESTATE.points.red > GAMESTATE.points.blue ? "VERMELHO" : "AZUL"}</span>, VOCÊ VENCEU!<br><span style="color:${CONFIG.colors.red}">${GAMESTATE.points.red}</span> : <span style="color:${CONFIG.colors.blue}">${GAMESTATE.points.blue}</span>`;
    DOM.victoryModal.style.display = "flex";
    GAMESTATE.currentPlayer = "red";
    GAMESTATE.currentWord = "";
    GAMESTATE.points.red = 0;
    GAMESTATE.points.blue = 0;
    GAMESTATE.newGame = true;
    DOM.startForm.style.display = 'flex';
}

function startTurnTimer() {
    clearTimeout(turnTimer);
    clearInterval(countdownInterval);

    endTime = new Date().getTime() + CONFIG.maxTime * 1000;

    updateCountdownDisplay();

    countdownInterval = setInterval(updateCountdownDisplay, 1000);
    turnTimer = setTimeout(timeOutAction, CONFIG.maxTime * 1000);
    DOM.countdown.style.color = GAMESTATE.currentPlayer === "red" ? CONFIG.colors.red : CONFIG.colors.blue;
    DOM.countdown.style.borderColor = GAMESTATE.currentPlayer === "red" ? CONFIG.colors.red : CONFIG.colors.blue;
}

function timeOutAction() {
    vitoriaRound(3, GAMESTATE.currentPlayer === "red" ? "AZUL" : "VERMELHO");
}

function updateCountdownDisplay() {
    const now = new Date().getTime();
    let timeLeft = Math.ceil((endTime - now) / 1000);

    if (timeLeft < 0) {
        timeLeft = 0;
    }
    
    if (DOM.countdown) {
        DOM.countdown.innerText = timeLeft > 9 ? `00:${timeLeft}` : `00:0${timeLeft}`;
    }
}

// Função que atualiza o atributo lang da página
function resetGame() {
    const select = document.getElementById('select-lang');
    const langSelecionado = select.value;
    
    DOM.countdown.style.display = 'none';
    document.documentElement.setAttribute('lang', langSelecionado);
    CONFIG.lang = langSelecionado;
    GAMESTATE.currentPlayer = "red";
    GAMESTATE.currentWord = "";
    GAMESTATE.points.red = 0;
    GAMESTATE.points.blue = 0;
    GAMESTATE.newGame = true;
    document.getElementById("comecar-partida").style.display = 'flex';
}

// Adiciona o event listener para mudança no select
document.getElementById('select-lang').addEventListener('change', resetGame);

document.getElementById('title').addEventListener('click', resetGame);


function mudarTema() {
    let tema = document.documentElement.getAttribute("data-theme");

    if (tema === "light") {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
    }
}

async function loadWords() {
    const portugues = await fetch('dicionarios/wordsPT.json');
    CONFIG.dicio.pt = await portugues.json();
    
    const english = await fetch('dicionarios/wordsEN.json');
    CONFIG.dicio.en = await english.json();
}

document.addEventListener("DOMContentLoaded", () => {
    let temaSalvo = localStorage.getItem("theme");
    if (temaSalvo) {
        document.documentElement.setAttribute("data-theme", temaSalvo);
    }
    loadWords();
});