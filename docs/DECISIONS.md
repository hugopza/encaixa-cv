# Decisions

## Base i atribució

S'ha revisat RecruiterAI (https://github.com/Stevekaplanai/recruiterai), llicència MIT. Es conserva LICENSE. L'arquitectura de sessió i propietat deriva d'aquesta referència; el producte, esquema i flux d'anàlisi s'estan reescrivint per al repte.

Altres referències investigades:

- HarshGcode/Resume_screening: flux documental i dashboard. SQLite amb disc persistent no encaixa amb el desplegament previst.
- abhay-yemekar/hirelens: patró de rúbrica, cites i validació. No s'ha integrat el monorepo.
- olafkfreund/SkillAi: comparació i infraestructura. No s'ha copiat codi GPL.
- 99Ahmadprojects/AI-Powered-Resume-Screening-and-Shortlisting-System-for-Recruitments: procés múltiple. No s'ha copiat codi; sense llicència identificada.

## Simplificacions

- Un únic Next.js i Supabase; sense backend separat, vectors ni workers.
- Login amb contrasenya per evitar dependre d'un correu a cada inici de sessió.
- Rúbrica fixa per vacant per mantenir comparabilitat.
- Anàlisi individual amb reintent, sense procés massiu durant el MVP.
- CV original no desat; només text i resultat.
- Cap preselecció automàtica, encara que la puntuació sigui alta.
- L'usuari prefereix Haiku per latència/cost; cal verificar l'accés i la qualitat amb fixtures.

## Disseny

Portal de treball per a reclutadors: blau tinta, cobalt, blanc fred, taules llegibles, detall amb cites i comparació per criteris. Text en català. Les mètriques mostren dades reals, sense tendències inventades.
