export interface LevelInfo {
  level: number;
  title: string;
  tier: string;
  currentLevelExp: number;
  nextLevelExp: number;
  expForNextLevel: number;
  expInCurrentLevel: number;
  progressPercent: number;
  totalExp: number;
}

export const LEVEL_THRESHOLDS: Array<{ level: number; minExp: number; title: string; tier: string }> = [
  { level: 1, minExp: 0, title: 'Maba Kentingan', tier: 'Mahasiswa Baru' },
  { level: 2, minExp: 500, title: 'Mahasiswa Tingkat 2', tier: 'Junior' },
  { level: 3, minExp: 1200, title: 'Aktivis Kampus UNS', tier: 'Senior' },
  { level: 4, minExp: 2200, title: 'Asisten Laboratorium', tier: 'Scholar' },
  { level: 5, minExp: 3500, title: 'Kandidat Cumlaude', tier: 'Elite' },
  { level: 6, minExp: 5200, title: 'Peneliti Skripsi', tier: 'Master' },
  { level: 7, minExp: 7500, title: 'Sarjana UNS', tier: 'Graduate' },
  { level: 8, minExp: 10500, title: 'Dosen Teladan', tier: 'Academician' },
  { level: 9, minExp: 15000, title: 'Guru Besar / Profesor', tier: 'Legend' },
  { level: 10, minExp: 22000, title: 'Rektor Kehormatan UNS', tier: 'Grandmaster' },
];

export function calculateLevel(totalExp: number): LevelInfo {
  const safeExp = Math.max(0, typeof totalExp === 'number' && !isNaN(totalExp) ? totalExp : 0);

  let currentTier = LEVEL_THRESHOLDS[0];
  let nextTier = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (safeExp >= LEVEL_THRESHOLDS[i].minExp) {
      currentTier = LEVEL_THRESHOLDS[i];
      nextTier = LEVEL_THRESHOLDS[i + 1] || {
        level: currentTier.level + 1,
        minExp: currentTier.minExp + 10000,
        title: 'Sang Rektor Abadi',
        tier: 'Mythic',
      };
      break;
    }
  }

  const currentLevelExp = currentTier.minExp;
  const nextLevelExp = nextTier.minExp;
  const expForNextLevel = Math.max(1, nextLevelExp - currentLevelExp);
  const expInCurrentLevel = safeExp - currentLevelExp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((expInCurrentLevel / expForNextLevel) * 100)));

  return {
    level: currentTier.level,
    title: currentTier.title,
    tier: currentTier.tier,
    currentLevelExp,
    nextLevelExp,
    expForNextLevel,
    expInCurrentLevel,
    progressPercent,
    totalExp: safeExp,
  };
}
