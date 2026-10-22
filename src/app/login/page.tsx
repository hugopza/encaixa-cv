import { configured } from '@/lib/supabase-server';
import LoginForm from '@/components/login-form';
import { Layers3, Check, Quote } from 'lucide-react';
import Link from 'next/link';
export default function Login() {
  return <main className="login-layout">
    <section className="login-story"><Link className="brand" href="/"> <Layers3 size={28} /> encaixa<span>●</span></Link>
      <div><div className="story-tag">Selecció amb criteri</div><h1>El talent es veu.<br />L’encaix s’explica.</h1><p>Passa de llegir currículums a entendre candidatures. Una mateixa rúbrica. Evidències concretes. Decisions teves.</p>
      <div className="evidence-preview"><Quote size={24} /><p>“Ha liderat la migració de tres aplicacions a React i TypeScript.”</p><div><span className="pill success">Evidència verificada</span><span>Competència tècnica · 4/5</span></div></div></div>
      <p className="story-foot"><Check size={16} /> IA per donar context. Tu prens la decisió.</p>
    </section>
    <section className="login-side"><LoginForm configured={configured()} /><small>Les dades de cada compte es mantenen separades.</small></section>
  </main>;
}
