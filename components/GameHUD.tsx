'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Clock } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface GameHUDProps {
  round: number;
  totalRounds: number;
  currentScore: number;
  timeRemaining: number | null;
  gameMode: 'streetview' | 'photo';
  onExitGame: () => void;
}

export function GameHUD({
  round,
  totalRounds,
  currentScore,
  timeRemaining,
  onExitGame,
}: GameHUDProps) {
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMuted());

  const handleToggleMute = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  const isTimeCritical = timeRemaining !== null && timeRemaining <= 10;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 bg-[#0C0E11]/95 border-b border-[#262A32] px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
      <div className="flex items-center shrink-0">
        <span className="text-sm font-bold tracking-tight text-[#F2F0EB] whitespace-nowrap">
          UNSGuessr
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 text-xs font-medium min-w-0 overflow-hidden">
        <span className="font-mono text-[#C7C4BC] shrink-0">
          Ronde {round}/{totalRounds}
        </span>

        <span className="text-[#353942] hidden sm:inline" aria-hidden="true">·</span>

        <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <span className="text-[#9B988F] hidden sm:inline">Skor</span>
          <span className="font-mono font-bold text-[#E2B34B] tabular-nums text-xs sm:text-sm">
            {currentScore.toLocaleString('id-ID')}
          </span>
        </div>

        {timeRemaining !== null && (
          <>
            <span className="text-[#353942] hidden sm:inline" aria-hidden="true">·</span>
            <div
              className={`flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded font-mono font-bold tabular-nums text-xs shrink-0 ${
                isTimeCritical
                  ? 'bg-red-950/90 border border-red-400/70 text-red-200'
                  : 'text-[#F2F0EB]'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${isTimeCritical ? 'text-red-400' : 'text-[#9B988F]'}`} />
              <span>{timeRemaining}d</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 z-50">
        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={isMuted ? 'Nyalakan suara' : 'Matikan suara'}
          title={isMuted ? 'Nyalakan suara' : 'Matikan suara'}
          className="w-8 h-8 flex items-center justify-center text-[#C7C4BC] hover:text-[#F2F0EB] bg-[#14171C] hover:bg-[#1C2028] border border-[#686A70] rounded-md transition-colors cursor-pointer shrink-0"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onExitGame}
          aria-label="Keluar ke beranda"
          title="Keluar ke beranda"
          className="h-8 px-2.5 text-xs font-medium text-[#F2F0EB] bg-[#14171C] hover:bg-[#1C2028] border border-[#686A70] rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 text-[#9B988F]" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
