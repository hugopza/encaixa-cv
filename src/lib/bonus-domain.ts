import { z } from 'zod';

export const interviewQuestionSchema = z.object({
  id: z.string().regex(/^q[1-6]$/), kind: z.enum(['technical', 'competency']),
  question: z.string().min(15).max(700), assesses: z.string().min(5).max(300),
  signals: z.array(z.string().min(3).max(250)).min(1).max(4),
});
export const interviewPlanSchema = z.object({ questions: z.array(interviewQuestionSchema).min(4).max(6) }).superRefine(({ questions }, ctx) => {
  if (new Set(questions.map(q => q.id)).size !== questions.length || !questions.some(q => q.kind === 'technical') || !questions.some(q => q.kind === 'competency')) ctx.addIssue({ code: 'custom', message: 'Calen IDs únics i preguntes tècniques i competencials.' });
});
export const interviewEvaluationSchema = z.object({
  summary: z.string().min(20).max(1600),
  items: z.array(z.object({ questionId: z.string(), score: z.number().int().min(0).max(5), rationale: z.string().min(15).max(800), quote: z.string().min(1).max(600) })).min(4).max(6),
  followUps: z.array(z.string().min(5).max(400)).max(5),
});
export type InterviewPlan = z.infer<typeof interviewPlanSchema>;
export type InterviewEvaluation = z.infer<typeof interviewEvaluationSchema>;
export type Interview = {
  candidate_id: string; plan: InterviewPlan | null; answers: Record<string, string>;
  evaluation: InterviewEvaluation | null; status: 'generating' | 'draft' | 'evaluating' | 'ready' | 'error';
  error: string | null; model: string | null; updated_at: string;
};
export function validateAnswers(input: unknown, plan: InterviewPlan, complete = false) {
  const answers = z.record(z.string(), z.string().trim().max(6000)).parse(input);
  if (Object.keys(answers).some(id => !plan.questions.some(q => q.id === id))) throw new Error('Hi ha respostes de preguntes desconegudes.');
  if (complete && plan.questions.some(q => (answers[q.id]?.length || 0) < 20)) throw new Error('Respon totes les preguntes amb almenys 20 caràcters abans de valorar.');
  return answers;
}
export function validateInterviewEvaluation(input: unknown, plan: InterviewPlan, answers: Record<string, string>) {
  const result = interviewEvaluationSchema.parse(input);
  if (result.items.length !== plan.questions.length || new Set(result.items.map(i => i.questionId)).size !== plan.questions.length) throw new Error('La valoració no cobreix totes les preguntes.');
  const normalize = (s: string) => s.normalize('NFKC').replace(/\s+/g, ' ').trim();
  for (const item of result.items) {
    if (!plan.questions.some(q => q.id === item.questionId) || !normalize(item.quote) || !normalize(answers[item.questionId] || '').includes(normalize(item.quote))) throw new Error('Una evidència no existeix a la resposta corresponent.');
  }
  return result;
}

export type Finding = { id: string; label: string; status: 'confirmed' | 'unverified' | 'discrepancy'; detail: string; sources: string[] };
export type BackgroundReport = { profileUrl: string; checkedAt: string; repositories: { name: string; url: string; language: string | null }[]; findings: Finding[] };
export type BackgroundCheck = { id: string; profile_url: string; report: BackgroundReport; review_status: 'pending' | 'reviewed' | 'followup'; review_note: string; checked_at: string };

export function githubProfile(input: string) {
  const url = new URL(input);
  const match = url.pathname.match(/^\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\/?$/);
  const reserved = new Set(['login','signup','settings','search','topics','explore','orgs','organizations','marketplace','features','about','pricing','apps']);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password || url.search || url.hash || !match || reserved.has(match[1].toLowerCase())) throw new Error('Introdueix un perfil https://github.com/usuari, sense rutes addicionals.');
  return { username: match[1], url: `https://github.com/${match[1]}` };
}
export function cvProfessionalLinks(text: string) {
  const matches = text.match(/https:\/\/[^\s<>"']+/gi) || [];
  const links = new Set<string>();
  for (const raw of matches) {
    try {
      const url = new URL(raw.replace(/[),.;]+$/, ''));
      if (url.username || url.password) continue;
      if (url.hostname === 'github.com') {
        const username = url.pathname.split('/')[1];
        links.add(githubProfile(`https://github.com/${username}`).url);
      } else if (url.hostname === 'linkedin.com' || url.hostname === 'www.linkedin.com') {
        if (/^\/in\/[^/]+\/?$/.test(url.pathname)) links.add(`${url.origin}${url.pathname}`);
      }
    } catch { /* A malformed link is not a proposed identity. */ }
  }
  return [...links].slice(0, 10);
}
