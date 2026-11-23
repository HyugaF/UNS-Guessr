'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Play,
  Settings,
  HelpCircle,
  X,
  Volume2,
  VolumeX,
  LogOut,
  Check,
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import type { AuthUser } from '@/components/AuthModal';
import { calculateLevel } from '@/lib/expLevel';

interface LobbyScreenProps {
  onStartGame: (config: {
    timerDuration: number | null;
  }) => void;
  onOpenDuel: () => void;
  onOpenEightPlayer: () => void;
  authUser?: AuthUser | null;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

const TIMER_PRESETS: Array<{ label: string; value: number | null }> = [
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '120d', value: 120 },
  { label: 'Bebas', value: null },
];

export function LobbyScreen({
  onStartGame,
  onOpenDuel,
  onOpenEightPlayer,
  authUser,
  onOpenAuthModal,
  onLogout,
}: LobbyScreenProps) {
  const [selectedTimer, setSelectedTimer] = useState<number | null>(60);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const userExp = authUser?.stats?.exp ?? 0;
  const levelInfo = calculateLevel(userExp);

  const [highScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('unsguessr_highscore_streetview') || '0', 10);
    }
    return 0;
  });

  const displayHighScore = authUser?.stats?.highScore
    ? Math.max(highScore, authUser.stats.highScore)
    : highScore;

  useEffect(() => {
    const hasModal = showSettingsModal || showSupportModal || showUserModal;
    if (!hasModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettingsModal(false);
        setShowSupportModal(false);
        setShowUserModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettingsModal, showSupportModal, showUserModal]);

  const requireAuth = (callback: () => void) => {
    if (!authUser) {
      soundFx.playPinDrop();
      onOpenAuthModal('login');
      return;
    }
    callback();
  };

  const handleStart = (timer: number | null = selectedTimer) => {
    requireAuth(() => {
      soundFx.playClick();
      onStartGame({ timerDuration: timer });
    });
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setMuted(!next);
  };

  return (
    <div className="min-h-screen w-full bg-[#0C0E11] text-[#F2F0EB] flex flex-col font-sans">
      {/* SINGLE SLIM TOP NAVIGATION BAR (NO SAAS SIDEBAR, NO FAKE SEARCH) */}
      <header className="sticky top-0 z-30 h-14 w-full bg-[#0C0E11]/95 border-b border-[#262A32] px-4 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <span className="text-base font-bold tracking-tight text-[#F2F0EB] shrink-0">
            UNSGuessr
          </span>

          <nav aria-label="Mode permainan" className="hidden md:flex items-center gap-5 text-sm">
            <button
              type="button"
              onClick={() => handleStart(selectedTimer)}
              className="text-[#F2F0EB] hover:text-[#E2B34B] font-medium transition-colors cursor-pointer"
            >
              Solo 5 Ronde
            </button>
            <button
              type="button"
              onClick={() =>
                requireAuth(() => {
                  soundFx.playClick();
                  onOpenDuel();
                })
              }
              className="text-[#C7C4BC] hover:text-[#F2F0EB] font-medium transition-colors cursor-pointer"
            >
              Duel 1v1
            </button>
            <button
              type="button"
              onClick={() =>
                requireAuth(() => {
                  soundFx.playClick();
                  onOpenEightPlayer();
                })
              }
              className="text-[#C7C4BC] hover:text-[#F2F0EB] font-medium transition-colors cursor-pointer"
            >
              Room 8 Pemain
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
            title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
            className="w-9 h-9 flex items-center justify-center text-[#C7C4BC] hover:text-[#F2F0EB] rounded-md hover:bg-[#14171C] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            aria-label="Panduan bermain"
            title="Panduan"
            className="hidden sm:flex w-9 h-9 items-center justify-center text-[#C7C4BC] hover:text-[#F2F0EB] rounded-md hover:bg-[#14171C] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            aria-label="Pengaturan"
            title="Pengaturan"
            className="hidden sm:flex w-9 h-9 items-center justify-center text-[#C7C4BC] hover:text-[#F2F0EB] rounded-md hover:bg-[#14171C] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <span className="h-4 w-px bg-[#262A32] hidden sm:block" aria-hidden="true" />

          {authUser ? (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setShowUserModal(true);
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-[#686A70] hover:border-[#F2F0EB] bg-[#14171C] text-sm transition-colors cursor-pointer"
              title="Buka profil dan progres EXP"
            >
              <span className="font-mono text-xs text-[#E2B34B] font-semibold">
                Lv.{levelInfo.level}
              </span>
              <span className="text-[#F2F0EB] font-medium max-w-[110px] sm:max-w-[150px] truncate">
                {authUser.displayName}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onOpenAuthModal('login');
                }}
                className="px-3 py-1.5 text-sm font-medium text-[#F2F0EB] hover:text-[#E2B34B] transition-colors cursor-pointer"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onOpenAuthModal('register');
                }}
                className="px-3.5 py-1.5 text-sm font-semibold bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] rounded-md transition-colors cursor-pointer"
              >
                Daftar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN FLOW */}
      <main className="flex-1 flex flex-col">
        {/* FULL-BLEED CAMPUS HERO STAGE */}
        <section
          aria-label="Mulai permainan UNSGuessr"
          className="relative w-full min-h-[470px] sm:min-h-[520px] lg:min-h-[560px] flex items-end border-b border-[#262A32] overflow-hidden"
        >
          <Image
            src="/images/uns-campus-hero.jpg"
            alt="Suasana senja kawasan Rektorat Universitas Sebelas Maret Kentingan Surakarta"
            fill
            priority
            sizes="100vw"
            referrerPolicy="no-referrer"
            className="object-cover object-center"
          />

          {/* Directional scrim so left editorial block stays high-contrast across all viewports */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0C0E11] via-[#0C0E11]/85 to-[#0C0E11]/25"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0C0E11] via-transparent to-[#0C0E11]/35"
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col gap-8">
            <div className="max-w-xl flex flex-col gap-4">
              <p className="font-mono text-xs text-[#C7C4BC] tracking-wide">
                7°33&apos;37&quot;S 110°51&apos;24&quot;E · Kentingan, Surakarta
              </p>

              <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-semibold text-[#F2F0EB] leading-[1.06] tracking-tight">
                Seberapa hafal kamu sudut UNS?
              </h1>

              <p className="text-sm sm:text-base text-[#C7C4BC] leading-relaxed max-w-lg">
                Lima titik acak Street View 360° di sekitar Kentingan, Manahan, Kleco, dan Mesen. Tentukan lokasimu di peta seakurat mungkin.
              </p>

              {/* DIRECT PLAY BAR: TIMER PRESET + SINGLE PRIMARY CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStart(selectedTimer)}
                  className="px-6 py-3 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] font-bold text-sm rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Mulai Main Solo</span>
                </button>

                <div
                  className="inline-flex items-center bg-[#14171C]/95 border border-[#686A70] rounded-md p-1 self-start sm:self-auto"
                  role="group"
                  aria-label="Pilih durasi per ronde"
                >
                  {TIMER_PRESETS.map((preset) => {
                    const active = selectedTimer === preset.value;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          setSelectedTimer(preset.value);
                        }}
                        aria-pressed={active}
                        className={`px-3 py-1.5 text-xs font-mono font-semibold rounded transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#F2F0EB] text-[#0C0E11]'
                            : 'text-[#C7C4BC] hover:text-[#F2F0EB]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* QUIET CARTOGRAPHIC TELEMETRY STRIP (NO BOXED KPI CARDS) */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 border-t border-[#F2F0EB]/15 text-sm">
              <div className="flex items-baseline gap-2.5">
                <span className="text-xs text-[#9B988F]">Skor terbaik</span>
                <span className="font-mono font-bold text-[#F2F0EB] tabular-nums">
                  {displayHighScore.toLocaleString('id-ID')}
                </span>
                <span className="text-xs font-mono text-[#9B988F]">/ 25.000</span>
              </div>

              {authUser ? (
                <>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-xs text-[#9B988F]">Peringkat akun</span>
                    <span className="font-mono font-semibold text-[#E2B34B]">
                      Lv.{levelInfo.level}
                    </span>
                    <span className="text-xs text-[#C7C4BC]">{levelInfo.title}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-24 h-1.5 bg-[#262A32] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E2B34B]"
                        style={{ width: `${Math.max(6, levelInfo.progressPercent)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-[#9B988F] tabular-nums">
                      {levelInfo.expInCurrentLevel}/{levelInfo.expForNextLevel} XP
                    </span>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    onOpenAuthModal('register');
                  }}
                  className="text-xs text-[#C7C4BC] hover:text-[#F2F0EB] underline underline-offset-4 cursor-pointer"
                >
                  Buat akun untuk menyimpan skor dan naik level
                </button>
              )}
            </div>
          </div>
        </section>

        {/* COMPETITIVE ARENAS: OPEN ARCHITECTURAL TWO-COLUMN SPLIT (NO ICON-BOX CARDS) */}
        <section
          aria-label="Mode tanding multiplayer"
          className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-6 border-b border-[#262A32]">
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#F2F0EB]">
              Tanding bareng teman atau rival kampus
            </h2>
            <span className="font-mono text-xs text-[#9B988F]">
              Titik Street View sinkron tiap ronde
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#262A32]">
            {/* ARENA 01: DUEL 1V1 */}
            <div className="py-7 md:pr-10 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between gap-4 font-mono text-xs text-[#9B988F]">
                  <span>01 · DUEL 1V1</span>
                  <span>6.000 HP · 1.0x hingga 2.0x</span>
                </div>
                <h3 className="text-xl font-bold text-[#F2F0EB]">
                  Duel Satu Lawan Satu
                </h3>
                <p className="text-sm text-[#C7C4BC] leading-relaxed">
                  Selisih skor di tiap ronde langsung mengurangi HP lawan. Mulai ronde ketiga pengganda naik ke 1.5x, lalu 2.0x sampai salah satu tumbang.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() =>
                    requireAuth(() => {
                      soundFx.playClick();
                      onOpenDuel();
                    })
                  }
                  className="px-4 py-2.5 bg-[#14171C] hover:bg-[#1C2028] border border-[#686A70] hover:border-[#F2F0EB] text-[#F2F0EB] text-sm font-semibold rounded-md transition-colors cursor-pointer"
                >
                  Buka Arena Duel
                </button>
              </div>
            </div>

            {/* ARENA 02: 8 PLAYER ROOM */}
            <div className="py-7 md:pl-10 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between gap-4 font-mono text-xs text-[#9B988F]">
                  <span>02 · ROOM PRIVAT</span>
                  <span>Maks 8 pemain · 5 ronde</span>
                </div>
                <h3 className="text-xl font-bold text-[#F2F0EB]">
                  Room 8 Pemain
                </h3>
                <p className="text-sm text-[#C7C4BC] leading-relaxed">
                  Buat room sendiri dan bagikan kode ke teman satu kelas atau himpunan. Semua menebak lokasi yang sama lalu lihat siapa paling atas di podium.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() =>
                    requireAuth(() => {
                      soundFx.playClick();
                      onOpenEightPlayer();
                    })
                  }
                  className="px-4 py-2.5 bg-[#14171C] hover:bg-[#1C2028] border border-[#686A70] hover:border-[#F2F0EB] text-[#F2F0EB] text-sm font-semibold rounded-md transition-colors cursor-pointer"
                >
                  Buat atau Gabung Room
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* QUIET GROUNDED FOOTER */}
      <footer className="w-full border-t border-[#262A32] px-4 sm:px-8 py-5 text-xs text-[#9B988F]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
            <span className="text-[#C7C4BC]">Kawasan Peta:</span>
            <span>Kentingan</span>
            <span>·</span>
            <span>Manahan</span>
            <span>·</span>
            <span>Kleco</span>
            <span>·</span>
            <span>Mesen</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="hover:text-[#F2F0EB] transition-colors cursor-pointer"
            >
              Cara bermain
            </button>
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="hover:text-[#F2F0EB] transition-colors cursor-pointer"
            >
              Pengaturan
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL: SETTINGS */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
        >
          <div className="bg-[#14171C] border border-[#353942] rounded-lg w-full max-w-sm p-6 flex flex-col gap-5 relative">
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              aria-label="Tutup pengaturan"
              className="absolute top-4 right-4 text-[#C7C4BC] hover:text-[#F2F0EB] p-1.5 rounded-md hover:bg-[#1C2028] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 id="settings-modal-title" className="font-editorial text-2xl font-semibold text-[#F2F0EB]">
              Pengaturan
            </h3>

            <div className="flex flex-col divide-y divide-[#262A32]">
              <div className="flex items-center justify-between py-3.5 gap-4">
                <div>
                  <div className="text-sm font-medium text-[#F2F0EB]">Efek suara</div>
                  <div className="text-xs text-[#9B988F]">Bunyi pin peta, skor, dan hitungan mundur</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={soundEnabled}
                  aria-label="Aktifkan efek suara"
                  onClick={handleToggleSound}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                    soundEnabled ? 'bg-[#E2B34B]' : 'bg-[#353942]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-[#0C0E11] transition-transform ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="py-3.5 flex flex-col gap-1">
                <div className="text-sm font-medium text-[#F2F0EB]">Proteksi peta</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Tautan lokasi langsung di Street View dinonaktifkan</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 bg-[#1C2028] hover:bg-[#262B35] border border-[#686A70] text-[#F2F0EB] rounded-md text-sm font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL: PANDUAN */}
      {showSupportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
        >
          <div className="bg-[#14171C] border border-[#353942] rounded-lg w-full max-w-md p-6 flex flex-col gap-4 relative">
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              aria-label="Tutup panduan"
              className="absolute top-4 right-4 text-[#C7C4BC] hover:text-[#F2F0EB] p-1.5 rounded-md hover:bg-[#1C2028] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 id="support-modal-title" className="font-editorial text-2xl font-semibold text-[#F2F0EB]">
              Cara bermain
            </h3>

            <div className="flex flex-col divide-y divide-[#262A32] text-sm text-[#C7C4BC]">
              <div className="py-3">
                <strong className="text-[#F2F0EB] block mb-1">Solo 5 Ronde</strong>
                Putar kamera Street View untuk mencari petunjuk gedung atau jalan, taruh pin di peta kanan bawah, lalu tekan Tebak.
              </div>
              <div className="py-3">
                <strong className="text-[#F2F0EB] block mb-1">Duel 1v1 (6.000 HP)</strong>
                Selisih poin tiap ronde dikalikan pengganda ronde untuk mengurangi HP lawan. Yang HP-nya bertahan sampai akhir menang.
              </div>
              <div className="py-3">
                <strong className="text-[#F2F0EB] block mb-1">Room 8 Pemain</strong>
                Buat room untuk dapat kode unik, atau masukkan kode teman untuk main 5 ronde bareng.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] rounded-md text-sm font-bold cursor-pointer"
            >
              Oke, paham
            </button>
          </div>
        </div>
      )}

      {/* MODAL: PROFIL & EXP */}
      {showUserModal && authUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
        >
          <div className="bg-[#14171C] border border-[#353942] rounded-lg w-full max-w-sm p-6 flex flex-col gap-5 relative">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              aria-label="Tutup profil"
              className="absolute top-4 right-4 text-[#C7C4BC] hover:text-[#F2F0EB] p-1.5 rounded-md hover:bg-[#1C2028] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-8">
              <div className="font-mono text-xs text-[#9B988F]">@{authUser.username}</div>
              <h3 id="profile-modal-title" className="font-editorial text-2xl font-semibold text-[#F2F0EB] mt-0.5 truncate">
                {authUser.displayName}
              </h3>
            </div>

            {/* LEVEL & EXP */}
            <div className="flex flex-col gap-2 py-4 border-y border-[#262A32]">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-mono font-semibold text-[#E2B34B]">
                  Level {levelInfo.level} · {levelInfo.title}
                </span>
                <span className="font-mono text-[#9B988F]">{levelInfo.tier}</span>
              </div>

              <div className="w-full bg-[#0C0E11] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#E2B34B] h-full transition-all duration-300"
                  style={{ width: `${Math.max(5, levelInfo.progressPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-[#C7C4BC]">
                <span>
                  {levelInfo.expInCurrentLevel.toLocaleString('id-ID')} / {levelInfo.expForNextLevel.toLocaleString('id-ID')} XP
                </span>
                <span className="text-[#9B988F]">
                  Total {levelInfo.totalExp.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* FLAT HAIRLINE STATS (NO BOXES INSIDE BOXES) */}
            <dl className="grid grid-cols-2 gap-y-4 gap-x-6 text-left">
              <div>
                <dt className="text-xs text-[#9B988F]">Skor terbaik</dt>
                <dd className="text-lg font-mono font-bold text-[#F2F0EB] tabular-nums mt-0.5">
                  {displayHighScore.toLocaleString('id-ID')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#9B988F]">Total main</dt>
                <dd className="text-lg font-mono font-bold text-[#F2F0EB] tabular-nums mt-0.5">
                  {authUser.stats?.gamesPlayed || 0}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#9B988F]">Menang duel</dt>
                <dd className="text-lg font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                  {authUser.stats?.duelWins || 0}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#9B988F]">Kalah duel</dt>
                <dd className="text-lg font-mono font-bold text-red-400 tabular-nums mt-0.5">
                  {authUser.stats?.duelLosses || 0}
                </dd>
              </div>
            </dl>

            <div className="text-xs text-[#9B988F] font-mono pt-3 border-t border-[#262A32]">
              Terdaftar {new Date(authUser.createdAt).toLocaleDateString('id-ID')}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowUserModal(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 px-3 bg-red-950/50 hover:bg-red-900/70 border border-red-400/50 text-red-200 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="py-2.5 px-4 bg-[#1C2028] hover:bg-[#262B35] border border-[#686A70] text-[#F2F0EB] rounded-md text-sm font-medium transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
