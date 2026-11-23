import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/db';
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
    const { user, token } = await registerUser(username, password, clientIp);

    const response = NextResponse.json({
      success: true,
      message: 'Registrasi berhasil!',
      user,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: 'uns_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada registrasi.';
    const isRateLimit = message.includes('Batas pendaftaran') || message.includes('Mohon tunggu');
    return NextResponse.json(
      { success: false, error: message },
      { status: isRateLimit ? 429 : 400 }
    );
  }
}
