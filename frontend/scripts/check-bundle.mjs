/**
 * Bundle budget gate untuk artefak Next.js (audit #62 / 9.5).
 *
 * Metode: baca `.next/build-manifest.json`, gabungkan `polyfillFiles` +
 * `rootMainFiles` + chunk unik tiap route dari `pagesChunkGroupBootstrapParams`,
 * lalu ukur ukuran gzip tiap file dengan zlib level default. Ambang: 200 KiB
 * (204800 byte) untuk rute terbesar. Ini menyetarakan "JS awal" dengan chunk
 * yang dimuat saat navigasi awal; bukan pengukuran transfer jaringan penuh
 * (yang dapat memuat chunk tambahan lazily).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_BYTES = 200 * 1024;
const root = process.cwd();
const manifestPath = join(root, ".next", "build-manifest.json");

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  console.error(`Gagal membaca ${manifestPath}. Jalankan \`npm run build\` terlebih dahulu.`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}

const gzipSize = (file) => gzipSync(readFileSync(join(root, ".next", file))).length;
const baseFiles = [...new Set([...(manifest.polyfillFiles ?? []), ...(manifest.rootMainFiles ?? [])])];
const groups = manifest.pagesChunkGroupBootstrapParams ?? {};

const baseBytes = baseFiles.reduce((sum, file) => sum + gzipSize(file), 0);
let worst = { route: "(base)", bytes: baseBytes };

for (const [route, info] of Object.entries(groups)) {
  const files = new Set([...baseFiles, ...(info.otherChunks ?? [])]);
  const bytes = [...files].reduce((sum, file) => sum + gzipSize(file), 0);
  if (bytes > worst.bytes) worst = { route, bytes };
}

console.log(`Base chunks  : ${baseBytes} byte (${(baseBytes / 1024).toFixed(1)} KiB)`);
console.log(`Rute terberat: ${worst.route} — ${worst.bytes} byte (${(worst.bytes / 1024).toFixed(1)} KiB)`);
console.log(`Budget       : ${BUDGET_BYTES} byte (200 KiB)`);

if (worst.bytes > BUDGET_BYTES) {
  console.error(`GAGAL: bundle awal melebihi budget sebesar ${worst.bytes - BUDGET_BYTES} byte.`);
  process.exit(1);
}

console.log("LULUS: bundle awal berada di bawah budget.");
