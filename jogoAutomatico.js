const red = "#ff2b47";
const blue = "#992bff";
const redlight = "#ff8292";
const bluelight = "#c587ff";
const genDisable = "#333333";
const caracteres = /^[a-zA-Z]$/;
const caracteresInvalidos = /^[WwYyKkXx]$/

let maxPoints = 15;
let maxTime = 3;
let turnTimer;

let jgdrAtual = "vermelho";
let palavra = "";

let pontosRed = 0.75;
let pontosBlue = 0.75;

let caixaAtual = 0;

function resetRound() {
    palavra = "";
    let initialBox = document.getElementById(`char1`);
    let disabledBoxes = document.getElementsByClassName("start-disabled");
    initialBox.value = "";
    initialBox.disabled = false;
    initialBox.style.borderColor = jgdrAtual === "vermelho" ? red : blue;
    initialBox.style.boxShadow = `0px 0px 1.5dvw ${jgdrAtual === "vermelho" ? red : blue}`;

    for (let box of disabledBoxes) {
        box.disabled = true;
        box.value = "";
        box.style.borderColor = genDisable;
        box.style.boxShadow = `none`;
    }
}

function novaLetra(box) {
    travarInput();
    caixaAtual = box;
    let cBox = document.getElementById(`char${caixaAtual}`);

    if (!caracteres.test(cBox.value) || (caixaAtual < 3 && caracteresInvalidos.test(cBox.value))) {
        document.getElementById(`char-valido`).style.display = 'flex';
        cBox.value = "";
        cBox.disabled = false;
        return;
    }
    clearTimeout(turnTimer);
    let nBox = document.getElementById(`char${caixaAtual+1}`);
    cBox.disabled = true;
    cBox.style.boxShadow = `none`
    palavra += cBox.value.toLowerCase();
    
    if (caixaAtual == 8) verificarPalavra();
    
    else {
        verificarPalavra().then(() => {
            nBox.style.borderColor = jgdrAtual === "vermelho" ? blue : red;
            nBox.style.boxShadow = `0px 0px 1.5dvw ${jgdrAtual === "vermelho" ? blue : red}`
            nBox.disabled = false;
            nBox.focus();
            jgdrAtual = jgdrAtual === "vermelho" ? "azul" : "vermelho";
        });
    }
}

async function verificarPalavra() {
    const variacoes = gerarVariacoes(palavra);
    let prefixoInvalido = false;

    async function processarVariacoes(urlBase) {
        for (let word of variacoes) {
            try {
                const resposta = await fetch(`${urlBase}/${word}`);
                const dados = await resposta.json();

                if (urlBase.includes("word")) {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(dados[0]?.xml || "", "application/xml");
                    const definicoes = xmlDoc.getElementsByTagName("def");

                    if (definicoes.length === 0) return true;
                    else vitoriaRound(2, jgdrAtual === "vermelho" ? "AZUL" : "VERMELHO").then(() => {});
                    return false;
                } else if (urlBase.includes("prefix")) {
                    if (dados.length > 0) {
                        prefixoInvalido = false;
                        break;
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }
        return false;
    }

    if (palavra.length > 4) {
        const resultado = await processarVariacoes("https://api.dicionario-aberto.net/word");
        if (resultado) return;
    } else if (palavra.length > 2) {
        prefixoInvalido = true;
        await processarVariacoes("https://api.dicionario-aberto.net/prefix");
    }

    if (prefixoInvalido) {
        vitoriaRound(1, jgdrAtual === "vermelho" ? "AZUL" : "VERMELHO").then(() => {});
    }
}


async function vitoriaRound(caso, vencedor) {
    travarInput();
    let pontosRodada = 9 - caixaAtual;
    let detalhes = document.getElementById("detalhes-vitoria");
    detalhes.innerHTML = `<span id="cor-vitoria">${pontosRodada} PONTOS PARA O ${vencedor}</span><br>`;
    clearTimeout(turnTimer);

    if (caso != 0) vencedor == "AZUL" ? pontosBlue +=  pontosRodada: pontosRed += pontosRodada;
    if (pontosBlue > maxPoints || pontosRed > maxPoints) vitoriaJogo();

    else {
        switch (caso) {
            case 0:
                detalhes.innerHTML = `Houve um empate<br>${palavra} não é uma palavra, mas é possivei prosseguir a partir dela<br><a id="link-sentido" href="https://www.dicio.com.br/pesquisa.php?q=${palavra}">Palavras possiveis</a>`;
                document.getElementById("link-sentido").style.color = "#00ffbf";
                break
            case 1:   
                detalhes.innerHTML += `Não é permitido começar com "${palavra}"`;
                break
            case 2:
                detalhes.innerHTML += `O jogador ${jgdrAtual} escreveu <br><a id="link-sentido" href="https://www.dicio.com.br/${palavra}/">${palavra}</a>`;
                document.getElementById("link-sentido").style.color = vencedor === "AZUL" ? red : blue;
                break
            case 3:
                detalhes.innerHTML += `O jogador ${jgdrAtual} demorou demais<br>Palavras que começam com <a id="link-sentido" href="https://www.dicio.com.br/pesquisa.php?q=${palavra}">'${palavra}'</a>`;
                document.getElementById("link-sentido").style.color = vencedor === "AZUL" ? red : blue;
                break
            default:
                break;
        }
    }

    if (caso != 0) document.getElementById("cor-vitoria").style.color = vencedor === "VERMELHO" ? red : blue;
    document.getElementById("vitoria-round").style.display = "flex";
}

function travarInput() {
    let disabledBoxes = document.getElementsByClassName("input-char");
    
    for (let box of disabledBoxes) {
        box.disabled = true;
        box.style.boxShadow = 'none';
    }
}

function proximoRound() {
    document.getElementById(`vitoria-round`).style.display = 'none';
    document.getElementById(`pontos-red`).style.height = `${pontosRed*100/maxPoints}dvh`;
    document.getElementById(`pontos-blue`).style.height = `${pontosBlue*100/maxPoints}dvh`;
    resetRound();
}

function vitoriaJogo() {
    document.getElementById("detalhes-vitoria").innerHTML = `<span style="color:${pontosRed > pontosBlue ? red : blue}">PARABÉNS JOGADOR ${pontosRed > pontosBlue ? "VERMELHO" : "AZUL"}, VOCÊ VENCEU!</span><br><span style="color:${red}">${pontosRed-0.75}</span> : <span style="color:${blue}">${pontosBlue-0.75}</span>`;
    document.getElementById("vitoria-round").style.display = "flex";
    jgdrAtual = "vermelho";
    palavra = "";
    pontosBlue = 0.75;
    pontosRed = 0.75;
    caixaAtual = 0;
}

function startTurnTimer() {
    clearTimeout(turnTimer);
    turnTimer = setTimeout(timeOutAction, maxTime * 1000);
}

function timeOutAction() {
    vitoriaRound(3, jgdrAtual === "vermelho" ? "AZUL" : "VERMELHO", palavra);
}

function gerarVariacoes(palavra) {
    const mapeamento = {
        'a': ['a', 'á', 'â', 'ã'],
        'e': ['e', 'é', 'ê'],
        'i': ['i', 'í'],
        'o': ['o', 'ó', 'ô', 'õ'],
        'u': ['u', 'ú', 'ü'],
        'c': ['c', 'ç']
    };

    function combinar(subPalavra, indice, acentoUsado) {
        if (indice === palavra.length) {
            return [subPalavra];
        }

        const char = palavra[indice];
        const alternativas = mapeamento[char] || [char];

        return alternativas.flatMap(letra => {
            const isAcentuada = mapeamento[char]?.includes(letra) && letra !== char;
            if (acentoUsado && isAcentuada) {
                return [];
            }
            return combinar(subPalavra + letra, indice + 1, acentoUsado || isAcentuada);
        });
    }

    return combinar('', 0, false);
}
