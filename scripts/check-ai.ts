import { loadEnvFile } from 'node:process';
import { screen } from '../src/lib/screen';
import type { Job } from '../src/lib/domain';

// A real provider call using synthetic data only. No database writes.
async function main() {
  loadEnvFile('.env.local');
  const job: Job = {
    id: '00000000-0000-4000-8000-000000000001', created_at: new Date().toISOString(), status: 'open',
    title: 'Frontend developer', department: 'Tecnologia', location: 'Barcelona',
    description: 'Busquem experiència pràctica en React i TypeScript, desenvolupament accessible i proves automatitzades amb Playwright.',
    criteria: [
      { id: 'skills', label: 'Experiència pràctica amb React i TypeScript', weight: 70 },
      { id: 'testing', label: 'Proves automatitzades amb Playwright', weight: 30 },
    ],
  };
  const resume = `CV SINTÈTIC PER A PROVES. Experiència: desenvolupament de productes web entre 2022 i 2026. He desenvolupat aplicacions amb React i TypeScript durant quatre anys. He implementat formularis accessibles amb navegació per teclat. He escrit proves end-to-end amb Playwright per a fluxos de registre i compra. He col·laborat amb disseny i backend per lliurar una plataforma interna de gestió de comandes. Formació: desenvolupament d'aplicacions web.`;
  const result = await screen(job, resume);
  console.log(JSON.stringify({ ok: true, model: result.model, score: result.score, criteria: result.analysis.criteria.length, verifiedQuotes: result.analysis.criteria.filter(c => c.quote).length }));
}
main().catch(error => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error && 'status' in error ? error.message : 'No s’ha pogut completar la comprovació d’IA.' }));
  process.exitCode = 1;
});
