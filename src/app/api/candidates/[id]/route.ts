import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticated, failure, HttpError } from '@/lib/http';
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { sb, user } = await authenticated(request);
    const id = z.uuid().parse((await context.params).id);
    const input = z.object({ stage: z.enum(['review', 'shortlist', 'rejected']) }).parse(await request.json());
    const { data, error } = await sb.from('candidates').update(input).eq('id', id).eq('user_id', user.id).select().maybeSingle();
    if (error) throw new HttpError(500, 'No s’ha pogut actualitzar el candidat.');
    if (!data) throw new HttpError(404, 'No s’ha trobat el candidat.');
    return NextResponse.json(data);
  } catch (e) { return failure(e); }
}
