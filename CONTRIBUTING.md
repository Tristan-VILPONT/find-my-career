# Contributing

Thank you for helping improve *Quel métier me correspond ?* or for adapting it to another country.

A French version of the method guide is in [docs/ADAPTER.fr.md](docs/ADAPTER.fr.md). The English guide is [docs/ADAPT.md](docs/ADAPT.md).

## Before you start

- Keep the project free and usable without an account.
- Credit **Tristan Vilpont** as the author of the original method and site.
- Credit every official data source and respect its licence ([LICENSE](LICENSE), [LICENSE-DATA](LICENSE-DATA), [LICENSE-DOCS](LICENSE-DOCS)).
- Do not add tracking, accounts, or a server that stores answers, unless that change is clearly optional and off by default.
- Do not commit secrets, API tokens, `.env` files, or personal addresses other than the public contact below.

## Development

```bash
npm install
npm test
npm run dev
```

If you change the scoring rules, the grid, the catalogue or the official sources, update the tests in `tests/` and the attributions in the About page and in `LICENSE-DATA`.

## Adaptations for another country

Please start from [docs/ADAPT.md](docs/ADAPT.md). A ready-to-copy prompt for a coding assistant is at the end of that guide.

A country-specific version can live in its own repository. In that case, link back to the original project and keep the credit to Tristan Vilpont.

## How to propose a change

1. Describe the problem or the idea clearly (in French or in English).
2. For a code change, explain what you tested (`npm test`, and a local preview if the interface changed).
3. If the change touches official data, name the source, the date of the extract, and the licence.

## Contact

The public contact address is [tristanvilpont@hotmail.fr](mailto:tristanvilpont@hotmail.fr). The public repository is [https://github.com/Tristan-VILPONT/find-my-career](https://github.com/Tristan-VILPONT/find-my-career).
