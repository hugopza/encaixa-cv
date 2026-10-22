# Configuració

## Local

1. Node.js 22 o superior.
2. `npm install`
3. Completar `.env.local` seguint `.env.example`. No versionar-lo.
4. Aplicar l'esquema de Supabase abans de crear dades.
5. `npm run dev` i obrir http://127.0.0.1:3000.

Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`.

No cal cap clau service-role. La clau d'Anthropic només s'utilitza al servidor.

## Supabase

Opció SQL Editor: executar `supabase/migration.sql` una sola vegada en un projecte buit. No executar aquesta mateixa migració dues vegades ni aplicar-la després amb CLI si ja s'ha aplicat manualment sense reconciliar l'historial.

Opció CLI (migració preparada a `supabase/migrations/20261022153000_create_recruiting_portal.sql`):

```sh
supabase login
supabase link --project-ref PROJECT_REF
supabase db push
```

El projecte verificat és `prova_tecnica`, referència `fgfwwjdneeiiadoictpv`. Les claus de `.env.local` no autentiquen la CLI. El login pot requerir autorització al navegador i el link una contrasenya de BD. No posar aquestes credencials a Git.

En processos restringits es pot evitar l'escriptura de telemetria amb `SUPABASE_TELEMETRY_DISABLED=1`. Això no substitueix el token de login: el procés de l'agent pot no tenir accés a les credencials de la terminal de l'usuari.

El model per defecte és `claude-haiku-4-5-20251001`; `ANTHROPIC_MODEL` permet canviar-lo. El servidor local i el build utilitzen Webpack amb concurrència reduïda després d'un error de memòria de Turbopack en aquest equip.

Auth: activar Email/password. Configurar Site URL i redireccions `/callback` per a localhost i la URL desplegada. Si es manté confirmació de correu, verificar-la abans de la demo.

## Vercel

1. Verificar repositori GitHub i projecte Vercel de destí.
2. Importar com a Next.js; afegir les quatre variables d'entorn.
3. Desplegar i configurar les URLs a Supabase Auth.
4. Provar login, càrrega PDF i anàlisi a la URL real.
5. Comprovar que el pla suporta la durada configurada de 120 s per a anàlisi; ajustar reintents/durada si cal.

## Verificació

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Consultar `ESTAT.md` per veure què s'ha executat realment.
