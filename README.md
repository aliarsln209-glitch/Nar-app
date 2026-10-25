# NAR – Gıda Etiketi Analizi (PWA)

Vite + React + TypeScript PWA. v0.1: profil (14 alerjen + 5 tercih, cihazda saklanır), ürün listesi + sonuç ekranı, E-kod arama, favoriler.

## Çalıştırma
```
npm install
npm run dev
npm run build
```

## Mimari
- `src/engine/types.ts` – analiz motoru sözleşmesi (AI ekibinin API'siyle hizalanacak).
- `src/engine/mock.ts` – DEMO motor: `food_ai_300_soru.json` test setindeki elle yazılmış beklenen sonuçları döndürür. Gerçek analiz değildir.
- `src/engine/index.ts` – gerçek API hazır olunca buradan değişecek.
- `src/data/demoCases.json` – test setinin kısaltılmış hali. `src/data/ecodes.ts` – E-kod verisi için yer tutucu.
- Profil/favoriler yalnızca `localStorage` (KVKK: sağlık verisi sunucuya gitmez).
- Kazınmış metinler `cleanText` ile temizlenir, HTML olarak render edilmez.

## Cloudflare
Workers & Pages → Create application → GitHub repo → Build command: `npm run build`, çıktı: `dist` (`wrangler.jsonc` SPA yönlendirmesini ayarlar).

## Eksikler
Barkod, OCR, RAG asistanı, hesaplar, gerçek E-kod verisi, yüksek çözünürlüklü logo (mevcut 143×139 px; ikonlar büyütülmüş).
