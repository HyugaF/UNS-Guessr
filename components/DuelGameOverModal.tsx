'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home } from 'lucide-react';
import type { DuelRoundResult } from '@/types/multiplayer';
import { formatDistance } from '@/lib/geoScore';
import { soundFx } from '@/lib/soundFx';
import { calculateLevel } from '@/lib/expLevel';

interface DuelGameOverModalProps {
  player1Name: string;
  player1Hp: number;
  player1TotalScore: number;
  player2Name: string;
  player2Avatar: string;
  player2Hp: number;
  player2TotalScore: number;
  rounds: DuelRoundResult[];
  isKnockout?: boolean;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  expGained?: number;
  userStats?: {
    exp: number;
    level: number;
  };
  leveledUp?: boolean;
}

export function DuelGameOverModal({
  player1Name,
  player1Hp,
  player1TotalScore,
  player2Name,
  player2Avatar,
  player2Hp,
  player2TotalScore,
  rounds,
  isKnockout = false,
  onPlayAgain,
  onReturnToLobby,
  expGained,
  userStats,
  leveledUp,
}: DuelGameOverModalProps) {
  const isWinner =
    player1Hp > player2Hp || (player1Hp === player2Hp && player1TotalScore > player2TotalScore);
  const isDraw = player1Hp === player2Hp && player1TotalScore === player2TotalScore;

  const defaultExp = Math.round(player1TotalScore / 5) + (isWinner ? 600 : 200);
  const calculatedExp = expGained ?? defaultExp;
  const totalUserExp = userStats?.exp ?? calculatedExp;
  const levelInfo = calculateLevel(totalUserExp);

  const totalDamageDealtByP1 = rounds
    .filter((r) => r.damageTarget === 'player2')
    .reduce((acc, r) => acc + (r.damage || 0), 0);

  const totalDamageDealtByP2 = rounds
    .filter((r) => r.damageTarget === 'player1')
    .reduce((acc, r) => acc + (r.damage || 0), 0);

  const p1Initials = player1Name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'P1';
  const p2Initials =
    /^[a-zA-Z0-9]{1,2}$/.test(player2Avatar)
      ? player2Avatar.toUpperCase()
      : player2Name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'P2';

  useEffect(() => {
    if (isWinner) {
      soundFx.playGameComplete();
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.4 },
          colors: ['#E2B34B', '#34D399', '#F2F0EB'],
        });
      }
    } else {
      soundFx.playScoreChime(2500);
    }
  }, [isWinner]);

  return (
    <div className="min-h-screen w-full bg-[#0C0E11] text-[#F2F0EB] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14 flex flex-col gap-8">
        {/* HEADER */}
        <header className="border-b border-[#262A32] pb-6">
          <div className="text-xs font-mono text-[#9B988F]">
            Duel 1v1 · Format 6.000 HP · {rounds.length} ronde
          </div>

          <h1
            className={`font-editorial text-3xl sm:text-4xl font-medium tracking-tight mt-1 ${
              isWinner ? 'text-emerald-400' : isDraw ? 'text-[#E2B34B]' : 'text-rose-400'
            }`}
          >
            {isWinner
              ? isKnockout
                ? 'Menang Knockout'
                : 'Kamu Menang Duel'
              : isDraw
              ? 'Duel Berakhir Seri'
              : isKnockout
              ? 'Kena Knockout'
              : 'Lawan Lebih Unggul'}
          </h1>

          <p className="text-sm text-[#C7C4BC] mt-2 leading-relaxed">
            {isWinner
              ? `Sisa HP kamu masih lebih tinggi dari ${player2Name}.`
              : isDraw
              ? 'Sisa HP dan skor akhir kalian persis sama.'
              : `${player2Name} lebih tepat di ronde kali ini. Mau langsung tanding ulang?`}
          </p>
        </header>

        {/* HEAD-TO-HEAD SUMMARY */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-0 sm:divide-x sm:divide-[#262A32]">
          {/* PLAYER 1 */}
          <div className="sm:pr-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md bg-[#14171C] border border-[#353942] text-[#F2F0EB] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                  {p1Initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#F2F0EB] truncate">{player1Name}</div>
                  <div className="text-xs text-[#9B988F]">Kamu</div>
                </div>
              </div>
              {isWinner && (
                <span className="text-xs font-mono font-semibold text-[#E2B34B]">Menang</span>
              )}
            </div>

            <div>
              <div className="text-xs text-[#9B988F]">Sisa HP</div>
              <div
                className={`text-3xl font-mono font-bold tabular-nums mt-0.5 ${
                  player1Hp > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {Math.max(0, player1Hp).toLocaleString('id-ID')}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs font-mono pt-3 border-t border-[#262A32]">
              <div>
                <dt className="text-[#9B988F] font-sans">Damage Masuk</dt>
                <dd className="font-semibold text-[#E2B34B] mt-0.5 tabular-nums">
                  +{totalDamageDealtByP1.toLocaleString('id-ID')}
                </dd>
              </div>
              <div>
                <dt className="text-[#9B988F] font-sans">Total Skor</dt>
                <dd className="font-semibold text-[#F2F0EB] mt-0.5 tabular-nums">
                  {player1TotalScore.toLocaleString('id-ID')} pts
                </dd>
              </div>
            </dl>
          </div>

          {/* PLAYER 2 */}
          <div className="sm:pl-6 pt-6 sm:pt-0 border-t sm:border-t-0 border-[#262A32] flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md bg-[#14171C] border border-[#353942] text-[#C7C4BC] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                  {p2Initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#F2F0EB] truncate">{player2Name}</div>
                  <div className="text-xs text-[#9B988F]">Lawan</div>
                </div>
              </div>
              {!isWinner && !isDraw && (
                <span className="text-xs font-mono font-semibold text-[#E2B34B]">Menang</span>
              )}
            </div>

            <div>
              <div className="text-xs text-[#9B988F]">Sisa HP</div>
              <div
                className={`text-3xl font-mono font-bold tabular-nums mt-0.5 ${
                  player2Hp > 0 ? 'text-[#F2F0EB]' : 'text-rose-400'
                }`}
              >
                {Math.max(0, player2Hp).toLocaleString('id-ID')}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs font-mono pt-3 border-t border-[#262A32]">
              <div>
                <dt className="text-[#9B988F] font-sans">Damage Masuk</dt>
                <dd className="font-semibold text-[#C7C4BC] mt-0.5 tabular-nums">
                  +{totalDamageDealtByP2.toLocaleString('id-ID')}
                </dd>
              </div>
              <div>
                <dt className="text-[#9B988F] font-sans">Total Skor</dt>
                <dd className="font-semibold text-[#F2F0EB] mt-0.5 tabular-nums">
                  {player2TotalScore.toLocaleString('id-ID')} pts
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* EXP REWARD */}
        <section className="border-y border-[#262A32] py-5 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="font-semibold text-emerald-400">
              +{calculatedExp.toLocaleString('id-ID')} EXP masuk {isWinner ? '(bonus menang)' : ''}
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

        {/* ROUND TIMELINE */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-mono text-[#9B988F]">Riwayat Ronde</h2>

          <div className="divide-y divide-[#262A32] border-y border-[#262A32]">
            {rounds.map((r) => {
              const p1Won = r.damageTarget === 'player2';
              const p2Won = r.damageTarget === 'player1';

              return (
                <div
                  key={r.round}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[#9B988F] shrink-0">0{r.round}</span>
                    <div className="min-w-0">
                      <div className="font-mono text-[#F2F0EB] truncate">
                        {formatDistance(r.player1Distance)} vs {formatDistance(r.player2Distance)}
                      </div>
                      <div className="text-xs text-[#9B988F] truncate">
                        {r.multiplier || 1.0}x · {r.location.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono tabular-nums">
                    {p1Won && (
                      <span className="font-semibold text-emerald-400">
                        +{r.damage.toLocaleString('id-ID')} DMG
                      </span>
                    )}
                    {p2Won && (
                      <span className="font-semibold text-rose-400">
                        -{r.damage.toLocaleString('id-ID')} DMG
                      </span>
                    )}
                    {r.damageTarget === 'none' && (
                      <span className="font-semibold text-[#C7C4BC]">Seri</span>
                    )}
                    <div className="text-xs text-[#9B988F]">
                      HP {r.player1HpAfter.toLocaleString('id-ID')} : {r.player2HpAfter.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full sm:flex-1 py-3 px-5 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] font-semibold text-sm rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tanding Ulang</span>
          </button>

          <button
            type="button"
            onClick={onReturnToLobby}
            className="w-full sm:w-auto py-3 px-5 bg-[#14171C] hover:bg-[#1C2028] text-[#F2F0EB] font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[#686A70] hover:border-[#F2F0EB]"
          >
            <Home className="w-4 h-4" />
            <span>Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
}
