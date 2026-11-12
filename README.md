# Quel métier me correspond ?

**Find an occupation that feels like you.**

A free French website that helps teenagers around 15 explore occupations, from what actually matters to them. It is not a psychological test and it is not a verdict. After a short quiz, it ranks official occupation sheets and lets you browse, save and compare them.

Live demo: [https://quelmetiermecorrespond.fr](https://quelmetiermecorrespond.fr)

Source code: [https://github.com/Tristan-VILPONT/find-my-career](https://github.com/Tristan-VILPONT/find-my-career)

Created by **Tristan Vilpont**. Public contact: [contact@quelmetiermecorrespond.fr](mailto:contact@quelmetiermecorrespond.fr). Version française : [README.fr.md](README.fr.md).

No account is required. Answers, favourites and comparisons stay in the browser (`localStorage`). Nothing is sent to a server.

## What the site does

1. You pick a few broad families, then as many official Onisep interests as you like.
2. You answer 12 questions (study length, place of work, remote work, hours, health, usefulness to others, resilience, staying or moving, free time, career path, pay, and whether the job could help you build assets). Money-related questions come last, on purpose. You can always answer “it doesn’t matter”.
3. The site ranks **1,138** Onisep occupation sheets and shows why each one matches. Each sheet also displays the author’s personal grid and, when available, labour-market figures from France Travail.

The method, the grid and this repository are shared so that other countries can reuse the idea with their own official occupations, their own public sources, and their own language. See [docs/ADAPT.md](docs/ADAPT.md) (français : [docs/ADAPTER.fr.md](docs/ADAPTER.fr.md)).

## Run it locally

You need Node.js 22 or later. Python 3 is only required if you rebuild the catalogue.

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:43123](http://127.0.0.1:43123).

```bash
npm test                 # 30 tests: scoring, grid, catalogue, SEO
python3 scripts/test_parse.py
npm run lint
npm run build            # writes dist/
npm run preview          # serves dist/ on the same port
```

`package.json` is marked `"private": true` so the project is not published to npm by mistake. That does not mean the source is closed.

## Deploy (static site, no backend)

`npm run build` produces a static `dist/` folder.

- **Cloudflare Workers (Static Assets)**: `wrangler deploy` with `wrangler.jsonc` (SPA mode via `not_found_handling`). `public/_redirects` only contains 301 redirects for retired occupation URLs, generated at build time.
- **Netlify**: `netlify.toml` at the repo root (`npm run build`, publish `dist`).
- **Vercel**: `vercel.json` rewrites routes to `index.html`. Vite framework, output directory `dist`.

The site is installable (manifest, icons, service worker). The offline cache is registered on the production build, after a first visit. It is not registered in development.

## Data

| File | Role |
| --- | --- |
| `data/source/fiches-metiers.zip` | Onisep XML, October 2026 extract |
| `data/source/ideo-metiers.csv` | URLs, domains and sub-domains |
| `data/source/enrichi.json` | Six estimated criteria per occupation (value, confidence, short justification) |
| `data/source/france-travail/` | ROME 4.0 v462 (zipped JSON), BMO 2026 (xlsx), Dares FAP-2021 / ROME table |
| `data/source/grille.json` | Phase 2: ROME, BMO and grid criteria per occupation (`scripts/france_travail.py`) |
| `data/fixtures/published-ids.json` | Occupation URLs published in phase 1; if a sheet disappears, the build writes a 301 |
| `data/source/id-aliases.json` | Old MET identifier → new one, if Onisep renumbers a sheet |
| `public/data/catalog.json` | JSON served by the site (loaded after the first screen) |

The catalogue is **not** bundled into the homepage JavaScript: the quiz appears immediately, then the browser downloads `/data/catalog.json`.

To refresh the French occupation sheets (about ten Onisep extracts a year, no API key), follow the steps in [README.fr.md](README.fr.md#rafraîchir-les-fiches). For a version in another country, start from [docs/ADAPT.md](docs/ADAPT.md).

## How the score works

- “It doesn’t matter” (and “pay is not my main criterion”) is ignored.
- An unknown enriched criterion does not penalise an occupation.
- **High** confidence: weight 1. **Medium** or **low** confidence: weight 0.5, and the sheet shows “(estimate)”.
- Interests combine precision and recall (F1), plus a small bonus capped at 0.12 when several interests match.
- The starting salary is the first clear monthly gross amount in the Onisep “working life” text. A daily rate or an allowance is ignored. If there is no amount, the occupation is not pushed down the ranking.

The site does not republish the full official sheets, only a short hook and a link back to the source.

## Licences and credits

Several licences apply. Please respect all of them and credit the people and institutions involved.

| What | Licence | Who to credit |
| --- | --- | --- |
| Source code | [MIT](LICENSE) | Tristan Vilpont |
| Method, personal grid, and guides | [CC BY 4.0](LICENSE-DOCS) | Tristan Vilpont |
| Onisep occupation data and the derived catalogue | [ODbL 1.0](LICENSE-DATA) | Onisep, Idéo-Fiches métiers |
| ROME 4.0 and the BMO survey | [Licence Ouverte 2.0](LICENSE-DATA) | France Travail |
| FAP-2021 / ROME correspondence table | See [LICENSE-DATA](LICENSE-DATA) (licence not named on data.gouv.fr as of 12 November 2026) | Dares |

Onisep data is published under ODbL, **not** under the Licence Ouverte. If you reuse the derived catalogue, you must share your adapted database under ODbL as well, and keep attributing Onisep.

Suggested citation: see [CITATION.cff](CITATION.cff). In short: credit Tristan Vilpont as the author of the method and of the original site, and credit each official data source.

## Adapt it to your country

The French data is only one implementation. The method is meant to be copied freely: swap in your country’s official occupation list, your public employment classification, and your recruitment statistics, then translate the interface. A step-by-step guide and a ready-to-copy prompt for a coding assistant are in [docs/ADAPT.md](docs/ADAPT.md).

## Contributing

Issues and pull requests are welcome, including adaptations for other countries. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and keep the source attributions.

## Author

Created by **Tristan Vilpont**.

Public contact: [contact@quelmetiermecorrespond.fr](mailto:contact@quelmetiermecorrespond.fr)

Live site: [https://quelmetiermecorrespond.fr](https://quelmetiermecorrespond.fr)

Source code: [https://github.com/Tristan-VILPONT/find-my-career](https://github.com/Tristan-VILPONT/find-my-career)
