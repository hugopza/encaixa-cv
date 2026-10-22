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
- Mostrar/ocultar contrasenya, vacant amb un sol criteri al 100%, visió general agregada i dashboard per vacant.
- Eliminació de vacants amb confirmació, validació de propietari i cascada de candidatures.
- Bonus d'entrevista i comprovació GitHub integrats de forma diferida a la fitxa. Detalls i límits a `BONUS.md`.
- Cita d'exemple i requadre d'evidència retirats del login a petició de l'usuari.
- Contracte d'IA estricte derivat de Zod, compartit entre anàlisi i entrevistes. Errors de format, evidències, truncament i timeout diferenciats; sense logs de CVs ni de claus.
- Límit d'IA persistent preparat: 10 operacions/hora i 30/dia per usuari, 100/dia globals, una operació simultània per usuari. S'aplica a anàlisi, generació i valoració d'entrevistes; pendent de migrar i verificar contra la BD remota.

## Verificacions executades

- Diagnòstic del CV català indicat per l'usuari: extracció local correcta (una pàgina, 2.274 caràcters). Una crida real amb aquest PDF i els tres criteris 50/30/20 ha passat amb tres cites literals i IDs vàlids. El títol i la descripció utilitzats eren genèrics: no s'ha reproduït la petició exacta ni identificat encara la causa del cas fallit de producció.
- Millora posterior: IDs restringits als de la vacant dins del contracte del model; reintent amb la resposta rebutjada i el camp concret incorrecte; error final d'evidència amb índex de criteri, sense exposar cites ni CV. Lint, typecheck, 33 tests i build aprovats. Aquest canvi encara no s'ha verificat a la URL desplegada.

- `npm run typecheck`: aprovat després d'excloure `tmp/` i corregir l'alliberament del PDF amb `pdf.loadingTask.destroy()`.
- `npm run lint`: aprovat després de substituir dos enllaços interns per `next/link`.
- `npm test`: 31 proves aprovades de rúbrica, dashboard, entrevistes, fonts GitHub, contracte estricte i quota (denegació sense consumir la clau, alliberament de concurrència i Retry-After).
- `npm run build`: aprovat amb Webpack i dos workers, inclosa la comprovació TypeScript del build.
- Servidor local: va arrencar i `/login` va respondre HTTP 200.
- Localhost tancat a petició de l'usuari; port 3000 comprovat sense listeners. No tornar-lo a aixecar sense petició.
- Extracció local dels quatre CVs aportats: llegibles. Tres versions individuals acceptades; el PDF trilingüe supera 2 MB. No s'han copiat al repositori ni enviat a Anthropic.
- Migració aplicada per l'usuari. Comprovació REST posterior de `jobs` i `candidates`: totes dues existeixen i retornen `42501` (accés anònim denegat), en lloc de PGRST205. Això comprova existència i restricció anònima, no l'aïllament entre dos usuaris autenticats.
- Nova clau Anthropic acceptada: 401 resolt. Crida real d'anàlisi amb Haiku 4.5 i CV sintètic completada: 74/100, dos criteris i dues cites verificades. No s'ha enviat cap CV real.
- Error reproduït abans de la correcció: `strengths`, `gaps` i `questions` retornats com a strings, tot i que l'esquema exigeix arrays. No era un timeout. Corregit amb `strict: true` i esquema generat pel helper oficial d'Anthropic; el cas amb dos criteris passa després del canvi.
- Incidència de registre: `.env.local` contenia `/rest/v1/` al final de la URL de Supabase. S'ha corregit a la URL base; `/auth/v1/settings` respon HTTP 200, email activat i registre habilitat. La correcció de la variable a Vercel i el nou desplegament encara s'han de confirmar.

## Git i infraestructura

- Repositori verificat: https://github.com/hugopza/prova-tenica.git.
- Cinc commits inicials creats per l'usuari i sincronitzats amb `origin/master`.
- Correccions locals posteriors pendents de commit/push.
- L'agent no ha pogut escriure a `.git/index.lock` en els intents anteriors. L'autorització de l'usuari no canvia els permisos efectius del procés.
- Projecte Supabase vinculat: `prova_tecnica`, ref `fgfwwjdneeiiadoictpv`.
- Migració preparada: `supabase/migrations/20261022153000_create_recruiting_portal.sql`.
- Nova migració dels bonus preparada: `supabase/migrations/20261022180000_candidate_bonuses.sql`; pendent d'aplicar.
- Migració de límits preparada: `supabase/migrations/20261022190000_ai_rate_limits.sql`; pendent d'aplicar. Si la funció de quota no està disponible, l'API bloqueja la crida d'IA amb 503 en lloc de permetre consum sense límit.
- CLI localitzada al cache de npx. La telemetria es desactiva amb `SUPABASE_TELEMETRY_DISABLED=1`; el token de login de l'usuari no és accessible al procés de l'agent.
- L'usuari ha confirmat `npx supabase db push` completat; existència de les dues taules comprovada després.
- L'usuari ha aportat la URL desplegada `https://prova-tenica-q6ki-3ylnsuzi7-hugos-projects-85a383b8.vercel.app/`. L'accés des de l'entorn de l'agent està bloquejat per xarxa (EACCES); no s'ha verificat la configuració de producció.

## Bloquejos que requereixen intervenció de l'usuari

1. Configurar a Vercel la mateixa clau activa i tornar a desplegar si encara no s'ha fet. La clau local ja s'ha verificat; no enviar-la al xat ni a Git.
2. Permetre escriptura de l'agent a `.git` o crear els commits des de la terminal de l'usuari.
3. Aplicar les migracions noves dels bonus i dels límits des de la terminal autenticada.

## Pendent de verificar

- Flux autenticat complet amb persistència, anàlisi real i comparació.
- Aïllament RLS entre dos usuaris contra el projecte remot.
- Inspecció visual desktop/mòbil en navegador; només hi ha revisió de codi fins ara.
- Desplegament Vercel, comprovacions a la URL final i walkthrough.
- Entrevista real amb Anthropic, consulta GitHub en viu i persistència/revisió dels bonus. Només s'han verificat contractes i lògica amb proves unitàries; no hi ha resultats simulats a la UI.

## Incidència de memòria

Turbopack va registrar errors out-of-memory en aquest equip. S'ha passat `dev` i `build` a Webpack i reduït els workers a dos. La compilació de producció posterior ha acabat correctament. Evitar executar compiladors simultanis.
