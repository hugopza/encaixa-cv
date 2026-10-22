# Bonus: entrevistes i fonts professionals

## Revisió de l'estat previ

Només existien dos suggeriments de preguntes dins de l'anàlisi del CV. No hi havia registre de respostes, valoració d'entrevista, fonts externes ni revisions humanes. Els suggeriments s'han integrat al nou panell i serveixen de punt de partida per a la generació.

## Entrevistes assistides

Fitxa del candidat → Entrevista assistida amb IA.

- Quatre preguntes personalitzades tècniques i competencials, amb criteris observables per escoltar la resposta.
- Context: CV, vacant, rúbrica i suggeriments ja generats. Sense inferències de personalitat ni preguntes sensibles.
- Respostes desades com a esborrany, amb control de revisió per evitar sobreescriure una altra sessió.
- Valoració 0–5 de cada resposta amb justificació i una cita literal contrastada contra aquella resposta.
- Desar canvis invalida la valoració anterior. Editar-la l'oculta fins a desar o tornar a valorar.
- Una valoració no és verificació independent dels fets declarats ni decideix la contractació.
- Errors visibles, reintent, càrrega i recuperació d'operacions interrompudes després de tres minuts.

Depèn de la mateixa clau Anthropic del flux principal. L'última comprovació real retorna HTTP 401; no s'ha validat una entrevista real contra el proveïdor. No es genera cap resultat de substitució.

## Comprovació professional automatitzada

Fitxa del candidat → Fonts professionals públiques.

- Detecta enllaços GitHub i LinkedIn explícits al text del CV, sense cercar ni inferir persones pel nom.
- Cal confirmar humanament el perfil abans de vincular-lo i consultar GitHub.
- Consulta l'API pública de GitHub sense token: perfil personal i fins a 20 repositoris públics recents. Exclou repositoris privats, derivats i d'altres propietaris.
- Només es conserven URLs, nom del repositori i llenguatge principal; no es fan servir email, foto, ubicació, seguidors, dades sensibles o altres senyals personals.
- Contrasta llenguatges esmentats al CV i coincidència de l'enllaç explícit. Mostra fonts, data i abast limitat de la mostra.
- Distingeix coincidència confirmada, no verificat i possible discrepància de l'enllaç. L'absència de codi mai prova manca d'experiència ni es considera una discrepància.
- No prova autoria individual, relació laboral, anys d'experiència ni nivell tècnic.
- Requereix nota de revisió humana per registrar revisat o demanar aclariment. No modifica puntuacions ni decisions de selecció.
- Mostra errors de xarxa, límits de GitHub, perfils inexistents i casos sense repositoris; reutilitza consultes recents durant cinc minuts.
- Les peticions només es construeixen contra `api.github.com`; no s'accedeix a URLs arbitràries del CV.

LinkedIn/portfolio i cerca general: automatització pendent d'un proveïdor i credencials adients. LinkedIn es mostra com a enllaç de revisió manual. No hi ha scraping, cerca fictícia ni identitats deduïdes. No hi ha encara prova real end-to-end del bonus GitHub.

Fonts de l'API: https://docs.github.com/en/rest/users/users i https://docs.github.com/en/rest/repos/repos. La quota pública sense autenticar és limitada: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api.

## Persistència i desplegament

Nova migració: `supabase/migrations/20261022180000_candidate_bonuses.sql`.

Taules `candidate_interviews` i `candidate_background_checks`: RLS pel propietari, comprovació de propietat del candidat, cap accés anònim i esborrat en cascada. La migració no altera l'esquema del flux principal. Els panells només consulten les taules quan s'obren: si falta la migració, mostren un error accionable sense bloquejar el dashboard.

API autenticada:

- `GET/POST /api/candidates/:id/interview` (generar, desar, valorar).
- `GET/POST/PATCH /api/candidates/:id/background` (consultar, vincular i registrar revisió).

Cal aplicar `npx supabase db push` i fer push del codi a GitHub per al desplegament. Cal una clau Anthropic acceptada i saldo/model disponibles per activar l'entrevista. No presentar les proves unitàries com una validació real dels serveis externs.
