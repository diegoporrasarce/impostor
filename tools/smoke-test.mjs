/*
 * Prueba de humo del juego con un DOM simulado (sin navegador).
 * Uso: node tools/smoke-test.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

/* -------------------- mini DOM -------------------- */
class El {
  constructor(tag) {
    this.tagName = (tag || "div").toUpperCase();
    this.id = "";
    this._classes = new Set();
    this.children = [];
    this._text = "";
    const self = this;
    this.style = { setProperty(k, v) { self.style[k] = v; }, getPropertyValue(k) { return self.style[k]; } };
    this._listeners = {};
    this._attrs = {};
    this.dataset = {};
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.type = "";
    this.offsetWidth = 1;
    this.maxLength = 0;
    this.placeholder = "";
  }
  get className() { return [...this._classes].join(" "); }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get classList() {
    const s = this._classes;
    return {
      add: (...c) => c.forEach((x) => s.add(x)),
      remove: (...c) => c.forEach((x) => s.delete(x)),
      contains: (c) => s.has(c),
      toggle: (c, force) => {
        const on = force === undefined ? !s.has(c) : !!force;
        if (on) s.add(c); else s.delete(c);
        return on;
      },
    };
  }
  get textContent() { return this._text; }
  set textContent(v) { this._text = String(v); this.children = []; }
  set innerHTML(v) { if (v === "") { this.children = []; this._text = ""; } }
  appendChild(c) { this.children.push(c); c.parent = this; return c; }
  setAttribute(k, v) {
    this._attrs[k] = String(v);
    if (k === "class") this.className = v;
    if (k.indexOf("data-") === 0) this.dataset[k.slice(5)] = String(v);
  }
  getAttribute(k) { return k in this._attrs ? this._attrs[k] : null; }
  hasAttribute(k) { return k in this._attrs; }
  addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); }
  dispatch(t) { (this._listeners[t] || []).forEach((fn) => fn.call(this, { target: this })); }
  querySelector(sel) { return document.querySelector(sel); }
  querySelectorAll(sel) { return document.querySelectorAll(sel); }
}

const IDS = {};
const ALL = [];
const scrollStub = new El("div"); scrollStub.className = "scroll";

function match(el, sel) {
  if (sel[0] === "#") return el.id === sel.slice(1);
  if (sel[0] === "[") return el.hasAttribute(sel.slice(1, -1).split("=")[0]);
  if (sel[0] === ".") return sel.slice(1).split(".").every((c) => el.classList.contains(c));
  return false;
}

const document = {
  readyState: "complete",
  addEventListener() {},
  createElement: (t) => { const e = new El(t); ALL.push(e); return e; },
  querySelector: (sel) => {
    if (sel === ".screen.is-active .scroll") return scrollStub;
    return ALL.find((e) => match(e, sel)) || null;
  },
  querySelectorAll: (sel) => ALL.filter((e) => match(e, sel)),
};

/* parsear index.html para crear los elementos */
const html = read("index.html");
const tagRe = /<([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
let m;
while ((m = tagRe.exec(html))) {
  const attrs = m[2];
  const el = new El(m[1]);
  const id = (attrs.match(/\bid="([^"]*)"/) || [])[1];
  const cls = (attrs.match(/\bclass="([^"]*)"/) || [])[1];
  const db = (attrs.match(/\bdata-back="([^"]*)"/) || [])[1];
  const dm = (attrs.match(/\bdata-mode="([^"]*)"/) || [])[1];
  const ds = (attrs.match(/\bdata-screen="([^"]*)"/) || [])[1];
  if (id) el.id = id;
  if (cls) el.className = cls;
  if (db) el.setAttribute("data-back", db);
  if (dm) el.setAttribute("data-mode", dm);
  if (ds) el.setAttribute("data-screen", ds);
  if (/\bchecked\b/.test(attrs)) el.checked = true;
  ALL.push(el);
  if (id) IDS[id] = el;
}

const store = {};
globalThis.window = globalThis;
globalThis.document = document;
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
globalThis.location = { hostname: "localhost", protocol: "http:" };
globalThis.navigator = {};
globalThis.confirm = () => true;

/* cargar el juego */
function run(rel) { new Function(read(rel))(); }
run("js/words.js");
run("js/pairs.js");
run("js/app.js");

/* -------------------- utilidades de test -------------------- */
let failures = 0;
function ok(cond, msg) {
  if (cond) { console.log("  ✓ " + msg); }
  else { console.log("  ✗ " + msg); failures++; }
}
function byId(id) { const e = IDS[id]; if (!e) throw new Error("no existe #" + id); return e; }
function click(id) { byId(id).dispatch("click"); }
function activeScreen() {
  const s = ALL.filter((e) => e.classList.contains("screen") && e.classList.contains("is-active"));
  return s.length === 1 ? s[0].getAttribute("data-screen") : "??" + s.map((x) => x.getAttribute("data-screen"));
}

/* -------------------- 1. Límite de impostores -------------------- */
console.log("\n— Límite de impostores —");
click("btnPlay");
ok(activeScreen() === "setup", "abre la pantalla de ajustes");
for (let i = 0; i < 12; i++) click("impostorsPlus");
ok(byId("impostorsValue").textContent === "6", "el máximo de impostores es el nº de jugadores (6)");
click("playersPlus"); // 7
ok(byId("impostorsPlus").disabled === false, "con más jugadores se pueden añadir más impostores");
click("impostorsPlus");
ok(byId("impostorsValue").textContent === "7", "permite 7 impostores con 7 jugadores");
click("playersMinus"); // 6
ok(byId("impostorsValue").textContent === "6", "al bajar jugadores se ajusta el nº de impostores");
for (let i = 0; i < 12; i++) click("impostorsMinus");
ok(byId("impostorsValue").textContent === "1", "el mínimo es 1 impostor");

/* -------------------- 2. Nombres de jugadores -------------------- */
console.log("\n— Nombres de jugadores —");
click("playersPlus"); click("playersPlus"); // 8
click("impostorsPlus");                     // 2
ok(byId("playersValue").textContent === "8", "8 jugadores");
ok(byId("impostorsValue").textContent === "2", "2 impostores");

click("btnEditNames");
ok(!byId("modalNames").classList.contains("is-hidden"), "abre el editor de nombres");
const nameInputs = document.querySelectorAll("[data-index]");
ok(nameInputs.length === 8, "hay un campo por jugador (8)");
nameInputs[0].value = "Marta";
nameInputs[1].value = "Bruno";
click("btnSaveNames");
ok(byId("modalNames").classList.contains("is-hidden"), "se cierra al guardar");

/* -------------------- 3. Partida clásica (orden 1→N) -------------------- */
console.log("\n— Modo clásico —");
click("startGame");
ok(activeScreen() === "reveal", "empieza el revelado");
const order = [];
const words = [];
for (let i = 0; i < 8; i++) {
  order.push(byId("handoffName").textContent);
  click("revealButton");
  words.push(byId("cardWord").textContent);
  click("hideButton");
}
ok(order[0] === "Marta" && order[1] === "Bruno", "el orden es 1, 2, 3… (Marta, Bruno)");
ok(order[7] === "Jugador 8", "los jugadores sin nombre usan “Jugador N”");
const impostorReveals = words.filter((w) => w === "IMPOSTOR").length;
const civilWords = words.filter((w) => w !== "IMPOSTOR");
ok(impostorReveals === 2, "exactamente 2 jugadores ven IMPOSTOR");
ok(new Set(civilWords).size === 1 && civilWords.length === 6, "los 6 civiles ven la misma palabra");
ok(activeScreen() === "discussion", "pasa al debate tras revelar a todos");
ok(byId("speakOrder").children[0].textContent === "Marta", "el orden de palabra empieza por el jugador 1");

click("btnToVote");
ok(activeScreen() === "vote", "empieza la votación");
ok(byId("voteName").textContent === "Marta", "la votación empieza por el jugador 1");
for (let i = 0; i < 8; i++) {
  const grid = byId("voteGrid");
  ok(grid.children.length === 7, "el votante tiene 7 opciones (sin incluirse)");
  if (i === 0) ok(grid.children[0].textContent === "Bruno", "las opciones usan nombres");
  grid.children[0].dispatch("click");
  click("voteConfirm");
}
ok(activeScreen() === "result", "tras votar todos, muestra el resultado");
ok(byId("resultWord").textContent === civilWords[0], "el resultado muestra la palabra correcta");
ok(byId("resultImpostors").textContent.length > 0, "muestra el/los impostor(es)");
ok(byId("decoyCard").classList.contains("is-hidden"), "sin tarjeta de señuelo en modo clásico");

/* -------------------- 4. Pista para el impostor -------------------- */
console.log("\n— Pista para el impostor —");
const hintSwitch = byId("optHint");
hintSwitch.checked = true;
hintSwitch.dispatch("change");
ok(byId("categoriesCard").classList.contains("is-hidden"), "con pista se ocultan las categorías (se usan parejas)");
click("startGame");
ok(activeScreen() === "reveal", "la partida con pista empieza el revelado");
const words2 = [];
const hints2 = [];
for (let i = 0; i < 8; i++) {
  click("revealButton");
  words2.push(byId("cardWord").textContent);
  hints2.push(byId("cardHint").textContent);
  click("hideButton");
}
const impWords = words2.filter((w) => w === "IMPOSTOR");
const civWords = words2.filter((w) => w !== "IMPOSTOR");
ok(impWords.length === 2, "los 2 impostores ven IMPOSTOR");
ok(new Set(civWords).size === 1 && civWords.length === 6, "los 6 civiles ven la misma palabra");
const impHints = hints2.filter((h) => h.indexOf("Pista: ") === 0);
ok(impHints.length === 2, "los impostores reciben una pista de palabra parecida");
ok(impHints.every((h) => h !== "Pista: " + civWords[0]), "la pista es distinta de la palabra de los civiles");
click("btnToResult");
ok(activeScreen() === "result", "salta al resultado");
ok(!byId("decoyCard").classList.contains("is-hidden"), "muestra la pista del impostor");
ok(byId("resultDecoy").textContent.length > 0, "la pista del impostor no está vacía");

hintSwitch.checked = false;
hintSwitch.dispatch("change");
ok(!byId("categoriesCard").classList.contains("is-hidden"), "sin pista vuelven a verse las categorías");

/* -------------------- 5. Categorías -------------------- */
console.log("\n— Categorías —");
const chipCount = byId("categoriesGrid").children.length;
ok(chipCount === 26, "el selector tiene las 26 categorías (" + chipCount + ")");
ok(byId("catCount").textContent.indexOf("palabras") !== -1, "muestra el total de palabras seleccionadas");

/* -------------------- 6. Persistencia -------------------- */
console.log("\n— Persistencia —");
ok(!!store["impostor.settings.v1"], "los ajustes se guardan en localStorage");

/* -------------------- resumen -------------------- */
console.log("\n" + (failures === 0 ? "TODO OK ✔" : failures + " FALLOS ✗"));
if (failures) process.exitCode = 1;
