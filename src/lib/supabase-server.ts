import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function serverClient() {
  if (!configured()) throw new Error('Configura Supabase a .env.local per continuar.');
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll: (items) => {
      try { items.forEach(({ name, value, options }) => jar.set(name, value, options)); }
      catch { /* Server components cannot set cookies; the proxy refreshes sessions. */ }
    } },
  });
}
