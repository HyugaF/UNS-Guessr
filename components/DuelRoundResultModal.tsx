'use client';

import React, { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import type { UNSLocation } from '@/data/unsLocations';
import { formatDistance } from '@/lib/geoScore';
import { soundFx } from '@/lib/soundFx';

interface DuelRoundResultModalProps {
  round: number;
  totalRounds: number;
  location: UNSLocation;
  multiplier?: number;
  player1Name: string;
  player1Distance: number;
  player1Score: number;
  player1HpBefore: number;
  player1HpAfter: number;
  player2Name: string;
  player2Avatar: string;
  player2Distance: number;
  player2Score: number;
  player2HpBefore: number;
  player2HpAfter: number;
  damage: number;
  damageTarget: 'player1' | 'player2' | 'none';
  isKnockout?: boolean;
  onNextRound: () => void;
}

export function DuelRoundResultModal({
  round,
  totalRounds,
  location,
  multiplier = 1.0,
  player1Name,
  player1Distance,
  player1Score,
  player1HpBefore,
  player1HpAfter,
  player2Name,
  player2Avatar,
  player2Distance,
  player2Score,
  player2HpBefore,
  player2HpAfter,
  damage,
  damageTarget,
  isKnockout = false,
  onNextRound,
}: DuelRoundResultModalProps) {
  const isFinalRound = round >= totalRounds || isKnockout;
  const p1HpLost = player1HpBefore - player1HpAfter;
  const p2HpLost = player2HpBefore - player2HpAfter;

  const maxHp = 6000;
  const p1Percent = Math.max(0, Math.min(100, (player1HpAfter / maxHp) * 100));
  const p2Percent = Math.max(0, Math.min(100, (player2HpAfter / maxHp) * 100));

  const p1Initials = player1Name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'P1';
  const p2Initials =
    /^[a-zA-Z0-9]{1,2}$/.test(player2Avatar)
      ? player2Avatar.toUpperCase()
      : player2Name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'P2';

  useEffect(() => {
    if (isKnockout) {
      soundFx.playGameComplete();
    } else if (damageTarget === 'player2') {
      soundFx.playScoreChime(player1Score);
    } else {
      soundFx.playPinDrop();
    }
  }, [isKnockout, damageTarget, player1Score]);

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 w-[96%] max-w-4xl max-h-[calc(100vh-4.5rem)] z-40 pointer-events-auto flex flex-col overflow-y-auto">
      <div className="bg-[#14171C]/95 border border-[#353942] rounded-lg p-4 flex flex-col gap-4 text-[#F2F0EB]">
        {/* TOP ROW */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262A32] pb-2.5 text-xs font-mono">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-[#F2F0EB]">
              Ronde {round}/{totalRounds}
            </span>
            <span className="text-[#353942]" aria-hidden="true">·</span>
            <span className="text-[#C7C4BC]">Pengganda {multiplier.toFixed(1)}x</span>
            {isKnockout && (
              <>
                <span className="text-[#353942]" aria-hidden="true">·</span>
                <span className="text-rose-400 font-semibold">KNOCKOUT</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[#C7C4BC]">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>
              {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
            </span>
          </div>
        </div>

        {/* FLAT 3-COLUMN HEAD-TO-HEAD */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-0 md:divide-x md:divide-[#262A32] items-center">
          {/* PLAYER 1 */}
          <div className="md:col-span-4 md:pr-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-[#1C2028] border border-[#353942] text-[#F2F0EB] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                  {p1Initials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#F2F0EB] truncate">{player1Name}</div>
                  <div className="text-xs text-[#9B988F]">Kamu</div>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-400 shrink-0 tabular-nums">
                +{player1Score.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#C7C4BC]">
              <span className="font-sans text-[#9B988F]">Jarak</span>
              <strong>{formatDistance(player1Distance)}</strong>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-sans text-[#9B988F]">Sisa HP</span>
                <span className="font-semibold text-[#F2F0EB] tabular-nums">
                  {player1HpAfter.toLocaleString('id-ID')} / {maxHp}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#262A32] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${p1Percent}%` }}
                />
              </div>
              {p1HpLost > 0 && (
                <div className="text-xs font-mono font-semibold text-rose-400 text-right tabular-nums">
                  -{p1HpLost.toLocaleString('id-ID')} HP
                </div>
              )}
            </div>
          </div>

          {/* CENTER DAMAGE SUMMARY */}
          <div className="md:col-span-4 md:px-4 py-3 md:py-0 border-y md:border-y-0 border-[#262A32] flex flex-col items-center justify-center text-center gap-1">
            <span className="text-xs text-[#9B988F]">Selisih Damage</span>

            {damageTarget === 'player2' && (
              <>
                <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
                  +{damage.toLocaleString('id-ID')} DMG
                </span>
                <span className="text-xs text-[#C7C4BC]">
                  Pin kamu lebih dekat, lawan kena damage.
                </span>
              </>
            )}

            {damageTarget === 'player1' && (
              <>
                <span className="text-2xl font-mono font-bold text-rose-400 tabular-nums">
                  -{damage.toLocaleString('id-ID')} DMG
                </span>
                <span className="text-xs text-[#C7C4BC]">
                  Pin lawan lebih dekat, HP kamu berkurang.
                </span>
              </>
            )}

            {damageTarget === 'none' && (
              <>
                <span className="text-2xl font-mono font-bold text-[#E2B34B] tabular-nums">
                  0 DMG
                </span>
                <span className="text-xs text-[#C7C4BC]">
                  Skor ronde seri, HP tidak berkurang.
                </span>
              </>
            )}

            <div className="text-xs font-mono text-[#9B988F] mt-1">
              Selisih {Math.abs(player1Score - player2Score).toLocaleString('id-ID')} × {multiplier.toFixed(1)}x
            </div>
          </div>

          {/* PLAYER 2 */}
          <div className="md:col-span-4 md:pl-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-[#1C2028] border border-[#353942] text-[#C7C4BC] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                  {p2Initials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#F2F0EB] truncate">{player2Name}</div>
                  <div className="text-xs text-[#9B988F]">Lawan</div>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-[#E2B34B] shrink-0 tabular-nums">
                +{player2Score.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#C7C4BC]">
              <span className="font-sans text-[#9B988F]">Jarak</span>
              <strong>{formatDistance(player2Distance)}</strong>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-sans text-[#9B988F]">Sisa HP</span>
                <span className="font-semibold text-[#F2F0EB] tabular-nums">
                  {player2HpAfter.toLocaleString('id-ID')} / {maxHp}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#262A32] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E2B34B] transition-all duration-500"
                  style={{ width: `${p2Percent}%` }}
                />
              </div>
              {p2HpLost > 0 && (
                <div className="text-xs font-mono font-semibold text-rose-400 text-right tabular-nums">
                  -{p2HpLost.toLocaleString('id-ID')} HP
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2.5 border-t border-[#262A32]">
          <span className="text-xs text-[#9B988F] hidden sm:inline">
            Pin kamu, lawan, dan titik asli bisa dicek di peta belakang.
          </span>

          <button
            type="button"
            onClick={onNextRound}
            className={`w-full sm:w-auto py-2 px-5 font-semibold text-xs sm:text-sm rounded-md transition-colors cursor-pointer shrink-0 ${
              isKnockout
                ? 'bg-rose-500 hover:bg-rose-400 text-[#0C0E11]'
                : 'bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11]'
            }`}
          >
            {isKnockout
              ? 'Lihat Hasil Knockout'
              : isFinalRound
              ? 'Lihat Hasil Akhir'
              : `Lanjut Ronde ${round + 1}`}
          </button>
        </div>
      </div>
    </div>
  );
}
