'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { MapPin, Award } from 'lucide-react';
import type { UNSLocation } from '@/data/unsLocations';
import { formatDistance } from '@/lib/geoScore';
import { soundFx } from '@/lib/soundFx';

interface RoundResultModalProps {
  round: number;
  totalRounds: number;
  location: UNSLocation;
  distanceMeters: number;
  score: number;
  onNextRound: () => void;
}

export function RoundResultModal({
  round,
  totalRounds,
  location,
  distanceMeters,
  score,
  onNextRound,
}: RoundResultModalProps) {
  const [animatedScore, setAnimatedScore] = useState<number>(score);

  useEffect(() => {
    soundFx.playScoreChime(score);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const duration = 500;
    const startTime = performance.now();
    let frameId = 0;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - progress) * (1 - progress);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };
    frameId = requestAnimationFrame(step);

    if (score >= 4500) {
      confetti({
        particleCount: 55,
        spread: 55,
        origin: { y: 0.25 },
        colors: ['#E2B34B', '#34D399', '#F2F0EB'],
      });
    }

    return () => cancelAnimationFrame(frameId);
  }, [score]);

  const isFinalRound = round >= totalRounds;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 w-[96%] max-w-3xl z-40 pointer-events-auto">
      <div className="bg-[#14171C]/95 border border-[#353942] rounded-lg px-4 py-2.5 text-[#F2F0EB] flex flex-wrap md:flex-nowrap items-center justify-between gap-3 relative overflow-hidden">
        <div
          className={`absolute bottom-0 left-0 h-[2px] transition-all duration-500 ${
            score >= 4500 ? 'bg-emerald-400' : score >= 3000 ? 'bg-[#E2B34B]' : 'bg-rose-400'
          }`}
          style={{ width: `${(score / 5000) * 100}%` }}
        />

        <div className="flex items-center gap-2.5 min-w-0 text-xs font-mono">
          <span className="font-semibold text-[#F2F0EB] shrink-0">
            Ronde {round}/{totalRounds}
          </span>
          <span className="text-[#353942]" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[#C7C4BC] truncate">
              {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[#9B988F] font-sans">Jarak</span>
            <strong className="text-[#F2F0EB] tabular-nums">{formatDistance(distanceMeters)}</strong>
          </div>
          <div className="flex items-center gap-1.5 border-l border-[#262A32] pl-4">
            <span className="text-[#9B988F] font-sans">Poin</span>
            <strong className="text-[#E2B34B] tabular-nums">
              +{animatedScore.toLocaleString('id-ID')}
            </strong>
            {score >= 4800 && (
              <span title="Tebakan akurat" className="text-emerald-400">
                <Award className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onNextRound}
          className="py-2 px-4 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] font-semibold text-xs rounded-md transition-colors cursor-pointer shrink-0 ml-auto md:ml-0"
        >
          {isFinalRound ? 'Lihat Hasil' : 'Ronde Berikutnya'}
        </button>
      </div>
    </div>
  );
}
