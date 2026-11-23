import type { UNSLocation } from '@/data/unsLocations';

export interface DuelPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  hp: number;
  hasGuessedThisRound: boolean;
  currentGuess: { lat: number; lng: number } | null;
  lastDistance: number;
  lastScore: number;
  lastDamageTaken: number;
}

export interface DuelRoundResult {
  round: number;
  location: UNSLocation;
  player1Guess: { lat: number; lng: number } | null;
  player1Distance: number;
  player1Score: number;
  player2Guess: { lat: number; lng: number } | null;
  player2Distance: number;
  player2Score: number;
  // Tournament 6000 HP & Damage System
  multiplier: number;
  damage: number;
  damageTarget: 'player1' | 'player2' | 'none';
  player1HpBefore: number;
  player1HpAfter: number;
  player2HpBefore: number;
  player2HpAfter: number;
  isKnockout: boolean;
}

export interface MultiplayerRoomConfig {
  roomCode: string;
  timerDuration: number | null; // in seconds
  totalRounds: number;
  isBotOpponent: boolean;
  botDifficulty: 'easy' | 'medium' | 'hard';
}

// 8-PLAYER CLASSIC MULTIPLAYER ROOM (ALA GEOGUESSR)
export interface RoomPlayer8 {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  totalScore: number;
  roundScores: number[];
  roundDistances: number[];
  hasGuessedThisRound: boolean;
  currentGuess: { lat: number; lng: number } | null;
  lastDistance: number;
  lastScore: number;
}

export interface EightPlayerRoomState {
  roomCode: string;
  hostId: string;
  players: RoomPlayer8[];
  currentRound: number;
  totalRounds: number;
  timerDuration: number | null;
  locations: UNSLocation[];
  headings: number[];
  status: 'LOBBY' | 'PLAYING' | 'ROUND_RESULT' | 'PODIUM';
}

export const PLAYER_COLORS_8 = [
  '#a855f7', // Purple (Host/Player 1)
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#14b8a6', // Teal
];
