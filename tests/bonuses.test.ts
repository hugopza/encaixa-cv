import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cvProfessionalLinks, githubProfile, interviewPlanSchema, validateAnswers, validateInterviewEvaluation, type InterviewPlan, type InterviewEvaluation } from '../src/lib/bonus-domain';
import { buildGithubReport } from '../src/lib/background';
import { z } from 'zod';

function plan(): InterviewPlan {
  return { questions: [1, 2, 3, 4].map(n => ({ id: `q${n}`, kind: n <= 2 ? 'technical' as const : 'competency' as const, question: `Explica amb un exemple professional el cas número ${n}.`, assesses: 'Evidència aplicada al treball', signals: ['Explica el context i el resultat.'] })) };
}
function answers() { return Object.fromEntries([1, 2, 3, 4].map(n => [`q${n}`, `En el projecte ${n} vaig implementar proves i documentar-ne els resultats.`])); }
function evaluation(): InterviewEvaluation {
  return { summary: 'Les respostes contenen exemples professionals que cal contrastar en entrevista.', items: [1, 2, 3, 4].map(n => ({ questionId: `q${n}`, score: 3, rationale: 'La resposta aporta un exemple de treball amb un resultat declarat.', quote: `En el projecte ${n} vaig implementar proves` })), followUps: ['Com vas comprovar els resultats?'] };
}

test('entrevista: contracte estructurat amb preguntes tècniques i competencials', () => {
  assert.equal(interviewPlanSchema.safeParse(plan()).success, true);
  assert.equal(z.toJSONSchema(interviewPlanSchema).type, 'object');
  const duplicate = plan(); duplicate.questions[1].id = 'q1';
  assert.equal(interviewPlanSchema.safeParse(duplicate).success, false);
  const onlyTechnical = plan(); onlyTechnical.questions.forEach(q => q.kind = 'technical');
  assert.equal(interviewPlanSchema.safeParse(onlyTechnical).success, false);
});
test('entrevista: es pot desar un esborrany però no valorar respostes incompletes', () => {
  assert.deepEqual(validateAnswers({ q1: 'Esborrany' }, plan()), { q1: 'Esborrany' });
  assert.throws(() => validateAnswers({ q1: 'Esborrany' }, plan(), true), /Respon totes/);
  assert.throws(() => validateAnswers({ stranger: 'Resposta aliena' }, plan()), /desconegudes/);
  assert.equal(Object.keys(validateAnswers(answers(), plan(), true)).length, 4);
});
test('entrevista: exigeix evidència dins de la resposta corresponent', () => {
  assert.equal(validateInterviewEvaluation(evaluation(), plan(), answers()).items.length, 4);
  const invented = evaluation(); invented.items[0].quote = 'He dirigit una organització de cent persones.';
  assert.throws(() => validateInterviewEvaluation(invented, plan(), answers()), /no existeix/);
  const swapped = evaluation(); swapped.items[0].quote = 'En el projecte 2 vaig implementar proves';
  assert.throws(() => validateInterviewEvaluation(swapped, plan(), answers()), /no existeix/);
});
test('entrevista: rebutja IDs duplicats, puntuacions fora d’escala i cites buides', () => {
  const duplicate = evaluation(); duplicate.items[1].questionId = 'q1';
  assert.throws(() => validateInterviewEvaluation(duplicate, plan(), answers()));
  const invalid = evaluation(); invalid.items[0].score = 9;
  assert.throws(() => validateInterviewEvaluation(invalid, plan(), answers()));
  const empty = evaluation(); empty.items[0].quote = '   ';
  assert.throws(() => validateInterviewEvaluation(empty, plan(), answers()));
});
test('GitHub: només accepta un perfil públic HTTPS, sense credencials ni rutes arbitràries', () => {
  assert.deepEqual(githubProfile('https://github.com/example-user/'), { username: 'example-user', url: 'https://github.com/example-user' });
  for (const url of ['http://github.com/example', 'https://github.com.evil.test/example', 'https://github.com@localhost/example', 'https://127.0.0.1/example', 'https://github.com/example/repo', 'https://github.com/example?tab=repositories', 'https://github.com:444/example', 'https://github.com/login', 'https://github.com/%2e%2e']) assert.throws(() => githubProfile(url), url);
});
test('no infereix perfils pel nom; només extreu enllaços explícits', () => {
  assert.deepEqual(cvProfessionalLinks('Nom de la persona, React i Python.'), []);
  assert.deepEqual(cvProfessionalLinks('Codi: https://github.com/example-user/repo. Perfil: https://www.linkedin.com/in/example-user'), ['https://github.com/example-user', 'https://www.linkedin.com/in/example-user']);
});
function repo(name: string, overrides = {}) {
  return { name, html_url: `https://github.com/example-user/${name}`, language: 'TypeScript', private: false, fork: false, owner: { login: 'example-user' }, ...overrides };
}
test('GitHub: una coincidència de llenguatge requereix una font pública pròpia no derivada', () => {
  const report = buildGithubReport('https://github.com/example-user', 'TypeScript i Python. https://github.com/example-user', [repo('real'), repo('fork', { fork: true }), repo('private', { private: true }), repo('other-owner', { owner: { login: 'another' } }), repo('bad-url', { html_url: 'https://evil.test/repo' })]);
  assert.equal(report.repositories.length, 1);
  assert.equal(report.findings.find(f => f.id === 'language-TypeScript')?.status, 'confirmed');
  assert.deepEqual(report.findings.find(f => f.id === 'language-TypeScript')?.sources, ['https://github.com/example-user/real']);
  assert.equal(report.findings.find(f => f.id === 'language-Python')?.status, 'unverified');
});
test('GitHub: l’absència de repositoris no es presenta com a discrepància ni com a falta d’experiència', () => {
  const report = buildGithubReport('https://github.com/example-user', 'Experiència amb Python.', []);
  assert.equal(report.repositories.length, 0);
  assert.equal(report.findings.every(f => f.status === 'unverified'), true);
});
test('GitHub: un enllaç diferent del CV exigeix revisió i conserva les fonts', () => {
  const report = buildGithubReport('https://github.com/example-user', 'Perfil https://github.com/other-account', []);
  const finding = report.findings.find(f => f.id === 'profile-link');
  assert.equal(finding?.status, 'discrepancy');
  assert.deepEqual(finding?.sources, ['https://github.com/example-user', 'https://github.com/other-account']);
});
test('GitHub: no confon Java amb JavaScript i conserva els llenguatges amb signes', () => {
  const report = buildGithubReport('https://github.com/example-user', 'JavaScript, C++ i C#.', []);
  assert.equal(report.findings.some(f => f.id === 'language-Java'), false);
  assert.equal(report.findings.some(f => f.id === 'language-C++'), true);
  assert.equal(report.findings.some(f => f.id === 'language-C#'), true);
});
