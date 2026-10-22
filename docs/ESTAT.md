# Estat del projecte

Actualitzat: 22 d'octubre de 2026. Aquest fitxer diferencia implementació i verificació.

## Escrit, pendent de validar

- Configuració Next.js i autenticació Supabase amb sessió de servidor.
- Esquema SQL amb RLS i relació composta propietari/vacant.
- API de vacants, càrrega PDF/TXT, detecció de duplicats i decisions humanes.
- Anàlisi Anthropic amb tool call, Zod, cites i total ponderat.
- Interfície de login, dashboard, taula, detall, comparador i formularis.

## Bloquejos detectats

- `npm install` no ha completat: la xarxa del procés ha retornat EACCES al registre npm.
- La comanda `supabase` no està disponible al PATH.
- L'usuari ha emplenat `.env.local`; no s'han mostrat els valors. Connexió encara no verificada.

## Pendent

1. Acabar CSS i proves de domini.
2. Resoldre instal·lació; lint, tipus, tests i build.
3. Preparar i aplicar migració amb CLI o SQL Editor, sense duplicar-la.
4. Configurar Haiku i verificar una crida real.
5. Provar flux complet i aïllament entre dos usuaris amb CVs sintètics.
6. Revisió visual desktop/mòbil i errors.
7. Commits petits en català; publicar quan es conegui el destí.
8. URL desplegada i walkthrough final.

## Resultats verificats

Revisió estàtica dels cinc repositoris de referència. Encara no hi ha build, tests ni flux end-to-end aprovats. No hi ha URL de producció ni repositori remot confirmats.
