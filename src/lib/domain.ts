import { z } from 'zod';

export const criterionSchema = z.object({ id: z.string().min(1).max(40), label: z.string().min(2).max(160), weight: z.number().int().min(1).max(100) });
export const jobSchema = z.object({ title: z.string().trim().min(3).max(120), department: z.string().trim().max(80), location: z.string().trim().max(100), description: z.string().trim().min(40).max(12000), criteria: z.array(criterionSchema).min(1).max(8) }).superRefine((job, ctx) => {
  if (job.criteria.reduce((n, c) => n + c.weight, 0) !== 100) ctx.addIssue({ code: 'custom', message: 'Els pesos han de sumar 100.', path: ['criteria'] });
  if (new Set(job.criteria.map(c => c.id)).size !== job.criteria.length) ctx.addIssue({ code: 'custom', message: 'Els criteris han de ser únics.', path: ['criteria'] });
});
export const analysisSchema = z.object({
  summary: z.string().min(20).max(1800),
  strengths: z.array(z.string().min(1).max(400)).max(5),
  gaps: z.array(z.string().min(1).max(400)).max(5),
  questions: z.array(z.string().min(1).max(400)).max(4),
  criteria: z.array(z.object({ id: z.string(), score: z.number().int().min(0).max(5), rationale: z.string().min(10).max(800), quote: z.string().max(600) })).min(1).max(8),
});
export type Analysis = z.infer<typeof analysisSchema>;
export type Criterion = z.infer<typeof criterionSchema>;
export type Job = z.infer<typeof jobSchema> & { id: string; created_at: string; status: 'open' | 'closed' };
export type Candidate = { id: string; job_id: string; name: string; email: string | null; resume_text: string; filename: string | null; status: 'pending' | 'analyzing' | 'ready' | 'error'; stage: 'review' | 'shortlist' | 'rejected'; score: number | null; analysis: Analysis | null; error: string | null; created_at: string; model: string | null; analyzed_at: string | null };

export function validateAnalysis(raw: unknown, rubric: Criterion[], text: string) {
  const parsed = analysisSchema.parse(raw);
  if (parsed.criteria.length !== rubric.length || new Set(parsed.criteria.map(c => c.id)).size !== rubric.length) throw new Error('La resposta no cobreix tots els criteris.');
  const normal = (s: string) => s.normalize('NFKC').replace(/\s+/g, ' ').trim();
  const source = normal(text);
  for (const c of parsed.criteria) {
    if (!rubric.some(r => r.id === c.id)) throw new Error('Criteri desconegut.');
    if (c.score > 0 && !c.quote.trim()) throw new Error('Falta evidència per a una puntuació.');
    if (c.quote && !source.includes(normal(c.quote))) throw new Error('Una evidència no existeix al CV.');
  }
  const score = Math.round(rubric.reduce((total, r) => total + parsed.criteria.find(c => c.id === r.id)!.score / 5 * r.weight, 0));
  return { analysis: parsed, score };
}
