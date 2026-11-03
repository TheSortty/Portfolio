import { NextResponse } from 'next/server';

// Versión publicada del sitio. El panel instalado como app la compara con la
// suya para recargarse cuando hay una nueva.

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ build: process.env.DASHBOARD_BUILD_ID ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}
