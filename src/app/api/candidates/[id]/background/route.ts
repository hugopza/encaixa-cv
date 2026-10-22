import { NextResponse } from 'next/server';
import { z } from 'zod';
import { candidateContext, bonusDatabaseError } from '@/lib/bonus-data';
import { checkGithub } from '@/lib/background';
import { githubProfile } from '@/lib/bonus-domain';
import { failure, HttpError } from '@/lib/http';
export const maxDuration = 45;
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { sb, user, candidate } = await candidateContext(request, (await context.params).id);
    const result = await sb.from('candidate_background_checks').select('*').eq('candidate_id', candidate.id).eq('user_id', user.id).order('checked_at', { ascending: false }).limit(10);
    bonusDatabaseError(result.error);
    return NextResponse.json({ checks: result.data });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request, context: Context) {
  try {
    const { sb, user, candidate } = await candidateContext(request, (await context.params).id);
    const input = z.object({ profileUrl: z.string().max(200), confirmed: z.literal(true) }).parse(await request.json());
    let profile: ReturnType<typeof githubProfile>;
    try { profile = githubProfile(input.profileUrl); }
    catch { throw new HttpError(400, 'Introdueix un perfil https://github.com/usuari, sense rutes addicionals.'); }
    const previous = await sb.from('candidate_background_checks').select('*').eq('candidate_id', candidate.id).eq('user_id', user.id).eq('profile_url', profile.url).maybeSingle();
    bonusDatabaseError(previous.error);
    if (previous.data && Date.now() - new Date(previous.data.checked_at).getTime() < 300_000) return NextResponse.json({ check: previous.data });
    const report = await checkGithub(profile.url, candidate.resume_text);
    const result = await sb.from('candidate_background_checks').upsert({ candidate_id: candidate.id, user_id: user.id, profile_url: profile.url, profile_confirmed_at: new Date().toISOString(), report, checked_at: report.checkedAt, review_status: 'pending', review_note: '', reviewed_at: null }, { onConflict: 'candidate_id,profile_url' }).select().single();
    bonusDatabaseError(result.error);
    return NextResponse.json({ check: result.data });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const { sb, user, candidate } = await candidateContext(request, (await context.params).id);
    const input = z.object({ id: z.uuid(), checkedAt: z.string(), status: z.enum(['reviewed','followup']), note: z.string().trim().min(10).max(2000) }).parse(await request.json());
    const result = await sb.from('candidate_background_checks').update({ review_status: input.status, review_note: input.note, reviewed_at: new Date().toISOString() }).eq('id', input.id).eq('candidate_id', candidate.id).eq('user_id', user.id).eq('checked_at', input.checkedAt).select().maybeSingle();
    bonusDatabaseError(result.error);
    if (!result.data) throw new HttpError(409, 'La comprovació ha canviat o no existeix. Actualitza-la.');
    return NextResponse.json({ check: result.data });
  } catch (error) { return failure(error); }
}
