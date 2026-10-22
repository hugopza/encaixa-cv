'use client';
import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronDown, CodeXml as Github, ExternalLink, FileCheck2, LoaderCircle, MessageSquare, RefreshCw, Save, ShieldCheck, Sparkles } from 'lucide-react';
import type { Candidate } from '@/lib/domain';
import { cvProfessionalLinks, type BackgroundCheck, type Interview } from '@/lib/bonus-domain';

async function request<T>(url: string, body?: unknown, method = 'POST'): Promise<T> {
  const response = await fetch(url, body === undefined ? undefined : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No s’ha pogut completar l’operació.');
  return data;
}
function useBonusRecord<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    request<T>(url).then(result => { if (active) setData(result); }).catch(error => { if (active) setError(error instanceof Error ? error.message : 'No s’han pogut carregar les dades.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [url]);
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await request<T>(url)); }
    catch (error) { setError(error instanceof Error ? error.message : 'No s’han pogut carregar les dades.'); }
    finally { setLoading(false); }
  }, [url]);
  return { data, setData, error, setError, loading, refresh };
}

export default function CandidateBonuses({ candidate }: { candidate: Candidate }) {
  const [interviewOpened, setInterviewOpened] = useState(false);
  const [backgroundOpened, setBackgroundOpened] = useState(false);
  return <div className="candidate-bonuses">
    <details className="bonus-section" onToggle={e => { if (e.currentTarget.open) setInterviewOpened(true); }}><summary><MessageSquare size={19}/><span><strong>Entrevista assistida amb IA</strong><small>Preguntes personalitzades, respostes i valoració justificada</small></span><ChevronDown size={17}/></summary>{interviewOpened && <InterviewPanel key={candidate.id} candidate={candidate}/>}</details>
    <details className="bonus-section" onToggle={e => { if (e.currentTarget.open) setBackgroundOpened(true); }}><summary><Github size={19}/><span><strong>Fonts professionals públiques</strong><small>Perfils confirmats per tu i evidències contrastables</small></span><ChevronDown size={17}/></summary>{backgroundOpened && <BackgroundPanel key={candidate.id} candidate={candidate}/>}</details>
  </div>;
}

function InterviewPanel({ candidate }: { candidate: Candidate }) {
  const url = `/api/candidates/${candidate.id}/interview`;
  const { data, setData, error, setError, loading, refresh } = useBonusRecord<{ session: Interview | null }>(url);
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const session = data?.session;
  const answers = draft || session?.answers || {};
  const evaluation = draft === null ? session?.evaluation : null;
  async function run(action: 'generate' | 'save' | 'evaluate') {
    setBusy(true); setError(''); setSaved(false);
    try {
      const result = await request<{ session: Interview }>(url, { action, answers, revision: session?.updated_at });
      setData(result); setDraft(null); setSaved(action === 'save');
    } catch (error) {
      await refresh();
      setError(error instanceof Error ? error.message : 'No s’ha pogut completar l’entrevista.');
    } finally { setBusy(false); }
  }
  return <div className="bonus-body" aria-busy={loading || busy}>
    <p className="bonus-intro">Preguntes tècniques i competencials basades en aquest CV i aquesta vacant. Les respostes es desen al teu compte; la valoració d’IA és orientativa.</p>
    {loading && <p className="bonus-loading" role="status"><LoaderCircle size={16} className="spin"/> Carregant entrevista…</p>}
    {error && <p className="notice danger" role="alert">{error}</p>}
    {data && !session?.plan && <><p className="bonus-empty">Encara no hi ha una entrevista generada.</p>{candidate.analysis?.questions?.length ? <div className="initial-questions"><strong>Suggeriments de l’anàlisi del CV</strong><ul>{candidate.analysis.questions.map((q, i) => <li key={i}>{q}</li>)}</ul></div> : null}<button className="primary" disabled={busy || loading} onClick={() => run('generate')}>{busy ? <LoaderCircle size={16} className="spin"/> : <Sparkles size={16}/>} Generar entrevista</button></>}
    {session?.plan && <>
      {session.plan.questions.map((q, index) => <section className="interview-question" key={q.id}><div className="question-heading"><span className="pill review">{q.kind === 'technical' ? 'Tècnica' : 'Competencial'}</span><span>{index + 1}/{session.plan!.questions.length}</span></div><h4>{q.question}</h4><p>{q.assesses}</p><details className="expected-signals"><summary>Què cal escoltar</summary><ul>{q.signals.map((signal, i) => <li key={i}>{signal}</li>)}</ul></details><label htmlFor={`answer-${candidate.id}-${q.id}`}>Resposta registrada<textarea id={`answer-${candidate.id}-${q.id}`} rows={4} maxLength={6000} disabled={busy} value={answers[q.id] || ''} placeholder="Registra la resposta del candidat. Mínim 20 caràcters per valorar." onChange={e => { setDraft({ ...answers, [q.id]: e.target.value }); setSaved(false); }}/></label></section>)}
      <div className="bonus-actions"><button className="secondary" disabled={busy || loading} onClick={() => run('save')}><Save size={16}/> Desar respostes</button><button className="primary" disabled={busy || loading || session.plan.questions.some(q => (answers[q.id]?.trim().length || 0) < 20)} onClick={() => run('evaluate')}>{busy ? <LoaderCircle size={16} className="spin"/> : <Sparkles size={16}/>} Valorar amb IA</button></div>
      {saved && <p className="save-confirmation" role="status"><Check size={14}/> Respostes desades.</p>}
      {draft !== null && <p className="form-hint unsaved-note">Hi ha canvis sense desar. Una valoració anterior s’oculta mentre edites.</p>}
      {evaluation && <section className="interview-evaluation"><h3><FileCheck2 size={18}/> Valoració de l’entrevista</h3><p>{evaluation.summary}</p>{evaluation.items.map(item => <div className="criterion-detail" key={item.questionId}><div><h4>{session.plan!.questions.find(q => q.id === item.questionId)?.question}</h4><b>{item.score}/5</b></div><p>{item.rationale}</p><blockquote>“{item.quote}”<small>Cita contrastada amb la resposta registrada</small></blockquote></div>)}{!!evaluation.followUps.length && <><h4>Per aprofundir</h4><ul className="questions">{evaluation.followUps.map((q, i) => <li key={i}>{q}</li>)}</ul></>}<p className="analysis-meta">{session.model} · Valoració assistida, sense decisió automàtica.</p></section>}
    </>}
    {!busy && <button className="text-button bonus-refresh" onClick={() => { setDraft(null); void refresh(); }}><RefreshCw size={14}/> Tornar a carregar l’entrevista desada</button>}
  </div>;
}

function BackgroundPanel({ candidate }: { candidate: Candidate }) {
  const url = `/api/candidates/${candidate.id}/background`;
  const { data, setData, error, setError, loading, refresh } = useBonusRecord<{ checks: BackgroundCheck[] }>(url);
  const [profileUrl, setProfileUrl] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const links = cvProfessionalLinks(candidate.resume_text);
  async function check(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await request<{ check: BackgroundCheck }>(url, { profileUrl: profileUrl.trim(), confirmed });
      setData({ checks: [result.check, ...(data?.checks || []).filter(c => c.id !== result.check.id)] });
    } catch (error) { setError(error instanceof Error ? error.message : 'No s’ha pogut consultar el perfil.'); }
    finally { setBusy(false); }
  }
  function select(url: string) { setProfileUrl(url); setConfirmed(false); }
  return <div className="bonus-body" aria-busy={loading || busy}>
    <p className="bonus-intro">Consulta repositoris públics d’un perfil GitHub que hagis confirmat. No es busquen persones pel nom, no es consulta codi privat i no s’utilitzen dades sensibles. Les coincidències no proven experiència laboral ni autoria individual.</p>
    {!!links.length && <div className="professional-links"><strong>Enllaços explícits detectats al CV</strong>{links.map(link => <div key={link}><a href={link} target="_blank" rel="noopener noreferrer">{link}<ExternalLink size={12}/></a>{link.startsWith('https://github.com/') ? <button type="button" className="text-button" onClick={() => select(link)}>Seleccionar</button> : <span className="pill muted">Verificació manual</span>}</div>)}</div>}
    {!links.length && <p className="bonus-empty">No s’han detectat enllaços GitHub o LinkedIn explícits al CV. Pots indicar un perfil GitHub després de verificar-lo amb el candidat.</p>}
    <form className="background-form" onSubmit={check}><label>Perfil GitHub públic<input type="url" required placeholder="https://github.com/usuari" value={profileUrl} disabled={busy} onChange={e => { setProfileUrl(e.target.value); setConfirmed(false); }}/></label><label className="confirmation-label"><input type="checkbox" required checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)}/><span>He comprovat amb el candidat que aquest perfil li correspon i confirmo que es pot vincular a aquesta candidatura.</span></label><button className="primary" disabled={!confirmed || busy || loading || !data}>{busy ? <LoaderCircle size={16} className="spin"/> : <Github size={16}/>} Consultar fonts públiques</button></form>
    {loading && <p className="bonus-loading" role="status"><LoaderCircle size={16} className="spin"/> Carregant comprovacions…</p>}
    {error && <p className="notice danger" role="alert">{error}</p>}
    {data && !data.checks.length && <p className="bonus-empty">Encara no hi ha comprovacions desades. No s’ha verificat cap informació externa.</p>}
    {data?.checks.map(check => <BackgroundResult key={`${check.id}:${check.checked_at}`} check={check} endpoint={url} onSaved={updated => setData({ checks: data.checks.map(c => c.id === updated.id ? updated : c) })}/>)}
    <p className="bonus-limits">La consulta automàtica cobreix fins a 20 repositoris públics recents, excloent derivats. LinkedIn i portfolios es revisen manualment; la cerca general requereix un proveïdor extern que encara no està configurat.</p><button className="text-button bonus-refresh" disabled={busy} onClick={() => void refresh()}><RefreshCw size={14}/> Actualitzar comprovacions</button>
  </div>;
}

function BackgroundResult({ check, endpoint, onSaved }: { check: BackgroundCheck; endpoint: string; onSaved: (check: BackgroundCheck) => void }) {
  const [note, setNote] = useState(check.review_note);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function review(status: 'reviewed' | 'followup') {
    setBusy(true); setError('');
    try { const result = await request<{ check: BackgroundCheck }>(endpoint, { id: check.id, checkedAt: check.checked_at, status, note }, 'PATCH'); onSaved(result.check); }
    catch (error) { setError(error instanceof Error ? error.message : 'No s’ha pogut desar la revisió.'); }
    finally { setBusy(false); }
  }
  return <section className="background-result"><div className="background-result-head"><a href={check.profile_url} target="_blank" rel="noopener noreferrer"><Github size={16}/>{check.profile_url}<ExternalLink size={12}/></a><span className={`pill ${check.review_status === 'reviewed' ? 'success' : 'review'}`}>{check.review_status === 'pending' ? 'Pendent de revisió humana' : check.review_status === 'reviewed' ? 'Revisat pel reclutador' : 'Cal aclarir-ho amb el candidat'}</span></div><p className="analysis-meta">Consultat el {new Date(check.checked_at).toLocaleString('ca')}</p>
    {!check.report.repositories.length && <p className="bonus-empty">No s’han trobat repositoris públics propis en aquesta mostra. No se’n pot deduir manca d’experiència.</p>}
    {check.report.findings.map(finding => <div className="background-finding" key={finding.id}><div><h4>{finding.label}</h4><span className={`pill ${finding.status === 'confirmed' ? 'success' : finding.status === 'discrepancy' ? 'possible-discrepancy' : 'muted'}`}>{finding.status === 'confirmed' ? 'Coincidència confirmada' : finding.status === 'discrepancy' ? 'Possible discrepància · revisar' : 'No verificat'}</span></div><p>{finding.detail}</p><div className="source-links">{finding.sources.map(source => <a href={source} target="_blank" rel="noopener noreferrer" key={source}>{source}<ExternalLink size={11}/></a>)}</div></div>)}
    <label className="review-note">Nota de revisió humana<textarea rows={3} maxLength={2000} disabled={busy} value={note} onChange={e => setNote(e.target.value)} placeholder="Documenta què has contrastat i com has revisat les possibles discrepàncies (mínim 10 caràcters)."/></label><div className="bonus-actions"><button className="secondary" disabled={busy || note.trim().length < 10} onClick={() => review('followup')}>Demanar aclariment</button><button className="secondary" disabled={busy || note.trim().length < 10} onClick={() => review('reviewed')}><ShieldCheck size={15}/> Desar revisió humana</button></div>{error && <p className="notice danger" role="alert">{error}</p>}
  </section>;
}
