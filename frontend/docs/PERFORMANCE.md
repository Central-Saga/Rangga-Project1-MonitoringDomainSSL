# Bundle budget frontend

Gate untuk parameter `9.5` (audit 496): **JS awal ≤ 200 KiB gzip**.

## Perintah

```bash
npm run build
npm run check:bundle
```

`check:bundle` membaca `.next/build-manifest.json`, menggabungkan
`polyfillFiles` + `rootMainFiles` + chunk unik tiap rute dari
`pagesChunkGroupBootstrapParams`, lalu mengukur gzip tiap file dengan
`zlib.gzipSync` (level default). Rute terbesar yang melebihi 204.800 byte
menggagalkan perintah dengan exit code 1.

## Hasil terukur (23 Nov 2026)

- Base chunks: `171156` byte gzip (`167.1 KiB`)
- Rute terberat: `(base)` — `171156` byte gzip (`167.1 KiB`)
- Budget: `204800` byte (`200 KiB`)
- Status: **LULUS**

## Catatan metodologi

Angka audit awal (`213.8 KB gzip`) berasal dari analyzer yang menghitung
transfer jaringan/route bundle dengan metodologi berbeda. Gate yang
di-commit di sini mengukur chunk awal dari manifest build Next.js dan sengaja
tidak memasukkan chunk lazy yang dimuat setelah interaksi. Jadi hasil ini
membuktikan kepatuhan terhadap metode yang didokumentasikan, bukan kesetaraan
byte-for-byte dengan analyzer auditor.

`npm audit --audit-level=critical` juga dijalankan dan melaporkan
`found 0 vulnerabilities` pada saat verifikasi.
