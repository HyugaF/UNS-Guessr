import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'UNSGuessr',
    timestamp: new Date().toISOString(),
  });
}
