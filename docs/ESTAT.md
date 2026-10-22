# Estat del projecte

Actualitzat: 22 d'octubre de 2026. Es diferencia codi implementat de flux verificat.

## Implementat

- Marca i metadades en català: Encaixa. Referències i noms de paquet actualitzats; verificació de cerca i consistència JSON del lockfile, sense canvis funcionals.
- Login i registre amb Supabase; sessió comprovada a cada API.
- Vacants amb rúbrica fixa; candidats PDF/TXT o text enganxat.
- Esquema amb RLS i relació composta propietari/vacant.
- Duplicats per hash; persistència abans d'analitzar; estats i reintents.
- Anthropic: tool call, Zod, cites contrastades i total ponderat al servidor.
- Model per defecte: `claude-haiku-4-5-20251001`.
- Dashboard, classificació, cerca, filtre, detall i comparació de fins a tres candidats.
- Decisions de preselecció/descart exclusivament manuals.
- Estils responsive i diàlegs natius amb focus i tancament per Escape.

## Verificacions executades

- `npm run typecheck`: aprovat després d'excloure `tmp/` i corregir l'alliberament del PDF amb `pdf.loadingTask.destroy()`.
- `npm run lint`: aprovat després de substituir dos enllaços interns per `next/link`.
- `npm test`: 8 proves aprovades de puntuació ponderada, cites inventades/absents, normalització de text, IDs, escala i pesos.
- `npm run build`: aprovat amb Webpack i dos workers, inclosa la comprovació TypeScript del build.
- Servidor local: va arrencar i `/login` va respondre HTTP 200.
- Localhost tancat a petició de l'usuari; port 3000 comprovat sense listeners. No tornar-lo a aixecar sense petició.
- Extracció local dels quatre CVs aportats: llegibles. Tres versions individuals acceptades; el PDF trilingüe supera 2 MB. No s'han copiat al repositori ni enviat a Anthropic.
- Migració aplicada per l'usuari. Comprovació REST posterior de `jobs` i `candidates`: totes dues existeixen i retornen `42501` (accés anònim denegat), en lloc de PGRST205. Això comprova existència i restricció anònima, no l'aïllament entre dos usuaris autenticats.
- Crida mínima a Anthropic: HTTP 401 d'autenticació. No hi ha encara anàlisi real completada.
- Incidència de registre: `.env.local` contenia `/rest/v1/` al final de la URL de Supabase. S'ha corregit a la URL base; `/auth/v1/settings` respon HTTP 200, email activat i registre habilitat. La correcció de la variable a Vercel i el nou desplegament encara s'han de confirmar.

## Git i infraestructura

- Repositori verificat: https://github.com/hugopza/prova-tenica.git.
- Cinc commits inicials creats per l'usuari i sincronitzats amb `origin/master`.
- Correccions locals posteriors pendents de commit/push.
- L'agent no ha pogut escriure a `.git/index.lock` en els intents anteriors. L'autorització de l'usuari no canvia els permisos efectius del procés.
- Projecte Supabase vinculat: `prova_tecnica`, ref `fgfwwjdneeiiadoictpv`.
- Migració preparada: `supabase/migrations/20261022153000_create_recruiting_portal.sql`.
- CLI localitzada al cache de npx. La telemetria es desactiva amb `SUPABASE_TELEMETRY_DISABLED=1`; el token de login de l'usuari no és accessible al procés de l'agent.
- L'usuari ha confirmat `npx supabase db push` completat; existència de les dues taules comprovada després.
- L'usuari ha aportat la URL desplegada `https://prova-tenica-q6ki-3ylnsuzi7-hugos-projects-85a383b8.vercel.app/`. L'accés des de l'entorn de l'agent està bloquejat per xarxa (EACCES); no s'ha verificat la configuració de producció.

## Bloquejos que requereixen intervenció de l'usuari

1. Revisar/substituir `ANTHROPIC_API_KEY` a `.env.local`; l'API rebutja l'autenticació. No enviar la clau al xat.
2. Permetre escriptura de l'agent a `.git` o crear els commits des de la terminal de l'usuari.

## Pendent de verificar

- Flux autenticat complet amb persistència, anàlisi real i comparació.
- Aïllament RLS entre dos usuaris contra el projecte remot.
- Inspecció visual desktop/mòbil en navegador; només hi ha revisió de codi fins ara.
- Desplegament Vercel, comprovacions a la URL final i walkthrough.

## Incidència de memòria

Turbopack va registrar errors out-of-memory en aquest equip. S'ha passat `dev` i `build` a Webpack i reduït els workers a dos. La compilació de producció posterior ha acabat correctament. Evitar executar compiladors simultanis.
