'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="fatal"><h1>No hem pogut obrir l’espai.</h1><p>Comprova la connexió i la configuració de Supabase.</p><button className="primary" onClick={reset}>Tornar-ho a provar</button><a href="/login">Iniciar sessió</a></main>;
}
