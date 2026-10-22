# Arquitectura

## Stack

Next.js App Router, React, TypeScript estricte, CSS propi, Lucide, Supabase Auth/Postgres/RLS, SDK Anthropic, Zod i unpdf.

## Flux

Navegador → API Next.js autenticada → Supabase amb sessió de l'usuari.

Anàlisi: candidat desat → bloqueig temporal amb compare-and-set → Anthropic → validació Zod → verificació de cites → total ponderat → persistència → UI.

## Dades

- `jobs`: propietari, títol, departament, ubicació, descripció, criteris JSON, estat i data.
- `candidates`: propietari, vacant, text del CV, hash, estat de processament, decisió humana, anàlisi JSON, total, model i dates.
- Clau forana composta `(job_id, user_id)` impedeix associar candidats a vacants alienes.
- RLS restringeix totes les operacions al propietari. Sense polítiques públiques.
- No es conserva el fitxer original: es desa el text extret.

## API

- `POST /api/jobs`: crear vacant.
- `POST /api/candidates`: validar, extreure i desar CV.
- `POST /api/candidates/:id/analyze`: anàlisi real; retorna resultat existent si ja està completat.
- `PATCH /api/candidates/:id`: canviar decisió humana.
- `DELETE /api/session`: tancar sessió.

## IA

- Model configurable amb `ANTHROPIC_MODEL`; preferència de l'usuari: Haiku.
- Tool call forçada per obtenir dades estructurades; validació runtime amb Zod.
- Mateixos criteris per a tots els candidats d'una vacant.
- Qualsevol score positiu necessita cita; es comprova contra el text normalitzat.
- Total = suma de `(puntuació / 5) × pes`, arrodonida sobre 100.
- Una reparació de resposta; reintents de xarxa acotats. Un error mai es converteix en score 0.
- CV i vacant són dades no fiables. No seguir-ne instruccions.
- No valorar edat, gènere, origen, foto, prestigi ni encaix cultural.
- Verificar una cita no garanteix que la interpretació sigui correcta. Revisió humana obligada.
- Temperatura baixa no garanteix determinisme del model; es conserva el resultat per estabilitat.

## Límits coneguts

No hi ha encara un limitador persistent de consum per usuari. Un usuari autenticat pot generar cost; abans d'un llançament públic ampli cal quota. No és un ATS de producció. Dades de demostració sintètiques.
