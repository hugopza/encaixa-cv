import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jobSchema, validateAnalysis, type Analysis, type Criterion } from '../src/lib/domain';

const rubric: Criterion[] = [
  { id: 'skills', label: 'React i TypeScript', weight: 70 },
  { id: 'experience', label: 'Experiència rellevant', weight: 30 },
];
const text = 'Ha desenvolupat aplicacions React i TypeScript. Té tres anys d’experiència en productes web.';
function analysis(): Analysis {
  return {
    summary: 'Experiència acreditada en desenvolupament web amb React i TypeScript.',
    strengths: ['Experiència en React.'], gaps: ['No s’acrediten proves automatitzades.'], questions: ['Quines proves has escrit?'],
    criteria: [
      { id: 'skills', score: 4, rationale: 'El CV acredita desenvolupament amb les tecnologies requerides.', quote: 'Ha desenvolupat aplicacions React i TypeScript.' },
      { id: 'experience', score: 3, rationale: 'El CV acredita tres anys d’experiència en productes web.', quote: 'Té tres anys d’experiència en productes web.' },
    ],
  };
}
test('calcula el total ponderat per ID encara que la resposta canviï l’ordre', () => {
  const input = analysis(); input.criteria.reverse();
  assert.equal(validateAnalysis(input, rubric, text).score, 74);
});
test('rebutja una cita inventada encara que el JSON sigui vàlid', () => {
  const input = analysis(); input.criteria[0].quote = 'Ha liderat un equip de 40 persones.';
  assert.throws(() => validateAnalysis(input, rubric, text), /no existeix/);
});
test('rebutja puntuacions positives sense evidència', () => {
  const input = analysis(); input.criteria[0].quote = '';
  assert.throws(() => validateAnalysis(input, rubric, text), /Falta evidència/);
});
test('admet informació no acreditada amb puntuació zero i sense cita', () => {
  const input = analysis(); input.criteria[0].score = 0; input.criteria[0].quote = '';
  assert.equal(validateAnalysis(input, rubric, text).score, 18);
});
test('contrasta cites tot normalitzant els salts de línia del PDF', () => {
  assert.equal(validateAnalysis(analysis(), rubric, text.replace('React i TypeScript', 'React\n  i TypeScript')).score, 74);
});
test('rebutja criteris duplicats i aliens a la rúbrica', () => {
  const input = analysis(); input.criteria[1].id = 'skills';
  assert.throws(() => validateAnalysis(input, rubric, text));
  input.criteria[1].id = 'unknown';
  assert.throws(() => validateAnalysis(input, rubric, text), /desconegut/);
});
test('rebutja puntuacions fora d’escala en lloc de convertir-les en zero', () => {
  const input = analysis(); input.criteria[0].score = 8;
  assert.throws(() => validateAnalysis(input, rubric, text));
});
test('la vacant exigeix pesos que sumin 100 i IDs únics', () => {
  const job = { title: 'Frontend developer', department: 'Tecnologia', location: 'Barcelona', description: 'Desenvolupament de productes web amb React i TypeScript.', criteria: rubric };
  assert.equal(jobSchema.safeParse(job).success, true);
  assert.equal(jobSchema.safeParse({ ...job, criteria: rubric.map(c => ({ ...c, weight: 10 })) }).success, false);
  assert.equal(jobSchema.safeParse({ ...job, criteria: rubric.map(c => ({ ...c, id: 'duplicate' })) }).success, false);
});

test('una vacant amb un únic criteri del 100% es pot crear i analitzar', () => {
  const single = [{ ...rubric[0], weight: 100 }];
  const job = { title: 'Frontend developer', department: '', location: '', description: 'Busquem experiència pràctica en React i TypeScript.', criteria: single };
  assert.equal(jobSchema.safeParse(job).success, true);
  const input = analysis(); input.criteria = [input.criteria[0]];
  assert.equal(validateAnalysis(input, single, text).score, 80);
});

test('no permet una vacant sense criteris ni un únic criteri amb pes incomplet', () => {
  const job = { title: 'Frontend developer', department: '', location: '', description: 'Busquem experiència pràctica en React i TypeScript.' };
  assert.equal(jobSchema.safeParse({ ...job, criteria: [] }).success, false);
  assert.equal(jobSchema.safeParse({ ...job, criteria: [{ ...rubric[0], weight: 50 }] }).success, false);
});
