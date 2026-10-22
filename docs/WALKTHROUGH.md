# Walkthrough de 10–15 minuts

## Preparació

- URL real oberta i compte confirmat.
- Tres CVs sintètics: encaix alt, parcial i perfil d'una altra especialitat.
- Fitxers preparats a `docs/demo/`: vacant i tres CVs TXT. Les anàlisis s'han de generar amb l'API real; no contenen puntuacions prefixades.
- Una vacant amb criteris clars i anàlisis desades; fer també una crida en viu.
- Una còpia local dels CVs. No utilitzar dades personals reals.

## Guió

1. 0–1 min: problema i abast. Explicar decisions assistides amb evidències.
2. 1–3 min: login, crear vacant, descriure criteris i pesos.
3. 3–5 min: carregar un CV; mostrar estats i anàlisi real.
4. 5–8 min: resum, puntuacions, cita del CV, mancances i pregunta d'entrevista.
5. 8–10 min: comparar dos candidats i prendre una decisió manual.
6. 10–12 min: mètriques, persistència i arquitectura.
7. 12–15 min: proves executades, límits, atribució i següents passos.

## Explicacions importants

- Score 0 vol dir no acreditat segons el CV, no incapacitat de la persona.
- El servidor valida cites i estructura; la interpretació continua requerint revisió.
- No hi ha OCR ni automatització del descart.
- Mostrar només verificacions realment executades; no presentar fixtures com a respostes d'IA.
