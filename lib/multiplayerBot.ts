import type { UNSLocation } from '@/data/unsLocations';
import { calculateDistanceMeters, calculateRoundScore } from '@/lib/geoScore';

export interface BotRivalProfile {
  name: string;
  title: string;
  avatar: string;
  rating: number;
}

export const BOT_RIVALS: BotRivalProfile[] = [
  {
    name: 'Kating Sepuh UNS',
    title: 'Mahasiswa Tingkat Akhir (Hafal Kentingan)',
    avatar: 'KS',
    rating: 2480,
  },
  {
    name: 'Mbak Vokasi UNS',
    title: 'Penjelajah Kampus Vokasi & Boulevard',
    avatar: 'MV',
    rating: 2150,
  },
  {
    name: 'Anak Hima UNS',
    title: 'Pelari Rapat Fakultas & SPMB',
    avatar: 'AH',
    rating: 1890,
  },
];

/**
 * Generates a realistic simulated opponent guess around the actual UNS coordinate
 */
export function generateBotGuess(
  actual: { lat: number; lng: number },
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): { guess: { lat: number; lng: number }; distance: number; score: number; delaySeconds: number } {
  // Accuracy radius in meters based on difficulty
  const maxOffsetMeters = difficulty === 'hard' ? 90 : difficulty === 'medium' ? 180 : 380;
  const minOffsetMeters = difficulty === 'hard' ? 10 : difficulty === 'medium' ? 25 : 60;

  const distanceMeters = minOffsetMeters + Math.random() * (maxOffsetMeters - minOffsetMeters);
  const angle = Math.random() * 2 * Math.PI;

  // Convert offset meters to lat/lng degrees (approx 111,320m per degree lat)
  const dLat = (distanceMeters * Math.cos(angle)) / 111320;
  const dLng = (distanceMeters * Math.sin(angle)) / (111320 * Math.cos((actual.lat * Math.PI) / 180));

  const guess = {
    lat: actual.lat + dLat,
    lng: actual.lng + dLng,
  };

  const calculatedDist = calculateDistanceMeters(guess, actual);
  const calculatedScore = calculateRoundScore(calculatedDist);

  // Realistic decision delay
  const delaySeconds = Math.floor(Math.random() * 12) + 6;

  return {
    guess,
    distance: calculatedDist,
    score: calculatedScore,
    delaySeconds,
  };
}
