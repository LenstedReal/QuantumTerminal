# Yapılacaklar (QuantumTerminal)

14 Kasım 2026 notu. Altyapı ve güvenlik düzeltmeleri yapıldı ("Hata ve güvenlik düzeltmeleri" commit'i); **arayüz değişmedi**.

## Sıradaki iş: arayüz
- [ ] Sahibiyle konuşulacak: web sitesinde neler istendiği, neler istenmediği (ilk iş).
- [ ] Görsel yenileme: daha güçlü neon terminal havası, açılış animasyonu, fiyat değişiminde yanıp sönen rakamlar, akıcı geçişler, telefonda düzgün düzen.
- [ ] Giriş ekranı: `App.js` sadece paneli gösteriyor, giriş/2FA ekranı hiç bağlı değil. Giriş zorunlu mu olacak, panel herkese açık mı kalacak? Karar verilecek.
- [ ] "İndir" düğmesi Play Store ana sayfasına gidiyor; doğru uygulama adresi konacak.

## Sahibinin yapması gerekenler
- [ ] Eski admin şifresi depo geçmişinde duruyor: **şifreyi değiştir**. Yeni şifre sunucuda `ADMIN_PASSWORD` ortam değişkeni olarak verilir.
- [ ] `.gitconfig` dosyası birinin adı ve e-postasıyla depoda; tutulsun mu silinsin mi?
- [ ] Sunucu (backend) şu an nerede çalışıyor? Vercel yalnızca arayüzü yayınlıyor. Sunucu yoksa giriş ve sunucu üzerinden veri çalışmaz (arayüz CoinGecko'ya doğrudan bağlanır).

## Açık kalan teknik konular
- Kayıt ekranı e-postanın kayıtlı olup olmadığını belli ediyor.
- E-posta doğrulama kodu tarayıcıya geri dönüyor, e-posta gönderilmiyor; kodun deneme sınırı yok.
- Yenileme jetonları (refresh token) döndürülmüyor / iptal edilmiyor.
- Kaba kuvvet kilidi `X-Forwarded-For` başlığına güveniyor (taklit edilebilir).
- Ayrıntılı liste: düzeltme turunun raporu (dosya:satır) bu notun hazırlandığı oturumda tutuldu; önemli olanlar yukarıda.
