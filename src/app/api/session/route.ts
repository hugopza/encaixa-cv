import { NextResponse } from 'next/server';
import { authenticated, failure } from '@/lib/http';
export async function DELETE(request: Request) {
  try { const { sb } = await authenticated(request); await sb.auth.signOut(); return NextResponse.json({ ok: true }); }
  catch (e) { return failure(e); }
}
