/*
 * Comprueba la base de palabras y las pistas: totales, duplicados y categorías vacías.
 * Uso: node tools/validate.mjs
 */
import { readFileSync } from "node:fs";

globalThis.window = {};
function load(rel) {
  const code = readFileSync(new URL(rel, import.meta.url), "utf8");
  new Function(code)();
}

load("../js/words.js");
load("../js/clues.js");

const DATA = window.IMPOSTOR_DATA;
const CLUES = window.IMPOSTOR_CLUES;
const problems = [];
let total = 0;

for (const cat of DATA.categories) {
  const seen = new Set();
  for (const w of cat.words) {
    const k = w.toLowerCase();
    if (seen.has(k)) problems.push(`duplicado en "${cat.id}": ${w}`);
    seen.add(k);
    total++;
  }
  if (cat.words.length < 20) problems.push(`pocas palabras en "${cat.id}": ${cat.words.length}`);
  if (!cat.name || !cat.id) problems.push(`categoría sin nombre/id`);
}

const index = new Map();
for (const cat of DATA.categories) {
  for (const w of cat.words) {
    const k = w.toLowerCase();
    if (!index.has(k)) index.set(k, new Set());
    index.get(k).add(cat.id);
  }
}
const cross = [...index.entries()].filter(([, set]) => set.size > 1);

/* --- Pistas --- */
const keyIndex = new Set(index.keys());
let clueLinks = 0;
const clueWords = new Set();
const seenClueWord = new Set();
for (const [word, list] of Object.entries(CLUES)) {
  if (!keyIndex.has(word.toLowerCase())) problems.push(`pista de palabra que no existe: "${word}"`);
  if (!Array.isArray(list) || list.length === 0) problems.push(`palabra sin pistas: "${word}"`);
  const own = new Set();
  for (const cl of list) {
    if (typeof cl !== "string" || !cl.trim()) { problems.push(`pista vacía en "${word}"`); continue; }
    const k = cl.toLowerCase();
    if (k === word.toLowerCase()) problems.push(`pista que repite su palabra: "${word}"`);
    if (own.has(k)) problems.push(`pista repetida en "${word}": ${cl}`);
    own.add(k);
    clueLinks++;
    if (!keyIndex.has(k)) clueWords.add(cl);
  }
}

console.log(`Categorías: ${DATA.categories.length}`);
console.log(`Palabras:   ${total}`);
console.log(`Palabras con pistas: ${Object.keys(CLUES).length} (${clueLinks} pistas)`);
console.log(`Pistas nuevas (categoría "Pistas"): ${clueWords.size}`);
console.log(`Repetidas en varias categorías: ${cross.length}`);
for (const [w, set] of cross.slice(0, 20)) console.log(`  · "${w}" → ${[...set].join(", ")}`);
if (problems.length) {
  console.log("\nPROBLEMAS:");
  problems.forEach((p) => console.log("  ! " + p));
  process.exitCode = 1;
} else {
  console.log("\nSin problemas de duplicados. ✔");
}
