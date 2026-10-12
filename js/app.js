/* ============================================================
   El Impostor · lógica del juego
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Atajos y utilidades ---------------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var DATA = window.IMPOSTOR_DATA || { categories: [] };
  var PAIRS = window.IMPOSTOR_PAIRS || [];

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function randInt(n) { return Math.floor(Math.random() * n); }
  function range(a, b) { var out = []; for (var i = a; i <= b; i++) out.push(i); return out; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randInt(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function formatTime(totalSeconds) {
    var s = Math.max(0, Math.ceil(totalSeconds));
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }
  function maxImpostors(players) { return Math.max(1, players); }

  /* ---------------- Nombres de los jugadores ---------------- */
  function nameFor(p) {
    var n = settings.names && settings.names[p - 1];
    n = (n || "").trim();
    return n || ("Jugador " + p);
  }
  function ensureNamesLength() {
    if (!Array.isArray(settings.names)) settings.names = [];
    while (settings.names.length < settings.players) settings.names.push("");
  }

  /* ---------------- Estado y persistencia ---------------- */
  var LS_SETTINGS = "impostor.settings.v1";

  var settings = {
    players: 6,
    impostors: 1,
    mode: "classic",
    categories: null,        // null = todas
    hint: true,
    names: [],
    timer: true,
    timerSeconds: 120,
    vote: true,
    sound: true
  };
  var game = null;
  var usedWords = {};
  var usedPairs = {};
  var currentScreen = "home";

  function saveSettings() { try { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); } catch (e) {} }
  function loadSettings() {
    try {
      var raw = localStorage.getItem(LS_SETTINGS);
      if (raw) Object.assign(settings, JSON.parse(raw));
    } catch (e) {}
  }

  /* ---------------- Sonido y vibración ---------------- */
  var audioCtx = null;
  function beep(freq, dur, type, gain) {
    if (!settings.sound) return;
    try {
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = type || "sine";
      o.frequency.value = freq || 440;
      g.gain.value = gain || 0.07;
      o.connect(g); g.connect(audioCtx.destination);
      var now = audioCtx.currentTime;
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (dur || 0.12));
      o.start(now);
      o.stop(now + (dur || 0.12) + 0.03);
    } catch (e) {}
  }
  function vibrate(ms) {
    if (settings.sound && typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  }

  /* ---------------- Toast ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.remove("is-hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add("is-hidden"); }, 2200);
  }

  /* ---------------- Navegación de pantallas ---------------- */
  function showScreen(name) {
    currentScreen = name;
    $$(".screen").forEach(function (s) { s.classList.toggle("is-active", s.getAttribute("data-screen") === name); });
    var sc = $(".screen.is-active .scroll");
    if (sc) sc.scrollTop = 0;
  }

  /* ---------------- Categorías ---------------- */
  function getAllCategories() {
    return DATA.categories.map(function (c) { return { id: c.id, name: c.name, emoji: c.emoji, words: c.words }; });
  }
  function selectedIds() {
    var all = getAllCategories();
    if (settings.categories === null) return all.map(function (c) { return c.id; });
    var present = all.map(function (c) { return c.id; });
    return settings.categories.filter(function (id) { return present.indexOf(id) !== -1; });
  }
  function getActiveCategories() {
    var ids = selectedIds();
    return getAllCategories().filter(function (c) { return ids.indexOf(c.id) !== -1; });
  }
  function toggleCategory(id) {
    var ids = selectedIds();
    var i = ids.indexOf(id);
    if (i === -1) ids.push(id); else ids.splice(i, 1);
    settings.categories = ids;
    saveSettings();
    renderCategories();
  }
  function renderCategories() {
    var grid = $("#categoriesGrid");
    grid.innerHTML = "";
    var ids = selectedIds();
    getAllCategories().forEach(function (cat) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (ids.indexOf(cat.id) !== -1 ? " is-on" : "");
      var em = document.createElement("span"); em.className = "chip-emoji"; em.textContent = cat.emoji || "⭐";
      var nm = document.createElement("span"); nm.textContent = cat.name;
      b.appendChild(em); b.appendChild(nm);
      b.addEventListener("click", function () { toggleCategory(cat.id); });
      grid.appendChild(b);
    });
    updateCatCount();
  }
  function updateCatCount() {
    if (settings.mode === "infiltrate") {
      $("#catCount").textContent = PAIRS.length + " parejas de palabras";
      return;
    }
    var cats = getActiveCategories();
    var words = cats.reduce(function (n, c) { return n + c.words.length; }, 0);
    $("#catCount").textContent = cats.length + (cats.length === 1 ? " categoría · " : " categorías · ") +
      words.toLocaleString("es-ES") + " palabras";
  }
  function updateHomeCount() {
    var words = DATA.categories.reduce(function (n, c) { return n + c.words.length; }, 0);
    $("#homeWordCount").textContent = words.toLocaleString("es-ES") + " palabras · " +
      DATA.categories.length + " categorías · " + PAIRS.length + " parejas";
  }

  /* ---------------- Ajustes en pantalla ---------------- */
  function updateModeUI() {
    var inf = settings.mode === "infiltrate";
    $$(".seg-btn").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-mode") === settings.mode); });
    $("#modeDesc").textContent = inf
      ? "Todos reciben una palabra, pero la del impostor es parecida. Se usan parejas de palabras."
      : "El impostor no sabe la palabra y debe disimular.";
    $("#rowHint").classList.toggle("is-hidden", inf);
    $("#categoriesCard").classList.toggle("is-hidden", inf);
    updateCatCount();
  }
  function updateCountersUI() {
    var max = maxImpostors(settings.players);
    settings.impostors = clamp(settings.impostors, 1, max);
    $("#playersValue").textContent = settings.players;
    $("#impostorsValue").textContent = settings.impostors;
    $("#impostorsMinus").disabled = settings.impostors <= 1;
    $("#impostorsPlus").disabled = settings.impostors >= max;
    $("#timerValue").textContent = formatTime(settings.timerSeconds);
    $("#timerRow").classList.toggle("is-hidden", !settings.timer);
    ensureNamesLength();
  }
  function updateSwitchesUI() {
    $("#optHint").checked = settings.hint;
    $("#optTimer").checked = settings.timer;
    $("#optVote").checked = settings.vote;
    $("#optSound").checked = settings.sound;
  }
  function updateSetupUI() {
    updateSwitchesUI();
    updateCountersUI();
    updateModeUI();
  }

  /* ---------------- Selección de palabras ---------------- */
  function pickClassicWord() {
    var pool = [];
    getActiveCategories().forEach(function (c) {
      c.words.forEach(function (w) { pool.push({ w: w, cat: c.name }); });
    });
    if (!pool.length) return null;
    var available = pool.filter(function (p) { return !usedWords[p.w]; });
    if (!available.length) { usedWords = {}; available = pool; }
    var chosen = available[randInt(available.length)];
    usedWords[chosen.w] = true;
    return chosen;
  }
  function pickPair() {
    if (!PAIRS.length) return null;
    var idxs = [];
    for (var i = 0; i < PAIRS.length; i++) if (!usedPairs[i]) idxs.push(i);
    if (!idxs.length) { usedPairs = {}; idxs = range(0, PAIRS.length - 1); }
    var idx = idxs[randInt(idxs.length)];
    usedPairs[idx] = true;
    var p = PAIRS[idx];
    var flip = Math.random() < 0.5;
    return { word: flip ? p[0] : p[1], decoy: flip ? p[1] : p[0] };
  }

  /* ---------------- Partida ---------------- */
  function prepareRound() {
    var word = null, decoy = null, categoryName = "";
    if (settings.mode === "infiltrate") {
      var pair = pickPair();
      if (!pair) { toast("No hay parejas de palabras disponibles"); return; }
      word = pair.word; decoy = pair.decoy;
    } else {
      var chosen = pickClassicWord();
      if (!chosen) { toast("Elige al menos una categoría con palabras"); return; }
      word = chosen.w; categoryName = chosen.cat;
    }

    var impostorList = shuffle(range(1, settings.players)).slice(0, settings.impostors);
    var impostorSet = {};
    impostorList.forEach(function (p) { impostorSet[p] = true; });

    game = {
      mode: settings.mode,
      players: settings.players,
      word: word,
      decoy: decoy,
      categoryName: categoryName,
      impostorSet: impostorSet,
      impostorList: impostorList,
      revealOrder: range(1, settings.players),
      index: 0,
      votes: {},
      voteOrder: [],
      voteIndex: 0,
      selectedVote: null,
      tally: null
    };
    beep(600, 0.09); vibrate(15);
    showScreen("reveal");
    renderHandoff();
  }

  /* ---------------- Revelado ---------------- */
  function currentRevealPlayer() { return game.revealOrder[game.index]; }
  function renderHandoff() {
    $("#revealCard").classList.add("is-hidden");
    $("#revealHandoff").classList.remove("is-hidden");
    $("#handoffName").textContent = nameFor(currentRevealPlayer());
    $("#revealProgress").textContent = (game.index + 1) + " de " + game.players;
  }
  function showCard() {
    var player = currentRevealPlayer();
    var isImpostor = !!game.impostorSet[player];
    var card = $("#revealCard");
    var role, wordText, hint = "";
    card.classList.remove("is-impostor");

    if (isImpostor && game.mode === "classic") {
      role = "Eres el impostor";
      wordText = "IMPOSTOR";
      card.classList.add("is-impostor");
      if (settings.hint && game.categoryName) hint = "Categoría: " + game.categoryName;
      beep(170, 0.22, "sawtooth"); vibrate(60);
    } else {
      role = "Tu palabra es";
      wordText = isImpostor ? game.decoy : game.word;
      beep(680, 0.1); vibrate(20);
    }

    $("#cardRole").textContent = role;
    $("#cardWord").textContent = wordText;
    $("#cardHint").textContent = hint;
    $("#revealHandoff").classList.add("is-hidden");
    card.classList.remove("is-hidden");

    var inner = $(".reveal-card-inner", card);
    inner.style.animation = "none";
    void inner.offsetWidth;
    inner.style.animation = "";
  }
  function hideCard() {
    var card = $("#revealCard");
    card.classList.add("is-hidden");
    $(".reveal-card-inner", card).style.animation = "none";
    if (game.index + 1 < game.players) {
      game.index++;
      renderHandoff();
    } else {
      goDiscussion();
    }
  }

  /* ---------------- Debate ---------------- */
  var timerHandle = null, timerRemaining = 0, timerTotal = 0, timerPaused = false;
  function updateTimerUI() {
    var pct = timerTotal > 0 ? (timerRemaining / timerTotal) * 100 : 0;
    var ring = $("#discRing");
    ring.style.setProperty("--p", pct + "%");
    $("#discTime").textContent = formatTime(timerRemaining);
    ring.classList.toggle("is-low", timerRemaining <= timerTotal * 0.25);
  }
  function startDiscussionTimer() {
    stopDiscussionTimer();
    var wrap = $("#discTimerWrap");
    if (!settings.timer || settings.timerSeconds <= 0) { wrap.classList.add("is-hidden"); return; }
    wrap.classList.remove("is-hidden");
    timerTotal = settings.timerSeconds;
    timerRemaining = timerTotal;
    timerPaused = false;
    $("#timerToggle").textContent = "Pausar";
    $("#discRing").classList.remove("is-done");
    updateTimerUI();
    timerHandle = setInterval(function () {
      if (timerPaused) return;
      timerRemaining -= 0.25;
      if (timerRemaining <= 0) {
        timerRemaining = 0;
        updateTimerUI();
        finishTimer();
        return;
      }
      updateTimerUI();
    }, 250);
  }
  function finishTimer() {
    stopDiscussionTimer();
    var ring = $("#discRing");
    ring.classList.add("is-done");
    ring.classList.remove("is-low");
    $("#discTime").textContent = "0:00";
    $("#discLead").textContent = "¡Se acabó el tiempo! Es hora de decidir.";
    beep(880, 0.15, "square"); vibrate([0, 120, 80, 120]);
  }
  function stopDiscussionTimer() {
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
  }
  function goDiscussion() {
    var ol = $("#speakOrder");
    ol.innerHTML = "";
    for (var i = 1; i <= game.players; i++) {
      var li = document.createElement("li");
      li.textContent = nameFor(i);
      ol.appendChild(li);
    }
    var n = game.impostorList.length;
    $("#impostorInfoTitle").textContent = n === 1
      ? "Hay 1 impostor entre vosotros."
      : "Hay " + n + " impostores entre vosotros.";
    $("#impostorInfoText").textContent = game.mode === "infiltrate"
      ? "El impostor tiene una palabra parecida a la vuestra."
      : "El impostor no sabe la palabra y debe improvisar.";
    $("#btnToVote").textContent = settings.vote ? "Ir a votar" : "Revelar la solución";
    $("#discLead").textContent = "Cada jugador da una pista sobre su palabra… sin decirla.";
    showScreen("discussion");
    startDiscussionTimer();
  }

  /* ---------------- Votación ---------------- */
  function startVoting() {
    game.voteOrder = range(1, game.players);
    game.voteIndex = 0;
    game.votes = {};
    game.selectedVote = null;
    game.tally = null;
    renderVoteStep();
    showScreen("vote");
  }
  function renderVoteStep() {
    if (game.voteIndex >= game.voteOrder.length) { finishVoting(); return; }
    var voter = game.voteOrder[game.voteIndex];
    game.selectedVote = null;
    $("#voteStep").textContent = "Votación " + (game.voteIndex + 1) + " de " + game.voteOrder.length;
    $("#voteName").textContent = nameFor(voter);
    $("#voteQuestion").textContent = "¿Quién crees que es el impostor?";
    var grid = $("#voteGrid");
    grid.innerHTML = "";
    for (var p = 1; p <= game.players; p++) {
      if (p === voter) continue;
      (function (cand) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "vote-option";
        b.textContent = nameFor(cand);
        b.addEventListener("click", function () {
          $$(".vote-option").forEach(function (x) { x.classList.remove("is-selected"); });
          b.classList.add("is-selected");
          game.selectedVote = cand;
          $("#voteConfirm").disabled = false;
          beep(520, 0.06); vibrate(10);
        });
        grid.appendChild(b);
      })(p);
    }
    $("#voteConfirm").disabled = true;
  }
  function finishVoting() {
    var counts = {};
    for (var p = 1; p <= game.players; p++) counts[p] = 0;
    Object.keys(game.votes).forEach(function (voter) { counts[game.votes[voter]] += 1; });
    var max = -1, leaders = [];
    for (var i = 1; i <= game.players; i++) {
      if (counts[i] > max) { max = counts[i]; leaders = [i]; }
      else if (counts[i] === max) leaders.push(i);
    }
    game.tally = { counts: counts, max: max, leaders: leaders, accused: leaders.length === 1 ? leaders[0] : null };
    showResult();
  }

  /* ---------------- Resultado ---------------- */
  function showResult() {
    stopDiscussionTimer();
    var g = game;
    var impArr = g.impostorList.slice().sort(function (a, b) { return a - b; });
    var impNames = impArr.map(function (p) { return nameFor(p); }).join(", ");

    $("#impostorCardLabel").textContent = impArr.length > 1 ? "Impostores" : "Impostor";
    $("#resultImpostors").textContent = impNames;
    $("#wordCardLabel").textContent = g.mode === "infiltrate" ? "La palabra (mayoría)" : "La palabra era";
    $("#resultWord").textContent = g.word;

    var decoyCard = $("#decoyCard");
    if (g.mode === "infiltrate" && g.decoy) {
      decoyCard.classList.remove("is-hidden");
      $("#resultDecoy").textContent = g.decoy;
    } else {
      decoyCard.classList.add("is-hidden");
    }

    var voteBox = $("#voteOutcome");
    var emoji = $("#resultEmoji");
    var title = $("#resultTitle");
    var sub = $("#resultSub");

    if (g.tally) {
      var t = g.tally;
      voteBox.classList.remove("is-hidden");
      voteBox.classList.remove("good", "bad");
      var strong = document.createElement("strong");
      var summary = document.createElement("span");
      summary.className = "muted small";
      summary.textContent = range(1, g.players).map(function (p) { return nameFor(p) + ": " + (t.counts[p] || 0); }).join("   ");

      if (!t.accused) {
        emoji.textContent = "🤝";
        title.textContent = "Empate en la votación";
        sub.textContent = "No os pusisteis de acuerdo. ¡El impostor se salva!";
        strong.textContent = "Empate entre: " + t.leaders.map(function (p) { return nameFor(p); }).join(", ") + ".";
        voteBox.classList.add("bad");
      } else if (g.impostorSet[t.accused]) {
        emoji.textContent = "🎉";
        title.textContent = "¡Habéis pillado al impostor!";
        sub.textContent = nameFor(t.accused) + " era impostor. Gana el grupo.";
        strong.textContent = "Más votado: " + nameFor(t.accused) + " con " + t.max + (t.max === 1 ? " voto." : " votos.");
        voteBox.classList.add("good");
      } else {
        emoji.textContent = "😈";
        title.textContent = "¡Se han librado!";
        sub.textContent = nameFor(t.accused) + " era inocente. Gana el impostor.";
        strong.textContent = "Más votado: " + nameFor(t.accused) + " con " + t.max + (t.max === 1 ? " voto." : " votos.");
        voteBox.classList.add("bad");
      }
      voteBox.innerHTML = "";
      voteBox.appendChild(strong);
      voteBox.appendChild(summary);
    } else {
      voteBox.classList.add("is-hidden");
      emoji.textContent = "🕵️";
      title.textContent = "El impostor era…";
      sub.textContent = impArr.length > 1 ? "Estos eran los impostores." : "Este era el impostor.";
    }

    beep(720, 0.14); vibrate(30);
    showScreen("result");
  }

  /* ---------------- Nombres (modal) ---------------- */
  var nameInputs = [];
  function openNamesModal() {
    ensureNamesLength();
    renderNamesInputs();
    $("#modalNames").classList.remove("is-hidden");
  }
  function renderNamesInputs() {
    nameInputs = [];
    var list = $("#nameList");
    list.innerHTML = "";
    for (var i = 1; i <= settings.players; i++) {
      var row = document.createElement("label");
      row.className = "name-row";
      var idx = document.createElement("span");
      idx.className = "name-index";
      idx.textContent = String(i);
      var inp = document.createElement("input");
      inp.type = "text";
      inp.className = "text-input";
      inp.maxLength = 20;
      inp.placeholder = "Jugador " + i;
      inp.value = settings.names[i - 1] || "";
      inp.setAttribute("data-index", String(i - 1));
      row.appendChild(idx);
      row.appendChild(inp);
      list.appendChild(row);
      nameInputs.push(inp);
    }
  }
  function saveNames() {
    ensureNamesLength();
    nameInputs.forEach(function (inp) {
      var i = parseInt(inp.getAttribute("data-index"), 10);
      if (!isNaN(i)) settings.names[i] = (inp.value || "").trim();
    });
    saveSettings();
    $("#modalNames").classList.add("is-hidden");
    beep(700, 0.08);
    toast("Nombres guardados");
  }

  /* ---------------- Enlazado de eventos ---------------- */
  function bindSetup() {
    $("#playersMinus").addEventListener("click", function () {
      settings.players = clamp(settings.players - 1, 3, 16); saveSettings(); updateCountersUI();
    });
    $("#playersPlus").addEventListener("click", function () {
      settings.players = clamp(settings.players + 1, 3, 16); saveSettings(); updateCountersUI();
    });
    $("#impostorsMinus").addEventListener("click", function () {
      settings.impostors = clamp(settings.impostors - 1, 1, maxImpostors(settings.players)); saveSettings(); updateCountersUI();
    });
    $("#impostorsPlus").addEventListener("click", function () {
      settings.impostors = clamp(settings.impostors + 1, 1, maxImpostors(settings.players)); saveSettings(); updateCountersUI();
    });
    $("#timerMinus").addEventListener("click", function () {
      settings.timerSeconds = clamp(settings.timerSeconds - 30, 30, 600); saveSettings(); updateCountersUI();
    });
    $("#timerPlus").addEventListener("click", function () {
      settings.timerSeconds = clamp(settings.timerSeconds + 30, 30, 600); saveSettings(); updateCountersUI();
    });
    $$(".seg-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        settings.mode = b.getAttribute("data-mode"); saveSettings(); updateModeUI(); beep(560, 0.06);
      });
    });
    $("#selectAllCats").addEventListener("click", function () { settings.categories = null; saveSettings(); renderCategories(); });
    $("#selectNoneCats").addEventListener("click", function () { settings.categories = []; saveSettings(); renderCategories(); });
    $("#optHint").addEventListener("change", function () { settings.hint = this.checked; saveSettings(); });
    $("#optTimer").addEventListener("change", function () { settings.timer = this.checked; saveSettings(); updateCountersUI(); });
    $("#optVote").addEventListener("change", function () { settings.vote = this.checked; saveSettings(); });
    $("#optSound").addEventListener("change", function () { settings.sound = this.checked; saveSettings(); });
    $("#startGame").addEventListener("click", function () { prepareRound(); });
  }

  function bindNavigation() {
    $("#btnPlay").addEventListener("click", function () {
      beep(560, 0.07);
      updateSetupUI();
      showScreen("setup");
    });

    $$("[data-back]").forEach(function (b) {
      b.addEventListener("click", function () {
        showScreen(b.getAttribute("data-back"));
        updateHomeCount();
        updateSetupUI();
      });
    });

    var confirmExit = function () {
      if (window.confirm("¿Seguro que quieres salir de la partida?")) {
        stopDiscussionTimer();
        showScreen("home");
        updateHomeCount();
      }
    };
    $("#revealExit").addEventListener("click", confirmExit);
    $("#discExit").addEventListener("click", confirmExit);
    $("#voteExit").addEventListener("click", confirmExit);
  }

  function bindReveal() {
    $("#revealButton").addEventListener("click", showCard);
    $("#hideButton").addEventListener("click", hideCard);
  }

  function bindDiscussion() {
    $("#timerToggle").addEventListener("click", function () {
      timerPaused = !timerPaused;
      this.textContent = timerPaused ? "Continuar" : "Pausar";
      beep(timerPaused ? 380 : 520, 0.06);
    });
    $("#btnToVote").addEventListener("click", function () {
      stopDiscussionTimer();
      if (settings.vote) startVoting();
      else showResult();
    });
    $("#btnToResult").addEventListener("click", function () { stopDiscussionTimer(); showResult(); });
  }

  function bindVote() {
    $("#voteConfirm").addEventListener("click", function () {
      if (game.selectedVote == null) return;
      var voter = game.voteOrder[game.voteIndex];
      game.votes[voter] = game.selectedVote;
      beep(760, 0.08); vibrate(15);
      game.voteIndex++;
      renderVoteStep();
    });
  }

  function bindResult() {
    $("#btnAgain").addEventListener("click", function () { prepareRound(); });
    $("#btnNewGame").addEventListener("click", function () { updateSetupUI(); showScreen("setup"); });
  }

  function bindNames() {
    $("#btnEditNames").addEventListener("click", openNamesModal);
    $("#btnSaveNames").addEventListener("click", saveNames);
    $("#btnCancelNames").addEventListener("click", function () { $("#modalNames").classList.add("is-hidden"); });
    $("#modalNames").addEventListener("click", function (e) { if (e.target === this) this.classList.add("is-hidden"); });
  }

  /* ---------------- Service Worker (PWA) ---------------- */
  function setupServiceWorker() {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    var host = location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || !location.protocol.startsWith("http")) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  /* ---------------- Arranque ---------------- */
  function init() {
    loadSettings();
    bindSetup();
    bindNavigation();
    bindReveal();
    bindDiscussion();
    bindVote();
    bindResult();
    bindNames();
    renderCategories();
    updateSetupUI();
    updateHomeCount();
    setupServiceWorker();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
