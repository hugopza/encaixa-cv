'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
export default function LoginForm({ configured }: { configured: boolean }) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = new FormData(e.currentTarget);
    try {
      const sb = browserClient();
      const credentials = { email: String(form.get('email')), password: String(form.get('password')) };
      const result = signup ? await sb.auth.signUp({ ...credentials, options: { emailRedirectTo: `${location.origin}/callback` } }) : await sb.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      if (result.data.session) { location.assign('/'); return; }
      setMessage('Compte creat. Comprova el correu per confirmar-lo i després inicia sessió.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No s’ha pogut iniciar sessió.'); }
    finally { setBusy(false); }
  }
  return <div className="login-form"><div className="login-heading"><h2>{signup ? 'Crea el teu espai' : 'El teu pròxim equip comença aquí.'}</h2><p>{signup ? 'Un compte per gestionar les teves vacants.' : 'Entra al teu espai de selecció.'}</p></div>
    {!configured && <div className="notice">Falta configurar Supabase. Completa NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY a .env.local i reinicia el servidor.</div>}
    <form onSubmit={submit}><label>Correu electrònic<input name="email" type="email" autoComplete="email" placeholder="tu@empresa.com" required /></label>
      <div className="password-field"><label htmlFor="password">Contrasenya</label><div className="password-input"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} placeholder="Com a mínim 8 caràcters" required /><button type="button" className="icon-button" aria-label={showPassword ? 'Ocultar contrasenya' : 'Mostrar contrasenya'} aria-pressed={showPassword} aria-controls="password" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
      {error && <p className="notice danger" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
      <button className="primary full" disabled={busy || !configured}>{busy ? <LoaderCircle className="spin" size={18} /> : <>{signup ? 'Crear compte' : 'Iniciar sessió'}<ArrowRight size={18}/></>}</button>
    </form><p className="login-switch">{signup ? 'Ja tens un compte?' : 'És la primera vegada?'} <button className="text-button" onClick={() => { setSignup(!signup); setError(''); setMessage(''); }}>{signup ? 'Inicia sessió' : 'Crea un compte'}</button></p>
  </div>;
}
