/*
 * Comprueba la base de palabras: totales, duplicados y categorías vacías.
 * Uso: node tools/validate.mjs
 */
import { readFileSync } from "node:fs";

globalThis.window = {};
function load(rel) {
  const code = readFileSync(new URL(rel, import.meta.url), "utf8");
  new Function(code)();
}

load("../js/words.js");
load("../js/pairs.js");

const DATA = window.IMPOSTOR_DATA;
const PAIRS = window.IMPOSTOR_PAIRS;
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

const pairSeen = new Set();
for (const p of PAIRS) {
  if (!Array.isArray(p) || p.length !== 2 || !p[0] || !p[1]) problems.push(`pareja inválida: ${JSON.stringify(p)}`);
  const key = [p[0].toLowerCase(), p[1].toLowerCase()].sort().join("|");
  if (pairSeen.has(key)) problems.push(`pareja duplicada: ${p.join(" / ")}`);
  pairSeen.add(key);
}

console.log(`Categorías: ${DATA.categories.length}`);
console.log(`Palabras:   ${total}`);
console.log(`Parejas:    ${PAIRS.length}`);
console.log(`Repetidas en varias categorías: ${cross.length}`);
for (const [w, set] of cross.slice(0, 20)) console.log(`  · "${w}" → ${[...set].join(", ")}`);
if (problems.length) {
  console.log("\nPROBLEMAS:");
  problems.forEach((p) => console.log("  ! " + p));
  process.exitCode = 1;
} else {
  console.log("\nSin problemas de duplicados. ✔");
}
