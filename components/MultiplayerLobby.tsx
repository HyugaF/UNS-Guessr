'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  ArrowLeft,
  UserPlus,
  Play,
  Trash2,
} from 'lucide-react';
import { BOT_RIVALS, type BotRivalProfile } from '@/lib/multiplayerBot';
import { soundFx } from '@/lib/soundFx';
import type { RoomPlayer8 } from '@/types/multiplayer';
import { PLAYER_COLORS_8 } from '@/types/multiplayer';
import {
  generateRoomCode,
  saveRoomToStorage,
  getRoomFromStorage,
  AVATAR_OPTIONS,
} from '@/lib/eightPlayerRoom';

interface MultiplayerLobbyProps {
  initialMode?: '8player' | 'duel';
  defaultPlayerName?: string;
  onBackToLobby: () => void;
  onStartDuel: (config: {
    roomCode: string;
    isBot: boolean;
    botProfile?: BotRivalProfile;
    timerDuration: number | null;
    player2Name: string;
  }) => void;
  onStartEightPlayer: (config: {
    roomCode: string;
    players: RoomPlayer8[];
    timerDuration: number | null;
    currentUserId: string;
    isHost: boolean;
  }) => void;
}

export function MultiplayerLobby({
  initialMode = '8player',
  defaultPlayerName,
  onBackToLobby,
  onStartDuel,
  onStartEightPlayer,
}: MultiplayerLobbyProps) {
  const [multiMode, setMultiMode] = useState<'8player' | 'duel'>(initialMode);
  const [eightTab, setEightTab] = useState<'host' | 'join'>('host');
  const [duelTab, setDuelTab] = useState<'quick' | 'host' | 'join'>('quick');

  const playerName = defaultPlayerName || 'Mahasiswa UNS';
  const joinNameInput = playerName;
  const [playerAvatar, setPlayerAvatar] = useState<string>(AVATAR_OPTIONS[0]);

  const [roomCode] = useState<string>(() => generateRoomCode());
  const [timerDuration, setTimerDuration] = useState<number | null>(60);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedDuelCode, setCopiedDuelCode] = useState<boolean>(false);

  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer8[]>(() => [
    {
      id: 'me_host',
      name: defaultPlayerName || 'Mahasiswa UNS',
      avatar: AVATAR_OPTIONS[0],
      color: PLAYER_COLORS_8[0],
      isHost: true,
      isReady: true,
      totalScore: 0,
      roundScores: [],
      roundDistances: [],
      hasGuessedThisRound: false,
      currentGuess: null,
      lastDistance: 0,
      lastScore: 0,
    },
  ]);

  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joinAvatarInput, setJoinAvatarInput] = useState<string>(AVATAR_OPTIONS[1]);
  const [joinError, setJoinError] = useState<string>('');

  const [selectedBotIndex, setSelectedBotIndex] = useState<number>(0);
  const [duelRoomCode] = useState<string>(() => `UNS-${Math.floor(100 + Math.random() * 900)}`);
  const [duelJoinCodeInput, setDuelJoinCodeInput] = useState<string>('');
  const [duelJoinError, setDuelJoinError] = useState<string>('');

  const handleUpdateHostIdentity = (newAvatar: string) => {
    setPlayerAvatar(newAvatar);
    setRoomPlayers((prev) =>
      prev.map((p, idx) => (idx === 0 ? { ...p, name: playerName, avatar: newAvatar } : p))
    );
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopiedCode(true);
      soundFx.playClick();
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const handleCopyDuelCode = () => {
    navigator.clipboard.writeText(duelRoomCode).then(() => {
      setCopiedDuelCode(true);
      soundFx.playClick();
      setTimeout(() => setCopiedDuelCode(false), 2000);
    });
  };

  const handleAddSimulatedFriend = () => {
    if (roomPlayers.length >= 8) return;
    soundFx.playPinDrop();
    const nextIdx = roomPlayers.length;
    const friendNames = [
      'Budi Teknik',
      'Siti Kedokteran',
      'Agus MIPA',
      'Dewi FIB',
      'Fajar FEB',
      'Rina FKIP',
      'Dimas FH',
    ];
    const friendAvatars = ['FT', 'FK', 'FM', 'IB', 'EB', 'FP', 'FH'];

    const newPlayer: RoomPlayer8 = {
      id: `player_${Date.now()}_${nextIdx}`,
      name: friendNames[(nextIdx - 1) % friendNames.length],
      avatar: friendAvatars[(nextIdx - 1) % friendAvatars.length],
      color: PLAYER_COLORS_8[nextIdx % PLAYER_COLORS_8.length],
      isHost: false,
      isReady: true,
      totalScore: 0,
      roundScores: [],
      roundDistances: [],
      hasGuessedThisRound: false,
      currentGuess: null,
      lastDistance: 0,
      lastScore: 0,
    };

    setRoomPlayers((prev) => [...prev, newPlayer]);
  };

  const handleRemovePlayer = (id: string) => {
    soundFx.playClick();
    setRoomPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStart8PlayerGame = () => {
    if (roomPlayers.length < 2) return;
    soundFx.playGameStart();
    onStartEightPlayer({
      roomCode,
      players: roomPlayers,
      timerDuration,
      currentUserId: roomPlayers[0].id,
      isHost: true,
    });
  };

  const handleJoin8PlayerRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Masukkan kode room dulu.');
      return;
    }

    soundFx.playClick();
    const existing = getRoomFromStorage(cleanCode);
    let playersToUse: RoomPlayer8[];

    if (existing && existing.players.length > 0) {
      const newP: RoomPlayer8 = {
        id: `guest_${Date.now()}`,
        name: joinNameInput || 'Mahasiswa UNS',
        avatar: joinAvatarInput,
        color: PLAYER_COLORS_8[existing.players.length % PLAYER_COLORS_8.length],
        isHost: false,
        isReady: true,
        totalScore: 0,
        roundScores: [],
        roundDistances: [],
        hasGuessedThisRound: false,
        currentGuess: null,
        lastDistance: 0,
        lastScore: 0,
      };
      playersToUse = [...existing.players, newP];
      saveRoomToStorage({ ...existing, players: playersToUse });
    } else {
      const hostP: RoomPlayer8 = {
        id: `host_${cleanCode}`,
        name: 'Host Ruang ' + cleanCode,
        avatar: 'UN',
        color: PLAYER_COLORS_8[0],
        isHost: true,
        isReady: true,
        totalScore: 0,
        roundScores: [],
        roundDistances: [],
        hasGuessedThisRound: false,
        currentGuess: null,
        lastDistance: 0,
        lastScore: 0,
      };
      const myP: RoomPlayer8 = {
        id: `user_${Date.now()}`,
        name: defaultPlayerName || joinNameInput || 'Mahasiswa UNS',
        avatar: joinAvatarInput,
        color: PLAYER_COLORS_8[1],
        isHost: false,
        isReady: true,
        totalScore: 0,
        roundScores: [],
        roundDistances: [],
        hasGuessedThisRound: false,
        currentGuess: null,
        lastDistance: 0,
        lastScore: 0,
      };
      playersToUse = [hostP, myP];
    }

    soundFx.playGameStart();
    onStartEightPlayer({
      roomCode: cleanCode,
      players: playersToUse,
      timerDuration: 60,
      currentUserId: playersToUse[playersToUse.length - 1].id,
      isHost: false,
    });
  };

  const handleStartQuickDuel = () => {
    soundFx.playClick();
    const bot = BOT_RIVALS[selectedBotIndex];
    onStartDuel({
      roomCode: `BOT-${Math.floor(100 + Math.random() * 900)}`,
      isBot: true,
      botProfile: bot,
      timerDuration,
      player2Name: bot.name,
    });
  };

  const handleStartHostDuel = () => {
    soundFx.playClick();
    onStartDuel({
      roomCode: duelRoomCode,
      isBot: true,
      botProfile: BOT_RIVALS[1],
      timerDuration,
      player2Name: 'Pemain 2 (Tamu)',
    });
  };

  const handleJoinDuelRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = duelJoinCodeInput.trim().toUpperCase();
    if (!cleaned) {
      setDuelJoinError('Masukkan kode room duel dulu.');
      return;
    }
    soundFx.playClick();
    onStartDuel({
      roomCode: cleaned,
      isBot: true,
      botProfile: BOT_RIVALS[0],
      timerDuration: 60,
      player2Name: 'Host Ruang ' + cleaned,
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#0C0E11] text-[#F2F0EB] font-sans flex flex-col">
      {/* TOP BAR */}
      <header className="h-14 border-b border-[#262A32] px-4 sm:px-8 flex items-center justify-between gap-4 bg-[#0C0E11]">
        <button
          type="button"
          onClick={onBackToLobby}
          className="flex items-center gap-2 text-sm text-[#C7C4BC] hover:text-[#F2F0EB] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-5 text-sm">
          <button
            type="button"
            onClick={() => {
              setMultiMode('duel');
              soundFx.playClick();
            }}
            className={`pb-0.5 font-semibold border-b-2 transition-colors cursor-pointer ${
              multiMode === 'duel'
                ? 'border-[#E2B34B] text-[#F2F0EB]'
                : 'border-transparent text-[#9B988F] hover:text-[#F2F0EB]'
            }`}
          >
            Duel 1v1
          </button>
          <button
            type="button"
            onClick={() => {
              setMultiMode('8player');
              soundFx.playClick();
            }}
            className={`pb-0.5 font-semibold border-b-2 transition-colors cursor-pointer ${
              multiMode === '8player'
                ? 'border-[#E2B34B] text-[#F2F0EB]'
                : 'border-transparent text-[#9B988F] hover:text-[#F2F0EB]'
            }`}
          >
            Room 8 Pemain
          </button>
        </div>

        <span className="font-mono text-xs text-[#9B988F] hidden sm:inline truncate max-w-[140px]">
          {playerName}
        </span>
      </header>

      {/* MAIN BODY (OPEN EDITORIAL LAYOUT, NO NESTED BOXES) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* MODE A: 8 PLAYER ROOM */}
        {multiMode === '8player' && (
          <div className="flex flex-col gap-7">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#262A32] pb-5">
              <div>
                <p className="font-mono text-xs text-[#9B988F]">5 RONDE · HINGGA 8 PEMAIN</p>
                <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#F2F0EB] mt-1">
                  Room 8 Pemain
                </h1>
              </div>

              <div className="flex items-center gap-5 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setEightTab('host');
                    soundFx.playClick();
                  }}
                  className={`pb-1 font-semibold border-b-2 transition-colors cursor-pointer ${
                    eightTab === 'host'
                      ? 'border-[#E2B34B] text-[#F2F0EB]'
                      : 'border-transparent text-[#9B988F] hover:text-[#F2F0EB]'
                  }`}
                >
                  Buat room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEightTab('join');
                    soundFx.playClick();
                  }}
                  className={`pb-1 font-semibold border-b-2 transition-colors cursor-pointer ${
                    eightTab === 'join'
                      ? 'border-[#E2B34B] text-[#F2F0EB]'
                      : 'border-transparent text-[#9B988F] hover:text-[#F2F0EB]'
                  }`}
                >
                  Gabung pakai kode
                </button>
              </div>
            </div>

            {eightTab === 'host' && (
              <div className="flex flex-col gap-8">
                {/* ROOM CODE + IDENTITY ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-7 border-b border-[#262A32]">
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-medium text-[#9B988F]">Kode room</span>
                    <div className="flex items-center justify-between gap-3 bg-[#14171C] px-4 py-3 rounded-md border border-[#353942]">
                      <span className="font-mono text-2xl font-bold text-[#E2B34B] tracking-widest">
                        {roomCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-3 py-1.5 bg-[#1C2028] hover:bg-[#262B35] border border-[#686A70] text-[#F2F0EB] rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-[#9B988F]">
                      Kirim kode ini ke temanmu supaya bisa ikut masuk ke room yang sama.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9B988F]">Nama host</span>
                      <span className="font-mono text-[#C7C4BC]">{playerName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {AVATAR_OPTIONS.slice(0, 8).map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => handleUpdateHostIdentity(av)}
                          className={`w-9 h-9 rounded-md text-xs font-mono font-bold flex items-center justify-center border transition-colors cursor-pointer ${
                            playerAvatar === av
                              ? 'bg-[#F2F0EB] text-[#0C0E11] border-[#F2F0EB]'
                              : 'bg-[#14171C] text-[#C7C4BC] border-[#686A70] hover:border-[#F2F0EB]'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[#9B988F]">
                      Pilih kode fakultas untuk tanda pin kamu di peta hasil.
                    </p>
                  </div>
                </div>

                {/* PLAYER LIST */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[#F2F0EB]">
                      Pemain di room ({roomPlayers.length}/8)
                    </h2>
                    {roomPlayers.length < 8 && (
                      <button
                        type="button"
                        onClick={handleAddSimulatedFriend}
                        className="text-xs font-medium text-[#C7C4BC] hover:text-[#F2F0EB] border border-[#686A70] hover:border-[#F2F0EB] px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Tambah pemain uji</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const player = roomPlayers[idx];
                      if (player) {
                        return (
                          <div
                            key={player.id}
                            className="bg-[#14171C] border border-[#262A32] rounded-md p-3 flex flex-col justify-between gap-3"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="w-8 h-8 rounded flex items-center justify-center text-xs font-mono font-bold text-[#F2F0EB] border"
                                style={{
                                  backgroundColor: `${player.color}22`,
                                  borderColor: player.color,
                                }}
                              >
                                {player.avatar}
                              </span>
                              {player.isHost ? (
                                <span className="text-xs font-mono text-[#E2B34B]">Host</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePlayer(player.id)}
                                  aria-label={`Keluarkan ${player.name}`}
                                  className="p-1 text-[#9B988F] hover:text-red-400 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="text-sm font-medium text-[#F2F0EB] truncate">
                              {player.name}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`empty-${idx}`}
                          className="border border-dashed border-[#262A32] rounded-md p-3 flex items-center justify-center min-h-[88px] text-xs font-mono text-[#9B988F]"
                        >
                          Slot {idx + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TIMER & START */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-[#262A32]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs text-[#9B988F]">Durasi ronde:</span>
                    <div className="inline-flex items-center bg-[#14171C] border border-[#686A70] rounded-md p-0.5">
                      {[
                        { label: '30d', val: 30 },
                        { label: '60d', val: 60 },
                        { label: '90d', val: 90 },
                        { label: 'Bebas', val: null },
                      ].map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => setTimerDuration(t.val)}
                          className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                            timerDuration === t.val
                              ? 'bg-[#F2F0EB] text-[#0C0E11]'
                              : 'text-[#C7C4BC] hover:text-[#F2F0EB]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStart8PlayerGame}
                    disabled={roomPlayers.length < 2}
                    className={`px-5 py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                      roomPlayers.length >= 2
                        ? 'bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] cursor-pointer'
                        : 'bg-[#14171C] text-[#9B988F] border border-[#262A32] cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {roomPlayers.length >= 2
                        ? `Mulai (${roomPlayers.length} pemain)`
                        : 'Butuh minimal 2 pemain'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {eightTab === 'join' && (
              <form onSubmit={handleJoin8PlayerRoom} className="flex flex-col gap-5 max-w-md">
                <div>
                  <label htmlFor="join-8p-name" className="text-xs text-[#9B988F] block mb-1.5">
                    Nama pemain (sesuai akun)
                  </label>
                  <input
                    id="join-8p-name"
                    type="text"
                    value={joinNameInput}
                    readOnly
                    disabled
                    className="w-full bg-[#14171C] border border-[#262A32] rounded-md px-3.5 py-2.5 text-sm font-medium text-[#C7C4BC] cursor-not-allowed"
                  />
                </div>

                <div>
                  <span className="text-xs text-[#9B988F] block mb-2">Kode fakultas di pin</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setJoinAvatarInput(av)}
                        className={`w-9 h-9 rounded-md text-xs font-mono font-bold flex items-center justify-center border transition-colors cursor-pointer ${
                          joinAvatarInput === av
                            ? 'bg-[#F2F0EB] text-[#0C0E11] border-[#F2F0EB]'
                            : 'bg-[#14171C] text-[#C7C4BC] border-[#686A70] hover:border-[#F2F0EB]'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="join-8p-code" className="text-xs text-[#9B988F] block mb-1.5">
                    Kode room
                  </label>
                  <input
                    id="join-8p-code"
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => {
                      setJoinCodeInput(e.target.value.toUpperCase());
                      setJoinError('');
                    }}
                    placeholder="UNS-AB42"
                    maxLength={10}
                    className="w-full bg-[#14171C] border border-[#686A70] focus:border-[#E2B34B] rounded-md p-3 text-lg font-mono font-bold text-[#F2F0EB] tracking-widest uppercase transition-colors"
                  />
                  {joinError && <p className="text-xs text-red-400 mt-1.5">{joinError}</p>}
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] font-bold text-sm rounded-md transition-colors cursor-pointer self-start"
                >
                  Masuk ke Room
                </button>
              </form>
            )}
          </div>
        )}

        {/* MODE B: DUEL 1V1 */}
        {multiMode === 'duel' && (
          <div className="flex flex-col gap-7">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#262A32] pb-5">
              <div>
                <p className="font-mono text-xs text-[#9B988F]">
                  6.000 HP · R1-2 1.0x · R3-4 1.5x · R5+ 2.0x
                </p>
                <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#F2F0EB] mt-1">
                  Duel 1v1
                </h1>
              </div>

              <div className="flex items-center gap-5 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setDuelTab('quick');
                    soundFx.playClick();
                  }}
                  className={`pb-1 font-semibold border-b-2 transition-colors cursor-pointer ${
                    duelTab === 'quick'
                      ? 'border-[#E2B34B] text-[#F2F0EB]'
                      : 'border-transparent text-[#9B988F] hover:text-[#F2F0EB]'
                  }`}
                >
                  Lawan bot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDuelTab('host');
                    soundFx.playClick();
                  }}
                  className={`pb-1 font-semibold border-b-2 transition-colors cursor-pointer ${
                    duelTab === 'host'
                      ? 'border-[#E2B34B] text-[#F2F0EB]'
                      : 'border-transparent text-[#9B988F] hover:text-[#F2F0EB]'
                  }`}
                >
                  Buat room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDuelTab('join');
                    soundFx.playClick();
                  }}
                  className={`pb-1 font-semibold border-b-2 transition-colors cursor-pointer ${
                    duelTab === 'join'
                      ? 'border-[#E2B34B] text-[#F2F0EB]'
                      : 'border-transparent text-[#9B988F] hover:text-[#F2F0EB]'
                  }`}
                >
                  Gabung
                </button>
              </div>
            </div>

            {duelTab === 'quick' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col divide-y divide-[#262A32] border-y border-[#262A32]">
                  {BOT_RIVALS.map((bot, index) => {
                    const isSelected = selectedBotIndex === index;
                    return (
                      <button
                        key={bot.name}
                        type="button"
                        onClick={() => {
                          setSelectedBotIndex(index);
                          soundFx.playClick();
                        }}
                        className={`py-4 px-3 text-left transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected ? 'bg-[#14171C]' : 'hover:bg-[#14171C]/60'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span
                            className={`w-10 h-10 rounded-md font-mono text-sm font-bold flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-[#E2B34B] text-[#0C0E11] border-[#E2B34B]'
                                : 'bg-[#14171C] text-[#C7C4BC] border-[#353942]'
                            }`}
                          >
                            {bot.avatar}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-base text-[#F2F0EB]">{bot.name}</div>
                            <div className="text-xs text-[#9B988F] mt-0.5">{bot.title}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="font-mono text-xs text-[#C7C4BC]">{bot.rating} ELO</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[#E2B34B] bg-[#E2B34B]' : 'border-[#686A70]'
                            }`}
                            aria-hidden="true"
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#0C0E11]" />}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleStartQuickDuel}
                    className="px-6 py-3 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] font-bold text-sm rounded-md transition-colors cursor-pointer"
                  >
                    Mulai Duel melawan {BOT_RIVALS[selectedBotIndex].name}
                  </button>
                </div>
              </div>
            )}

            {duelTab === 'host' && (
              <div className="flex flex-col gap-5 max-w-md">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-[#9B988F]">Kode room duel</span>
                  <div className="flex items-center justify-between gap-3 bg-[#14171C] px-4 py-3 rounded-md border border-[#353942]">
                    <span className="font-mono text-2xl font-bold text-[#E2B34B] tracking-widest">
                      {duelRoomCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyDuelCode}
                      className="px-3 py-1.5 bg-[#1C2028] hover:bg-[#262B35] border border-[#686A70] text-[#F2F0EB] rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedDuelCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDuelCode ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartHostDuel}
                  className="px-6 py-3 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] font-bold text-sm rounded-md transition-colors cursor-pointer self-start"
                >
                  Mulai Pertandingan
                </button>
              </div>
            )}

            {duelTab === 'join' && (
              <form onSubmit={handleJoinDuelRoom} className="flex flex-col gap-5 max-w-md">
                <div>
                  <label htmlFor="join-duel-code" className="text-xs text-[#9B988F] block mb-1.5">
                    Kode room duel
                  </label>
                  <input
                    id="join-duel-code"
                    type="text"
                    value={duelJoinCodeInput}
                    onChange={(e) => {
                      setDuelJoinCodeInput(e.target.value.toUpperCase());
                      setDuelJoinError('');
                    }}
                    placeholder="UNS-782"
                    maxLength={8}
                    className="w-full bg-[#14171C] border border-[#686A70] focus:border-[#E2B34B] rounded-md p-3 text-lg font-mono font-bold text-[#F2F0EB] tracking-widest uppercase transition-colors"
                  />
                  {duelJoinError && <p className="text-xs text-red-400 mt-1.5">{duelJoinError}</p>}
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] font-bold text-sm rounded-md transition-colors cursor-pointer self-start"
                >
                  Masuk dan Tanding
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
