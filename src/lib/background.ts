import { z } from 'zod';
import { cvProfessionalLinks, githubProfile, type BackgroundReport, type Finding } from './bonus-domain';
import { HttpError } from './http';

const publicRepoSchema = z.object({ name: z.string(), html_url: z.url(), language: z.string().nullable(), fork: z.boolean(), private: z.boolean(), owner: z.object({ login: z.string() }) });
type PublicRepo = z.infer<typeof publicRepoSchema>;

export function buildGithubReport(profileUrl: string, cv: string, repos: PublicRepo[]): BackgroundReport {
  const profile = githubProfile(profileUrl);
  const own = repos.filter(r => !r.private && !r.fork && r.owner.login.toLowerCase() === profile.username.toLowerCase()).filter(r => {
    try { const url = new URL(r.html_url); return url.protocol === 'https:' && url.hostname === 'github.com' && url.pathname.toLowerCase().startsWith(`/${profile.username.toLowerCase()}/`); }
    catch { return false; }
  }).slice(0, 20);
  const findings: Finding[] = [];
  const cvProfiles = cvProfessionalLinks(cv).filter(url => url.startsWith('https://github.com/'));
  if (cvProfiles.length) {
    const matches = cvProfiles.some(url => url.toLowerCase() === profile.url.toLowerCase());
    findings.push({ id: 'profile-link', label: 'Enllaç GitHub del CV', status: matches ? 'confirmed' : 'discrepancy', detail: matches ? 'El perfil confirmat pel reclutador coincideix amb un enllaç explícit del CV. No és una verificació independent d’identitat.' : 'El perfil seleccionat no coincideix amb els enllaços GitHub detectats al CV. Pot haver-hi diversos comptes: requereix revisió humana.', sources: [profile.url, ...cvProfiles] });
  } else findings.push({ id: 'profile-link', label: 'Enllaç GitHub del CV', status: 'unverified', detail: 'No hi ha cap URL GitHub explícita al text del CV. La vinculació depèn de la confirmació del reclutador.', sources: [profile.url] });
  const languages = ['TypeScript','JavaScript','Python','Java','Go','Rust','Ruby','PHP','Swift','Kotlin','C++','C#','HTML','CSS','SQL','Dart'];
  for (const language of languages) {
    const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'i').test(cv)) continue;
    const evidence = own.filter(r => r.language?.toLowerCase() === language.toLowerCase());
    findings.push({ id: `language-${language}`, label: `El CV esmenta ${language}`, status: evidence.length ? 'confirmed' : 'unverified', detail: evidence.length ? `Hi ha repositoris públics no derivats amb ${language} com a llenguatge principal. Això corrobora presència de codi, no autoria individual, experiència laboral ni nivell de domini.` : `No s’ha trobat ${language} com a llenguatge principal en la mostra de fins a 20 repositoris públics recents. L’absència no és una discrepància ni una prova de manca d’experiència.`, sources: evidence.length ? evidence.map(r => r.html_url) : [profile.url] });
  }
  return { profileUrl: profile.url, checkedAt: new Date().toISOString(), repositories: own.map(r => ({ name: r.name, url: r.html_url, language: r.language })), findings };
}

async function githubGet(path: string) {
  let response: Response;
  try {
    response = await fetch(`https://api.github.com${path}`, { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Encaixa-professional-review' }, signal: AbortSignal.timeout(12_000), cache: 'no-store', redirect: 'error' });
  } catch { throw new HttpError(502, 'No s’ha pogut connectar amb GitHub. Reintenta-ho més tard.'); }
  if (response.status === 404) throw new HttpError(404, 'No s’ha trobat aquest perfil públic de GitHub.');
  if (response.status === 403 || response.status === 429) throw new HttpError(429, 'GitHub ha limitat les consultes públiques. Reintenta més tard.');
  if (!response.ok) throw new HttpError(502, 'GitHub no ha pogut completar la consulta.');
  return response.json();
}

export async function checkGithub(profileUrl: string, cv: string) {
  const profile = githubProfile(profileUrl);
  const user = z.object({ login: z.string(), type: z.string() }).parse(await githubGet(`/users/${encodeURIComponent(profile.username)}`));
  if (user.type !== 'User' || user.login.toLowerCase() !== profile.username.toLowerCase()) throw new HttpError(400, 'Cal un perfil personal públic. No es vinculen organitzacions ni s’infereixen identitats.');
  const repos = z.array(publicRepoSchema).parse(await githubGet(`/users/${encodeURIComponent(user.login)}/repos?type=owner&sort=updated&per_page=20`));
  return buildGithubReport(profile.url, cv, repos);
}
