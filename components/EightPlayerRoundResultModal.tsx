'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Users,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { UNSLocation } from '@/data/unsLocations';
import type { RoomPlayer8 } from '@/types/multiplayer';
import { formatDistance } from '@/lib/geoScore';

interface EightPlayerRoundResultModalProps {
  round: number;
  totalRounds: number;
  location: UNSLocation;
  players: RoomPlayer8[];
  currentUserId: string;
  isHost: boolean;
  onNextRound: () => void;
}

export function EightPlayerRoundResultModal({
  round,
  totalRounds,
  location,
  players,
  currentUserId,
  onNextRound,
}: EightPlayerRoundResultModalProps) {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(true);

  const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const myPlayer = players.find((p) => p.id === currentUserId);
  const myRank = sortedPlayers.findIndex((p) => p.id === currentUserId) + 1;
  const isFinalRound = round >= totalRounds;

  return (
    <>
      {/* TOP SUMMARY BANNER */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 w-[96%] max-w-4xl z-40 pointer-events-auto">
        <div className="bg-[#14171C]/95 border border-[#353942] rounded-lg px-4 py-2.5 text-[#F2F0EB] flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
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

          <div className="flex items-center gap-3 text-xs shrink-0 font-mono">
            <span>
              <span className="text-[#9B988F] font-sans mr-1">Jarak</span>
              <strong className="text-[#F2F0EB]">
                {myPlayer && myPlayer.lastDistance > 0 ? formatDistance(myPlayer.lastDistance) : '-'}
              </strong>
            </span>
            <span className="border-l border-[#262A32] pl-3">
              <span className="text-[#9B988F] font-sans mr-1">Poin</span>
              <strong className="text-emerald-400">
                +{myPlayer ? myPlayer.lastScore.toLocaleString('id-ID') : 0}
              </strong>
            </span>
            <span className="border-l border-[#262A32] pl-3">
              <span className="text-[#9B988F] font-sans mr-1">Posisi</span>
              <strong className="text-[#E2B34B]">
                #{myRank}/{players.length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
            <button
              type="button"
              onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
              className="text-xs text-[#F2F0EB] bg-[#1C2028] hover:bg-[#262A32] border border-[#686A70] px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
              aria-expanded={isLeaderboardOpen}
            >
              <Users className="w-3.5 h-3.5 text-[#C7C4BC]" />
              <span className="hidden sm:inline">Klasemen</span>
              {isLeaderboardOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onNextRound}
              className="py-2 px-4 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] font-semibold text-xs rounded-md transition-colors cursor-pointer shrink-0"
            >
              {isFinalRound ? 'Podium Akhir' : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>

      {/* COMPACT FLOATING LEADERBOARD */}
      {isLeaderboardOpen && (
        <div className="fixed bottom-3 right-3 w-[calc(100vw-24px)] max-w-xs sm:w-80 z-40">
          <div className="bg-[#14171C]/95 border border-[#353942] rounded-lg p-3 flex flex-col gap-2 text-[#F2F0EB]">
            <div className="flex items-center justify-between px-1 pb-2 border-b border-[#262A32] text-xs font-mono text-[#9B988F]">
              <span>Klasemen Ronde {round}</span>
              <span>Total</span>
            </div>

            <div className="divide-y divide-[#262A32] max-h-56 overflow-y-auto">
              {sortedPlayers.map((player, idx) => {
                const rank = idx + 1;
                const isMe = player.id === currentUserId;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between px-2 py-2 text-xs ${
                      isMe
                        ? 'bg-[#1C2028] border-l-2 border-[#E2B34B] text-[#F2F0EB]'
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
                      <span
                        className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-semibold text-[#F2F0EB] shrink-0 border"
                        style={{ borderColor: player.color, backgroundColor: `${player.color}22` }}
                      >
                        {player.avatar}
                      </span>
                      <span className={`truncate font-medium ${isMe ? 'text-[#F2F0EB]' : 'text-[#C7C4BC]'}`}>
                        {isMe ? 'Kamu' : player.name}
                      </span>
                      {player.isHost && <Crown className="w-3 h-3 text-[#E2B34B] shrink-0" />}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                      <span className="text-[#9B988F]">
                        {player.lastDistance > 0 ? formatDistance(player.lastDistance) : '-'}
                      </span>
                      <span className="font-semibold text-[#F2F0EB] w-14 text-right">
                        {player.totalScore.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
