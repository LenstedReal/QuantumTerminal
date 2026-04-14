# LENSTEDREAL Quantum Terminal V10 - PRD

## Problem Statement
Profesyonel trading terminal dashboard'u. Orijinal HTML tasarımını koruyup React+FastAPI full-stack uygulamasına dönüştürme, auth sistemi ekleme, gerçek zamanlı veri çekme, mobil uyumluluk.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Lucide icons, TradingView widget'ları
- **Backend**: FastAPI (Python), Motor (MongoDB async driver), httpx (CoinGecko API)
- **Database**: MongoDB
- **Auth**: JWT (httpOnly cookies), bcrypt, PyOTP (2FA), brute force koruma
- **Data**: CoinGecko free API (30s interval)

## Core Requirements
- LENSTEDREAL SYSTEMS markası (hiç Emergent ibaresi yok)
- TradingView Advanced Chart (NVDA default)
- TradingView Technical Analysis widget (Güçlü Al/Sat göstergesi)
- TradingView Screener widget (Tarayıcı)
- Varlık İstihbaratı paneli (NVDA.US, GOOGL.US + canlı BTC/ETH)
- Sistem logları
- "by lenstedreal" footer
- Ticker bar (canlı fiyat kayması)
- Play Store indirme linki + App Store YAKINDA badge

## Implemented (14 Nisan 2026)
- ✅ Full React frontend with original design preserved
- ✅ FastAPI backend with CoinGecko API integration
- ✅ JWT auth with email/password, email verification, 2FA (TOTP)
- ✅ Discord login button (placeholder - YAKINDA)
- ✅ Login activity logging (IP, device, OS)
- ✅ Brute force protection (5 deneme, 15dk kilitleme)
- ✅ Admin seeding on startup
- ✅ Full Turkish localization
- ✅ TradingView widgets (chart, technical analysis, screener)
- ✅ Real-time market data (30s refresh)
- ✅ Mobile responsive design
- ✅ Scanline overlay effect
- ✅ No Emergent branding

## Backlog
- P0: Discord OAuth entegrasyonu (Discord App credentials gerekli)
- P1: E-posta doğrulama (SendGrid/SMTP entegrasyonu)
- P1: Kullanıcı profil sayfası ve 2FA yönetimi
- P2: Push notification sistemi
- P2: Watchlist / favori varlıklar
- P2: Gerçek alım/satım emri sistemi
- P3: Play Store APK / PWA build

## Next Tasks
1. Discord OAuth (kullanıcıdan credentials alınacak)
2. E-posta gönderimi için SMTP/SendGrid entegrasyonu
3. Kullanıcı ayarları sayfası
4. PWA manifest ekleme (Play Store için)
