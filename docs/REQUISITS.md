# Requisits i abast

## Prova

- Durada: 3 hores. Lliurament: URL desplegada, repositori GitHub i walkthrough de 10–15 minuts.
- Avaluació: producte 25%, IA 25%, UX/UI 25%, comunicació 15%, execució 10%.
- Autenticació obligatòria; crear vacants; analitzar CVs amb IA.
- Resum del candidat, puntuació d'encaix i justificació.
- Dashboard amb mètriques i comparació de candidats.

## MVP

- Email/contrasenya amb Supabase Auth, registre i tancament de sessió.
- Vacants amb descripció i 2–6 criteris editables en crear-les; pesos sumen 100%.
- PDF amb text o TXT: màxim 2 MB, 15 pàgines, 45.000 caràcters. Alternativa: enganxar text.
- Candidats persistits abans d'analitzar; detecció de duplicats per vacant.
- IA: resum, puntuacions 0–5 per criteri, justificació, cites, punts forts, mancances i preguntes.
- Total ponderat calculat al servidor. Sense decisió automàtica.
- Classificació, cerca, filtre d'estat, detall i comparació de fins a tres candidats.
- Mètriques calculades a partir de registres reals; errors i reintent visibles.

## Acceptació

1. Un visitant sense sessió no accedeix a dades ni pot consumir IA.
2. Un compte crea una vacant i carrega un CV que persisteix després de recarregar.
3. L'anàlisi real retorna cites presents al CV i un total reproduïble a partir de puntuacions/pesos.
4. Dos candidats es poden comparar sota la mateixa rúbrica.
5. Un segon usuari no pot llegir ni modificar les dades del primer.
6. Un PDF sense text dona un error accionable, sense inventar resultats.
7. La mateixa seqüència funciona a la URL desplegada.

## Fora d'abast

OCR, DOC/DOCX, ZIP, correus automàtics, calendari, embeddings, agents múltiples, equip multiusuari, edició de rúbrica després d'analitzar i automatització de decisions.
