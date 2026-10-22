import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticated, failure, HttpError } from '@/lib/http';
import { screen } from '@/lib/screen';
import type { Job } from '@/lib/domain';
export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { sb, user } = await authenticated(request);
    const id = z.uuid().parse((await context.params).id);
    const { data: candidate } = await sb.from('candidates').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (!candidate) throw new HttpError(404, 'No s’ha trobat el candidat.');
    if (candidate.status === 'ready') return NextResponse.json(candidate);
    const { data: job } = await sb.from('jobs').select('*').eq('id', candidate.job_id).eq('user_id', user.id).single();
    if (!job) throw new HttpError(404, 'No s’ha trobat la vacant.');
    // Compare-and-set also permits recovery after an interrupted server request.
    const stale = new Date(Date.now() - 180_000).toISOString();
    const { data: lock, error: lockError } = await sb.from('candidates').update({ status: 'analyzing', error: null, analysis_started_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).or(`status.neq.analyzing,analysis_started_at.lt.${stale}`).select('id').maybeSingle();
    if (lockError) throw new HttpError(500, 'No s’ha pogut iniciar l’anàlisi.');
    if (!lock) throw new HttpError(409, 'L’anàlisi ja està en curs. Espera o reintenta d’aquí a 3 minuts.');
    try {
      const result = await screen(job as Job, candidate.resume_text);
      const { data, error } = await sb.from('candidates').update({ ...result, status: 'ready', error: null, analyzed_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw new HttpError(500, 'No s’ha pogut desar l’anàlisi.');
      return NextResponse.json(data);
    } catch (e) {
      await sb.from('candidates').update({ status: 'error', error: e instanceof HttpError ? e.message : 'L’anàlisi ha fallat. Torna-ho a provar.' }).eq('id', id).eq('user_id', user.id);
      throw e;
    }
  } catch (e) { return failure(e); }
}
