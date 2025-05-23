const CONFIG = {
    api: {
        pt: {
            prefix: "https://api.dicionario-aberto.net/prefix/",
            word: "https://api.dicionario-aberto.net/near/"
        }
    },
    colors: {
        red : "#ff2b47",
        blue : "#992bff",
        genDisable : "#333333"
    },
    charPattern: /^[a-zA-Z]$/,
    charNotAllowed: /[áâéêíóôúç]/gi,
    maxPoints: 15,
    maxTime: 15
}

const GAMESTATE = {
    currentPlayer: 'red',
    currentWord: '',
    boxIndex: 1,
    points: { red: 0, blue: 0},
    timer: null,
    countdown: null,
    endTime: null,
    newGame: false,
    continueTurn: true,
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
    }
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
    DOM.firstBox.style.boxShadow = `0px 0px 1.5dvw ${GAMESTATE.currentPlayer === "red" ? CONFIG.colors.red : CONFIG.colors.blue}`;
}

function novaLetra(box) {
    GAMESTATE.boxIndex = box;
    let cBox = document.getElementById(`char${GAMESTATE.boxIndex}`);

    if (!CONFIG.charPattern.test(cBox.value) || (GAMESTATE.currentWord.length < 2 && iniciosInvalidos.includes(GAMESTATE.currentWord + cBox.value.toLowerCase()))) {
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

    
    GAMESTATE.currentPlayer = 
    GAMESTATE.currentPlayer === "red" ? "blue" : "red";
    let newColor = CONFIG.colors[GAMESTATE.currentPlayer];

        verificarPalavra().then(() => {
            if (GAMESTATE.boxIndex < 8) {
                let nBox = document.getElementById(`char${GAMESTATE.boxIndex + 1}`);
                nBox.style.borderColor = newColor;
                nBox.style.boxShadow = `0px 0px 1.5dvw ${newColor}`
                nBox.disabled = false;
                nBox.focus();
                if (GAMESTATE.continueTurn) startTurnTimer();
            }
        });
}

async function verificarPalavra() {

    async function corresponderExatamente() {
        try {
            const resposta = await fetch(`https://api.dicionario-aberto.net/near/${GAMESTATE.currentWord}`);
            const dados = await resposta.json();
            const palavrasValidas = await dados
                .filter(e => e.length === GAMESTATE.currentWord.length)
                .map(element => element.replace(CONFIG.charNotAllowed, match => caracteresUnicos[match.toLowerCase()] || match))
                .filter(e => e === GAMESTATE.currentWord);
            console.log(palavrasValidas)
            if (palavrasValidas.length > 0) {
                    return true;
            }

            else return false;
        } catch (error) {
          console.error(error);
        }
    }

    async function corresponderPrefixo() {
        const variacoes = await gerarVariacoes(GAMESTATE.currentWord);
        for (let word of variacoes) {
            const resposta = await fetch(`https://api.dicionario-aberto.net/prefix/${word}`);
            const dados = await resposta.json();
            if (dados.length !== 0) {
                return false
            }
        }
        return true
    }
    
    if (GAMESTATE.currentWord.length > 4) {
        const palavraExiste = await corresponderExatamente();
    
        if (palavraExiste) {
            await vitoriaRound(2, GAMESTATE.currentPlayer === "red" ? "AZUL" : "VERMELHO");
        }
        else if (GAMESTATE.currentWord.length > 2) {
            const prefixoInvalido = await corresponderPrefixo();
            if (prefixoInvalido) {
                await vitoriaRound(1 , GAMESTATE.currentPlayer === "red" ? "AZUL" : "VERMELHO");
            }
            else if (GAMESTATE.boxIndex == 8) vitoriaRound (0, GAMESTATE.currentPlayer)
        }
    }
}

async function vitoriaRound(caso, vencedor) {
    GAMESTATE.continueTurn = false;
    DOM.countdown.style.display = 'none';
    travarInput();
    let pontosRodada = 9 - GAMESTATE.boxIndex;
    DOM.victoryDetails.innerHTML = `<span id="cor-vitoria">${pontosRodada} PONTOS PARA O ${vencedor}</span><br>`;

    if (caso == 3) pontosRodada--;
    if (caso != 0) {
        vencedor == "VERMELHO" ? GAMESTATE.points.red += pontosRodada : GAMESTATE.points.blue += pontosRodada;
        GAMESTATE.currentPlayer = vencedor === "VERMELHO" ? "red" : "blue";
    }
    if (GAMESTATE.points.blue > CONFIG.maxPoints || GAMESTATE.points.red > CONFIG.maxPoints) vitoriaJogo();

    else {
        switch (caso) {
            case 0:
                DOM.victoryDetails.innerHTML = `Houve um empate<br><span style="color:${GAMESTATE.currentPlayer === "red" ? CONFIG.colors.red : CONFIG.colors.blue}">'${GAMESTATE.currentWord}'</span> não é uma palavra, mas é possivei prosseguir a partir dela<br><a id="link-sentido" href="https://www.dicio.com.br/pesquisa.php?q=${GAMESTATE.currentWord}">Palavras possiveis</a>`;
                document.getElementById("link-sentido").style.color = "#00ffbf";
                break
            case 1:   
                DOM.victoryDetails.innerHTML += `Não é permitido começar com "${GAMESTATE.currentWord}"`;
                break
            case 2:
                DOM.victoryDetails.innerHTML += `O jogador ${GAMESTATE.currentPlayer} escreveu <br><a id="link-sentido" href="https://www.dicio.com.br/pesquisa.php?q=${GAMESTATE.currentWord}/">${GAMESTATE.currentWord}</a>`;
                document.getElementById("link-sentido").style.color = vencedor === "AZUL" ? CONFIG.colors.red : CONFIG.colors.blue;
                break
            case 3:
                DOM.victoryDetails.innerHTML += `O jogador ${GAMESTATE.currentPlayer} demorou demais<br>Palavras que começam com <a id="link-sentido" href="https://dicionario-aberto.net/ss_search/prefix/${GAMESTATE.currentWord}">'${GAMESTATE.currentWord}'</a>`;
                document.getElementById("link-sentido").style.color = vencedor === "AZUL" ? CONFIG.colors.red : CONFIG.colors.blue;
                break
            default:
                break;
        }
    }

    if (caso != 0) document.getElementById("cor-vitoria").style.color = vencedor === "VERMELHO" ? CONFIG.colors.red : CONFIG.colors.blue;
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
    DOM.victoryDetails.innerHTML = `PARABÉNS JOGADOR <span style="color:${GAMESTATE.points.red  > GAMESTATE.points.blue ? CONFIG.colors.red : CONFIG.colors.blue}">${GAMESTATE.points.red > GAMESTATE.points.blue ? "VERMELHO" : "AZUL"}</span>, VOCÊ VENCEU!<br><span style="color:${CONFIG.colors.red}">${GAMESTATE.points.red+0.75}</span> : <span style="color:${CONFIG.colors.blue}">${GAMESTATE.points.blue-0.75}</span>`;
    DOM.victoryModal.style.display = "flex";
    GAMESTATE.currentPlayer = "red";
    GAMESTATE.currentWord = "";
    GAMESTATE.points.red = 0;
    GAMESTATE.points.blue = 0;
    GAMESTATE.newGame = true;
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

const caracteresUnicos = {
    "á" : "a",
    "â" : "a",
    "é" : "e",
    "ê" : "e",
    "í" : "i",
    "ó" : "o",
    "ô" : "o",
    "ú" : "u",
    "ç" : "c"
}

function gerarVariacoes(palavra) {
    const mapeamento = {
      a: ['a', 'á', 'â', 'ã'],
      e: ['e', 'é', 'ê'],
      i: ['i', 'í'],
      o: ['o', 'ó', 'ô', 'õ'],
      u: ['u', 'ú', 'ü'],
      c: ['c', 'ç']
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

const iniciosInvalidos = [
    "aa", "ak", "aw", "ay",
    "bb", "bc", "bd", "bf", "bg", "bh", "bj", "bk", "bm", "bn", "bp", "bq", "bs", "bt", "bv", "bw", "bx", "by", "bz",
    "cb", "cc", "cd", "cf", "cg", "cj", "ck", "cm", "cn", "cp", "cq", "cs", "cv", "cw", "cx", "cy", "cz",
    "db", "dc", "dd", "df", "dg", "dh", "dj", "dk", "dl", "dm", "dn", "dp", "dq", "ds", "dt", "dv", "dw", "dx", "dy", "dz",
    "ee", "ej", "ek", "eh", "eo", "ew", "ey",
    "fb", "fc", "fd", "ff", "fg", "fh", "fj", "fk", "fm", "fn", "fp", "fq", "fs", "ft", "fv", "fw", "fx", "fy", "fz",
    "gb", "gc", "gd", "gf", "gg", "gh", "gj", "gk", "gm", "gp", "gq", "gs", "gt", "gv", "gw", "gx", "gy", "gz",
    "hb", "hc", "hd", "hf", "hg", "hh", "hj", "hk", "hl", "hm", "hn", "hp", "hq", "hr", "hs", "ht", "hv", "hw", "hx", "hy", "hz",
    "ih", "ii", "ij", "ik", "iq", "iw", "iy",
    "jb", "jc", "jd", "jf", "jg", "jh", "jj", "jk", "jl", "jm", "jn", "jp", "jq", "jr", "js", "jt", "jv", "jw", "jx", "jy", "jz",
    "kb", "kc", "kd", "kf", "kg", "kj", "kk", "kp", "kq", "kt", "kv", "kx", "kz",
    "lb", "lc", "ld", "lf", "lg", "lj", "lk", "ll", "lm", "ln", "lp", "lq", "lr", "ls", "lt", "lv", "lw", "lx", "ly", "lz",
    "mb", "mc", "md", "mf", "mg", "mh", "mj", "mk", "ml", "mm", "mn", "mp", "mq", "mr", "ms", "mt", "mv", "mw", "mx", "my", "mz",
    "nb", "nc", "nd", "nf", "ng", "nj", "nk", "nl", "nm", "nn", "np", "nq", "nr", "ns", "nt", "nv", "nw", "nx", "ny", "nz",
    "oa", "oe", "oj", "ok", "oo", "oq", "ow", "oy",
    "pb", "pc", "pd", "pf", "pg", "pj", "pk", "pm", "pn", "pp", "pq", "pt", "pv", "pw", "px", "py", "pz",
    "qa", "qb", "qc", "qd", "qe", "qf", "qg", "qh", "qi", "qj", "qk", "ql", "qm", "qn", "qo", "qq", "qr", "qs", "qt", "qv", "qw", "qx", "qy", "qz",
    "rb", "rc", "rd", "rf", "rg", "rh", "rj", "rk", "rl", "rm", "rn", "rp", "rq", "rr", "rs", "rt", "rv", "rw", "rx", "ry", "rz",
    "sb", "sd", "sf", "sg", "sh", "sj", "sq", "sr", "ss", "sv", "sw", "sx", "sy", "sz",
    "tb", "tc", "td", "tf", "tg", "th", "tj", "tk", "tl", "tm", "tn", "tp", "tq", "tt", "tv", "tw", "ty", "tz",
    "uh", "uj", "uk", "uo", "up", "uq", "uu", "uv", "uw", "ux", "uy",
    "vb", "vc", "vd", "vf", "vg", "vh", "vj", "vk", "vl", "vm", "vn", "vp", "vq", "vr", "vs", "vt", "vv", "vw", "vx", "vy", "vz",
    "w",
    "xb", "xc", "xd", "xf", "xg", "xh", "xj", "xk", "xl", "xm", "xn", "xp", "xq", "xr", "xs", "xt", "xv", "xw", "xx", "xy", "xz",
    "y",
    "zb", "zc", "zd", "zf", "zg", "zh", "zj", "zk", "zl", "zm", "zn", "zp", "zq", "zr", "zs", "zt", "zv", "zw", "zx", "zy", "zz"
];