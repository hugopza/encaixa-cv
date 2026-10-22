# Guia per treballar en aquest repositori

Llegeix `docs/README.md` i `docs/ESTAT.md` abans de modificar res.

- Prioritat: flux real login → vacant → CV → anàlisi → comparació → URL desplegada.
- No simulis IA ni dades de producció. Distingir codi escrit de funcionalitat verificada.
- No mostrar, versionar ni copiar claus de `.env.local` a documentació o logs.
- Autenticar cada API al servidor i aplicar RLS per propietari. No utilitzar service-role al navegador.
- Validar amb Zod la resposta d'IA i les cites. Calcular la puntuació al servidor.
- No fer descart ni preselecció automàtics. No puntuar característiques personals.
- Commits petits, ordenats, amb missatges breus en català. No incloure `tmp/` ni dependències.
- Comprovar `npm run lint`, `npm run typecheck`, `npm test` i `npm run build` abans de donar el treball per validat.
- Documentar comprovacions executades i bloquejos a `docs/ESTAT.md`.
- No desplegar sobre un projecte existent sense verificar que és el destí correcte.

La persona usuària ha autoritzat implementar, aplicar l'esquema al projecte Supabase `prova_tecnica` (`fgfwwjdneeiiadoictpv`), crear commits petits i fer push a `https://github.com/hugopza/prova-tenica.git`. Vercel encara no té destí verificat. Mantenir localhost tancat fins que l'usuari demani tornar-lo a aixecar. Corregir autònomament errors resolubles; comunicar bloquejos de permisos o credencials.
