// Geodesy and Scoring calculation for UNSGuessr

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Calculates great-circle distance between two coordinates in meters
 * using the Haversine formula.
 */
export function calculateDistanceMeters(coord1: LatLng, coord2: LatLng): number {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Converts meters to human-readable Indonesian string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(km < 10 ? 2 : 1)} km`;
}

/**
 * Calculates score from 0 to 5,000 points based on campus-scale distance
 */
export function calculateRoundScore(distanceMeters: number): number {
  // Perfect guess within 15 meters
  if (distanceMeters <= 15) {
    return 5000;
  }

  // Very close: within 150 meters (same faculty building / courtyard)
  if (distanceMeters <= 150) {
    const penalty = (distanceMeters - 15) * 3.5;
    return Math.max(4500, Math.round(5000 - penalty));
  }

  // Inside campus area: 150m - 1200m
  if (distanceMeters <= 1200) {
    const decay = Math.exp(-0.0022 * (distanceMeters - 150));
    return Math.max(800, Math.round(4500 * decay));
  }

  // Multi-campus distances (e.g. Kentingan to Manahan ~5.8km, Kleco ~8.2km, Mesen ~3.5km)
  if (distanceMeters <= 10000) {
    const progress = (distanceMeters - 1200) / (10000 - 1200);
    return Math.max(50, Math.round(800 * (1 - progress)));
  }

  return 0;
}

export interface PlayerRank {
  title: string;
  badge: string;
  tagline: string;
  color: string;
}

export function getPlayerRank(totalScore: number): PlayerRank {
  if (totalScore >= 24000) {
    return {
      title: 'Maha-Peta UNS',
      badge: 'S',
      tagline: 'Hafal setiap sudut dan kawasan utama kampus UNS.',
      color: 'text-[#E5B94C]',
    };
  }
  if (totalScore >= 20000) {
    return {
      title: 'Kuncen Kentingan',
      badge: 'A',
      tagline: 'Insting navigasi kampus Anda tajam dan presisi.',
      color: 'text-emerald-400',
    };
  }
  if (totalScore >= 15000) {
    return {
      title: 'Penjelajah Senior',
      badge: 'B',
      tagline: 'Cukup akrab dengan jalur dan gedung utama kampus UNS.',
      color: 'text-slate-100',
    };
  }
  if (totalScore >= 10000) {
    return {
      title: 'Penjelajah UNS',
      badge: 'C',
      tagline: 'Mengenali sebagian gedung, masih perlu membiasakan arah.',
      color: 'text-slate-300',
    };
  }
  return {
    title: 'Maba Baru Tiba',
    badge: 'D',
    tagline: 'Masih banyak sudut kampus UNS yang menarik untuk dijelajahi.',
    color: 'text-rose-400',
  };
}
