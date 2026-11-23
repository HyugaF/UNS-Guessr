import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';
import { getClientIp } from '@/lib/getIp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const { user, token } = await authenticateUser(username, password, clientIp);

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil!',
      user,
    });

    response.cookies.set({
      name: 'uns_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Username atau password salah.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
