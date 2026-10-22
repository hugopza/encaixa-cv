import { NextResponse } from 'next/server';
import { serverClient, configured } from './supabase-server';
import { ZodError } from 'zod';

export class HttpError extends Error { constructor(public status: number, message: string, public retryAfter?: number) { super(message); } }
export async function authenticated(request: Request) {
  const origin = request.headers.get('origin');
  if (request.method !== 'GET' && origin && origin !== new URL(request.url).origin) throw new HttpError(403, 'Origen no autoritzat.');
  if (!configured()) throw new HttpError(503, 'Falta configurar Supabase.');
  const sb = await serverClient();
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) throw new HttpError(401, 'La sessió ha caducat. Torna a iniciar sessió.');
  return { sb, user };
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message, ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}) }, { status: error.status, headers: error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : undefined });
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? 'Dades no vàlides.' }, { status: 400 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: 'Format de petició no vàlid.' }, { status: 400 });
  console.error('Request failed', error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: 'No s’ha pogut completar l’operació. Torna-ho a provar.' }, { status: 500 });
}
