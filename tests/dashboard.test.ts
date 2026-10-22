import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidateStats, dashboardStats } from '../src/lib/dashboard';
import type { Candidate, Job } from '../src/lib/domain';

function job(id: string, status: Job['status'] = 'open'): Job {
  return { id, status, title: id, department: '', location: '', description: 'Vacant de prova', criteria: [{ id: 'skills', label: 'Competències', weight: 100 }], created_at: '2026-10-22T00:00:00Z' };
}
function candidate(id: string, jobId: string, overrides: Partial<Candidate> = {}): Candidate {
  return { id, job_id: jobId, name: id, email: null, resume_text: '', filename: null, status: 'pending', stage: 'review', score: null, analysis: null, error: null, model: null, analyzed_at: null, created_at: '2026-10-22T00:00:00Z', ...overrides };
}

test('la visió general agrega totes les vacants i cada fila manté les seves dades', () => {
  const stats = dashboardStats([job('a'), job('b', 'closed')], [
    candidate('1', 'a', { status: 'ready', score: 80, stage: 'shortlist' }),
    candidate('2', 'a'),
    candidate('3', 'b', { status: 'ready', score: 30, stage: 'rejected' }),
    candidate('4', 'b', { status: 'error' }),
  ]);
  assert.equal(stats.total, 4);
  assert.equal(stats.openJobs, 1);
  assert.equal(stats.analyzed, 2);
  assert.equal(stats.pending, 1);
  assert.equal(stats.errors, 1);
  assert.equal(stats.shortlist, 1);
  assert.equal(stats.jobs[0].total, 2);
  assert.equal(stats.jobs[0].average, 80);
  assert.equal(stats.jobs[1].average, 30);
});

test('després d’eliminar una vacant les mètriques no inclouen les seves candidatures', () => {
  const stats = dashboardStats([job('b')], [candidate('1', 'a'), candidate('2', 'b')]);
  assert.equal(stats.total, 1);
  assert.equal(stats.jobs.length, 1);
});

test('els estats pendents i d’error no entren a la mitjana i zero és una puntuació vàlida', () => {
  const stats = candidateStats([
    candidate('1', 'a', { status: 'ready', score: 0 }),
    candidate('2', 'a', { status: 'ready', score: 80 }),
    candidate('3', 'a', { status: 'error', score: 100 }),
    candidate('4', 'a', { status: 'pending' }),
  ]);
  assert.equal(stats.average, 40);
});

test('les mètriques buides no inventen puntuacions ni percentatges', () => {
  const stats = dashboardStats([], []);
  assert.equal(stats.total, 0);
  assert.equal(stats.average, null);
  assert.equal(stats.openJobs, 0);
  assert.deepEqual(stats.jobs, []);
});
