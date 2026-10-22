import { redirect } from 'next/navigation';
import { configured, serverClient } from '@/lib/supabase-server';
import Workspace from '@/components/workspace';
import type { Candidate, Job } from '@/lib/domain';

export const dynamic = 'force-dynamic';
export default async function Home() {
  if (!configured()) redirect('/login');
  const sb = await serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const [jobs, candidates] = await Promise.all([
    sb.from('jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    sb.from('candidates').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);
  return <Workspace initialJobs={(jobs.data || []) as Job[]} initialCandidates={(candidates.data || []) as Candidate[]} email={user.email || ''} databaseError={Boolean(jobs.error || candidates.error)} />;
}
