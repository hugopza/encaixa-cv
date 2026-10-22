import { NextResponse } from 'next/server';
import { authenticated, failure, HttpError } from '@/lib/http';
import { jobSchema } from '@/lib/domain';
export async function POST(request: Request) {
  try {
    const { sb, user } = await authenticated(request);
    const input = jobSchema.parse(await request.json());
    const { data, error } = await sb.from('jobs').insert({ ...input, user_id: user.id }).select().single();
    if (error) throw new HttpError(500, 'No s’ha pogut crear la vacant. Comprova que has executat la migració SQL.');
    return NextResponse.json(data, { status: 201 });
  } catch (e) { return failure(e); }
}
