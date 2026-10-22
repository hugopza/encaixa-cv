import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strictTool, validationFeedback } from '../src/lib/ai-contract';
import { analysisSchema } from '../src/lib/domain';

test('l’API rep arrays reals en mode estricte derivats del mateix esquema local', () => {
  const tool = strictTool(analysisSchema);
  assert.equal(tool.strict, true);
  const properties = tool.input_schema.properties as Record<string, { type: string }>;
  for (const field of ['strengths','gaps','questions','criteria']) assert.equal(properties[field].type, 'array');
  assert.equal(tool.input_schema.additionalProperties, false);
});
test('una resposta amb llistes com a text continua rebutjada i la reparació identifica els camps', () => {
  const result = analysisSchema.safeParse({ summary: 'Un resum prou llarg per validar-lo.', strengths: 'React i TypeScript', gaps: 'Cap', questions: 'Explica un projecte', criteria: [] });
  assert.equal(result.success, false);
  if (!result.success) {
    const feedback = validationFeedback(result.error);
    assert.match(feedback, /strengths: invalid_type/);
    assert.match(feedback, /gaps: invalid_type/);
    assert.match(feedback, /questions: invalid_type/);
    assert.doesNotMatch(feedback, /React i TypeScript/);
  }
});
