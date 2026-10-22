import { z } from 'zod';
import { authenticated, HttpError } from './http';
import type { Candidate } from './domain';

export async function candidateContext(request: Request, id: string) {
  const { sb, user } = await authenticated(request);
  const candidateId = z.uuid().parse(id);
  const { data, error } = await sb.from('candidates').select('*').eq('id', candidateId).eq('user_id', user.id).maybeSingle();
  if (error) throw new HttpError(500, 'No s’ha pogut llegir la candidatura.');
  if (!data) throw new HttpError(404, 'No s’ha trobat el candidat.');
  return { sb, user, candidate: data as Candidate };
}
export function bonusDatabaseError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01','PGRST205'].includes(error.code || '')) throw new HttpError(503, 'Falta aplicar la migració dels bonus. Executa npx supabase db push.');
  throw new HttpError(500, 'No s’han pogut desar o llegir les dades del bonus. Torna-ho a provar.');
}
