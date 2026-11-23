'use client';

import React, { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
  stats: {
    highScore: number;
    gamesPlayed: number;
    duelWins: number;
    duelLosses: number;
    exp: number;
    level: number;
  };
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  initialMode?: 'login' | 'register';
  noticeMessage?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  noticeMessage,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Isi username dan password dulu.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    soundFx.playClick();

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses akun.');
      }

      setSuccessMessage(mode === 'register' ? 'Akun siap dipakai.' : 'Berhasil masuk.');
      soundFx.playVictory();

      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal terhubung ke server.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-sm bg-[#14171C] border border-[#353942] rounded-lg p-6 relative flex flex-col gap-5 text-[#F2F0EB] max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup jendela akun"
          className="absolute top-4 right-4 text-[#C7C4BC] hover:text-[#F2F0EB] p-1.5 rounded-md hover:bg-[#1C2028] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex flex-col gap-1 pr-8">
          <h2 id="auth-modal-title" className="font-editorial text-2xl font-semibold text-[#F2F0EB]">
            {mode === 'login' ? 'Masuk ke UNSGuessr' : 'Buat akun pemain'}
          </h2>
          <p className="text-sm text-[#C7C4BC]">
            {mode === 'login'
              ? 'Lanjutkan rekor skor dan progres levelmu.'
              : 'Nama akun langsung dipakai sebagai nama di dalam game.'}
          </p>
        </div>

        {/* UNDERLINE TABS (NOT PILLOWY SEGMENTED AI TABS) */}
        <div className="flex items-center gap-6 border-b border-[#262A32]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
              setSuccessMessage('');
              soundFx.playClick();
            }}
            className={`pb-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              mode === 'login'
                ? 'border-[#E2B34B] text-[#F2F0EB]'
                : 'border-transparent text-[#9B988F] hover:text-[#F2F0EB]'
            }`}
          >
            Masuk
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
              setSuccessMessage('');
              soundFx.playClick();
            }}
            className={`pb-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              mode === 'register'
                ? 'border-[#E2B34B] text-[#F2F0EB]'
                : 'border-transparent text-[#9B988F] hover:text-[#F2F0EB]'
            }`}
          >
            Daftar baru
          </button>
        </div>

        {noticeMessage && (
          <div className="p-3 bg-[#1C2028] border-l-2 border-[#E2B34B] text-[#F2F0EB] text-xs leading-relaxed">
            {noticeMessage}
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-red-950/50 border border-red-400/50 rounded-md text-red-200 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-400/50 rounded-md text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-username" className="text-xs font-medium text-[#C7C4BC]">
              Username
            </label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="nama_pengguna"
              maxLength={20}
              autoComplete="username"
              required
              className="w-full bg-[#0C0E11] border border-[#686A70] focus:border-[#E2B34B] rounded-md py-2.5 px-3 text-sm text-[#F2F0EB] placeholder:text-[#9B988F] transition-colors font-mono"
            />
            <span className="text-xs text-[#9B988F]">
              3 sampai 20 huruf kecil, angka, atau garis bawah.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-password" className="text-xs font-medium text-[#C7C4BC]">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                className="w-full bg-[#0C0E11] border border-[#686A70] focus:border-[#E2B34B] rounded-md py-2.5 pl-3 pr-10 text-sm text-[#F2F0EB] placeholder:text-[#9B988F] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#C7C4BC] hover:text-[#F2F0EB] rounded cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-md font-bold text-sm transition-colors flex items-center justify-center gap-2 mt-1 cursor-pointer ${
              loading
                ? 'bg-[#262A32] text-[#9B988F] cursor-not-allowed'
                : 'bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sebentar...</span>
              </>
            ) : mode === 'register' ? (
              <span>Buat Akun</span>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
