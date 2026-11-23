'use client';

import React from 'react';
import { Clock, LogOut, CheckCircle2 } from 'lucide-react';
import type { RoomPlayer8 } from '@/types/multiplayer';

interface EightPlayerHUDProps {
  round: number;
  totalRounds: number;
  players: RoomPlayer8[];
  currentUserId: string;
  timeRemaining: number | null;
  onExitRoom: () => void;
}

export function EightPlayerHUD({
  round,
  totalRounds,
  players,
  currentUserId,
  timeRemaining,
  onExitRoom,
}: EightPlayerHUDProps) {
  const me = players.find((p) => p.id === currentUserId) || players[0];
  const guessedCount = players.filter((p) => p.hasGuessedThisRound).length;
  const isTimeCritical = timeRemaining !== null && timeRemaining <= 10;

  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-[#0C0E11]/95 border-b border-[#262A32] z-40 px-3 sm:px-5 flex items-center justify-between text-[#F2F0EB] gap-2">
      <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
        <span className="font-bold text-[#F2F0EB]">R{round}/{totalRounds}</span>
        <span className="text-[#353942] hidden sm:inline" aria-hidden="true">·</span>
        <span className="hidden sm:inline text-[#C7C4BC]">
          {guessedCount}/{players.length} siap
        </span>
      </div>

      <div className="hidden lg:flex items-center gap-1.5 max-w-md overflow-x-auto py-0.5">
        {players.map((p) => {
          const isGuessed = p.hasGuessedThisRound;
          const isMe = p.id === currentUserId;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs shrink-0 ${
                isGuessed
                  ? 'bg-emerald-950/50 border-emerald-400/50 text-emerald-200'
                  : 'bg-[#14171C] border-[#262A32] text-[#C7C4BC]'
              } ${isMe ? 'border-[#E2B34B]' : ''}`}
            >
              <span className="font-mono font-bold">{p.avatar}</span>
              <span className="max-w-[56px] truncate">{isMe ? 'Anda' : p.name}</span>
              {isGuessed && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0 z-50">
        {timeRemaining !== null && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded font-mono text-xs font-bold tabular-nums border ${
              isTimeCritical
                ? 'bg-red-950/90 border-red-400/70 text-red-200'
                : 'bg-[#14171C] border-[#353942] text-[#F2F0EB]'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isTimeCritical ? 'text-red-400' : 'text-[#9B988F]'}`} />
            <span>0:{timeRemaining.toString().padStart(2, '0')}</span>
          </div>
        )}

        <div className="px-2.5 py-1 bg-[#14171C] border border-[#353942] rounded text-xs font-mono font-bold text-[#E2B34B] tabular-nums">
          {me.totalScore.toLocaleString('id-ID')}
        </div>

        <button
          type="button"
          onClick={onExitRoom}
          aria-label="Keluar dari room"
          className="h-8 px-2.5 bg-[#14171C] hover:bg-red-950/70 border border-[#686A70] hover:border-red-400/60 text-[#F2F0EB] rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0 text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5 text-[#9B988F]" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
