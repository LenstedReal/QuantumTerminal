# Yapılacaklar (QuantumTerminal)

14 Kasım 2026 notu.

## Yapıldı
- [x] Play Store / App Store düğmeleri ve Instagram adresi kaldırıldı; altta yalnızca "by lenstedreal".
- [x] Eski terminal görünümüne yakın arayüz: neon camgöbeği, bitişik paneller, modül numaraları, tarama çizgileri.
- [x] Sahte "GÜÇLÜ AL" sinyalleri yerine fiyat verisinden hesaplanan "Kuantum analiz" ve "Yapay zekâ hata yapabilir" notu.
- [x] Ek sekmeler: Piyasalar (BIST, dolar, euro, gram altın, endeksler, emtia, döviz), ısı haritaları, ekonomik takvim ve haberler.
- [x] Bağlantı: Vercel önbellek (`frontend/api`), CoinGecko, Binance ve CoinPaprika yedekleri; son veriler tarayıcıda saklanır.
- [x] Çok piyasalı terminal: ~686 sembol, piyasa sekmeleri, 686 sembolde arama, favoriler, piyasa nabzı, kendi ısı haritası, Türkiye/endeks/emtia/döviz tabloları, gerçek logolar (döviz çiftlerinde iki bayrak).
- [x] Depo temizliği: kullanılmayan sunucu kodu (giriş sistemi, MongoDB), hazır arayüz kütüphanesi, eski tasarım ve test notları kaldırıldı.

## Kontrol edilecek (canlı sitede)
- [ ] `/api/scan?m=bist` ve diğer piyasalar Vercel'de veri döndürüyor mu (TradingView tarayıcısı sunucudan erişime izin veriyor mu).
- [ ] TradingView grafiğinin Türkiye sembollerini (gram altın, BIST 100) gösterdiği.
