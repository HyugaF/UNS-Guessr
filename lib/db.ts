import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserStats {
  highScore: number;
  gamesPlayed: number;
  duelWins: number;
  duelLosses: number;
  exp: number;
  level: number;
}

import { calculateLevel, LEVEL_THRESHOLDS, type LevelInfo } from '@/lib/expLevel';
export { calculateLevel, LEVEL_THRESHOLDS, type LevelInfo };

export interface UserRecord {
  id: string;
  username: string; // normalized lowercase
  displayName: string;
  passwordHash: string;
  salt: string;
  registeredIp: string;
  createdAt: string;
  lastLoginAt: string;
  stats: UserStats;
}

export interface IpLog {
  ip: string;
  registeredCount: number;
  registeredUsernames: string[];
  lastRegisteredAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  username: string;
  displayName: string;
  ip: string;
  createdAt: string;
  expiresAt: string;
}

export interface LocalDatabaseSchema {
  version: number;
  users: UserRecord[];
  sessions: SessionRecord[];
  ipLogs: IpLog[];
}

// Database directory & file path (auto created inside /data/db/uns_database.json)
const DB_DIR = path.join(process.cwd(), 'data', 'db');
const DB_FILE = path.join(DB_DIR, 'uns_database.json');
const MAX_ACCOUNTS_PER_IP = 2; // Strict limit per user's prompt request
const REGISTRATION_COOLDOWN_SECONDS = 15; // Anti-spam cooldown per IP

// Simple in-memory mutex to ensure atomic disk writes
let isWriting = false;
const writeQueue: Array<() => void> = [];

function acquireWriteLock(): Promise<void> {
  return new Promise((resolve) => {
    if (!isWriting) {
      isWriting = true;
      resolve();
    } else {
      writeQueue.push(() => {
        isWriting = true;
        resolve();
      });
    }
  });
}

function releaseWriteLock(): void {
  isWriting = false;
  const next = writeQueue.shift();
  if (next) {
    next();
  }
}

/**
 * Initializes database file and directory if they do not exist.
 * Automatically run on VM startup.
 */
export function ensureDatabase(): LocalDatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialData: LocalDatabaseSchema = {
        version: 1,
        users: [],
        sessions: [],
        ipLogs: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.users)) parsed.users = [];
    if (!Array.isArray(parsed.sessions)) parsed.sessions = [];
    if (!Array.isArray(parsed.ipLogs)) parsed.ipLogs = [];
    return parsed as LocalDatabaseSchema;
  } catch (error) {
    console.error('[UNSGuessr DB] Error initializing database:', error);
    return { version: 1, users: [], sessions: [], ipLogs: [] };
  }
}

/**
 * Reads the latest database state from disk.
 */
export function readDatabase(): LocalDatabaseSchema {
  return ensureDatabase();
}

/**
 * Atomically writes database to disk using a temporary file.
 */
export async function writeDatabase(data: LocalDatabaseSchema): Promise<void> {
  await acquireWriteLock();
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    const serialized = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(tempFile, serialized, 'utf-8');
    await fs.promises.rename(tempFile, DB_FILE);
  } finally {
    releaseWriteLock();
  }
}

/**
 * Hash password securely using native scrypt algorithm.
 */
export function hashPassword(password: string, salt: string): string {
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return derivedKey.toString('hex');
}

/**
 * Verify password against stored hash and salt with constant-time equality.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const keyToTest = crypto.scryptSync(password, salt, 64);
    const keyOriginal = Buffer.from(hash, 'hex');
    if (keyToTest.length !== keyOriginal.length) return false;
    return crypto.timingSafeEqual(keyToTest, keyOriginal);
  } catch {
    return false;
  }
}

/**
 * Check IP address limits for registrations.
 */
export function checkIpRegistrationLimit(ip: string): {
  allowed: boolean;
  registeredCount: number;
  maxAllowed: number;
  message?: string;
} {
  const db = readDatabase();
  const normalizedIp = normalizeIp(ip);
  const ipRecord = db.ipLogs.find((l) => l.ip === normalizedIp);

  if (!ipRecord) {
    return {
      allowed: true,
      registeredCount: 0,
      maxAllowed: MAX_ACCOUNTS_PER_IP,
    };
  }

  // Check count limit
  if (ipRecord.registeredCount >= MAX_ACCOUNTS_PER_IP) {
    return {
      allowed: false,
      registeredCount: ipRecord.registeredCount,
      maxAllowed: MAX_ACCOUNTS_PER_IP,
      message: 'Batas pembuatan akun telah tercapai. Silakan login menggunakan akun yang sudah terdaftar.',
    };
  }

  // Check cooldown to prevent rapid-fire bot registrations
  const lastTime = new Date(ipRecord.lastRegisteredAt).getTime();
  const now = Date.now();
  const diffSeconds = (now - lastTime) / 1000;
  if (diffSeconds < REGISTRATION_COOLDOWN_SECONDS) {
    const waitSeconds = Math.ceil(REGISTRATION_COOLDOWN_SECONDS - diffSeconds);
    return {
      allowed: false,
      registeredCount: ipRecord.registeredCount,
      maxAllowed: MAX_ACCOUNTS_PER_IP,
      message: `Mohon tunggu ${waitSeconds} detik sebelum mencoba mendaftar lagi.`,
    };
  }

  return {
    allowed: true,
    registeredCount: ipRecord.registeredCount,
    maxAllowed: MAX_ACCOUNTS_PER_IP,
  };
}

/**
 * Normalize IP addresses (IPv4 mapped IPv6, localhost, etc.)
 */
export function normalizeIp(ip: string | null | undefined): string {
  if (!ip) return '127.0.0.1';
  let clean = ip.trim();
  // Handle ::ffff:127.0.0.1 IPv4 mapped
  if (clean.startsWith('::ffff:')) {
    clean = clean.replace('::ffff:', '');
  }
  if (clean === '::1' || clean === 'localhost') {
    clean = '127.0.0.1';
  }
  return clean;
}

export type SafeUser = Omit<UserRecord, 'passwordHash' | 'salt' | 'registeredIp'>;

export function toSafeUser(user: UserRecord): SafeUser {
  const rawStats = user.stats || ({} as Partial<UserStats>);
  const exp = typeof rawStats.exp === 'number' ? rawStats.exp : 0;
  const levelInfo = calculateLevel(exp);
  const safeStats: UserStats = {
    highScore: rawStats.highScore ?? 0,
    gamesPlayed: rawStats.gamesPlayed ?? 0,
    duelWins: rawStats.duelWins ?? 0,
    duelLosses: rawStats.duelLosses ?? 0,
    exp,
    level: levelInfo.level,
  };

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    stats: safeStats,
  };
}

/**
 * Register a new user in local database.
 */
export async function registerUser(
  rawUsername: string,
  rawPassword: string,
  clientIp: string
): Promise<{ user: SafeUser; token: string }> {
  const cleanUsername = rawUsername.trim().toLowerCase();
  const displayName = rawUsername.trim();
  const ip = normalizeIp(clientIp);

  // Validate format
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
    throw new Error('Username harus 3-20 karakter, hanya huruf, angka, atau garis bawah (_).');
  }

  if (!rawPassword || rawPassword.length < 6) {
    throw new Error('Password minimal 6 karakter.');
  }

  // Check IP limit
  const ipCheck = checkIpRegistrationLimit(ip);
  if (!ipCheck.allowed) {
    throw new Error(ipCheck.message || 'Batas pendaftaran per IP tercapai.');
  }

  const db = readDatabase();

  // Check username uniqueness
  const existing = db.users.find((u) => u.username === cleanUsername);
  if (existing) {
    throw new Error(`Username "${displayName}" sudah digunakan. Silakan pilih username lain.`);
  }

  // Create credentials
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(rawPassword, salt);
  const now = new Date().toISOString();

  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    username: cleanUsername,
    displayName,
    passwordHash,
    salt,
    registeredIp: ip,
    createdAt: now,
    lastLoginAt: now,
    stats: {
      highScore: 0,
      gamesPlayed: 0,
      duelWins: 0,
      duelLosses: 0,
      exp: 0,
      level: 1,
    },
  };

  // Update IP log
  let ipLog = db.ipLogs.find((l) => l.ip === ip);
  if (!ipLog) {
    ipLog = {
      ip,
      registeredCount: 1,
      registeredUsernames: [cleanUsername],
      lastRegisteredAt: now,
    };
    db.ipLogs.push(ipLog);
  } else {
    ipLog.registeredCount += 1;
    ipLog.registeredUsernames.push(cleanUsername);
    ipLog.lastRegisteredAt = now;
  }

  // Create session
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const session: SessionRecord = {
    token,
    userId: newUser.id,
    username: newUser.username,
    displayName: newUser.displayName,
    ip,
    createdAt: now,
    expiresAt,
  };

  db.users.push(newUser);
  db.sessions.push(session);

  await writeDatabase(db);

  return { user: toSafeUser(newUser), token };
}

/**
 * Authenticate existing user.
 */
export async function authenticateUser(
  rawUsername: string,
  rawPassword: string,
  clientIp: string
): Promise<{ user: SafeUser; token: string }> {
  const cleanUsername = rawUsername.trim().toLowerCase();
  const ip = normalizeIp(clientIp);

  const db = readDatabase();
  const user = db.users.find((u) => u.username === cleanUsername);

  if (!user) {
    throw new Error('Username atau password salah.');
  }

  const isValid = verifyPassword(rawPassword, user.passwordHash, user.salt);
  if (!isValid) {
    throw new Error('Username atau password salah.');
  }

  const now = new Date().toISOString();
  user.lastLoginAt = now;

  // Clean expired sessions and create new one
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Filter out expired sessions
  db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > Date.now());

  const session: SessionRecord = {
    token,
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    ip,
    createdAt: now,
    expiresAt,
  };

  db.sessions.push(session);
  await writeDatabase(db);

  return { user: toSafeUser(user), token };
}

/**
 * Validate active session token.
 */
export function getSessionUser(token: string): SafeUser | null {
  if (!token) return null;
  const db = readDatabase();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return null;

  return toSafeUser(user);
}

/**
 * Terminate session (logout).
 */
export async function destroySession(token: string): Promise<void> {
  const db = readDatabase();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  await writeDatabase(db);
}

export interface UpdatedUserStatsResult {
  stats: UserStats;
  levelInfo: LevelInfo;
  expGained: number;
  leveledUp: boolean;
}

/**
 * Update user game score, stats, and EXP level progression.
 */
export async function updateUserStats(
  userId: string,
  score: number,
  duelResult?: 'win' | 'loss',
  expGained?: number
): Promise<UpdatedUserStatsResult | null> {
  const db = readDatabase();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  // Ensure backward compatibility on existing user stats
  if (typeof user.stats.exp !== 'number') user.stats.exp = 0;
  if (typeof user.stats.level !== 'number') user.stats.level = 1;

  const prevLevel = user.stats.level || 1;

  user.stats.gamesPlayed += 1;
  if (score > user.stats.highScore) {
    user.stats.highScore = score;
  }
  if (duelResult === 'win') {
    user.stats.duelWins += 1;
  } else if (duelResult === 'loss') {
    user.stats.duelLosses += 1;
  }

  // Calculate actual EXP earned:
  // - Base score conversion: Math.round(score / 5) (e.g. 15,000 pts = 3,000 EXP)
  // - Duel win bonus: +500 EXP, loss participation: +150 EXP
  // - 8-Player or custom expGained: honored directly if provided
  let calculatedExp = expGained;
  if (typeof calculatedExp !== 'number' || calculatedExp <= 0) {
    const scoreExp = Math.max(0, Math.round((score || 0) / 5));
    if (duelResult === 'win') {
      calculatedExp = scoreExp + 500;
    } else if (duelResult === 'loss') {
      calculatedExp = scoreExp + 150;
    } else {
      calculatedExp = scoreExp + 100; // singleplayer round completion bonus
    }
  }

  user.stats.exp += calculatedExp;
  const levelInfo = calculateLevel(user.stats.exp);
  user.stats.level = levelInfo.level;
  const leveledUp = user.stats.level > prevLevel;

  await writeDatabase(db);
  return {
    stats: user.stats,
    levelInfo,
    expGained: calculatedExp,
    leveledUp,
  };
}
