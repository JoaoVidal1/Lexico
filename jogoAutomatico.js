/*
 * Refatoração do jogo de palavras
 * Código modular, organizado e eficiente
 */

// ====== Configurações e Constantes ======
const CONFIG = {
    colors: {
      red: "#ff2b47",
      blue: "#992bff",
      redLight: "#ff8292",
      blueLight: "#c587ff",
      disabled: "#333333",
    },
    maxPoints: 15,
    defaultPoints: 0.75,
    charPattern: /^[a-zA-Z]$/,
    invalidPrefixes: [ /* array iniciosInvalidos */ ],
    api: {
      prefix: "https://api.dicionario-aberto.net/prefix",
      word: "https://api.dicionario-aberto.net/word",
    }
  };
  
  // ====== Estado do Jogo ======
  const gameState = {
    maxTime: CONFIG.maxPoints,
    currentPlayer: 'vermelho',
    currentWord: '',
    boxIndex: 1,
    points: { vermelho: CONFIG.defaultPoints, azul: CONFIG.defaultPoints },
    timer: null,
    countdown: null,
    endTime: null,
    newGame: false,
    continueTurn: true,
  };
  
  // ====== Elementos do DOM ======
  const DOM = {
    startForm: document.getElementById('comecar-partida'),
    inputTime: document.getElementById('input-tempo'),
    startBtn: document.getElementById('comecar-partida').querySelector('button'),
    countdown: document.getElementById('countdown'),
    victoryModal: document.getElementById('vitoria-round'),
    victoryDetails: document.getElementById('detalhes-vitoria'),
    charBoxes: () => document.querySelectorAll('.input-char'),
    validMsg: document.getElementById('char-valido'),
    scoreBar: {
      red: document.getElementById('pontos-red'),
      blue: document.getElementById('pontos-blue'),
    }
  };
  
  // ====== Inicialização ======
  function init() {
    DOM.startForm.addEventListener('submit', startGame);
    DOM.charBoxes().forEach(box => box.addEventListener('input', onBoxInput));
  }
  
  // ====== Início de Partida ======
  function startGame(event) {
    event.preventDefault();
    gameState.maxTime = Number(DOM.inputTime.value) || gameState.maxTime;
    DOM.startForm.style.display = 'none';
    resetRound();
  }
  
  // ====== Reset Round ======
  function resetRound() {
    clearTimers();
    Object.assign(gameState, { boxIndex: 1, currentWord: '', continueTurn: true });
  
    DOM.charBoxes().forEach((box, i) => {
      box.value = '';
      box.disabled = i !== 0;
      box.style.borderColor = i === 0 ? getPlayerColor() : CONFIG.colors.disabled;
      box.style.boxShadow = i === 0 ? `0 0 1.5dvw ${getPlayerColor()}` : 'none';
      if (i === 0) box.focus();
    });
  }
  
  // ====== Input Handling ======
  function onBoxInput(event) {
    const box = event.target;
    const char = box.value;
  
    if (!validateChar(char)) {
      showInvalid();
      box.value = '';
      return;
    }
  
    hideInvalid();
    clearTimers();
    const idx = gameState.boxIndex;
    gameState.currentWord += char.toLowerCase();
    box.disabled = true;
    box.style.boxShadow = 'none';
  
    if (idx < 8) {
      switchPlayer();
      updateNextBox(idx + 1);
      if (gameState.continueTurn) startTurnTimer();
      checkWordProgress();
    } else {
      endRound('draw');
    }
  }
  
  // ====== Validações ======
  function validateChar(c) {
    return CONFIG.charPattern.test(c) && 
      !(gameState.currentWord.length < 2 && CONFIG.invalidPrefixes.includes((gameState.currentWord + c).toLowerCase()));
  }
  function showInvalid() { DOM.validMsg.style.display = 'flex'; }
  function hideInvalid() { DOM.validMsg.style.display = 'none'; }
  
  // ====== Atualiza Caixa ======
  function updateNextBox(i) {
    gameState.boxIndex = i;
    const next = document.getElementById(`char${i}`);
    next.disabled = false;
    next.style.borderColor = getPlayerColor();
    next.style.boxShadow = `0 0 1.5dvw ${getPlayerColor()}`;
    next.focus();
  }
  
  // ====== Jogador Ativo ======
  function getPlayerColor() {
    return gameState.currentPlayer === 'vermelho'
      ? CONFIG.colors.blue
      : CONFIG.colors.red;
  }
  function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 'vermelho' ? 'azul' : 'vermelho';
  }
  
  // ====== Timer ======
  function startTurnTimer() {
    const now = Date.now();
    gameState.endTime = now + gameState.maxTime * 1000;
    updateCountdown();
    gameState.countdown = setInterval(updateCountdown, 1000);
    gameState.timer = setTimeout(() => endRound('timeout'), gameState.maxTime * 1000);
    DOM.countdown.style.color = getBaseColor();
    DOM.countdown.style.borderColor = getBaseColor();
    DOM.countdown.style.display = 'block';
  }
  function updateCountdown() {
    const remaining = Math.max(0, Math.ceil((gameState.endTime - Date.now()) / 1000));
    DOM.countdown.textContent = `00:${remaining.toString().padStart(2, '0')}`;
  }
  function clearTimers() {
    clearTimeout(gameState.timer);
    clearInterval(gameState.countdown);
    DOM.countdown.style.display = 'none';
  }
  function getBaseColor() {
    return gameState.currentPlayer === 'vermelho'
      ? CONFIG.colors.red
      : CONFIG.colors.blue;
  }
  
  // ====== Verificação de Palavra ======
  async function checkWordProgress() {
    const word = gameState.currentWord;
    if (word.length > 2 && await checkPrefix(word)) {
      endRound('invalidPrefix');
      return;
    }
    if (word.length > 4 && await checkExists(word)) {
      endRound('validWord');
    }
  }
  async function checkPrefix(prefix) {
    try {
      const res = await fetch(`${CONFIG.api.prefix}/${prefix}`);
      const data = await res.json();
      return data.length > 0;
    } catch { return true; }
  }
  async function checkExists(word) {
    try {
      const res = await fetch(`${CONFIG.api.word}/${word}`);
      const [entry] = await res.json();
      const parser = new DOMParser();
      const xml = parser.parseFromString(entry?.xml || '', 'application/xml');
      return xml.getElementsByTagName('def').length > 0;
    } catch { return false; }
  }
  
  // ====== Fim de Round ======
  function endRound(reason) {
    gameState.continueTurn = false;
    clearTimers();
    const winner = determineWinner(reason);
    updateScore(winner, reason);
    showVictory(winner, reason);
  }
  function determineWinner(reason) {
    switch (reason) {
      case 'invalidPrefix': return gameState.currentPlayer === 'vermelho' ? 'azul' : 'vermelho';
      case 'timeout': return gameState.currentPlayer === 'vermelho' ? 'azul' : 'vermelho';
      case 'validWord': return gameState.currentPlayer === 'vermelho' ? 'azul' : 'vermelho';
      default: return null; // draw
    }
  }
  function updateScore(winner, reason) {
    const points = 9 - gameState.boxIndex + (reason === 'draw' ? 0 : 0);
    if (winner) gameState.points[winner] += points;
  }
  function showVictory(winner, reason) {
    const det = DOM.victoryDetails;
    det.innerHTML = buildVictoryHTML(winner, reason);
    DOM.victoryModal.style.display = 'flex';
  }
  function buildVictoryHTML(winner, reason) {
    const word = gameState.currentWord;
    const pt = 9 - gameState.boxIndex;
    let html = `<span id="cor-vitoria">${pt} pontos para ${winner.toUpperCase()}</span><br>`;
    switch (reason) {
      case 'invalidPrefix': html += `Prefixo inválido: "${word}" não pode iniciar.`; break;
      case 'timeout': html += `Tempo esgotado!`; break;
      case 'validWord': html += `Palavra encontrada: <a href="https://dicio.com.br/pesquisa?q=${word}">${word}</a>`; break;
      default: html += `Empate!`; break;
    }
    return html;
  }
  
  // ====== Próximo Round e Vitória de Jogo ======
  function nextRound() {
    if (gameState.newGame) resetGame();
    else {
      DOM.victoryModal.style.display = 'none';
      updateScoreBars();
      resetRound();
    }
  }
  function updateScoreBars() {
    DOM.scoreBar.red.style.height = `${(gameState.points.vermelho*100)/CONFIG.maxPoints}dvh`;
    DOM.scoreBar.blue.style.height = `${(gameState.points.azul*100)/CONFIG.maxPoints}dvh`;
  }
  function resetGame() {
    gameState.newGame = false;
    DOM.startForm.style.display = 'flex';
    gameState.currentPlayer = 'vermelho';
    gameState.points = { vermelho: CONFIG.defaultPoints, azul: CONFIG.defaultPoints };
  }
  
  // ====== Geração de Variações de Acentos ======
  function generateVariations(word) {
    const map = { a:['a','á','â','ã'], e:['e','é','ê'], i:['i','í'], o:['o','ó','ô','õ'], u:['u','ú','ü'], c:['c','ç'] };
    const results = [];
  
    function combine(prefix, i, accentUsed) {
      if (i === word.length) return results.push(prefix);
      const ch = word[i];
      const alts = map[ch] || [ch];
      alts.forEach(letter => {
        const used = accentUsed || (map[ch]?.includes(letter) && letter !== ch);
        if (!used || !map[ch]?.includes(letter)) combine(prefix + letter, i + 1, used);
      });
    }
    combine('', 0, false);
    return results;
  }
  
  // ====== Inicia ======
  document.addEventListener('DOMContentLoaded', init);
  