import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('uns_session')?.value;
    if (token) {
      await destroySession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Berhasil logout.',
    });

    response.cookies.set({
      name: 'uns_session',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json({ success: true });
  }
}
