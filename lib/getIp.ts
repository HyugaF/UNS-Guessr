import { NextRequest } from 'next/server';
import { normalizeIp } from './db';

/**
 * Extracts client IP address from Next.js request headers.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return normalizeIp(firstIp);
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return normalizeIp(realIp.trim());

  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return normalizeIp(cfIp.trim());

  // Next.js standard ip or fallback
  // @ts-expect-error NextRequest ip property
  const nextIp = req.ip;
  if (nextIp) return normalizeIp(nextIp);

  return '127.0.0.1';
}
