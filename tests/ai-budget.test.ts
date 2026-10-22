import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { withAiBudget } from '../src/lib/ai-budget';
import { HttpError, failure } from '../src/lib/http';

const lease = '00000000-0000-4000-8000-000000000001';
function store(data: unknown, error: { code: string } | null = null) {
  const calls: string[] = [];
  const client = { rpc: async (name: string) => { calls.push(name); return name === 'acquire_ai_budget' ? { data, error } : { data: null, error: null }; } } as unknown as Pick<SupabaseClient, 'rpc'>;
  return { client, calls };
}
test('sense quota no es crida el proveïdor i es retorna Retry-After', async () => {
  const { client, calls } = store({ allowed: false, reason: 'hourly', retry_after: 120 });
  let invoked = false;
  await assert.rejects(withAiBudget(client, async () => { invoked = true; }), error => {
    assert.ok(error instanceof HttpError);
    assert.equal(error.status, 429);
    assert.equal(failure(error).headers.get('Retry-After'), '120');
    return true;
  });
  assert.equal(invoked, false);
  assert.deepEqual(calls, ['acquire_ai_budget']);
});
test('s’allibera la concurrència després d’una resposta correcta', async () => {
  const { client, calls } = store({ allowed: true, lease_id: lease });
  assert.equal(await withAiBudget(client, async () => 74), 74);
  assert.deepEqual(calls, ['acquire_ai_budget','release_ai_budget']);
});
test('un error del proveïdor també allibera el lease sense ocultar l’error', async () => {
  const { client, calls } = store({ allowed: true, lease_id: lease });
  await assert.rejects(withAiBudget(client, async () => { throw new Error('provider failed'); }), /provider failed/);
  assert.deepEqual(calls, ['acquire_ai_budget','release_ai_budget']);
});
test('si falta la migració o la resposta no és vàlida, no es consumeix la clau', async () => {
  for (const config of [store(null, { code: 'PGRST202' }), store({ unexpected: true })]) {
    let invoked = false;
    await assert.rejects(withAiBudget(config.client, async () => { invoked = true; }), error => error instanceof HttpError && error.status === 503);
    assert.equal(invoked, false);
  }
});
test('el límit global, diari i de concurrència també deneguen l’operació', async () => {
  for (const reason of ['global','daily','concurrent']) {
    const { client } = store({ allowed: false, reason, retry_after: 60 });
    await assert.rejects(withAiBudget(client, async () => 'not called'), error => error instanceof HttpError && error.status === 429);
  }
});
