import type { RoomPlayer8, EightPlayerRoomState } from '@/types/multiplayer';
import { PLAYER_COLORS_8 } from '@/types/multiplayer';
import { UNS_LOCATIONS, type UNSLocation } from '@/data/unsLocations';

const ROOM_STORAGE_PREFIX = 'unsguessr_room_';

export const AVATAR_OPTIONS = ['UN', 'FT', 'FK', 'FM', 'EB', 'FH', 'FP', 'IS', 'IB', 'SV', 'AR', 'DK'];

export function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const part1 = letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
  const part2 = digits[Math.floor(Math.random() * digits.length)] + digits[Math.floor(Math.random() * digits.length)];
  return `UNS-${part1}${part2}`;
}

export function createInitial8PlayerRoom(hostName: string, hostAvatar: string, timerDuration: number | null = 60): EightPlayerRoomState {
  const roomCode = generateRoomCode();
  const hostId = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Randomize 5 locations for 5 rounds
  const pool = [...UNS_LOCATIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const locations = pool.slice(0, 5);
  const headings = locations.map(() => Math.floor(Math.random() * 360));

  const hostPlayer: RoomPlayer8 = {
    id: hostId,
    name: hostName || 'Mahasiswa UNS',
    avatar: hostAvatar || 'UN',
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

  const room: EightPlayerRoomState = {
    roomCode,
    hostId,
    players: [hostPlayer],
    currentRound: 0,
    totalRounds: 5,
    timerDuration,
    locations,
    headings,
    status: 'LOBBY',
  };

  saveRoomToStorage(room);
  return room;
}

export function saveRoomToStorage(room: EightPlayerRoomState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + room.roomCode.toUpperCase(), JSON.stringify(room));
  } catch (e) {
    console.error('Failed to save room to storage', e);
  }
}

export function getRoomFromStorage(roomCode: string): EightPlayerRoomState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ROOM_STORAGE_PREFIX + roomCode.toUpperCase());
    if (!raw) return null;
    return JSON.parse(raw) as EightPlayerRoomState;
  } catch (e) {
    console.error('Failed to load room from storage', e);
    return null;
  }
}
