import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticated, failure, HttpError } from '@/lib/http';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { sb, user } = await authenticated(request);
    const id = z.uuid().parse((await context.params).id);
    // Database FK cascades to this job's candidates and their analyses.
    const { data, error } = await sb.from('jobs').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
    if (error) throw new HttpError(500, 'No s’ha pogut eliminar la vacant. Torna-ho a provar.');
    if (!data) throw new HttpError(404, 'No s’ha trobat la vacant.');
    return NextResponse.json({ id: data.id });
  } catch (error) { return failure(error); }
}
