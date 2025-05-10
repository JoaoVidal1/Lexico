const red = "#ff2b47";
const blue = "#992bff";
const redlight = "#ff8292";
const bluelight = "#c587ff";
const genDisable = "#333333";
const caracteres = /^[a-zA-Z]$/

let maxPoints = 15;

let maxTime = 15;
let turnTimer;
let countdownInterval;
let endTime;

let jgdrAtual = "vermelho";
let palavra = "";

let pontosRed = 0.75;
let pontosBlue = 0.75;

let caixaAtual = 0;

let seguir = true;
let novoJogo = false;

function novaPartida(event) {
    maxTime = document.getElementById("input-tempo").value
    event.preventDefault();
    document.getElementById("comecar-partida").style.display = 'none';
    resetRound();
}

function resetRound() {
    clearTimeout(turnTimer);
    clearInterval(countdownInterval);
    caixaAtual = 0;
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
    seguir = true;
    travarInput();
    caixaAtual = box;
    let cBox = document.getElementById(`char${caixaAtual}`);

    if (!caracteres.test(cBox.value) || (palavra.length < 2 && iniciosInvalidos.includes(palavra + cBox.value.toLowerCase()))) {
        document.getElementById(`char-valido`).style.display = 'flex';
        cBox.value = "";
        cBox.disabled = false;
        return;
    }

    document.getElementById("countdown").style.display = 'block';
    seguir = true;

    clearTimeout(turnTimer);
    clearInterval(countdownInterval);

    let nBox = document.getElementById(`char${caixaAtual+1}`);
    cBox.disabled = true;
    cBox.style.boxShadow = `none`
    palavra += cBox.value.toLowerCase();

    if (document.documentElement.lang === "pt") {
        verificarPalavra().then(() => {
            if (caixaAtual < 8) {
                nBox.style.borderColor = jgdrAtual === "vermelho" ? blue : red;
                nBox.style.boxShadow = `0px 0px 1.5dvw ${jgdrAtual === "vermelho" ? blue : red}`
                nBox.disabled = false;
                nBox.focus();
                jgdrAtual = jgdrAtual === "vermelho" ? "azul" : "vermelho";
                if (seguir) startTurnTimer();
            }
        });
    }
}

async function processarVariacoes(urlBase, variacoes) {
    try {
        const promises = variacoes.map(async (word) => {
        const resposta = await fetch(`${urlBase}/${word}`);
        const dados = await resposta.json();
  
        if (urlBase.includes("word")) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(dados[0]?.xml || "", "application/xml");
            const definicoes = xmlDoc.getElementsByTagName("def");
            return definicoes.length !== 0;
        } 
        
        if (urlBase.includes("prefix")) {
            return dados.length === 0;
        }
  
        return false;
        });
  
        const resultados = await Promise.all(promises);
        return urlBase.includes("prefix") ? !resultados.some(r => !r) : resultados.some(r => r);
    } catch (error) {
        console.error(error);
        return urlBase.includes("prefix") ? true : false;
    }
}

async function verificarPalavra() {

    async function corresponderExatamente() {
        try {
            const resposta = await fetch(`https://api.dicionario-aberto.net/near/${palavra}`);
            const dados = await resposta.json();
            const palavrasValidas = await dados
                .filter(e => e.length === palavra.length)
                .map(element => element.replace(/[áâéêíóôúç]/gi, match => caracteresUnicos[match.toLowerCase()] || match))
                .filter(e => e === palavra);
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
        const variacoes = await gerarVariacoes(palavra);
        for (let word of variacoes) {
            const resposta = await fetch(`https://api.dicionario-aberto.net/prefix/${word}`);
            const dados = await resposta.json();
            if (dados.length !== 0) {
                return false
            }
        }
        return true
    }
    
    if (palavra.length > 4) {
        const palavraExiste = await corresponderExatamente();
    
        if (palavraExiste) {
            await vitoriaRound(2, jgdrAtual === "vermelho" ? "AZUL" : "VERMELHO");
        }
        else if (palavra.length > 2) {
            const prefixoInvalido = await corresponderPrefixo();
            if (prefixoInvalido) {
                await vitoriaRound(1 , jgdrAtual === "vermelho" ? "AZUL" : "VERMELHO");
            }
            else if (caixaAtual == 8) vitoriaRound (0, jgdrAtual)
        }
    }
}

async function vitoriaRound(caso, vencedor) {
    seguir = false;
    document.getElementById("countdown").style.display = 'none';
    travarInput();
    let pontosRodada = 9 - caixaAtual;
    let detalhes = document.getElementById("detalhes-vitoria");
    detalhes.innerHTML = `<span id="cor-vitoria">${pontosRodada} PONTOS PARA O ${vencedor}</span><br>`;

    if (caso == 3) pontosRodada--;
    if (caso != 0) vencedor == "AZUL" ? pontosBlue +=  pontosRodada: pontosRed += pontosRodada;
    if (pontosBlue > maxPoints || pontosRed > maxPoints) vitoriaJogo();

    else {
        switch (caso) {
            case 0:
                detalhes.innerHTML = `Houve um empate<br><span style="color:${jgdrAtual == "vermelho" ? red : blue}">'${palavra}'</span> não é uma palavra, mas é possivei prosseguir a partir dela<br><a id="link-sentido" href="https://www.dicio.com.br/pesquisa.php?q=${palavra}">Palavras possiveis</a>`;
                document.getElementById("link-sentido").style.color = "#00ffbf";
                break
            case 1:   
                detalhes.innerHTML += `Não é permitido começar com "${palavra}"`;
                break
            case 2:
                detalhes.innerHTML += `O jogador ${jgdrAtual} escreveu <br><a id="link-sentido" href="https://www.dicio.com.br/pesquisa.php?q=${palavra}/">${palavra}</a>`;
                document.getElementById("link-sentido").style.color = vencedor === "AZUL" ? red : blue;
                break
            case 3:
                detalhes.innerHTML += `O jogador ${jgdrAtual} demorou demais<br>Palavras que começam com <a id="link-sentido" href="https://dicionario-aberto.net/ss_search/prefix/${palavra}">'${palavra}'</a>`;
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
    if (novoJogo) {
        novoJogo = false;
        document.getElementById("comecar-partida").style.display = 'flex';
    } else {
    document.getElementById(`vitoria-round`).style.display = 'none';
    document.getElementById(`pontos-red`).style.height = `${pontosRed*100/maxPoints}dvh`;
    document.getElementById(`pontos-blue`).style.height = `${pontosBlue*100/maxPoints}dvh`;
    resetRound();
    }
}

function vitoriaJogo() {
    document.getElementById("detalhes-vitoria").innerHTML = `PARABÉNS JOGADOR <span style="color:${pontosRed > pontosBlue ? red : blue}">${pontosRed > pontosBlue ? "VERMELHO" : "AZUL"}</span>, VOCÊ VENCEU!<br><span style="color:${red}">${pontosRed-0.75}</span> : <span style="color:${blue}">${pontosBlue-0.75}</span>`;
    document.getElementById("vitoria-round").style.display = "flex";
    jgdrAtual = "vermelho";
    palavra = "";
    pontosBlue = 0.75;
    pontosRed = 0.75;
    novoJogo = true;
}

function startTurnTimer() {
    clearTimeout(turnTimer);
    clearInterval(countdownInterval);

    endTime = new Date().getTime() + maxTime * 1000;

    updateCountdownDisplay();

    countdownInterval = setInterval(updateCountdownDisplay, 1000);
    turnTimer = setTimeout(timeOutAction, maxTime * 1000);
    document.getElementById("countdown").style.color = jgdrAtual == "vermelho" ? red : blue;
    document.getElementById("countdown").style.borderColor = jgdrAtual == "vermelho" ? red : blue;
}

function timeOutAction() {
    vitoriaRound(3, jgdrAtual === "vermelho" ? "AZUL" : "VERMELHO", palavra);
}

function updateCountdownDisplay() {
    const now = new Date().getTime();
    let timeLeft = Math.ceil((endTime - now) / 1000);

    if (timeLeft < 0) {
        timeLeft = 0;
    }
    
    const countdownElement = document.getElementById("countdown");
    if (countdownElement) {
        countdownElement.innerText = timeLeft > 9 ? `00:${timeLeft}` : `00:0${timeLeft}`;
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
  
