'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Clock, Check } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface DuelHUDProps {
  round: number;
  totalRounds: number;
  multiplier?: number;
  player1Name: string;
  player1Hp: number;
  player1MaxHp?: number;
  player1Score?: number;
  player1Locked?: boolean;
  player2Name: string;
  player2Avatar: string;
  player2Hp: number;
  player2MaxHp?: number;
  player2Score?: number;
  player2Locked: boolean;
  timeRemaining: number | null;
  onExitDuel: () => void;
}

export function DuelHUD({
  round,
  multiplier = 1.0,
  player1Name,
  player1Hp,
  player1MaxHp = 6000,
  player1Locked = false,
  player2Name,
  player2Avatar,
  player2Hp,
  player2MaxHp = 6000,
  player2Locked,
  timeRemaining,
  onExitDuel,
}: DuelHUDProps) {
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMuted());

  const handleToggleMute = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  const p1Percent = Math.max(0, Math.min(100, (player1Hp / player1MaxHp) * 100));
  const p2Percent = Math.max(0, Math.min(100, (player2Hp / player2MaxHp) * 100));

  const getHpBarColor = (hp: number) => {
    if (hp > 3500) return 'bg-emerald-400';
    if (hp > 2000) return 'bg-[#E2B34B]';
    return 'bg-red-400';
  };

  const getHpTextColor = (hp: number) => {
    if (hp > 3500) return 'text-emerald-400';
    if (hp > 2000) return 'text-[#E2B34B]';
    return 'text-red-400';
  };

  const p1Initials = player1Name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'P1';
  const p2Initials =
    /^[a-zA-Z0-9]{1,2}$/.test(player2Avatar)
      ? player2Avatar.toUpperCase()
      : player2Name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'P2';

  const isTimeCritical = timeRemaining !== null && timeRemaining <= 10;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#0C0E11]/95 border-b border-[#262A32] px-2.5 sm:px-4 py-1.5">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* PLAYER 1 */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="relative shrink-0 hidden sm:flex w-8 h-8 rounded bg-[#14171C] border border-[#353942] text-[#F2F0EB] font-mono text-xs font-bold items-center justify-center">
            {p1Initials}
            {player1Locked && (
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-[#0C0E11] flex items-center justify-center"
                title="Tebakan terkunci"
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-[#F2F0EB] truncate">{player1Name}</span>
              <span className={`font-mono font-bold tabular-nums shrink-0 ${getHpTextColor(player1Hp)}`}>
                {player1Hp.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="w-full h-1.5 bg-[#1C2028] rounded-sm overflow-hidden">
              <div
                className={`h-full ${getHpBarColor(player1Hp)} transition-all duration-300`}
                style={{ width: `${p1Percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* CENTER TELEMETRY */}
        <div className="shrink-0 flex items-center gap-2 bg-[#14171C] border border-[#353942] px-2.5 py-1 rounded text-xs font-mono">
          <span className="font-bold text-[#F2F0EB]">R{round}</span>
          <span className="text-[#E2B34B] font-semibold hidden sm:inline">
            {multiplier.toFixed(1)}x
          </span>
          {timeRemaining !== null && (
            <span
              className={`flex items-center gap-1 pl-2 border-l border-[#262A32] font-bold tabular-nums ${
                isTimeCritical ? 'text-red-400' : 'text-[#C7C4BC]'
              }`}
            >
              <Clock className="w-3 h-3" />
              {timeRemaining}d
            </span>
          )}
        </div>

        {/* PLAYER 2 */}
        <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1 text-xs flex-row-reverse">
              <span className="font-semibold text-[#F2F0EB] truncate">{player2Name}</span>
              <span className={`font-mono font-bold tabular-nums shrink-0 ${getHpTextColor(player2Hp)}`}>
                {player2Hp.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="w-full h-1.5 bg-[#1C2028] rounded-sm overflow-hidden flex justify-end">
              <div
                className={`h-full ${getHpBarColor(player2Hp)} transition-all duration-300`}
                style={{ width: `${p2Percent}%` }}
              />
            </div>
          </div>

          <div className="relative shrink-0 hidden sm:flex w-8 h-8 rounded bg-[#14171C] border border-[#353942] text-[#C7C4BC] font-mono text-xs font-bold items-center justify-center">
            {p2Initials}
            {player2Locked && (
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-[#0C0E11] flex items-center justify-center"
                title="Lawan sudah menebak"
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-1.5 border-l border-[#262A32] pl-2 shrink-0 z-50">
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Nyalakan audio' : 'Matikan audio'}
            className="w-8 h-8 flex items-center justify-center text-[#C7C4BC] hover:text-[#F2F0EB] bg-[#14171C] hover:bg-[#1C2028] border border-[#686A70] rounded-md transition-colors cursor-pointer shrink-0"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onExitDuel}
            aria-label="Keluar dari duel"
            className="h-8 px-2.5 bg-[#14171C] hover:bg-red-950/70 border border-[#686A70] hover:border-red-400/60 text-[#F2F0EB] rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0 text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5 text-[#9B988F]" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
