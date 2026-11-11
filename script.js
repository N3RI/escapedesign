"use strict";

const GAME_DURATION_MS = 45 * 60 * 1000;
const PENALTY_MS = 30 * 1000;
const STORAGE_KEY = "designers-vault-save-v1";

// Edit this array to change challenge copy, accepted answers, hints, and visuals.
const CHALLENGES = [
  {
    number: 1, id: "typography", title: "TYPOGRAPHY", category: "TIPOGRAFÍA · CLASIFICACIÓN",
    description: "El archivo tipográfico del diseñador conserva una muestra de una identidad urbana que cruzó fronteras.",
    question: "Soy una tipografía geométrica sans serif, muy utilizada en diseño gráfico, cartelería e interfaces. Fui inspirada en la tipografía urbana de un barrio de Buenos Aires. ¿Cuál es mi nombre?",
    answers: ["montserrat"], hint: "Su nombre homenajea un barrio porteño y tiene nueve letras.",
    visual: "typography", difficulty: "INICIAL"
  },
  {
    number: 2, id: "color-lab", title: "COLOR LAB", category: "COLOR · CÓDIGO HEX",
    description: "Una muestra cromática quedó aislada en el laboratorio. Traduzcan su señal para abrir el siguiente circuito.",
    question: "¿Cuál es el código hexadecimal de este color? Escribí el código sin espacios.",
    answers: ["#cad2e7", "cad2e7"], hint: "El formato HEX usa seis caracteres: dos por cada canal de color.",
    visual: "color", difficulty: "INICIAL"
  },
  {
    number: 3, id: "rgb-detective", title: "RGB DETECTIVE", category: "COLOR · LUZ ADITIVA",
    description: "El sistema proyecta una mezcla de luz. Lean cada canal y descubran el color resultante.",
    question: "¿Qué color se obtiene con esta combinación de luz RGB?",
    answers: ["rojo"], hint: "Solo el canal R está encendido a su valor máximo.",
    visual: "rgb", difficulty: "INICIAL"
  },
  {
    number: 4, id: "the-grid", title: "THE GRID", category: "COMPOSICIÓN · RETÍCULA",
    description: "Una página editorial se ordena bajo una estructura invisible que alinea cada elemento.",
    question: "¿Cómo se llama el sistema de líneas y módulos que permite organizar los elementos de una composición editorial?",
    answers: ["retícula", "reticula", "grid"], hint: "En diseño editorial se conoce con un término en español y otro en inglés.",
    visual: "grid", difficulty: "INTERMEDIA"
  },
  {
    number: 5, id: "visual-language", title: "VISUAL LANGUAGE", category: "SEMIÓTICA · SÍMBOLO",
    description: "Un signo atraviesa los años y las culturas. Interpreten el mensaje que comunica.",
    question: "¿Qué concepto representa tradicionalmente este símbolo?",
    answers: ["paz"], hint: "Es el estado opuesto al conflicto armado.",
    visual: "dove", difficulty: "INTERMEDIA"
  },
  {
    number: 6, id: "brand-identity", title: "BRAND IDENTITY", category: "IDENTIDAD · MARCA",
    description: "En este sistema de identidad desapareció el nombre de la marca. Solo queda su signo.",
    question: "¿Cómo se denomina este tipo de identificador visual de marca?",
    answers: ["isotipo", "iso tipo"], hint: "Su nombre comienza con «iso» y se refiere a un identificador compuesto solo por símbolo.",
    visual: "symbol", difficulty: "INTERMEDIA"
  },
  {
    number: 7, id: "the-eye", title: "THE EYE", category: "DISEÑO · JERARQUÍA",
    description: "El afiche de prueba mezcla recursos sin un orden claro. Analicen qué principio ayudaría a organizar su lectura.",
    question: "¿Qué principio del diseño permite establecer niveles de importancia entre los elementos de una composición?",
    answers: ["jerarquía visual", "jerarquia visual", "jerarquía", "jerarquia"], hint: "Organiza qué vemos primero, después y al final.",
    visual: "poster", difficulty: "AVANZADA"
  },
  {
    number: 8, id: "data-visualization", title: "DATA VISUALIZATION", category: "INFORMACIÓN · GRÁFICOS",
    description: "Los datos del proyecto están codificados en una representación comparativa.",
    question: "¿Cómo se denomina este tipo de representación visual de datos?",
    answers: ["gráfico de barras", "grafico de barras", "diagrama de barras", "barras"], hint: "Cada valor se representa con un rectángulo cuya altura varía.",
    visual: "chart", difficulty: "AVANZADA"
  },
  {
    number: 9, id: "the-glossary", title: "THE GLOSSARY", category: "PROCESO · REFERENCIAS",
    description: "Una colección visual reúne las primeras decisiones estéticas de una propuesta.",
    question: "Soy una composición de imágenes, colores, texturas y tipografías que permite reunir referencias visuales y transmitir la dirección estética de un proyecto. ¿Qué soy?",
    answers: ["moodboard", "mood board", "tablero de inspiración", "tablero de inspiracion"], hint: "Es un término en inglés que combina «mood» (atmósfera) y «board» (tablero).",
    visual: "moodboard", difficulty: "AVANZADA"
  },
  {
    number: 10, id: "creative-mind", title: "CREATIVE MIND", category: "PROCESO · BRIEF",
    description: "La última puerta protege el punto de partida de todo proyecto. Identifiquen el documento que define el encargo.",
    question: "Antes de comenzar un proyecto de diseño, el profesional recibe un documento que establece los objetivos, requisitos, público destinatario y necesidades del cliente. ¿Cómo se denomina este documento?",
    answers: ["brief", "brief creativo", "brief de diseño"], hint: "Es una palabra breve, de origen inglés, que resume el encargo del cliente.",
    visual: "brief", difficulty: "EXPERTO"
  }
];

const TITLE_DESCRIPTIONS = [
  "Tipografía y lenguaje", "Código cromático", "Mezcla de luz", "Estructura editorial", "Lectura de símbolos",
  "Identidad de marca", "Análisis visual", "Visualización de datos", "Dirección estética", "El encargo"
];

const screens = {
  start: document.querySelector("#screen-start"),
  map: document.querySelector("#screen-map"),
  challenge: document.querySelector("#screen-challenge"),
  vault: document.querySelector("#screen-vault"),
  results: document.querySelector("#screen-results")
};

let game = null;
let timerInterval = null;
let toastTimeout = null;
let audioContext = null;
let muted = false;
let storageAvailable = true;

const $ = (selector, root = document) => root.querySelector(selector);

function readSavedGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved.team !== "string" || !Array.isArray(saved.completed) ||
        typeof saved.startedAt !== "number" || typeof saved.deadline !== "number") {
      throw new Error("El formato de la partida guardada no es válido.");
    }
    return saved;
  } catch (error) {
    storageAvailable = false;
    console.warn("No se pudo recuperar el progreso guardado.", error);
    $("#storage-warning").textContent = "No se pudo leer el progreso guardado. Podés comenzar una misión nueva.";
    $("#storage-warning").classList.remove("hidden");
    return null;
  }
}

function saveGame() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    storageAvailable = true;
  } catch (error) {
    storageAvailable = false;
    console.warn("No se pudo guardar el progreso.", error);
    $("#storage-warning").textContent = "El navegador no pudo guardar el progreso. Evitá recargar esta página durante la misión.";
    $("#storage-warning").classList.remove("hidden");
  }
}

function deleteSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("No se pudo eliminar el progreso guardado.", error);
  }
}

function normalizeAnswer(value) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
}

function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function remainingTime() {
  if (!game) return GAME_DURATION_MS;
  if (game.ended) return 0;
  return Math.max(0, game.deadline - Date.now());
}

function elapsedTime() {
  if (!game) return 0;
  const elapsed = game.ended ? game.endElapsedMs : Math.max(0, Date.now() - game.startedAt);
  return elapsed + game.penalties * PENALTY_MS;
}

function currentChallengeIndex() {
  return game.completed.findIndex((isComplete) => !isComplete);
}

function showScreen(name) {
  Object.entries(screens).forEach(([key, element]) => element.classList.toggle("hidden", key !== name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function playTone(kind) {
  if (muted) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext = audioContext || new Context();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime;
    const frequencies = kind === "success" ? [523, 659, 784] : kind === "open" ? [330, 440, 554, 740] : [170, 135];
    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, now + index * .11);
      gain.gain.exponentialRampToValueAtTime(.065, now + index * .11 + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, now + index * .11 + .22);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now + index * .11);
      oscillator.stop(now + index * .11 + .23);
    });
  } catch (error) {
    console.warn("No se pudo reproducir el sonido.", error);
  }
}

function updateHeader() {
  const chip = $("#team-chip");
  if (game && !screens.start.classList.contains("hidden")) {
    chip.classList.add("hidden");
    return;
  }
  if (game) {
    chip.textContent = game.team;
    chip.classList.remove("hidden");
  } else {
    chip.classList.add("hidden");
  }
}

function startNewGame(team) {
  const saved = readSavedGame();
  if (saved && !window.confirm("Hay una misión guardada. ¿Querés descartarla e iniciar una nueva?")) return;
  game = {
    team: team.trim(),
    startedAt: Date.now(),
    deadline: Date.now() + GAME_DURATION_MS,
    completed: CHALLENGES.map(() => false),
    hintsUsed: CHALLENGES.map(() => false),
    hintCount: 0,
    errors: 0,
    penalties: 0,
    finished: false,
    ended: false,
    endElapsedMs: 0,
    vaultOpened: false
  };
  deleteSavedGame();
  saveGame();
  enterMap();
}

function resumeGame() {
  const saved = readSavedGame();
  if (!saved) return;
  if (saved.finished || saved.ended) {
    game = saved;
    showResults();
    return;
  }
  game = saved;
  if (remainingTime() <= 0) {
    expireGame();
    return;
  }
  enterMap();
}

function enterMap() {
  showScreen("map");
  updateHeader();
  renderMap();
  startTimer();
}

function renderMap() {
  const grid = $("#lock-grid");
  grid.replaceChildren();
  const nextIndex = currentChallengeIndex();
  CHALLENGES.forEach((challenge, index) => {
    const complete = game.completed[index];
    const available = index === nextIndex && !game.ended;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lock-card${complete ? " completed" : ""}${available ? " available" : ""}`;
    button.disabled = !complete && !available;
    button.setAttribute("aria-label", `Candado ${String(challenge.number).padStart(2, "0")}: ${complete ? "completado" : available ? "disponible" : "bloqueado"}`);
    button.innerHTML = `<span class="lock-number"><span>LOCK ${String(challenge.number).padStart(2, "0")}</span><span class="lock-symbol">${complete ? "✓" : available ? "◈" : "⌑"}</span></span><strong>${challenge.title}</strong><small>${TITLE_DESCRIPTIONS[index]}</small>`;
    if (complete || available) button.addEventListener("click", () => openChallenge(index));
    grid.append(button);
  });
  const completedCount = game.completed.filter(Boolean).length;
  $("#progress-count").textContent = `${completedCount} / ${CHALLENGES.length}`;
  $("#progress-fill").style.width = `${completedCount / CHALLENGES.length * 100}%`;
  $("#current-lock-label").textContent = completedCount === CHALLENGES.length
    ? "TODOS LOS CANDADOS ABIERTOS"
    : `PRÓXIMO: CANDADO ${String(nextIndex + 1).padStart(2, "0")}`;
  updateTimers();
}

function graphicMarkup(type) {
  const graphics = {
    typography: '<div class="visual-type">Montserrat<small>BUENOS AIRES · 1900</small></div><span class="visual-caption">MUESTRA TIPOGRÁFICA / 01</span>',
    color: '<div class="rgb-card"><div class="color-swatch"></div><span class="hex-label">RGB 202 · 210 · 231</span></div><span class="visual-caption">MUESTRA CROMÁTICA / 02</span>',
    rgb: '<div class="rgb-values"><div class="rgb-line"><span>R</span><i><b class="r-bar"></b></i><span>255</span></div><div class="rgb-line"><span>G</span><i><b class="g-bar"></b></i><span>000</span></div><div class="rgb-line"><span>B</span><i><b class="b-bar"></b></i><span>000</span></div></div><span class="visual-caption">CANALES DE LUZ / 03</span>',
    grid: '<div class="grid-art" aria-hidden="true">' + "<i></i>".repeat(24) + '</div><span class="visual-caption">SISTEMA EDITORIAL / 04</span>',
    dove: '<div class="dove-art"><svg viewBox="0 0 200 200" role="img" aria-label="Paloma blanca con rama de olivo"><path fill="#f3f0e7" d="M29 112c22-5 39-21 50-47 4 22 17 35 38 41-13-19-17-40-13-63 13 16 28 25 48 27-9 10-12 21-8 34 8-6 15-7 24-4-17 30-42 45-77 43-25-1-45-11-62-31z"/><path fill="#f3f0e7" d="M96 80c-14-23-32-37-54-42 10 20 24 34 43 43z"/><path fill="none" stroke="#9eaa79" stroke-width="4" stroke-linecap="round" d="M66 144c18 10 41 13 67 5m-35-3-7-10m23 9-5-12m-27 9-10-8"/><path fill="#a8b67f" d="M92 137c-9-9-16-9-20-4 5 8 11 10 20 4zm24 3c-3-10 0-16 7-16 3 8 1 13-7 16zm-10 3c-8-8-14-8-19-3 5 7 11 8 19 3z"/></svg></div><span class="visual-caption">SÍMBOLO UNIVERSAL / 05</span>',
    symbol: '<div class="brand-symbol"><svg viewBox="0 0 100 100" role="img" aria-label="Identificador gráfico abstracto sin texto"><path d="M50 9 87 30v40L50 91 13 70V30z"/><path d="m31 62 19-33 19 33M39 49h22M42 59h16"/></svg></div><span class="visual-caption">SISTEMA DE IDENTIDAD / 06</span>',
    poster: '<div class="bad-poster" aria-label="Afiche deliberadamente desordenado"><span class="bad-huge">FESTI<br>VAL!!</span><span class="bad-thin">la gran noche</span><span class="bad-small">TODOS LOS DÍAS · EN TODAS PARTES</span><i class="bad-shape"></i><span class="bad-thin">arte música más cosas 2026</span><span class="bad-small">ENTRADA LIBRE / 7.30 / 18HS</span></div><span class="visual-caption">AFICHE DE PRUEBA / 07</span>',
    chart: '<div class="bar-chart" role="img" aria-label="Gráfico de barras de cinco valores"><span class="chart-label">MÉTRICA DE PROYECTO</span><i></i><i></i><i></i><i></i><i></i></div><span class="visual-caption">DATOS / Q1—Q5</span>',
    moodboard: '<div class="moodboard" aria-label="Tablero de referencias visuales"><i></i><i></i><i></i><i></i><em>sensaciones</em></div><span class="visual-caption">REFERENCIAS / 09</span>',
    brief: '<div class="brief-card"><b>BRIEF</b><span></span><span></span><span></span><small>PROYECTO · REQUISITOS · OBJETIVOS</small></div><span class="visual-caption">DOCUMENTO DE PROYECTO / 10</span>'
  };
  return graphics[type];
}

function openChallenge(index) {
  if (game.ended) return;
  const next = currentChallengeIndex();
  if (!game.completed[index] && index !== next) return;
  const challenge = CHALLENGES[index];
  const done = game.completed[index];
  $("#challenge-content").innerHTML = `
    <div class="challenge-copy">
      <span class="challenge-index">CANDADO ${String(challenge.number).padStart(2, "0")} / 10 · ${challenge.difficulty}</span>
      <h2 id="challenge-title">${challenge.title}</h2>
      <div class="challenge-category">${challenge.category}</div>
      <p class="challenge-description">${challenge.description}</p>
      <div class="question-box">${challenge.question}</div>
      ${done
        ? '<div class="challenge-done">✓ &nbsp;Este candado ya está desbloqueado. La respuesta no se puede modificar.</div>'
        : `<form class="answer-form" id="answer-form"><label for="answer-input">INGRESÁ LA CLAVE PARA CONTINUAR</label><div class="answer-row"><input id="answer-input" type="text" autocomplete="off" aria-label="Respuesta del desafío" required><button class="button button-gold" type="submit">DESBLOQUEAR <span aria-hidden="true">↗</span></button></div><div class="challenge-actions"><button class="text-button hint-button" id="hint-button" type="button">NECESITO UNA PISTA</button><span class="map-note">Una pista suma 30 s de penalización.</span></div><div id="answer-feedback" class="answer-feedback" role="status" aria-live="polite"></div><div id="hint-box" class="hint-box hidden" role="status"></div></form>`
      }
    </div>
    <div class="visual-card">${graphicMarkup(challenge.visual)}</div>`;
  showScreen("challenge");
  updateHeader();
  updateTimers();
  if (!done) {
    $("#answer-form").addEventListener("submit", (event) => submitAnswer(event, index));
    $("#hint-button").addEventListener("click", () => useHint(index));
    $("#answer-input").focus({ preventScroll: true });
  }
}

function submitAnswer(event, index) {
  event.preventDefault();
  if (game.ended || game.completed[index] || index !== currentChallengeIndex()) return;
  if (remainingTime() <= 0) {
    expireGame();
    return;
  }
  const answer = normalizeAnswer($("#answer-input").value);
  const accepted = CHALLENGES[index].answers.some((valid) => normalizeAnswer(valid) === answer);
  const feedback = $("#answer-feedback");
  if (!accepted) {
    game.errors += 1;
    game.penalties += 1;
    saveGame();
    feedback.textContent = "El mecanismo no responde. Revisen las pistas e inténtenlo nuevamente.";
    feedback.className = "answer-feedback error";
    $("#answer-form").classList.remove("shake");
    void $("#answer-form").offsetWidth;
    $("#answer-form").classList.add("shake");
    playTone("error");
    updateTimers();
    return;
  }
  game.completed[index] = true;
  saveGame();
  feedback.textContent = "¡CANDADO DESBLOQUEADO! El conocimiento es la llave.";
  feedback.className = "answer-feedback success";
  $("#answer-form").classList.add("unlock");
  playTone("success");
  window.setTimeout(() => {
    if (currentChallengeIndex() === -1) {
      showVault();
    } else {
      enterMap();
      showToast("Candado desbloqueado. El siguiente sistema está disponible.");
    }
  }, 950);
}

function useHint(index) {
  if (game.ended || game.completed[index]) return;
  if (remainingTime() <= 0) {
    expireGame();
    return;
  }
  if (!game.hintsUsed[index]) {
    game.hintsUsed[index] = true;
    game.hintCount += 1;
    game.penalties += 1;
    saveGame();
    updateTimers();
  }
  const hintBox = $("#hint-box");
  hintBox.textContent = `PISTA · ${CHALLENGES[index].hint}`;
  hintBox.classList.remove("hidden");
  $("#hint-button").textContent = "PISTA CONSULTADA";
  playTone("hint");
}

function updateTimers() {
  if (!game) return;
  const time = formatTime(remainingTime());
  $("#map-timer").textContent = time;
  $("#challenge-timer").textContent = time;
  const urgent = remainingTime() <= 5 * 60 * 1000;
  $(".timer-card").classList.toggle("urgent", urgent);
  $(".challenge-timer").classList.toggle("urgent", urgent);
}

function startTimer() {
  window.clearInterval(timerInterval);
  updateTimers();
  timerInterval = window.setInterval(() => {
    if (!game || game.ended || game.finished) {
      window.clearInterval(timerInterval);
      return;
    }
    if (remainingTime() <= 0) {
      expireGame();
      return;
    }
    updateTimers();
  }, 250);
}

function expireGame() {
  if (!game || game.ended || game.finished) return;
  game.ended = true;
  game.endElapsedMs = Math.min(GAME_DURATION_MS, Math.max(0, Date.now() - game.startedAt));
  saveGame();
  window.clearInterval(timerInterval);
  showResults();
}

function showVault() {
  window.clearInterval(timerInterval);
  if (remainingTime() <= 0) {
    expireGame();
    return;
  }
  showScreen("vault");
  updateHeader();
  $("#open-vault").classList.remove("hidden");
  $("#vault-reward").classList.add("hidden");
  $("#final-safe").classList.remove("open");
  startTimer();
}

function openVault() {
  if (game.ended || currentChallengeIndex() !== -1) return;
  if (remainingTime() <= 0) {
    expireGame();
    return;
  }
  game.finished = true;
  game.vaultOpened = true;
  game.endElapsedMs = Date.now() - game.startedAt;
  saveGame();
  window.clearInterval(timerInterval);
  $("#final-safe").classList.add("open");
  $("#final-safe").setAttribute("aria-label", "Caja fuerte abierta");
  $("#open-vault").classList.add("hidden");
  playTone("open");
  window.setTimeout(() => $("#vault-reward").classList.remove("hidden"), 950);
}

function showResults() {
  if (!game) return;
  window.clearInterval(timerInterval);
  showScreen("results");
  updateHeader();
  $("#result-team").textContent = `EQUIPO · ${game.team}`;
  $("#result-time").textContent = formatTime(elapsedTime());
  $("#result-errors").textContent = game.errors;
  $("#result-hints").textContent = game.hintCount;
  if (game.ended) {
    $("#results-title").innerHTML = 'TIEMPO <span>AGOTADO</span>';
    $("#result-message").textContent = "El sistema cerró el acceso cuando terminó la cuenta regresiva.";
    $("#result-outcome").textContent = `${game.completed.filter(Boolean).length} de 10 candados resueltos. Cada respuesta incorrecta y cada pista sumó 30 segundos al tiempo final.`;
  } else {
    $("#results-title").innerHTML = 'ARCHIVO <span>RECUPERADO</span>';
    $("#result-message").textContent = "¡Misión cumplida! Han recuperado el último proyecto del diseñador.";
    $("#result-outcome").textContent = "Trabajo en equipo, observación y conocimiento: la combinación que abrió la caja fuerte.";
  }
}

function restartGame() {
  if (!game || window.confirm("¿Iniciar una nueva misión? Se perderá el progreso actual.")) {
    window.clearInterval(timerInterval);
    deleteSavedGame();
    game = null;
    $("#team-name").value = "";
    $("#resume-button").classList.add("hidden");
    $("#storage-warning").classList.add("hidden");
    showScreen("start");
    updateHeader();
  }
}

$("#start-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const teamName = $("#team-name").value.trim();
  if (!teamName) {
    $("#team-name").focus();
    return;
  }
  startNewGame(teamName);
});
$("#resume-button").addEventListener("click", resumeGame);
$("#back-to-map").addEventListener("click", () => {
  if (currentChallengeIndex() === -1) showVault();
  else enterMap();
});
$("#new-game-map").addEventListener("click", restartGame);
$("#open-vault").addEventListener("click", openVault);
$("#show-results").addEventListener("click", showResults);
$("#restart-button").addEventListener("click", restartGame);
$("#sound-toggle").addEventListener("click", () => {
  muted = !muted;
  $(".sound-on").classList.toggle("hidden", muted);
  $(".sound-off").classList.toggle("hidden", !muted);
  $("#sound-toggle").title = muted ? "Sonido silenciado" : "Sonido activado";
  $("#sound-toggle").setAttribute("aria-label", muted ? "Activar sonidos" : "Silenciar sonidos");
  if (!muted) playTone("success");
});

const savedGame = readSavedGame();
if (savedGame) {
  $("#resume-button").classList.remove("hidden");
  $("#resume-button").textContent = savedGame.finished || savedGame.ended
    ? `Ver resultados de ${savedGame.team}`
    : `Continuar misión de ${savedGame.team}`;
}
