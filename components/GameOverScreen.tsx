'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Share2, Check } from 'lucide-react';
import type { UNSLocation } from '@/data/unsLocations';
import { formatDistance, getPlayerRank } from '@/lib/geoScore';
import { soundFx } from '@/lib/soundFx';
import { calculateLevel } from '@/lib/expLevel';

export interface RoundRecord {
  round: number;
  location: UNSLocation;
  userGuess: { lat: number; lng: number } | null;
  distanceMeters: number;
  score: number;
}

interface GameOverScreenProps {
  totalScore: number;
  maxScore: number;
  rounds: RoundRecord[];
  gameMode: 'streetview' | 'photo';
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  expGained?: number;
  userStats?: {
    exp: number;
    level: number;
  };
  leveledUp?: boolean;
}

export function GameOverScreen({
  totalScore,
  maxScore,
  rounds,
  gameMode,
  onPlayAgain,
  onReturnToLobby,
  expGained,
  userStats,
  leveledUp,
}: GameOverScreenProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const calculatedExp = expGained ?? Math.max(100, Math.round(totalScore / 5) + 150);
  const totalUserExp = userStats?.exp ?? calculatedExp;
  const levelInfo = calculateLevel(totalUserExp);

  const [isNewHighScore] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const key = `unsguessr_highscore_${gameMode}`;
      const prevHigh = parseInt(localStorage.getItem(key) || '0', 10);
      return totalScore > prevHigh;
    }
    return false;
  });

  const rank = getPlayerRank(totalScore);

  const validDistances = rounds.map((r) => r.distanceMeters);
  const avgDistance =
    validDistances.length > 0
      ? Math.round(validDistances.reduce((a, b) => a + b, 0) / validDistances.length)
      : 0;
  const bestRound = rounds.reduce((best, curr) => (curr.score > best.score ? curr : best), rounds[0]);

  useEffect(() => {
    soundFx.playGameComplete();

    const key = `unsguessr_highscore_${gameMode}`;
    const prevHigh = parseInt(localStorage.getItem(key) || '0', 10);
    if (totalScore > prevHigh) {
      localStorage.setItem(key, String(totalScore));
    }

    try {
      const historyKey = 'unsguessr_game_history';
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.unshift({
        date: new Date().toISOString(),
        gameMode,
        totalScore,
        avgDistance,
        rank: rank.title,
      });
      localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 15)));
    } catch {}

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      confetti({
        particleCount: 65,
        spread: 65,
        origin: { y: 0.4 },
        colors: ['#E2B34B', '#34D399', '#F2F0EB'],
      });
    }
  }, [totalScore, gameMode, avgDistance, rank.title]);

  const handleShareResult = () => {
    const text = [
      'UNSGuessr · Universitas Sebelas Maret',
      `Mode: ${gameMode === 'streetview' ? 'Street View 360°' : 'Kuis Foto'}`,
      `Skor Akhir: ${totalScore.toLocaleString('id-ID')} / ${maxScore.toLocaleString('id-ID')} pts`,
      `Predikat: ${rank.title} (${rank.badge})`,
      `Rata-rata Jarak: ${formatDistance(avgDistance)}`,
    ].join('\n');

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className="min-h-screen w-full bg-[#0C0E11] text-[#F2F0EB] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14 flex flex-col gap-8">
        {/* HEADER */}
        <header className="flex items-start justify-between gap-4 border-b border-[#262A32] pb-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#9B988F]">
              <span>Selesai 5 Ronde</span>
              {isNewHighScore && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#E2B34B] font-semibold">Rekor baru</span>
                </>
              )}
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#F2F0EB] tracking-tight mt-1">
              {rank.title}
            </h1>
            <p className="text-sm text-[#C7C4BC] mt-2 leading-relaxed">{rank.tagline}</p>
          </div>
          <div className="w-12 h-12 rounded-md bg-[#14171C] border border-[#353942] text-[#E2B34B] font-mono text-xl font-bold flex items-center justify-center shrink-0">
            {rank.badge}
          </div>
        </header>

        {/* PRIMARY SCORE & METRICS */}
        <section className="flex flex-col gap-4">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x sm:divide-[#262A32]">
            <div className="sm:pr-6">
              <dt className="text-xs text-[#9B988F]">Skor Total</dt>
              <dd className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-[#E2B34B] mt-1">
                {totalScore.toLocaleString('id-ID')}
              </dd>
              <dd className="text-xs font-mono text-[#9B988F] mt-0.5">
                dari {maxScore.toLocaleString('id-ID')} pts
              </dd>
            </div>
            <div className="sm:px-6">
              <dt className="text-xs text-[#9B988F]">Rata-rata Jarak</dt>
              <dd className="text-2xl font-semibold font-mono tabular-nums text-[#F2F0EB] mt-1">
                {formatDistance(avgDistance)}
              </dd>
            </div>
            <div className="sm:pl-6">
              <dt className="text-xs text-[#9B988F]">Tebakan Terdekat</dt>
              <dd className="text-2xl font-semibold font-mono tabular-nums text-emerald-400 mt-1">
                {bestRound ? formatDistance(bestRound.distanceMeters) : '-'}
              </dd>
            </div>
          </dl>

          <div className="w-full bg-[#1C2028] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E2B34B] transition-all duration-700"
              style={{ width: `${Math.min(100, (totalScore / maxScore) * 100)}%` }}
            />
          </div>
        </section>

        {/* EXP PROGRESSION */}
        <section className="border-y border-[#262A32] py-5 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="font-semibold text-emerald-400">
              +{calculatedExp.toLocaleString('id-ID')} EXP masuk
            </span>
            <span className="text-[#F2F0EB]">
              Lv.{levelInfo.level} · {levelInfo.title}
            </span>
          </div>

          <div className="w-full bg-[#1C2028] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E2B34B] transition-all duration-700"
              style={{ width: `${Math.max(6, levelInfo.progressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#9B988F] font-mono">
            <span>
              {levelInfo.expInCurrentLevel.toLocaleString('id-ID')} / {levelInfo.expForNextLevel.toLocaleString('id-ID')} XP ({levelInfo.progressPercent}%)
            </span>
            <span className="text-[#C7C4BC]">
              Total {levelInfo.totalExp.toLocaleString('id-ID')}
            </span>
          </div>

          {leveledUp && (
            <p className="text-xs font-medium text-emerald-300 pt-1">
              Naik ke Level {levelInfo.level}: {levelInfo.title}.
            </p>
          )}
        </section>

        {/* ROUND BREAKDOWN */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-mono text-[#9B988F]">Rincian 5 Ronde</h2>
          <div className="divide-y divide-[#262A32] border-y border-[#262A32]">
            {rounds.map((r) => (
              <div
                key={r.round}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0 font-mono">
                  <span className="text-[#9B988F] shrink-0">0{r.round}</span>
                  <div className="min-w-0">
                    <div className="font-sans text-sm text-[#F2F0EB] truncate">
                      {r.location.name}
                    </div>
                    <div className="text-xs text-[#9B988F] truncate">
                      {r.location.coordinates.lat.toFixed(4)}, {r.location.coordinates.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono tabular-nums">
                  <div className="font-semibold text-[#E2B34B]">
                    +{r.score.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[#9B988F]">{formatDistance(r.distanceMeters)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ACTIONS */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 py-3 px-5 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] font-semibold text-sm rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>

          <button
            type="button"
            onClick={handleShareResult}
            className="py-3 px-4 bg-[#14171C] hover:bg-[#1C2028] border border-[#686A70] hover:border-[#F2F0EB] text-[#F2F0EB] font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Tersalin' : 'Bagikan'}</span>
          </button>

          <button
            type="button"
            onClick={onReturnToLobby}
            className="py-3 px-4 bg-[#14171C] hover:bg-[#1C2028] border border-[#686A70] hover:border-[#F2F0EB] text-[#F2F0EB] font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
}
