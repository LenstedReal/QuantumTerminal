# LENSTEDREAL Quantum Terminal V10 - PRD

## Problem Statement
Profesyonel trading terminal dashboard'u. Orijinal HTML tasarımını koruyup React+FastAPI full-stack uygulamasına dönüştürme, auth sistemi, gerçek zamanlı veri, mobil uyumluluk, PWA.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Lucide icons, TradingView widget'ları
- **Backend**: FastAPI (Python), Motor (MongoDB async), httpx (CoinGecko API)
- **Database**: MongoDB
- **Auth**: JWT (httpOnly cookies), bcrypt, PyOTP (2FA), Discord OAuth, brute force koruma
- **Data**: CoinGecko free API (30s interval)
- **PWA**: manifest.json, app icons, standalone mode

## Core Requirements
- LENSTEDREAL SYSTEMS markası (hiç Emergent ibaresi yok)
- Neon cyberpunk terminal estetiği (glow efektleri, scanline overlay)
- TradingView Advanced Chart / Technical Analysis / Screener widget'ları
- Varlık İstihbaratı + Aktivite Kaydı paneli
- Sistem logları, Ticker bar
- "by lenstedreal" footer
- Play Store indirme + App Store YAKINDA
- Full Türkçe arayüz

## Implemented (14 Nisan 2026)
- ✅ Full React frontend with original design preserved + neon enhancement
- ✅ FastAPI backend with CoinGecko API integration
- ✅ JWT auth: email/password, email verification, 2FA (TOTP)
- ✅ Discord OAuth full flow (backend ready, needs credentials)
- ✅ Güçlü parola validasyonu (8+ karakter, büyük/küçük harf, rakam, özel karakter)
- ✅ Parola güvenlik göstergesi (frontend)
- ✅ Login activity logging (IP, device, OS, browser)
- ✅ Brute force protection (5 deneme, 15dk kilitleme)
- ✅ Admin seeding on startup
- ✅ Full Turkish localization (backend hata mesajları dahil)
- ✅ TradingView widgets (chart, technical analysis, screener)
- ✅ Real-time market data (30s refresh)
- ✅ Mobile responsive design
- ✅ PWA manifest + app icons
- ✅ Neon glow CSS animations (border-pulse, text-glow, neon-btn)
- ✅ Scanline overlay
- ✅ No Emergent branding

## Backlog
- P0: Discord OAuth credentials (DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET gerekli)
- P1: SendGrid/SMTP ile gerçek e-posta gönderimi
- P1: Kullanıcı profil/ayarlar sayfası
- P2: Push notification
- P2: Watchlist / favori varlıklar
- P3: Play Store APK / PWA build & publish
