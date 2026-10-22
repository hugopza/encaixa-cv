import { configured } from '@/lib/supabase-server';
import LoginForm from '@/components/login-form';
import { Layers3, Check } from 'lucide-react';
import Link from 'next/link';
export default function Login() {
  return <main className="login-layout">
    <section className="login-story"><Link className="brand" href="/"> <Layers3 size={28} /> encaixa<span>●</span></Link>
      <div><div className="story-tag">Selecció amb criteri</div><h1>El talent es veu.<br />L’encaix s’explica.</h1><p>Passa de llegir currículums a entendre candidatures. Una mateixa rúbrica. Evidències concretes. Decisions teves.</p>
      </div>
      <p className="story-foot"><Check size={16} /> IA per donar context. Tu prens la decisió.</p>
    </section>
    <section className="login-side"><LoginForm configured={configured()} /><small>Les dades de cada compte es mantenen separades.</small></section>
  </main>;
}
