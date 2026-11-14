# Yapılacaklar (QuantumTerminal)

14 Kasım 2026 notu. Altyapı ve güvenlik düzeltmeleri yapıldı ("Hata ve güvenlik düzeltmeleri" commit'i). Arayüz yenilendi ("Yeni arayüz" commit'i).

## Arayüz
- [x] Sahibinin isteği: Play Store / App Store düğmeleri ve Instagram adresi yok; altta yalnızca "by lenstedreal".
- [x] Yeni görünüm: cam paneller, açılış animasyonu, fiyat değişiminde yanıp sönen rakamlar, telefonda düzgün düzen.
- [x] Sahte "GÜÇLÜ AL" sinyalleri kaldırıldı. "Kuantum analiz" artık fiyat verisinden hesaplanıyor (ortalama farkı, 7 gün, 24 saat, RSI) ve nasıl hesaplandığını gösteriyor.
- [x] "Yapay zekâ hata yapabilir, yatırım tavsiyesi değildir" notu eklendi.
- [x] V11: Piyasalar (BIST, dolar, euro, gram altın, endeksler, emtia, döviz), ısı haritaları, ekonomik takvim ve haberler, sistem kaydı.
- [x] Bağlantı: Vercel önbellek (`frontend/api`), CoinGecko, Binance/CoinPaprika yedekleri; son veriler tarayıcıda saklanır.
- [ ] Giriş ekranı: `App.js` sadece paneli gösteriyor, giriş/2FA ekranı hiç bağlı değil. Giriş zorunlu mu olacak, panel herkese açık mı kalacak? Karar verilecek.
- Not: `design_guidelines.json` ve `memory/PRD.md` eski tasarım notları; Play Store düğmesinden bahsediyorlar ama sitede gösterilmiyorlar.

## Sahibinin yapması gerekenler
- [ ] `.gitconfig` dosyası birinin adı ve e-postasıyla depoda; tutulsun mu silinsin mi?
- [ ] Sunucu (backend) şu an nerede çalışıyor? Vercel yalnızca arayüzü yayınlıyor. Sunucu yoksa giriş ve sunucu üzerinden veri çalışmaz (arayüz CoinGecko'ya doğrudan bağlanır).

## Açık kalan teknik konular
- Kayıt ekranı e-postanın kayıtlı olup olmadığını belli ediyor.
- E-posta doğrulama kodu tarayıcıya geri dönüyor, e-posta gönderilmiyor; kodun deneme sınırı yok.
- Yenileme jetonları (refresh token) döndürülmüyor / iptal edilmiyor.
- Kaba kuvvet kilidi `X-Forwarded-For` başlığına güveniyor (taklit edilebilir).
- Ayrıntılı liste: düzeltme turunun raporu (dosya:satır) bu notun hazırlandığı oturumda tutuldu; önemli olanlar yukarıda.
