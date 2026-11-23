'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LobbyScreen } from '@/components/LobbyScreen';
import { MultiplayerLobby } from '@/components/MultiplayerLobby';
import { GameHUD } from '@/components/GameHUD';
import { DuelHUD } from '@/components/DuelHUD';
import { StreetViewPlayer } from '@/components/StreetViewPlayer';
import { GuessMap } from '@/components/GuessMap';
import { ResultReviewMap } from '@/components/ResultReviewMap';
import { RoundResultModal } from '@/components/RoundResultModal';
import { DuelRoundResultModal } from '@/components/DuelRoundResultModal';
import { GameOverScreen, type RoundRecord } from '@/components/GameOverScreen';
import { DuelGameOverModal } from '@/components/DuelGameOverModal';
import { EightPlayerHUD } from '@/components/EightPlayerHUD';
import { EightPlayerRoundResultModal } from '@/components/EightPlayerRoundResultModal';
import { EightPlayerPodiumModal } from '@/components/EightPlayerPodiumModal';
import { AuthModal, type AuthUser } from '@/components/AuthModal';
import { UNS_LOCATIONS, type UNSLocation } from '@/data/unsLocations';
import { calculateDistanceMeters, calculateRoundScore } from '@/lib/geoScore';
import { soundFx } from '@/lib/soundFx';
import { generateBotGuess, type BotRivalProfile } from '@/lib/multiplayerBot';
import { calculateLevel, type LevelInfo } from '@/lib/expLevel';
import type { DuelRoundResult, RoomPlayer8 } from '@/types/multiplayer';

type GameScreen =
  | 'LOBBY'
  | 'MULTIPLAYER_LOBBY'
  | 'PLAYING'
  | 'ROUND_RESULT'
  | 'GAME_OVER'
  | 'DUEL_PLAYING'
  | 'DUEL_ROUND_RESULT'
  | 'DUEL_GAME_OVER'
  | 'EIGHT_PLAYING'
  | 'EIGHT_ROUND_RESULT'
  | 'EIGHT_PODIUM';

const TOTAL_ROUNDS = 5;
const MAX_TOTAL_SCORE = TOTAL_ROUNDS * 5000;

export default function UNSGuessrPage() {
  const [screen, setScreen] = useState<GameScreen>('LOBBY');
  const [timerDuration, setTimerDuration] = useState<number | null>(60);

  // Active game session state (shared across singleplayer and duels)
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [sessionLocations, setSessionLocations] = useState<UNSLocation[]>([]);
  const [sessionHeadings, setSessionHeadings] = useState<number[]>([]);
  const [accumulatedScore, setAccumulatedScore] = useState<number>(0);
  const [roundRecords, setRoundRecords] = useState<RoundRecord[]>([]);

  // Current active round states
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [currentUserGuess, setCurrentUserGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [lastRoundDistance, setLastRoundDistance] = useState<number>(0);
  const [lastRoundScore, setLastRoundScore] = useState<number>(0);

  // Active pin currently placed by the user on the map
  const [activePin, setActivePin] = useState<{ lat: number; lng: number } | null>(null);
  const activePinRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    activePinRef.current = activePin;
  }, [activePin]);

  // Multiplayer Navigation Initial Mode ('duel' or '8player')
  const [multiplayerInitialMode, setMultiplayerInitialMode] = useState<'duel' | '8player'>('duel');

  // Multiplayer Duel States (Tournament 6000 HP System)
  const [player1Hp, setPlayer1Hp] = useState<number>(6000);
  const [player2Hp, setPlayer2Hp] = useState<number>(6000);
  const [isDuelKnockout, setIsDuelKnockout] = useState<boolean>(false);
  const [lastDuelMultiplier, setLastDuelMultiplier] = useState<number>(1.0);
  const [lastDuelDamage, setLastDuelDamage] = useState<number>(0);
  const [lastDuelDamageTarget, setLastDuelDamageTarget] = useState<'player1' | 'player2' | 'none'>('none');
  const [lastDuelP1HpBefore, setLastDuelP1HpBefore] = useState<number>(6000);
  const [lastDuelP2HpBefore, setLastDuelP2HpBefore] = useState<number>(6000);

  const [duelRoomCode, setDuelRoomCode] = useState<string>('');
  const [player1Locked, setPlayer1Locked] = useState<boolean>(false);
  const player1LockedRef = useRef<boolean>(false);
  useEffect(() => {
    player1LockedRef.current = player1Locked;
  }, [player1Locked]);

  const [player1PendingGuess, setPlayer1PendingGuess] = useState<{ lat: number; lng: number } | null>(null);
  const player1PendingGuessRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    player1PendingGuessRef.current = player1PendingGuess;
  }, [player1PendingGuess]);

  const [player2Name, setPlayer2Name] = useState<string>('Lawan');
  const [player2Avatar, setPlayer2Avatar] = useState<string>('KS');
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [player2Locked, setPlayer2Locked] = useState<boolean>(false);
  const player2LockedRef = useRef<boolean>(false);
  useEffect(() => {
    player2LockedRef.current = player2Locked;
  }, [player2Locked]);

  const [player2RoundGuess, setPlayer2RoundGuess] = useState<{ lat: number; lng: number } | null>(null);
  const player2RoundGuessRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    player2RoundGuessRef.current = player2RoundGuess;
  }, [player2RoundGuess]);

  const [player2LastDistance, setPlayer2LastDistance] = useState<number>(0);
  const [player2LastScore, setPlayer2LastScore] = useState<number>(0);
  const [duelRecords, setDuelRecords] = useState<DuelRoundResult[]>([]);
  const [activeBotProfile, setActiveBotProfile] = useState<BotRivalProfile | undefined>(undefined);

  // Damage multiplier calculator per round (GeoGuessr Pro Style)
  const getDuelMultiplier = (roundIdx: number): number => {
    if (roundIdx <= 1) return 1.0; // Round 1-2
    if (roundIdx <= 3) return 1.5; // Round 3-4
    if (roundIdx === 4) return 2.0; // Round 5
    return 3.0; // Sudden death
  };

  // Multiplayer 8-Player States (Ala GeoGuessr Klasik 5 Ronde)
  const [eightRoomCode, setEightRoomCode] = useState<string>('');
  const [eightPlayers, setEightPlayers] = useState<RoomPlayer8[]>([]);
  const eightPlayersRef = useRef<RoomPlayer8[]>([]);
  useEffect(() => {
    eightPlayersRef.current = eightPlayers;
  }, [eightPlayers]);

  const [eightCurrentUserId, setEightCurrentUserId] = useState<string>('');
  const [eightIsHost, setEightIsHost] = useState<boolean>(true);

  // Local Database Authentication
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalNotice, setAuthModalNotice] = useState<string>('');

  // EXP & Level Progression tracking
  const [lastExpReward, setLastExpReward] = useState<{
    expGained: number;
    levelInfo: LevelInfo | null;
    leveledUp: boolean;
  } | null>(null);

  const activePlayerName = authUser?.displayName || authUser?.username || 'Mahasiswa UNS';

  const promptAuthToPlay = useCallback(() => {
    soundFx.playPinDrop();
    setAuthModalNotice('Wajib masuk atau daftar akun terlebih dahulu untuk bermain!');
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setAuthUser(data.user);
        } else {
          setAuthUser(null);
        }
      }
    } catch {
      // Offline fallback
    }
  }, []);

  // Check current session on startup
  useEffect(() => {
    let isCancelled = false;

    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (isCancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setAuthUser(data.user);
          } else {
            setAuthUser(null);
          }
        }
      } catch {
        // Offline fallback
      }
    }

    checkSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setAuthUser(null);
    refreshAuth();
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setIsAuthModalOpen(false);
    setAuthModalNotice('');
    refreshAuth();
  };

  const syncUserStats = async (score?: number, duelResult?: 'win' | 'loss', expGained?: number) => {
    if (!authUser) return null;
    try {
      const res = await fetch('/api/user/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, duelResult, expGained }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setAuthUser((prev) => (prev ? { ...prev, stats: data.stats } : null));
          const reward = {
            expGained: data.expGained,
            levelInfo: data.levelInfo,
            leveledUp: !!data.leveledUp,
          };
          setLastExpReward(reward);
          return reward;
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  // Timer references
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Randomize locations with balanced distribution: Kentingan and Outer Campuses (Manahan, Kleco, Mesen, Pabelan)
  const generateRandomSession = (): { locations: UNSLocation[]; headings: number[] } => {
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const kentinganPool = shuffleArray(UNS_LOCATIONS.filter((loc) => loc.campus === 'kentingan'));
    const outerPool = shuffleArray(UNS_LOCATIONS.filter((loc) => loc.campus !== 'kentingan'));

    // Balance: 2-3 locations from Kentingan and 2-3 from Outer Campuses
    const kentinganCount = Math.random() > 0.5 ? 3 : 2;
    const outerCount = TOTAL_ROUNDS - kentinganCount;

    const selectedKentingan = kentinganPool.slice(0, kentinganCount);
    const selectedOuter = outerPool.slice(0, outerCount);

    const chosen = shuffleArray([...selectedKentingan, ...selectedOuter]);
    const headings = chosen.map(() => Math.floor(Math.random() * 360));
    return { locations: chosen, headings };
  };

  // ─────────────────────────────────────────────────────────────
  // 1. SINGLEPLAYER START & FLOW
  // ─────────────────────────────────────────────────────────────
  const handleStartGame = (config: { timerDuration: number | null }) => {
    if (!authUser) {
      promptAuthToPlay();
      return;
    }

    setTimerDuration(config.timerDuration);

    const { locations, headings } = generateRandomSession();
    setSessionLocations(locations);
    setSessionHeadings(headings);
    setCurrentRoundIndex(0);
    setAccumulatedScore(0);
    setRoundRecords([]);
    setCurrentUserGuess(null);

    if (config.timerDuration !== null) {
      setTimeRemaining(config.timerDuration);
    } else {
      setTimeRemaining(null);
    }

    setScreen('PLAYING');
  };

  const handleGuessSubmit = useCallback(
    (guess: { lat: number; lng: number } | null) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      const currentLocation = sessionLocations[currentRoundIndex];
      if (!currentLocation) return;

      let distance = 99999;
      let score = 0;

      if (guess) {
        distance = calculateDistanceMeters(guess, currentLocation.coordinates);
        score = calculateRoundScore(distance);
        setCurrentUserGuess(guess);
      } else {
        distance = 15000;
        score = 0;
        setCurrentUserGuess(null);
      }

      setLastRoundDistance(distance);
      setLastRoundScore(score);
      setAccumulatedScore((prev) => prev + score);

      const record: RoundRecord = {
        round: currentRoundIndex + 1,
        location: currentLocation,
        userGuess: guess,
        distanceMeters: distance,
        score,
      };

      setRoundRecords((prev) => [...prev, record]);
      setScreen('ROUND_RESULT');
    },
    [sessionLocations, currentRoundIndex]
  );

  const handleNextRound = () => {
    if (currentRoundIndex + 1 < TOTAL_ROUNDS) {
      const nextIndex = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIndex);
      setCurrentUserGuess(null);
      if (timerDuration !== null) {
        setTimeRemaining(timerDuration);
      }
      setScreen('PLAYING');
    } else {
      const calculatedExp = Math.max(100, Math.round(accumulatedScore / 5) + 150);
      syncUserStats(accumulatedScore, undefined, calculatedExp);
      setScreen('GAME_OVER');
    }
  };

  const handlePlayAgain = () => {
    const { locations, headings } = generateRandomSession();
    setSessionLocations(locations);
    setSessionHeadings(headings);
    setCurrentRoundIndex(0);
    setAccumulatedScore(0);
    setRoundRecords([]);
    setCurrentUserGuess(null);

    if (timerDuration !== null) {
      setTimeRemaining(timerDuration);
    } else {
      setTimeRemaining(null);
    }

    setScreen('PLAYING');
  };

  // ─────────────────────────────────────────────────────────────
  // 2. MULTIPLAYER DUEL START & FLOW (6000 HP TOURNAMENT SYSTEM)
  // ─────────────────────────────────────────────────────────────
  const handleStartDuel = (config: {
    roomCode: string;
    isBot: boolean;
    botProfile?: BotRivalProfile;
    timerDuration: number | null;
    player2Name: string;
  }) => {
    if (!authUser) {
      promptAuthToPlay();
      return;
    }

    setDuelRoomCode(config.roomCode);
    setTimerDuration(config.timerDuration);
    setPlayer2Name(config.player2Name);
    setPlayer2Avatar(config.botProfile?.avatar || 'P2');
    setActiveBotProfile(config.botProfile);
    setPlayer2Score(0);
    setDuelRecords([]);

    // Reset Tournament 6000 HP state
    setPlayer1Hp(6000);
    setPlayer2Hp(6000);
    setIsDuelKnockout(false);
    setLastDuelDamage(0);
    setLastDuelDamageTarget('none');
    setLastDuelP1HpBefore(6000);
    setLastDuelP2HpBefore(6000);

    const { locations, headings } = generateRandomSession();
    setSessionLocations(locations);
    setSessionHeadings(headings);
    setCurrentRoundIndex(0);
    setAccumulatedScore(0);
    setCurrentUserGuess(null);
    setPlayer1Locked(false);
    setPlayer1PendingGuess(null);
    setPlayer2Locked(false);
    setPlayer2RoundGuess(null);
    setActivePin(null);

    if (config.timerDuration !== null) {
      setTimeRemaining(config.timerDuration);
    } else {
      setTimeRemaining(null);
    }

    setScreen('DUEL_PLAYING');
  };

  // Finalize duel round after both players have guessed (or time expired)
  const finalizeDuelRound = useCallback(
    (
      p1FinalGuess: { lat: number; lng: number } | null,
      p2FinalGuess: { lat: number; lng: number } | null
    ) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
        botTimeoutRef.current = null;
      }

      const currentLocation = sessionLocations[currentRoundIndex];
      if (!currentLocation) return;

      // 1. Calculate Player 1 (You)
      let p1Distance = 99999;
      let p1Score = 0;
      if (p1FinalGuess) {
        p1Distance = calculateDistanceMeters(p1FinalGuess, currentLocation.coordinates);
        p1Score = calculateRoundScore(p1Distance);
        setCurrentUserGuess(p1FinalGuess);
      } else {
        p1Distance = 15000;
        p1Score = 0;
        setCurrentUserGuess(null);
      }

      setLastRoundDistance(p1Distance);
      setLastRoundScore(p1Score);
      setAccumulatedScore((prev) => prev + p1Score);

      // 2. Calculate Player 2 (Opponent)
      let p2Guess = p2FinalGuess;
      let p2Distance = 99999;
      let p2Score = 0;

      if (p2Guess) {
        p2Distance = calculateDistanceMeters(p2Guess, currentLocation.coordinates);
        p2Score = calculateRoundScore(p2Distance);
      } else {
        const botResult = generateBotGuess(currentLocation.coordinates, 'medium');
        p2Guess = botResult.guess;
        p2Distance = botResult.distance;
        p2Score = botResult.score;
      }

      setPlayer2RoundGuess(p2Guess);
      setPlayer2LastDistance(p2Distance);
      setPlayer2LastScore(p2Score);
      setPlayer2Score((prev) => prev + p2Score);

      // 3. Tournament 6000 HP & Damage Multiplier Calculation
      const mult = getDuelMultiplier(currentRoundIndex);
      const scoreDiff = Math.abs(p1Score - p2Score);
      const calculatedDamage = Math.round(scoreDiff * mult);

      let target: 'player1' | 'player2' | 'none' = 'none';
      let newP1Hp = player1Hp;
      let newP2Hp = player2Hp;

      if (p1Score > p2Score) {
        target = 'player2';
        newP2Hp = Math.max(0, player2Hp - calculatedDamage);
      } else if (p2Score > p1Score) {
        target = 'player1';
        newP1Hp = Math.max(0, player1Hp - calculatedDamage);
      }

      const knockout = newP1Hp <= 0 || newP2Hp <= 0;

      setLastDuelMultiplier(mult);
      setLastDuelDamage(calculatedDamage);
      setLastDuelDamageTarget(target);
      setLastDuelP1HpBefore(player1Hp);
      setLastDuelP2HpBefore(player2Hp);
      setPlayer1Hp(newP1Hp);
      setPlayer2Hp(newP2Hp);
      setIsDuelKnockout(knockout);

      const record: DuelRoundResult = {
        round: currentRoundIndex + 1,
        location: currentLocation,
        player1Guess: p1FinalGuess,
        player1Distance: p1Distance,
        player1Score: p1Score,
        player2Guess: p2Guess,
        player2Distance: p2Distance,
        player2Score: p2Score,
        multiplier: mult,
        damage: calculatedDamage,
        damageTarget: target,
        player1HpBefore: player1Hp,
        player1HpAfter: newP1Hp,
        player2HpBefore: player2Hp,
        player2HpAfter: newP2Hp,
        isKnockout: knockout,
      };

      setDuelRecords((prev) => [...prev, record]);
      setScreen('DUEL_ROUND_RESULT');
    },
    [sessionLocations, currentRoundIndex, player1Hp, player2Hp]
  );

  // Submit duel guess handler (player 1 locks in, waits for opponent if not yet ready)
  const handleDuelGuessSubmit = useCallback(
    (guess: { lat: number; lng: number } | null) => {
      setPlayer1Locked(true);
      setPlayer1PendingGuess(guess);

      // If opponent has already locked their guess, finalize immediately!
      if (player2LockedRef.current) {
        finalizeDuelRound(guess, player2RoundGuessRef.current);
      }
    },
    [finalizeDuelRound]
  );

  // Bot guessing simulation schedule (Duel)
  useEffect(() => {
    if (screen !== 'DUEL_PLAYING') {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
        botTimeoutRef.current = null;
      }
      return;
    }

    const currentLocation = sessionLocations[currentRoundIndex];
    if (!currentLocation) return;

    // Simulate bot thinking and locking in guess
    const botResult = generateBotGuess(currentLocation.coordinates, 'medium');
    const delayMs = (botResult.delaySeconds || 7) * 1000;

    botTimeoutRef.current = setTimeout(() => {
      setPlayer2Locked(true);
      setPlayer2RoundGuess(botResult.guess);
      setPlayer2LastDistance(botResult.distance);
      setPlayer2LastScore(botResult.score);
      soundFx.playPinDrop();

      // If Player 1 has already submitted, both are ready -> finalize immediately!
      if (player1LockedRef.current) {
        finalizeDuelRound(player1PendingGuessRef.current, botResult.guess);
      }
    }, delayMs);

    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
        botTimeoutRef.current = null;
      }
    };
  }, [screen, currentRoundIndex, sessionLocations, finalizeDuelRound]);

  const handleNextDuelRound = () => {
    if (isDuelKnockout || currentRoundIndex + 1 >= TOTAL_ROUNDS || player1Hp <= 0 || player2Hp <= 0) {
      const isP1Win = player1Hp > player2Hp || (player1Hp === player2Hp && accumulatedScore > player2Score);
      const duelExp = Math.round(accumulatedScore / 5) + (isP1Win ? 600 : 200);
      syncUserStats(accumulatedScore, isP1Win ? 'win' : 'loss', duelExp);
      setScreen('DUEL_GAME_OVER');
      return;
    }

    const nextIndex = currentRoundIndex + 1;
    setCurrentRoundIndex(nextIndex);
    setCurrentUserGuess(null);
    setActivePin(null);
    setPlayer1Locked(false);
    setPlayer1PendingGuess(null);
    setPlayer2Locked(false);
    setPlayer2RoundGuess(null);

    if (timerDuration !== null) {
      setTimeRemaining(timerDuration);
    }
    setScreen('DUEL_PLAYING');
  };

  const handleDuelRematch = () => {
    const { locations, headings } = generateRandomSession();
    setSessionLocations(locations);
    setSessionHeadings(headings);
    setCurrentRoundIndex(0);
    setAccumulatedScore(0);
    setPlayer2Score(0);
    setPlayer1Hp(6000);
    setPlayer2Hp(6000);
    setIsDuelKnockout(false);
    setLastDuelDamage(0);
    setLastDuelDamageTarget('none');
    setLastDuelP1HpBefore(6000);
    setLastDuelP2HpBefore(6000);
    setDuelRecords([]);
    setCurrentUserGuess(null);
    setActivePin(null);
    setPlayer1Locked(false);
    setPlayer1PendingGuess(null);
    setPlayer2Locked(false);
    setPlayer2RoundGuess(null);

    if (timerDuration !== null) {
      setTimeRemaining(timerDuration);
    } else {
      setTimeRemaining(null);
    }

    setScreen('DUEL_PLAYING');
  };

  // ─────────────────────────────────────────────────────────────
  // 3. MULTIPLAYER 8-PLAYER START & LIFECYCLE (ALA GEOGUESSR)
  // ─────────────────────────────────────────────────────────────
  const handleStartEightPlayer = (config: {
    roomCode: string;
    players: RoomPlayer8[];
    timerDuration: number | null;
    currentUserId: string;
    isHost: boolean;
  }) => {
    if (!authUser) {
      promptAuthToPlay();
      return;
    }

    setEightRoomCode(config.roomCode);
    setEightPlayers(
      config.players.map((p) => ({
        ...p,
        totalScore: 0,
        roundScores: [],
        roundDistances: [],
        hasGuessedThisRound: false,
        currentGuess: null,
        lastDistance: 0,
        lastScore: 0,
      }))
    );
    setEightCurrentUserId(config.currentUserId);
    setEightIsHost(config.isHost);
    setTimerDuration(config.timerDuration);

    const { locations, headings } = generateRandomSession();
    setSessionLocations(locations);
    setSessionHeadings(headings);
    setCurrentRoundIndex(0);
    setCurrentUserGuess(null);
    setActivePin(null);

    if (config.timerDuration !== null) {
      setTimeRemaining(config.timerDuration);
    } else {
      setTimeRemaining(null);
    }

    setScreen('EIGHT_PLAYING');
  };

  // Finalize 8-player round once everyone has guessed or timer expires
  const finalizeEightRound = useCallback(
    (finalPlayers: RoomPlayer8[]) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      const currentLocation = sessionLocations[currentRoundIndex];
      if (!currentLocation) return;

      const me = finalPlayers.find((p) => p.id === eightCurrentUserId);
      if (me) {
        setLastRoundDistance(me.lastDistance);
        setLastRoundScore(me.lastScore);
        setCurrentUserGuess(me.currentGuess);
      }

      // Commit round results to cumulative scores
      setEightPlayers(
        finalPlayers.map((p) => ({
          ...p,
          totalScore: p.totalScore + p.lastScore,
          roundScores: [...p.roundScores, p.lastScore],
          roundDistances: [...p.roundDistances, p.lastDistance],
        }))
      );

      setScreen('EIGHT_ROUND_RESULT');
    },
    [sessionLocations, currentRoundIndex, eightCurrentUserId]
  );

  // Submit guess for 8-Player round (locks user, checks if all have guessed)
  const handleEightGuessSubmit = useCallback(
    (guess: { lat: number; lng: number } | null) => {
      const currentLocation = sessionLocations[currentRoundIndex];
      if (!currentLocation) return;

      let distance = 99999;
      let score = 0;

      if (guess) {
        distance = calculateDistanceMeters(guess, currentLocation.coordinates);
        score = calculateRoundScore(distance);
        setCurrentUserGuess(guess);
      } else {
        distance = 15000;
        score = 0;
        setCurrentUserGuess(null);
      }

      setEightPlayers((prev) => {
        const updated = prev.map((p) =>
          p.id === eightCurrentUserId
            ? {
                ...p,
                hasGuessedThisRound: true,
                currentGuess: guess,
                lastDistance: distance,
                lastScore: score,
              }
            : p
        );

        // Check if all players in the room have now guessed
        const allGuessed = updated.every((p) => p.hasGuessedThisRound);
        if (allGuessed) {
          setTimeout(() => {
            finalizeEightRound(updated);
          }, 350);
        }

        return updated;
      });
    },
    [sessionLocations, currentRoundIndex, eightCurrentUserId, finalizeEightRound]
  );

  // Simulate other players submitting guesses during 8-Player round
  useEffect(() => {
    if (screen !== 'EIGHT_PLAYING') return;

    const currentLocation = sessionLocations[currentRoundIndex];
    if (!currentLocation) return;

    const timeouts: NodeJS.Timeout[] = [];
    const others = eightPlayersRef.current.filter(
      (p) => p.id !== eightCurrentUserId && !p.hasGuessedThisRound
    );

    others.forEach((p, idx) => {
      const delayMs = 2500 + Math.random() * 8500 + idx * 800;
      const t = setTimeout(() => {
        const botResult = generateBotGuess(currentLocation.coordinates, 'medium');
        setEightPlayers((prev) => {
          const updated = prev.map((item) =>
            item.id === p.id
              ? {
                  ...item,
                  hasGuessedThisRound: true,
                  currentGuess: botResult.guess,
                  lastDistance: botResult.distance,
                  lastScore: botResult.score,
                }
              : item
          );

          // If all players have guessed, transition to result screen!
          const allGuessed = updated.every((item) => item.hasGuessedThisRound);
          if (allGuessed) {
            setTimeout(() => {
              finalizeEightRound(updated);
            }, 350);
          }

          return updated;
        });
        soundFx.playPinDrop();
      }, delayMs);
      timeouts.push(t);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [screen, currentRoundIndex, sessionLocations, eightCurrentUserId, finalizeEightRound]);

  const handleNextEightRound = () => {
    if (currentRoundIndex + 1 < TOTAL_ROUNDS) {
      const nextIndex = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIndex);
      setCurrentUserGuess(null);
      setActivePin(null);
      setEightPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          hasGuessedThisRound: false,
          currentGuess: null,
          lastDistance: 0,
          lastScore: 0,
        }))
      );
      if (timerDuration !== null) {
        setTimeRemaining(timerDuration);
      }
      setScreen('EIGHT_PLAYING');
    } else {
      const sorted = [...eightPlayers].sort((a, b) => b.totalScore - a.totalScore);
      const myRank = sorted.findIndex((p) => p.id === eightCurrentUserId);
      const myScore = sorted.find((p) => p.id === eightCurrentUserId)?.totalScore || 0;
      let bonusExp = 200; // participation
      if (myRank === 0) bonusExp = 1000; // 1st place gold
      else if (myRank === 1) bonusExp = 600; // 2nd place silver
      else if (myRank === 2) bonusExp = 400; // 3rd place bronze
      const totalExpGained = Math.round(myScore / 5) + bonusExp;
      syncUserStats(myScore, undefined, totalExpGained);
      setScreen('EIGHT_PODIUM');
    }
  };

  const handleEightPlayAgain = () => {
    const { locations, headings } = generateRandomSession();
    setSessionLocations(locations);
    setSessionHeadings(headings);
    setCurrentRoundIndex(0);
    setCurrentUserGuess(null);
    setActivePin(null);
    setEightPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        totalScore: 0,
        roundScores: [],
        roundDistances: [],
        hasGuessedThisRound: false,
        currentGuess: null,
        lastDistance: 0,
        lastScore: 0,
      }))
    );
    if (timerDuration !== null) {
      setTimeRemaining(timerDuration);
    } else {
      setTimeRemaining(null);
    }
    setScreen('EIGHT_PLAYING');
  };

  // ─────────────────────────────────────────────────────────────
  // 4. COMMON TIMER COUNTDOWN HOOK (AUTO-SUBMITS ACTIVE PIN ON EXPIRY)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const isPlayingScreen =
      screen === 'PLAYING' || screen === 'DUEL_PLAYING' || screen === 'EIGHT_PLAYING';
    if (!isPlayingScreen || timerDuration === null) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;

          // Semisal pin sudah terpasang, gunakan pin tersebut sebagai jawaban final saat kehabisan waktu!
          const finalPin = activePinRef.current;

          if (screen === 'PLAYING') {
            handleGuessSubmit(finalPin);
          } else if (screen === 'DUEL_PLAYING') {
            const p1Final = player1LockedRef.current ? player1PendingGuessRef.current : finalPin;
            const p2Final = player2LockedRef.current ? player2RoundGuessRef.current : null;
            finalizeDuelRound(p1Final, p2Final);
          } else if (screen === 'EIGHT_PLAYING') {
            const curLoc = sessionLocations[currentRoundIndex];
            const updated = eightPlayersRef.current.map((p) => {
              if (p.id === eightCurrentUserId) {
                if (p.hasGuessedThisRound) return p;
                const d = finalPin && curLoc ? calculateDistanceMeters(finalPin, curLoc.coordinates) : 15000;
                const s = finalPin ? calculateRoundScore(d) : 0;
                return {
                  ...p,
                  hasGuessedThisRound: true,
                  currentGuess: finalPin,
                  lastDistance: d,
                  lastScore: s,
                };
              } else if (!p.hasGuessedThisRound) {
                const auto = curLoc ? generateBotGuess(curLoc.coordinates, 'medium') : { guess: null, distance: 15000, score: 0 };
                return {
                  ...p,
                  hasGuessedThisRound: true,
                  currentGuess: auto.guess,
                  lastDistance: auto.distance,
                  lastScore: auto.score,
                };
              }
              return p;
            });
            finalizeEightRound(updated);
          }
          return 0;
        }
        if (prev <= 10) {
          soundFx.playTimerTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [
    screen,
    timerDuration,
    currentRoundIndex,
    sessionLocations,
    eightCurrentUserId,
    handleGuessSubmit,
    finalizeDuelRound,
    finalizeEightRound,
  ]);


  const handleReturnToLobby = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
    setScreen('LOBBY');
  };

  const currentLocation = sessionLocations[currentRoundIndex];
  const currentHeading = sessionHeadings[currentRoundIndex];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070b14] select-none">
      {/* 1. LOBBY VIEW (SINGLEPLAYER UNS SEASON & MULTIPLAYER CARDS) */}
      {screen === 'LOBBY' && (
        <LobbyScreen
          onStartGame={handleStartGame}
          onOpenDuel={() => {
            if (!authUser) {
              promptAuthToPlay();
              return;
            }
            setMultiplayerInitialMode('duel');
            setScreen('MULTIPLAYER_LOBBY');
          }}
          onOpenEightPlayer={() => {
            if (!authUser) {
              promptAuthToPlay();
              return;
            }
            setMultiplayerInitialMode('8player');
            setScreen('MULTIPLAYER_LOBBY');
          }}
          authUser={authUser}
          onOpenAuthModal={(mode) => {
            setAuthModalNotice('');
            setAuthModalMode(mode || 'login');
            setIsAuthModalOpen(true);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* 2. MULTIPLAYER LOBBY HUB */}
      {screen === 'MULTIPLAYER_LOBBY' && (
        <MultiplayerLobby
          key={`${multiplayerInitialMode}-${authUser?.id || 'guest'}`}
          initialMode={multiplayerInitialMode}
          defaultPlayerName={activePlayerName}
          onBackToLobby={() => setScreen('LOBBY')}
          onStartDuel={handleStartDuel}
          onStartEightPlayer={handleStartEightPlayer}
        />
      )}

      {/* 3. SINGLEPLAYER ACTIVE GAMEPLAY (UNS SEASON) */}
      {screen === 'PLAYING' && currentLocation && (
        <div className="relative w-full h-full flex flex-col">
          <GameHUD
            round={currentRoundIndex + 1}
            totalRounds={TOTAL_ROUNDS}
            currentScore={accumulatedScore}
            timeRemaining={timeRemaining}
            gameMode="streetview"
            onExitGame={handleReturnToLobby}
          />

          <main className="relative flex-1 w-full h-full pt-12">
            <StreetViewPlayer
              key={`${currentLocation.id}-${currentHeading}`}
              location={currentLocation}
              randomHeading={currentHeading}
            />
          </main>

          <GuessMap
            key={`guess-${currentRoundIndex}`}
            onGuessSubmit={handleGuessSubmit}
            onPinChange={setActivePin}
            isResultMode={false}
            roundNumber={currentRoundIndex + 1}
          />
        </div>
      )}

      {/* 4. SINGLEPLAYER ROUND RESULT REVIEW */}
      {screen === 'ROUND_RESULT' && currentLocation && (
        <div className="relative w-full h-full flex flex-col">
          <GameHUD
            round={currentRoundIndex + 1}
            totalRounds={TOTAL_ROUNDS}
            currentScore={accumulatedScore}
            timeRemaining={null}
            gameMode="streetview"
            onExitGame={handleReturnToLobby}
          />

          <main className="relative flex-1 w-full h-full pt-12">
            <ResultReviewMap
              key={`review-${currentRoundIndex}`}
              actualLocation={currentLocation}
              userGuess={currentUserGuess}
              distanceMeters={lastRoundDistance}
            />
          </main>

          <RoundResultModal
            round={currentRoundIndex + 1}
            totalRounds={TOTAL_ROUNDS}
            location={currentLocation}
            distanceMeters={lastRoundDistance}
            score={lastRoundScore}
            onNextRound={handleNextRound}
          />
        </div>
      )}

      {/* 5. SINGLEPLAYER GAME OVER */}
      {screen === 'GAME_OVER' && (
        <GameOverScreen
          totalScore={accumulatedScore}
          maxScore={MAX_TOTAL_SCORE}
          rounds={roundRecords}
          gameMode="streetview"
          onPlayAgain={handlePlayAgain}
          onReturnToLobby={handleReturnToLobby}
          expGained={lastExpReward?.expGained}
          userStats={authUser?.stats}
          leveledUp={lastExpReward?.leveledUp}
        />
      )}

      {/* 6. MULTIPLAYER DUEL ACTIVE GAMEPLAY (TOURNAMENT BROADCAST 6000 HP) */}
      {screen === 'DUEL_PLAYING' && currentLocation && (
        <div className="relative w-full h-full flex flex-col">
          <DuelHUD
            round={currentRoundIndex + 1}
            totalRounds={TOTAL_ROUNDS}
            multiplier={getDuelMultiplier(currentRoundIndex)}
            player1Name={activePlayerName}
            player1Hp={player1Hp}
            player1Score={accumulatedScore}
            player1Locked={player1Locked}
            player2Name={player2Name}
            player2Hp={player2Hp}
            player2Score={player2Score}
            player2Avatar={player2Avatar}
            player2Locked={player2Locked}
            timeRemaining={timeRemaining}
            onExitDuel={handleReturnToLobby}
          />

          <main className="relative flex-1 w-full h-full pt-12">
            <StreetViewPlayer
              key={`duel-${currentLocation.id}-${currentHeading}`}
              location={currentLocation}
              randomHeading={currentHeading}
            />

            {/* WAITING OVERLAY: HANYA TAMPIL SAAT PEMAIN SUDAH TEBAK TAPI LAWAN BELUM */}
            {player1Locked && !player2Locked && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 max-w-[94vw] bg-[#14171C] border border-[#353942] text-[#F2F0EB] px-4 py-2 rounded-md text-xs flex items-center gap-2.5">
                <span className="font-medium text-[#C7C4BC] truncate">
                  Tebakan terkunci · Menunggu <strong className="text-[#F2F0EB]">{player2Name}</strong> menebak
                </span>
                {timeRemaining !== null && (
                  <span className="font-mono font-semibold text-[#E2B34B] pl-2 border-l border-[#262A32] shrink-0">
                    {timeRemaining}d
                  </span>
                )}
              </div>
            )}
          </main>

          <GuessMap
            key={`duel-guess-${currentRoundIndex}`}
            onGuessSubmit={handleDuelGuessSubmit}
            onPinChange={setActivePin}
            isLocked={player1Locked}
            lockStatusMessage={player2Locked ? 'Menyiapkan hasil...' : 'Terkunci! Menunggu lawan...'}
            isResultMode={false}
            roundNumber={currentRoundIndex + 1}
          />
        </div>
      )}

      {/* 7. MULTIPLAYER DUEL ROUND RESULT (HEAD-TO-HEAD DAMAGE REPORT) */}
      {screen === 'DUEL_ROUND_RESULT' && currentLocation && (
        <div className="relative w-full h-full flex flex-col">
          <DuelHUD
            round={currentRoundIndex + 1}
            totalRounds={TOTAL_ROUNDS}
            multiplier={lastDuelMultiplier}
            player1Name={activePlayerName}
            player1Hp={player1Hp}
            player1Score={accumulatedScore}
            player1Locked={true}
            player2Name={player2Name}
            player2Hp={player2Hp}
            player2Score={player2Score}
            player2Avatar={player2Avatar}
            player2Locked={true}
            timeRemaining={null}
            onExitDuel={handleReturnToLobby}
          />

          <main className="relative flex-1 w-full h-full pt-12">
            <ResultReviewMap
              key={`duel-review-${currentRoundIndex}`}
              actualLocation={currentLocation}
              userGuess={currentUserGuess}
              distanceMeters={lastRoundDistance}
              opponentGuess={player2RoundGuess}
            />
          </main>

          <DuelRoundResultModal
            round={currentRoundIndex + 1}
            totalRounds={TOTAL_ROUNDS}
            location={currentLocation}
            multiplier={lastDuelMultiplier}
            player1Name={activePlayerName}
            player1Distance={lastRoundDistance}
            player1Score={lastRoundScore}
            player1HpBefore={lastDuelP1HpBefore}
            player1HpAfter={player1Hp}
            player2Name={player2Name}
            player2Avatar={player2Avatar}
            player2Distance={player2LastDistance}
            player2Score={player2LastScore}
            player2HpBefore={lastDuelP2HpBefore}
            player2HpAfter={player2Hp}
            damage={lastDuelDamage}
            damageTarget={lastDuelDamageTarget}
            isKnockout={isDuelKnockout}
            onNextRound={handleNextDuelRound}
          />
        </div>
      )}

      {/* 8. MULTIPLAYER DUEL GAME OVER (VICTORY / DEFEAT / K.O.) */}
      {screen === 'DUEL_GAME_OVER' && (
        <DuelGameOverModal
          player1Name={activePlayerName}
          player1Hp={player1Hp}
          player1TotalScore={accumulatedScore}
          player2Name={player2Name}
          player2Avatar={player2Avatar}
          player2Hp={player2Hp}
          player2TotalScore={player2Score}
          rounds={duelRecords}
          isKnockout={isDuelKnockout}
          onPlayAgain={handleDuelRematch}
          onReturnToLobby={handleReturnToLobby}
          expGained={lastExpReward?.expGained}
          userStats={authUser?.stats}
          leveledUp={lastExpReward?.leveledUp}
        />
      )}

      {/* 9. MULTIPLAYER 8-PLAYER ACTIVE GAMEPLAY (KLASIK 5 RONDE) */}
      {screen === 'EIGHT_PLAYING' && currentLocation && (
        <div className="relative w-full h-full flex flex-col">
          <EightPlayerHUD
            round={currentRoundIndex + 1}
            totalRounds={TOTAL_ROUNDS}
            players={eightPlayers}
            currentUserId={eightCurrentUserId}
            timeRemaining={timeRemaining}
            onExitRoom={handleReturnToLobby}
          />

          <main className="relative flex-1 w-full h-full pt-12">
            <StreetViewPlayer
              key={`eight-${currentLocation.id}-${currentHeading}`}
              location={currentLocation}
              randomHeading={currentHeading}
            />

            {/* WAITING OVERLAY: HANYA TAMPIL SAAT USER SUDAH TEBAK TAPI BELUM SEMUA SELESAI */}
            {(() => {
              const myP = eightPlayers.find((p) => p.id === eightCurrentUserId);
              const guessedCount = eightPlayers.filter((p) => p.hasGuessedThisRound).length;
              if (myP?.hasGuessedThisRound && guessedCount < eightPlayers.length) {
                return (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 max-w-[94vw] bg-[#14171C] border border-[#353942] text-[#F2F0EB] px-4 py-2 rounded-md text-xs flex items-center gap-2.5">
                    <span className="font-medium text-[#C7C4BC] truncate">
                      Tebakan terkunci · Menunggu pemain lain ({guessedCount}/{eightPlayers.length} selesai)
                    </span>
                    {timeRemaining !== null && (
                      <span className="font-mono font-semibold text-[#E2B34B] pl-2 border-l border-[#262A32] shrink-0">
                        {timeRemaining}d
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </main>

          <GuessMap
            key={`eight-guess-${currentRoundIndex}`}
            onGuessSubmit={handleEightGuessSubmit}
            onPinChange={setActivePin}
            isLocked={eightPlayers.find((p) => p.id === eightCurrentUserId)?.hasGuessedThisRound || false}
            lockStatusMessage={`Terkunci! (${eightPlayers.filter((p) => p.hasGuessedThisRound).length}/${eightPlayers.length} menebak)`}
            isResultMode={false}
            roundNumber={currentRoundIndex + 1}
          />
        </div>
      )}

      {/* 10. MULTIPLAYER 8-PLAYER ROUND RESULT REVIEW & LIVE LEADERBOARD */}
      {screen === 'EIGHT_ROUND_RESULT' && currentLocation && (
        <div className="relative w-full h-full flex flex-col">
          <EightPlayerHUD
            round={currentRoundIndex + 1}
            totalRounds={TOTAL_ROUNDS}
            players={eightPlayers}
            currentUserId={eightCurrentUserId}
            timeRemaining={null}
            onExitRoom={handleReturnToLobby}
          />

          <main className="relative flex-1 w-full h-full pt-12">
            <ResultReviewMap
              key={`eight-review-${currentRoundIndex}`}
              actualLocation={currentLocation}
              userGuess={currentUserGuess}
              distanceMeters={lastRoundDistance}
              multiplayerGuesses={eightPlayers.map((p) => ({
                name: p.name,
                avatar: p.avatar,
                color: p.color,
                guess: p.currentGuess,
                distance: p.lastDistance,
                score: p.lastScore,
              }))}
            />
          </main>

          <EightPlayerRoundResultModal
            round={currentRoundIndex + 1}
            totalRounds={TOTAL_ROUNDS}
            location={currentLocation}
            players={eightPlayers}
            currentUserId={eightCurrentUserId}
            isHost={eightIsHost}
            onNextRound={handleNextEightRound}
          />
        </div>
      )}

      {/* 11. MULTIPLAYER 8-PLAYER FINAL PODIUM (JUARA 1, 2, 3) */}
      {screen === 'EIGHT_PODIUM' && (
        <EightPlayerPodiumModal
          players={eightPlayers}
          currentUserId={eightCurrentUserId}
          roomCode={eightRoomCode}
          onPlayAgain={handleEightPlayAgain}
          onReturnToLobby={handleReturnToLobby}
          expGained={lastExpReward?.expGained}
          userStats={authUser?.stats}
          leveledUp={lastExpReward?.leveledUp}
        />
      )}

      {/* 12. LOCAL AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        noticeMessage={authModalNotice}
      />
    </div>
  );
}
