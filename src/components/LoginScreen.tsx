'use client';

import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  RotateCw,
  AlertCircle,
  ShieldCheck,
  X,
  Phone,
  Mail,
  HelpCircle
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  isAuthenticating?: boolean;
}

export default function LoginScreen({
  onLoginSuccess,
  isAuthenticating = false
}: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier.trim(),
          username: identifier.trim(),
          password: password.trim(),
          rememberMe
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.user) {
        setError(
          data.message ||
            'Invalid credentials. Please verify your authorized username/email and permanent PIN.'
        );
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err?.message || 'Network error while attempting to connect to server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden bg-[#071c10] select-none font-sans">
      {/* FULL-SCREEN 3D BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: 'url(/dreamloom_login_bg.png)',
          backgroundPosition: 'center center'
        }}
      />

      {/* Subtle responsive overlay for optimal legibility across mobile & desktop */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 sm:from-black/20 z-0 pointer-events-none" />

      {/* TOP HEADER: BRANDING FOR MOBILE / TABLET (On desktop the 3D logo in background is prominent) */}
      <header className="relative z-10 w-full px-5 py-4 sm:px-8 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-sm border border-white/60 lg:opacity-0 lg:pointer-events-none transition">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.6 4.6 8.4C6.2 19.4 6 18.2 6 17c0-5 4-9 9-9 1.2 0 2.4.2 3.4.6C16.6 5.8 14.5 4 12 4z" />
              <path
                d="M21.7 8.3C21.9 9.5 22 10.7 22 12c0 5.5-4.5 10-10 10-1.3 0-2.5-.1-3.7-.4C9.5 20.6 11 19 11 17c0-4.4 3.6-8 8-8 1 0 1.9.2 2.7.3z"
                opacity="0.8"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xs font-extrabold tracking-wider text-[#0D5C2C] uppercase leading-none">
              DREAMLOOM HOLDING LIMITED
            </h1>
            <p className="text-[10px] text-emerald-800 italic font-serif leading-tight">
              where big dreamers meet
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 text-[11px] font-semibold text-emerald-950 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>256-Bit SSL Encrypted Portal</span>
        </div>
      </header>

      {/* MAIN CONTENT: RIGHT-ALIGNED WHITE TRANSLUCENT LOGIN PANEL */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center lg:justify-end px-4 sm:px-8 lg:pr-16 xl:pr-24 py-6">
        <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-md rounded-3xl border border-white/80 shadow-2xl shadow-emerald-950/40 p-6 sm:p-8 space-y-5 transition-all">
          {/* CARD HEADER */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#0D5C2C] tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-600 font-medium">
              Sign in to access Dreamloom BMS
            </p>
            <div className="w-12 h-0.5 bg-[#0D5C2C] rounded-full mx-auto my-2" />
          </div>

          {/* INITIAL SESSION VERIFICATION STATE */}
          {isAuthenticating ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#0D5C2C] border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-slate-700">
                Verifying secure session...
              </p>
              <p className="text-[11px] text-slate-400">
                Restoring authenticated dashboard
              </p>
            </div>
          ) : (
            <>
              {/* ERROR ALERT */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. USERNAME OR EMAIL */}
                <div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="Username or Email"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      className="w-full bg-slate-50/80 border border-slate-300 focus:border-[#0D5C2C] focus:bg-white rounded-xl pl-10 pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium transition focus:outline-none focus:ring-2 focus:ring-[#0D5C2C]/20"
                    />
                  </div>
                </div>

                {/* 2. PASSWORD WITH SHOW/HIDE TOGGLE */}
                <div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-50/80 border border-slate-300 focus:border-[#0D5C2C] focus:bg-white rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium transition focus:outline-none focus:ring-2 focus:ring-[#0D5C2C]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition p-0.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-[#0D5C2C]" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. REMEMBER ME TOGGLE (30-DAY PERSISTENT SESSION) */}
                <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50/90 border border-slate-200">
                  <label
                    htmlFor="remember-me"
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-[#0D5C2C]"
                    />
                    <span className="text-xs text-slate-700 font-semibold">
                      Remember me on this device
                    </span>
                  </label>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                    30 Days
                  </span>
                </div>

                {/* 4. SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#0C632D] to-[#15803D] hover:from-[#094E23] hover:to-[#126630] shadow-lg shadow-emerald-900/25 transition active:scale-[0.99] flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </>
                  )}
                </button>
              </form>

              {/* DIVIDER */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400">
                  <span className="bg-white/95 px-3 font-medium">or</span>
                </div>
              </div>

              {/* FORGOT PASSWORD */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#0D5C2C] hover:text-[#094E23] hover:underline transition"
                >
                  <Lock className="w-3.5 h-3.5 text-[#0D5C2C]" />
                  <span>Forgot Password?</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* BOTTOM FOOTER: BRANDING & MOTTO */}
      <footer className="relative z-10 w-full px-5 py-4 sm:px-8 sm:py-5 flex flex-wrap items-center justify-between text-xs text-white/90 gap-2">
        <div className="flex items-center gap-4 text-[11px] font-medium drop-shadow">
          <span className="hidden sm:inline">© {new Date().getFullYear()} Dreamloom Holding Limited</span>
          <span className="hidden md:inline">• Business Management System</span>
        </div>
        <div className="italic font-serif text-xs sm:text-sm font-semibold tracking-wide text-emerald-100 drop-shadow">
          Building Wealth Together
        </div>
      </footer>

      {/* FORGOT PASSWORD / PIN RECOVERY MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Lock className="w-4 h-4 text-[#0D5C2C]" />
                </div>
                <h3 className="text-base font-extrabold text-[#0D5C2C]">
                  Password & PIN Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              For corporate security and protection of financial records, credential resets cannot be executed automatically.
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
              <span className="font-bold text-[#0D5C2C] block">
                Please contact the authorized System Administrator:
              </span>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-medium text-slate-800">admin@dreamloom.co.ke</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-medium text-slate-800">+254 719 545 283 (Managing Director)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="text-[11px] text-slate-500">Executive Office • Nairobi, Kenya</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Once your identity is verified, an administrator will issue a temporary one-time PIN or update your credentials.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="w-full py-2.5 rounded-xl font-bold text-white bg-[#0D5C2C] hover:bg-[#0A4B23] transition text-xs shadow-md"
              >
                Close & Return to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
