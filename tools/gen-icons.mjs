/*
 * Genera los iconos PNG de la app sin dependencias externas.
 * Uso:  node tools/gen-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "icons");

/* ---- CRC32 ---- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

/* ---- helpers de color ---- */
const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];
const BG_TOP = [42, 31, 82];
const BG_BOT = [18, 15, 30];
const ACCENT = [139, 92, 246];
const ACCENT2 = [34, 211, 238];
const DARK = [18, 15, 30];

/**
 * Dibuja el icono: fondo degradado + "ojo de espía".
 * contentScale encoge el motivo para dejar margen (iconos maskable).
 */
function sample(u, v, contentScale) {
  // fondo
  let col = mix(BG_TOP, BG_BOT, v);
  // halo suave
  const dcx = u - 0.5, dcy = v - 0.42;
  const d = Math.sqrt(dcx * dcx + dcy * dcy);
  if (d < 0.62) col = mix(col, ACCENT, (1 - d / 0.62) * 0.35);

  // coordenadas del motivo (centradas y escaladas)
  const x = (u - 0.5) / contentScale;
  const y = (v - 0.5) / contentScale;

  // elipse del ojo
  const ex = x / 0.33, ey = y / 0.205;
  const inEye = ex * ex + ey * ey <= 1;
  if (inEye) {
    const t = Math.min(1, Math.max(0, u * 0.9 + 0.05));
    col = mix(ACCENT, ACCENT2, t);
  }
  // pupila
  const pd = Math.sqrt(x * x + y * y);
  if (pd <= 0.1) col = DARK;
  // brillo
  const hd = Math.sqrt((x + 0.055) ** 2 + (y + 0.05) ** 2);
  if (hd <= 0.036) col = mix(col, [255, 255, 255], 0.9);
  return col;
}

function renderIcon(size, contentScale) {
  const buf = Buffer.alloc(size * size * 4);
  const SS = 3; // supersampling 3x3
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (px + (sx + 0.5) / SS) / size;
          const v = (py + (sy + 0.5) / SS) / size;
          const c = sample(u, v, contentScale);
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = 255;
    }
  }
  return encodePNG(size, size, buf);
}

mkdirSync(outDir, { recursive: true });
const jobs = [
  ["icon-192.png", 192, 1.0],
  ["icon-512.png", 512, 1.0],
  ["icon-180.png", 180, 1.0],
  ["icon-maskable-512.png", 512, 0.78],
];
for (const [name, size, scale] of jobs) {
  writeFileSync(join(outDir, name), renderIcon(size, scale));
  console.log("✓ icons/" + name);
}
console.log("Iconos generados en", outDir);
