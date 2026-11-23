import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, updateUserStats } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('uns_session')?.value;
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = sessionCookie || bearerToken;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = getSessionUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { score, duelResult, expGained } = body || {};

    const result = await updateUserStats(
      user.id,
      typeof score === 'number' ? score : 0,
      duelResult === 'win' || duelResult === 'loss' ? duelResult : undefined,
      typeof expGained === 'number' ? expGained : undefined
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
      levelInfo: result.levelInfo,
      expGained: result.expGained,
      leveledUp: result.leveledUp,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui statistik.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
