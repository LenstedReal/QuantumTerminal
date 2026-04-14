import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Shield, Mail, Lock, User, AlertTriangle } from "lucide-react";

export default function AuthPage() {
  const { login, register, verify2FALogin } = useAuth();
  const [mode, setMode] = useState("login"); // login, register, 2fa
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.requires_2fa) {
      setTempToken(result.temp_token);
      setMode("2fa");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await register(email, password, name);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.verification_code) {
      setVerificationCode(result.verification_code);
    }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await verify2FALogin(totpCode, tempToken);
    setLoading(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(circle at center, #0a0a15 0%, #020204 100%)' }} data-testid="auth-page">
      {/* Scanline */}
      <div className="fixed inset-0 pointer-events-none z-50" style={{
        background: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%)',
        backgroundSize: '100% 4px',
        opacity: 0.25
      }} />

      <div className="w-full max-w-md" data-testid="auth-container">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-[4px] text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            LENSTEDREAL <span style={{ color: '#00f2ff', textShadow: '0 0 10px rgba(0,242,255,0.3)' }}>SYSTEMS</span>
          </h1>
          <div className="text-[10px] tracking-[3px] mt-1" style={{ color: '#64748b' }}>QUANTUM TERMINAL V10</div>
        </div>

        {/* Auth Card */}
        <div className="border rounded-xl p-6" style={{ background: 'rgba(7,10,16,0.9)', borderColor: 'rgba(30,41,59,0.6)' }}>
          {mode === "2fa" ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5" style={{ color: '#00f2ff' }} />
                <h2 className="text-sm font-bold tracking-wider" style={{ color: '#00f2ff' }}>İKİ FAKTÖRLÜ DOĞRULAMA</h2>
              </div>
              <p className="text-xs mb-4" style={{ color: '#64748b' }}>Doğrulama uygulamanızdan 6 haneli kodu girin.</p>
              <form onSubmit={handle2FA}>
                <input
                  type="text"
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded text-center text-lg tracking-[8px] font-mono font-bold outline-none"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.6)', color: '#fff' }}
                  data-testid="2fa-code-input"
                  autoFocus
                />
                {error && <div className="mt-3 text-xs flex items-center gap-1" style={{ color: '#ff003c' }}><AlertTriangle className="w-3 h-3" />{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 rounded font-bold text-sm tracking-wider transition-all"
                  style={{ background: '#00f2ff', color: '#020204' }}
                  data-testid="2fa-submit-btn"
                >
                  {loading ? "DOĞRULANIYOR..." : "DOĞRULA"}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Tab Switch */}
              <div className="flex border-b mb-6" style={{ borderColor: 'rgba(30,41,59,0.6)' }}>
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="flex-1 pb-3 text-xs font-bold tracking-wider transition-colors"
                  style={{
                    color: mode === "login" ? '#00f2ff' : '#64748b',
                    borderBottom: mode === "login" ? '2px solid #00f2ff' : '2px solid transparent'
                  }}
                  data-testid="login-tab"
                >
                  GİRİŞ YAP
                </button>
                <button
                  onClick={() => { setMode("register"); setError(""); }}
                  className="flex-1 pb-3 text-xs font-bold tracking-wider transition-colors"
                  style={{
                    color: mode === "register" ? '#00f2ff' : '#64748b',
                    borderBottom: mode === "register" ? '2px solid #00f2ff' : '2px solid transparent'
                  }}
                  data-testid="register-tab"
                >
                  KAYIT OL
                </button>
              </div>

              <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
                {mode === "register" && (
                  <div className="mb-4">
                    <label className="text-[10px] tracking-wider block mb-1.5" style={{ color: '#64748b' }}>İSİM</label>
                    <div className="flex items-center rounded px-3" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.6)' }}>
                      <User className="w-4 h-4 shrink-0" style={{ color: '#64748b' }} />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Adınız Soyadınız"
                        required
                        className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-white placeholder:text-zinc-600"
                        data-testid="register-name-input"
                      />
                    </div>
                  </div>
                )}
                <div className="mb-4">
                  <label className="text-[10px] tracking-wider block mb-1.5" style={{ color: '#64748b' }}>E-POSTA</label>
                  <div className="flex items-center rounded px-3" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.6)' }}>
                    <Mail className="w-4 h-4 shrink-0" style={{ color: '#64748b' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-white placeholder:text-zinc-600"
                      data-testid="email-input"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[10px] tracking-wider block mb-1.5" style={{ color: '#64748b' }}>PAROLA</label>
                  <div className="flex items-center rounded px-3" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.6)' }}>
                    <Lock className="w-4 h-4 shrink-0" style={{ color: '#64748b' }} />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 karakter"
                      required
                      minLength={6}
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-white placeholder:text-zinc-600"
                      data-testid="password-input"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="p-1">
                      {showPass ? <EyeOff className="w-4 h-4" style={{ color: '#64748b' }} /> : <Eye className="w-4 h-4" style={{ color: '#64748b' }} />}
                    </button>
                  </div>
                </div>

                {error && <div className="mb-3 text-xs flex items-center gap-1" style={{ color: '#ff003c' }}><AlertTriangle className="w-3 h-3" />{error}</div>}

                {verificationCode && mode === "register" && (
                  <div className="mb-3 p-3 rounded text-xs" style={{ background: 'rgba(0,242,255,0.1)', border: '1px solid rgba(0,242,255,0.3)', color: '#00f2ff' }}>
                    E-posta doğrulama kodu: <span className="font-bold text-sm">{verificationCode}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded font-bold text-sm tracking-wider transition-all hover:opacity-90"
                  style={{ background: '#00f2ff', color: '#020204' }}
                  data-testid={mode === "login" ? "login-submit-btn" : "register-submit-btn"}
                >
                  {loading ? "İŞLENİYOR..." : mode === "login" ? "GİRİŞ YAP" : "HESAP OLUŞTUR"}
                </button>
              </form>

              {/* Discord Login */}
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(30,41,59,0.6)' }}>
                <button
                  className="w-full py-2.5 rounded text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: '#5865F2', color: '#fff' }}
                  data-testid="discord-login-btn"
                  onClick={() => alert("Discord OAuth entegrasyonu için Discord uygulama bilgileri gereklidir. Yönetici ile iletişime geçin.")}
                >
                  <svg width="16" height="12" viewBox="0 0 127.14 96.36" fill="white">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                  </svg>
                  DISCORD ILE GIRIS YAP
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="text-sm font-bold tracking-[3px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#cbd5e1', textShadow: '0 0 15px rgba(0,242,255,0.3)' }}>
            by lenstedreal &#10084;&#65039;&#8205;&#129657;
          </div>
        </div>
      </div>
    </div>
  );
}
