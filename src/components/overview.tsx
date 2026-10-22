import { ArrowRight, BriefcaseBusiness, ChevronRight, Sparkles, Users, UserCheck } from 'lucide-react';
import type { Candidate, Job } from '@/lib/domain';
import { dashboardStats } from '@/lib/dashboard';

export default function Overview({ jobs, candidates, onOpenJob, onCreateJob }: { jobs: Job[]; candidates: Candidate[]; onOpenJob: (id: string) => void; onCreateJob: () => void }) {
  const stats = dashboardStats(jobs, candidates);
  const completion = stats.total ? Math.round(stats.analyzed / stats.total * 100) : 0;
  return <div className="overview">
    <section className="metrics" aria-label="Mètriques globals de totes les vacants">
      <Metric label="Vacants obertes" value={stats.openJobs} icon={<BriefcaseBusiness size={19}/>} foot={`${jobs.length} vacants en total`}/>
      <Metric label="Candidatures totals" value={stats.total} icon={<Users size={19}/>} foot="Entre totes les vacants"/>
      <Metric label="Anàlisis completades" value={stats.analyzed} icon={<Sparkles size={19}/>} foot={`${stats.pending} pendents · ${stats.errors} amb error`}/>
      <Metric label="En preselecció" value={stats.shortlist} icon={<UserCheck size={19}/>} foot="Decisions del reclutador"/>
    </section>
    <section className="candidate-panel overview-jobs"><div className="panel-heading"><div><h2>Les teves vacants <span>{jobs.length}</span></h2><p>Obre una vacant per veure el seu dashboard i les candidatures.</p></div></div>
      {jobs.length ? <div className="table-scroll"><table><thead><tr><th>Vacant</th><th>Candidatures</th><th>Analitzades</th><th>Preselecció</th><th>Encaix mitjà</th><th><span className="sr-only">Obrir vacant</span></th></tr></thead><tbody>{stats.jobs.map(row => <tr key={row.job.id}><td><button className="overview-job-name" onClick={() => onOpenJob(row.job.id)}><span className="vacancy-icon"><BriefcaseBusiness size={20}/></span><span><strong>{row.job.title}</strong><small>{[row.job.department, row.job.location].filter(Boolean).join(' · ') || 'Sense departament ni ubicació'}</small></span></button></td><td>{row.total}</td><td>{row.analyzed}<small className="overview-total">/{row.total}</small></td><td><span className="pill success">{row.shortlist}</span></td><td>{row.average === null ? <span className="muted-text">Sense anàlisis</span> : <b>{row.average}/100</b>}</td><td><button className="icon-button" onClick={() => onOpenJob(row.job.id)} aria-label={`Obrir dashboard de ${row.job.title}`}><ChevronRight size={18}/></button></td></tr>)}</tbody></table></div> : <div className="empty-table"><BriefcaseBusiness size={32}/><h3>Comença amb la primera vacant.</h3><p>Quan afegeixis candidatures, aquí veuràs les dades de tot el teu espai.</p><button className="primary" onClick={onCreateJob}>Crear una vacant<ArrowRight size={16}/></button></div>}
    </section>
    <div className="insights-row"><section className="distribution"><div><h3>Estat de les candidatures</h3><span>Totes les vacants</span></div>{[
      { label: 'Per revisar', count: stats.review, cls: 'medium' },
      { label: 'En preselecció', count: stats.shortlist, cls: 'high' },
      { label: 'Descartades', count: stats.rejected, cls: 'low' },
    ].map(stage => <div className="distribution-row" key={stage.label}><span>{stage.label}</span><div className="distribution-track"><span className={stage.cls} style={{ width: `${stats.total ? stage.count / stats.total * 100 : 0}%` }}/></div><b>{stage.count}</b></div>)}</section>
    <section className="distribution"><div><h3>Progrés de les anàlisis</h3><span>{completion}% completat</span></div><div className="analysis-progress"><strong>{stats.analyzed}<small>/{stats.total}</small></strong><p>Candidatures amb una anàlisi completada</p></div><div className="distribution-track progress-wide"><span className="medium" style={{ width: `${completion}%` }}/></div><p className="progress-note">{stats.pending} pendents o en curs · {stats.errors} amb error</p><p className="overview-context">L’encaix es consulta dins de cada vacant, amb la seva pròpia rúbrica.</p></section></div>
  </div>;
}

function Metric({ label, value, icon, foot }: { label: string; value: number; icon: React.ReactNode; foot: string }) {
  return <article className="metric"><div><span>{label}</span>{icon}</div><strong>{value}</strong><small>{foot}</small></article>;
}
