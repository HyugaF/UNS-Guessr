import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('uns_session')?.value;
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = sessionCookie || bearerToken;

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const user = getSessionUser(token);
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error: unknown) {
    console.error('Error fetching auth state:', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: 'Gagal memverifikasi sesi.' },
      { status: 500 }
    );
  }
}
