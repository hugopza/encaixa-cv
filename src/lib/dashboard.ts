import type { Candidate, Job } from './domain';

export function candidateStats(candidates: Candidate[]) {
  const scored = candidates.filter(c => c.status === 'ready' && c.score !== null);
  return {
    total: candidates.length,
    analyzed: candidates.filter(c => c.status === 'ready').length,
    pending: candidates.filter(c => c.status === 'pending' || c.status === 'analyzing').length,
    errors: candidates.filter(c => c.status === 'error').length,
    review: candidates.filter(c => c.stage === 'review').length,
    shortlist: candidates.filter(c => c.stage === 'shortlist').length,
    rejected: candidates.filter(c => c.stage === 'rejected').length,
    average: scored.length ? Math.round(scored.reduce((n, c) => n + c.score!, 0) / scored.length) : null,
  };
}

export function dashboardStats(jobs: Job[], candidates: Candidate[]) {
  // Only aggregate records belonging to the supplied jobs; no selected-vacancy state.
  const ids = new Set(jobs.map(j => j.id));
  const pool = candidates.filter(c => ids.has(c.job_id));
  return {
    ...candidateStats(pool),
    openJobs: jobs.filter(j => j.status === 'open').length,
    jobs: jobs.map(job => ({ job, ...candidateStats(pool.filter(c => c.job_id === job.id)) })),
  };
}
