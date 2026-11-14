# LENSTEDREAL Quantum Terminal

Çok piyasalı canlı terminal: ~686 sembol (kripto, ABD hisseleri, BIST, döviz, emtia, endeksler), TradingView grafikleri, gerçek logolar ve piyasa verisinden hesaplanan, nasıl hesaplandığını gösteren analiz. Yatırım tavsiyesi değildir.

- **Site:** `frontend/` (React, Create React App + craco). Vercel bu klasörü yayınlar, ayarlar `frontend/vercel.json` dosyasında.
- **Veri:** `frontend/api/scan.js` 6 piyasayı (kripto 250, ABD 200, BIST 150, döviz 40, emtia 21, endeks 24) TradingView tarayıcısından ve CoinGecko'dan toplu çeker; Vercel önbelleği sayesinde veri en fazla ~10 saniye gecikmelidir. CoinGecko çökerse kripto Binance'ten gelir. `frontend/api/global.js` toplam kripto piyasası verisini verir. Son alınan veriler tarayıcıda saklanır.
- **Yerelde çalıştırma:** `cd frontend && yarn install && yarn start`

by lenstedreal
