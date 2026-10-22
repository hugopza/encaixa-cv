import { NextResponse } from 'next/server';
import { z } from 'zod';
import { candidateContext, bonusDatabaseError } from '@/lib/bonus-data';
import { failure, HttpError } from '@/lib/http';
import { generateInterview, evaluateInterview } from '@/lib/interview-ai';
import { validateAnswers, type Interview } from '@/lib/bonus-domain';
import type { Job } from '@/lib/domain';
import { withAiBudget } from '@/lib/ai-budget';
export const maxDuration = 120;
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { sb, user, candidate } = await candidateContext(request, (await context.params).id);
    const { data, error } = await sb.from('candidate_interviews').select('*').eq('candidate_id', candidate.id).eq('user_id', user.id).maybeSingle();
    bonusDatabaseError(error);
    return NextResponse.json({ session: data });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const { sb, user, candidate } = await candidateContext(request, (await context.params).id);
    const input = z.object({ action: z.enum(['generate','save','evaluate']), answers: z.record(z.string(), z.string().max(6000)).optional(), revision: z.string().optional() }).parse(await request.json());
    const existing = await sb.from('candidate_interviews').select('*').eq('candidate_id', candidate.id).eq('user_id', user.id).maybeSingle();
    bonusDatabaseError(existing.error);
    const session = existing.data as Interview | null;
    if (session && ['generating','evaluating'].includes(session.status) && Date.now() - new Date(session.updated_at).getTime() < 180_000) throw new HttpError(409, 'Ja hi ha una generació en curs. Actualitza en uns segons; si s’ha interromput, reintenta d’aquí a 3 minuts.');
    if (input.action === 'generate' && session?.plan) return NextResponse.json({ session });
    if (input.action !== 'generate' && !session?.plan) throw new HttpError(409, 'Genera les preguntes abans de desar o valorar respostes.');
    if (input.action !== 'generate' && input.revision !== session?.updated_at) throw new HttpError(409, 'L’entrevista ha canviat en una altra sessió. Actualitza abans de continuar.');
    let answers = session?.answers || {};
    if (input.action !== 'generate') {
      try { answers = validateAnswers(input.answers || {}, session!.plan!, input.action === 'evaluate'); }
      catch (error) { throw new HttpError(400, error instanceof Error ? error.message : 'Respostes no vàlides.'); }
    }
    const now = new Date().toISOString();
    const patch = { status: input.action === 'generate' ? 'generating' : input.action === 'evaluate' ? 'evaluating' : 'draft', answers, error: null, evaluation: null, updated_at: now };
    const locked = session
      ? await sb.from('candidate_interviews').update(patch).eq('candidate_id', candidate.id).eq('user_id', user.id).eq('updated_at', session.updated_at).select().maybeSingle()
      : await sb.from('candidate_interviews').insert({ ...patch, candidate_id: candidate.id, user_id: user.id }).select().maybeSingle();
    if (locked.error?.code === '23505') throw new HttpError(409, 'Una altra sessió ja ha iniciat l’entrevista. Actualitza-la.');
    bonusDatabaseError(locked.error);
    if (!locked.data) throw new HttpError(409, 'L’entrevista ha canviat. Actualitza abans de continuar.');
    if (input.action === 'save') return NextResponse.json({ session: locked.data });
    try {
      const { data: job, error: jobError } = await sb.from('jobs').select('*').eq('id', candidate.job_id).eq('user_id', user.id).single();
      if (jobError || !job) throw new HttpError(404, 'No s’ha trobat la vacant.');
      const result = await withAiBudget(sb, async () => input.action === 'generate'
        ? await generateInterview(candidate, job as Job)
        : await evaluateInterview(session!.plan!, answers, job as Job));
      const resultPatch = input.action === 'generate' ? { plan: result.value, status: 'draft' } : { evaluation: result.value, status: 'ready' };
      const saved = await sb.from('candidate_interviews').update({ ...resultPatch, model: result.model, error: null, updated_at: new Date().toISOString() }).eq('candidate_id', candidate.id).eq('user_id', user.id).eq('updated_at', now).select().maybeSingle();
      bonusDatabaseError(saved.error);
      if (!saved.data) throw new HttpError(409, 'L’entrevista ja no està disponible o ha canviat.');
      return NextResponse.json({ session: saved.data });
    } catch (error) {
      await sb.from('candidate_interviews').update({ status: 'error', error: error instanceof HttpError ? error.message : 'La generació ha fallat.', updated_at: new Date().toISOString() }).eq('candidate_id', candidate.id).eq('user_id', user.id).eq('updated_at', now);
      throw error;
    }
  } catch (error) { return failure(error); }
}
