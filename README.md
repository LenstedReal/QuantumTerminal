# LENSTEDREAL Quantum Terminal

Canlı kripto piyasası terminali: CoinGecko fiyatları, TradingView grafikleri ve fiyat verisinden hesaplanan, nasıl hesaplandığını gösteren analiz. Yatırım tavsiyesi değildir.

- **Site:** `frontend/` (React, Create React App + craco). Vercel bu klasörü yayınlar, ayarlar `frontend/vercel.json` dosyasında.
- **Veri:** `frontend/api/` içindeki Vercel fonksiyonları CoinGecko verisini önbellekle sunar. Yanıt gelmezse site sırayla CoinGecko'ya doğrudan, Binance'e ve CoinPaprika'ya bağlanır; son alınan veriler tarayıcıda saklanır.
- **Yerelde çalıştırma:** `cd frontend && yarn install && yarn start`

by lenstedreal
