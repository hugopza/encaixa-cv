import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { HttpError } from './http';

const budgetSchema = z.discriminatedUnion('allowed', [
  z.object({ allowed: z.literal(true), lease_id: z.uuid() }),
  z.object({ allowed: z.literal(false), reason: z.enum(['concurrent','hourly','daily','global']), retry_after: z.number().int().min(1) }),
]);

export async function withAiBudget<T>(client: Pick<SupabaseClient, 'rpc'>, operation: () => Promise<T>) {
  const { data, error } = await client.rpc('acquire_ai_budget');
  if (error) {
    if (['42883','PGRST202'].includes(error.code || '')) throw new HttpError(503, 'Falta aplicar la migració del límit d’IA. Executa npx supabase db push.');
    throw new HttpError(503, 'No es pot comprovar el límit de consum. No s’ha cridat Anthropic.');
  }
  const parsed = budgetSchema.safeParse(data);
  if (!parsed.success) throw new HttpError(503, 'La comprovació de consum no és vàlida. No s’ha cridat Anthropic.');
  const budget = parsed.data;
  if (!budget.allowed) {
    const messages = {
      concurrent: 'Ja tens una operació d’IA en curs. Espera que acabi.',
      hourly: 'Has arribat al límit de 10 operacions d’IA per hora.',
      daily: 'Has arribat al límit de 30 operacions d’IA al dia.',
      global: 'L’app ha arribat al límit diari compartit de 100 operacions d’IA.',
    };
    const wait = budget.retry_after >= 3600 ? `${Math.ceil(budget.retry_after / 3600)} h` : `${Math.max(1, Math.ceil(budget.retry_after / 60))} min`;
    throw new HttpError(429, `${messages[budget.reason]} Reintenta d’aquí a ${wait}.`, budget.retry_after);
  }
  try { return await operation(); }
  finally {
    // Leases also expire after three minutes if the server is interrupted.
    try {
      const released = await client.rpc('release_ai_budget', { request_id: budget.lease_id });
      if (released.error) console.error('ai_budget_release_failed');
    } catch { console.error('ai_budget_release_failed'); }
  }
}
