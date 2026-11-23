'use client';

import React, { useEffect } from 'react';
import { Crown, RotateCcw, Home } from 'lucide-react';
import type { RoomPlayer8 } from '@/types/multiplayer';
import { formatDistance } from '@/lib/geoScore';
import { soundFx } from '@/lib/soundFx';
import { calculateLevel } from '@/lib/expLevel';

interface EightPlayerPodiumModalProps {
  players: RoomPlayer8[];
  currentUserId: string;
  roomCode: string;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  expGained?: number;
  userStats?: {
    exp: number;
    level: number;
  };
  leveledUp?: boolean;
}

export function EightPlayerPodiumModal({
  players,
  currentUserId,
  roomCode,
  onPlayAgain,
  onReturnToLobby,
  expGained,
  userStats,
  leveledUp,
}: EightPlayerPodiumModalProps) {
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];
  const runnerUp = sorted[1];
  const third = sorted[2];

  const myRank = sorted.findIndex((p) => p.id === currentUserId);
  const myPlayer = sorted.find((p) => p.id === currentUserId);
  const defaultExp =
    Math.round((myPlayer?.totalScore || 0) / 5) +
    (myRank === 0 ? 1000 : myRank === 1 ? 600 : myRank === 2 ? 400 : 200);
  const calculatedExp = expGained ?? defaultExp;
  const totalUserExp = userStats?.exp ?? calculatedExp;
  const levelInfo = calculateLevel(totalUserExp);

  useEffect(() => {
    soundFx.playVictory();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start md:justify-center bg-[#0C0E11]/90 p-4 py-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="podium-modal-title"
    >
      <div className="w-full max-w-lg bg-[#14171C] border border-[#353942] rounded-lg p-6 flex flex-col gap-6 text-[#F2F0EB] my-auto">
        {/* HEADER */}
        <div className="text-center flex flex-col items-center gap-1 border-b border-[#262A32] pb-4">
          <div className="text-xs font-mono text-[#9B988F]">
            Room {roomCode} · Selesai 5 Ronde
          </div>
          <h2
            id="podium-modal-title"
            className="font-editorial text-2xl sm:text-3xl font-medium tracking-tight text-[#F2F0EB]"
          >
            Podium Akhir
          </h2>
        </div>

        {/* PODIUM STANDS */}
        <div className="flex items-end justify-center gap-3 pt-1">
          {runnerUp && (
            <div className="flex-1 flex flex-col items-center max-w-[125px]">
              <div className="flex flex-col items-center gap-1 mb-2">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center font-mono text-xs font-semibold text-[#F2F0EB] border"
                  style={{ borderColor: runnerUp.color, backgroundColor: `${runnerUp.color}22` }}
                >
                  {runnerUp.avatar}
                </div>
                <span className="text-xs font-medium text-[#F2F0EB] truncate max-w-[115px] text-center">
                  {runnerUp.name}
                </span>
                <span className="text-xs font-mono text-[#C7C4BC] tabular-nums">
                  {runnerUp.totalScore.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full h-16 bg-[#1C2028] border-t-2 border-[#9B988F] rounded-t-md flex flex-col items-center justify-center">
                <span className="text-sm font-semibold font-mono text-[#F2F0EB]">2</span>
                <span className="text-xs text-[#9B988F]">Perak</span>
              </div>
            </div>
          )}

          {winner && (
            <div className="flex-1 flex flex-col items-center max-w-[140px]">
              <div className="flex flex-col items-center gap-1 mb-2">
                <Crown className="w-4 h-4 text-[#E2B34B]" />
                <div
                  className="w-12 h-12 rounded-md flex items-center justify-center font-mono text-sm font-semibold text-[#F2F0EB] border-2"
                  style={{ borderColor: '#E2B34B', backgroundColor: `${winner.color}28` }}
                >
                  {winner.avatar}
                </div>
                <span className="text-xs font-semibold text-[#E2B34B] truncate max-w-[130px] text-center">
                  {winner.name}
                </span>
                <span className="text-xs font-mono font-semibold text-[#F2F0EB] tabular-nums">
                  {winner.totalScore.toLocaleString('id-ID')} pts
                </span>
              </div>
              <div className="w-full h-24 bg-[#1C2028] border-t-2 border-[#E2B34B] rounded-t-md flex flex-col items-center justify-center">
                <span className="text-base font-bold font-mono text-[#E2B34B]">1</span>
                <span className="text-xs text-[#F2F0EB]">Juara</span>
              </div>
            </div>
          )}

          {third && (
            <div className="flex-1 flex flex-col items-center max-w-[125px]">
              <div className="flex flex-col items-center gap-1 mb-2">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center font-mono text-xs font-semibold text-[#F2F0EB] border"
                  style={{ borderColor: third.color, backgroundColor: `${third.color}22` }}
                >
                  {third.avatar}
                </div>
                <span className="text-xs font-medium text-[#F2F0EB] truncate max-w-[115px] text-center">
                  {third.name}
                </span>
                <span className="text-xs font-mono text-[#C7C4BC] tabular-nums">
                  {third.totalScore.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full h-12 bg-[#1C2028] border-t-2 border-amber-700 rounded-t-md flex flex-col items-center justify-center">
                <span className="text-sm font-semibold font-mono text-amber-400">3</span>
                <span className="text-xs text-[#9B988F]">Perunggu</span>
              </div>
            </div>
          )}
        </div>

        {/* EXP REWARD */}
        <div className="border-y border-[#262A32] py-4 flex flex-col gap-2">
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
        </div>

        {/* FULL STANDINGS */}
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-mono text-[#9B988F] pb-1.5 flex justify-between border-b border-[#262A32]">
            <span>Peringkat 1 sampai {players.length}</span>
            <span>Skor Total</span>
          </div>

          <div className="divide-y divide-[#262A32] max-h-44 overflow-y-auto">
            {sorted.map((player, idx) => {
              const rank = idx + 1;
              const isMe = player.id === currentUserId;
              const avgDist =
                player.roundDistances.length > 0
                  ? Math.round(
                      player.roundDistances.reduce((a, b) => a + b, 0) /
                        player.roundDistances.length
                    )
                  : 0;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-2 py-2 text-xs ${
                    isMe
                      ? 'bg-[#1C2028] border-l-2 border-[#E2B34B] text-[#F2F0EB] font-semibold'
                      : 'text-[#C7C4BC]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 font-mono font-semibold shrink-0 ${
                        rank === 1 ? 'text-[#E2B34B]' : 'text-[#9B988F]'
                      }`}
                    >
                      #{rank}
                    </span>
                    <span className="font-mono text-[#9B988F] shrink-0">
                      {player.avatar}
                    </span>
                    <span className="truncate">
                      {player.name} {isMe ? '(Kamu)' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                    <span className="text-[#9B988F]">
                      {avgDist > 0 ? formatDistance(avgDist) : '-'}
                    </span>
                    <span className="text-[#F2F0EB] font-semibold">
                      {player.totalScore.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onReturnToLobby}
            className="py-2.5 px-4 bg-[#1C2028] hover:bg-[#262A32] text-[#F2F0EB] font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 border border-[#686A70] hover:border-[#F2F0EB] cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={onPlayAgain}
            className="py-2.5 px-4 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] font-semibold text-sm rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
