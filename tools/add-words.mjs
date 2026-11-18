/*
 * Añade al juego las palabras (y pistas) de un issue creado con el formulario
 * «Sugerir palabras». Lo ejecuta la GitHub Action .github/workflows/palabras.yml.
 *
 * Entrada:  variable de entorno ISSUE_BODY (texto del issue).
 * Salida:   modifica js/words.js, js/clues.js y sw.js; escribe un resumen en
 *           SUMMARY_FILE y "result=changed|nothing|error" en GITHUB_OUTPUT.
 *
 * Uso local: ISSUE_BODY="$(cat issue.md)" node tools/add-words.mjs
 */
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const file = (rel) => new URL(rel, root);
const WORDS = file("js/words.js"), CLUES = file("js/clues.js"), SW = file("sw.js");

const MAX_WORDS = 60, MAX_LEN = 40, MAX_CLUES = 8;

function finish(result, lines) {
  const text = lines.join("\n") + "\n";
  if (process.env.SUMMARY_FILE) writeFileSync(process.env.SUMMARY_FILE, text);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `result=${result}\n`);
  console.log(text);
  process.exit(0);
}

/* ---------- Leer el formulario ---------- */
function sections(body) {
  const out = {};
  const parts = ("\n" + body.replace(/\r/g, "")).split(/\n### /);
  for (const p of parts.slice(1)) {
    const nl = p.indexOf("\n");
    const title = (nl < 0 ? p : p.slice(0, nl)).trim().toLowerCase();
    let value = nl < 0 ? "" : p.slice(nl + 1).trim();
    if (value === "_No response_") value = "";
    out[title] = value;
  }
  return out;
}

function clean(s) {
  if (/[<>]/.test(String(s))) return "";
  let t = String(s)
    .replace(/[\u0000-\u001f\u007f"\\`<>]/g, "")
    .replace(/^[\s\-*•·'«»“”]+|[\s'«»“”.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t || t.length > MAX_LEN) return "";
  return t.charAt(0).toLocaleUpperCase("es") + t.slice(1);
}

function splitList(s) {
  return s.split(/[,;\n]+/).map(clean).filter(Boolean);
}

const form = sections(process.env.ISSUE_BODY || "");
const catName = (form["categoría"] || form["categoria"] || "").trim();
const rawWords = form["palabras"] || "";
const rawClues = form["pistas (opcional)"] || form["pistas"] || "";

/* ---------- Cargar los datos actuales ---------- */
const load = (url, key) => {
  const w = {};
  new Function("window", readFileSync(url, "utf8"))(w);
  return w[key];
};
const DATA = load(WORDS, "IMPOSTOR_DATA");
const CLUE_DATA = load(CLUES, "IMPOSTOR_CLUES");

const cat = DATA.categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
if (!cat) finish("error", [`⚠️ No encuentro la categoría «${catName || "(vacía)"}». No he añadido nada.`]);

/* ---------- Palabras ---------- */
const inCat = new Set(cat.words.map((w) => w.toLowerCase()));
const added = [], repeated = [];
for (const w of splitList(rawWords)) {
  const k = w.toLowerCase();
  if (inCat.has(k)) { if (!repeated.includes(w)) repeated.push(w); continue; }
  if (added.length >= MAX_WORDS) break;
  inCat.add(k);
  added.push(w);
}

/* ---------- Pistas ---------- */
const allWords = new Map(); // minúsculas → forma escrita
for (const c of DATA.categories) for (const w of c.words) allWords.set(w.toLowerCase(), w);
for (const w of added) allWords.set(w.toLowerCase(), w);

const clueKeys = new Map(Object.keys(CLUE_DATA).map((k) => [k.toLowerCase(), k]));
const clueChanges = new Map(); // clave → lista final
const clueSkipped = [];
for (const line of rawClues.split("\n")) {
  if (!line.trim()) continue;
  const i = line.indexOf(":");
  if (i < 0) { clueSkipped.push(line.trim()); continue; }
  const word = clean(line.slice(0, i));
  const real = word && allWords.get(word.toLowerCase());
  if (!real) { clueSkipped.push(line.trim()); continue; }
  const key = clueKeys.get(real.toLowerCase()) || real;
  const list = clueChanges.get(key) || [...(CLUE_DATA[key] || [])];
  const seen = new Set(list.map((x) => x.toLowerCase()));
  for (const cl of splitList(line.slice(i + 1))) {
    const k = cl.toLowerCase();
    if (k === key.toLowerCase() || seen.has(k) || list.length >= MAX_CLUES) continue;
    seen.add(k);
    list.push(cl);
  }
  if (list.length) clueChanges.set(key, list);
}
const newClues = [...clueChanges].filter(([k, l]) =>
  JSON.stringify(l) !== JSON.stringify(CLUE_DATA[k] || []));

if (!added.length && !newClues.length) {
  const lines = ["No había nada nuevo que añadir."];
  if (repeated.length) lines.push(`Ya estaban en ${cat.name}: ${repeated.join(", ")}.`);
  if (clueSkipped.length) lines.push(`Pistas que no he entendido: ${clueSkipped.join(" · ")}`);
  finish("nothing", lines);
}

/* ---------- Escribir los archivos ---------- */
const originals = [WORDS, CLUES, SW].map((u) => [u, readFileSync(u, "utf8")]);

if (added.length) {
  let src = readFileSync(WORDS, "utf8");
  const start = src.indexOf(`{ id: ${JSON.stringify(cat.id)}`);
  const close = src.indexOf("]}", start);
  const lastQuote = src.lastIndexOf('"', close);
  if (start < 0 || close < 0 || lastQuote < start) finish("error", ["⚠️ No he podido localizar la categoría en js/words.js."]);
  const rows = [];
  for (let i = 0; i < added.length; i += 6) rows.push(added.slice(i, i + 6).map((w) => JSON.stringify(w)).join(", "));
  src = src.slice(0, lastQuote + 1) + ",\n      " + rows.join(",\n      ") + src.slice(lastQuote + 1);
  writeFileSync(WORDS, src);
}

if (newClues.length) {
  let src = readFileSync(CLUES, "utf8");
  for (const [key, list] of newClues) {
    const entry = `  ${JSON.stringify(key)}: [${list.map((x) => JSON.stringify(x)).join(", ")}]`;
    const re = new RegExp(`^  ${JSON.stringify(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}: \\[.*\\](,?)$`, "m");
    if (re.test(src)) {
      src = src.replace(re, (m, comma) => entry + comma);
    } else {
      src = src.replace(/\s*\n\};\s*$/, ",\n" + entry + "\n};\n");
    }
  }
  writeFileSync(CLUES, src);
}

let sw = readFileSync(SW, "utf8");
sw = sw.replace(/const VERSION = "v(\d+)"/, (m, n) => `const VERSION = "v${Number(n) + 1}"`);
writeFileSync(SW, sw);

/* ---------- Validar ---------- */
try {
  execFileSync(process.execPath, [new URL("validate.mjs", import.meta.url).pathname], { stdio: "pipe" });
} catch (e) {
  for (const [u, text] of originals) writeFileSync(u, text);
  const out = String(e.stdout || "").split("\n").filter((l) => l.includes("!")).slice(0, 10);
  finish("error", ["⚠️ La validación ha fallado y no he cambiado nada:", "", ...out.map((l) => "- " + l.trim())]);
}

/* ---------- Resumen ---------- */
const lines = [];
if (added.length) lines.push(`✅ Añadidas a **${cat.name}**: ${added.join(", ")}.`);
if (newClues.length) lines.push(`💡 Pistas: ${newClues.map(([k, l]) => `${k} (${l.join(", ")})`).join(" · ")}.`);
const asClue = new Set(Object.values(CLUE_DATA).flat().map((x) => x.toLowerCase()));
const noClue = added.filter((w) => !clueChanges.has(clueKeys.get(w.toLowerCase()) || w) &&
  !clueKeys.has(w.toLowerCase()) && !asClue.has(w.toLowerCase()));
if (noClue.length) lines.push(`ℹ️ Sin pistas (solo saldrán jugando sin pista): ${noClue.join(", ")}.`);
if (repeated.length) lines.push(`↩️ Ya estaban: ${repeated.join(", ")}.`);
if (clueSkipped.length) lines.push(`⚠️ Pistas que no he entendido: ${clueSkipped.join(" · ")}`);
lines.push("", "En un par de minutos estarán en la web.");
finish("changed", lines);
