# Encaja

Portal de selecció amb IA: vacants, CVs PDF/TXT, avaluació amb evidències i comparació de candidats.

## Arrencada

```sh
npm install
```

Completa `.env.local` seguint `.env.example`. Configura Supabase Auth amb email/contrasenya i aplica les migracions en el projecte indicat:

```sh
npx supabase login
npx supabase link --project-ref fgfwwjdneeiiadoictpv
npx supabase db push
npm run dev
```

Obre http://127.0.0.1:3000. Crea un compte, confirma'l si Supabase ho requereix i inicia sessió. Defineix una vacant amb pesos que sumin 100, carrega un CV i compara fins a tres candidatures.

## Verificació

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Resultats reals i pendents: [docs/ESTAT.md](docs/ESTAT.md). Configuració i desplegament: [docs/CONFIGURACIO.md](docs/CONFIGURACIO.md).

## Límits

PDF amb text o TXT: màxim 2 MB, 15 pàgines i 45.000 caràcters. Sense OCR. Les puntuacions orienten la revisió humana; no s'automatitza el descart. El text del CV s'envia a Anthropic. Utilitza CVs sintètics per a demostracions.

## Atribució

Referència arquitectònica: [RecruiterAI](https://github.com/Stevekaplanai/recruiterai), MIT; llicència conservada a LICENSE. Esquema, producte i avaluació adaptats per a aquesta prova. La resta de referències i decisions són a [docs/DECISIONS.md](docs/DECISIONS.md).
