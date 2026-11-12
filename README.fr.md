# Quel métier me correspond ?

**Trouve un métier qui te ressemble.**

Un site français gratuit pour aider des ados d'environ 15 ans (collège ou lycée) à explorer des métiers, à partir de ce qui compte pour eux. Ce n'est pas un test psychologique et ce n'est pas un verdict. Après un court quiz, le site classe les fiches officielles, et on peut les parcourir, les garder en favoris et les comparer.

Démo en ligne : [https://quelmetiermecorrespond.fr](https://quelmetiermecorrespond.fr)

Code source : [https://github.com/Tristan-VILPONT/find-my-career](https://github.com/Tristan-VILPONT/find-my-career)

Créé par **Tristan Vilpont**. Contact public : [contact@quelmetiermecorrespond.fr](mailto:contact@quelmetiermecorrespond.fr). English version: [README.md](README.md).

Pas de compte. Les réponses, les favoris et la comparaison restent dans le navigateur (`localStorage`). Rien n'est envoyé à un serveur.

## Ce que fait le site

1. Tu choisis quelques grandes familles, puis autant de centres d'intérêt officiels de l'Onisep que tu veux.
2. Tu réponds à 12 questions (durée des études, lieu de travail, télétravail, horaires, santé, utilité pour les autres, résistance aux crises, rester ou bouger, temps libre, parcours, salaire, et l'intérêt d'un métier pour investir ou se construire un patrimoine). Les questions sur l'argent sont volontairement à la fin. Tu peux toujours répondre « peu importe ».
3. Le site classe les **1 138** fiches métiers de l'Onisep et explique pourquoi chacune correspond. Chaque fiche montre aussi la grille personnelle de l'auteur et, quand c'est possible, des chiffres sur le marché du travail venant de France Travail.

La méthode, la grille et ce dépôt sont partagés pour que d'autres pays puissent reprendre l'idée avec leurs propres métiers, leurs sources publiques et leur langue. Voir [docs/ADAPTER.fr.md](docs/ADAPTER.fr.md) (English: [docs/ADAPT.md](docs/ADAPT.md)).

## Lancer en local

Il faut Node.js 22 ou plus. Python 3 n'est nécessaire que pour reconstruire le catalogue.

```bash
npm install
npm run dev
```

Ouvre ensuite [http://127.0.0.1:43123](http://127.0.0.1:43123).

```bash
npm test                 # 30 tests : barème, grille, catalogue, SEO
python3 scripts/test_parse.py
npm run lint
npm run build            # dossier dist/
npm run preview          # sert dist/ sur le même port
```

`package.json` est marqué `"private": true` pour éviter une publication accidentelle sur npm. Cela ne veut pas dire que le code est fermé.

## Déployer (gratuit, site statique)

Le build produit `dist/`. Aucun backend.

- **Cloudflare Workers (Static Assets)** : `wrangler deploy` avec `wrangler.jsonc` (mode SPA via `not_found_handling`). `public/_redirects` ne contient que les redirections 301 des anciennes fiches, générées au build.
- **Netlify** : `netlify.toml` est déjà à la racine (`npm run build`, publication `dist`).
- **Vercel** : `vercel.json` réécrit les routes vers `index.html`. Framework Vite, dossier de sortie `dist`.

Le site est installable (manifeste, icônes, service worker). Le cache hors-ligne s'active sur le build de production, après une première visite. En dev, le service worker n'est pas enregistré.

## Données

| Fichier | Rôle |
| --- | --- |
| `data/source/fiches-metiers.zip` | XML Onisep, extraction d'octobre 2026 |
| `data/source/ideo-metiers.csv` | URLs et domaines/sous-domaines |
| `data/source/enrichi.json` | 6 critères estimés par métier (valeur, confiance, justification) |
| `data/source/france-travail/` | ROME 4.0 v462 (JSON zippé), BMO 2026 (xlsx), table de passage FAP-2021 / ROME de la Dares |
| `data/source/grille.json` | Phase 2 : ROME, BMO et critères E/T/P, investisseur, temps libre, santé par métier (`scripts/france_travail.py`) |
| `data/fixtures/published-ids.json` | URL `/metier/{id}` publiées en phase 1 : si une fiche disparaît, le build écrit une redirection 301 |
| `data/source/id-aliases.json` | Ancien identifiant MET → nouveau, si l'Onisep renumérote une fiche |
| `public/data/catalog.json` | JSON servi par le site (chargé après le premier affichage) |

Le catalogue **n'est pas** dans le JavaScript de la page d'accueil : le quiz s'affiche tout de suite, puis le navigateur télécharge `/data/catalog.json`.

Licence des données : voir [LICENSE-DATA](LICENSE-DATA). L'attribution affichée dans le pied de page : [Données Onisep (Idéo-Fiches métiers) – licence ODbL](https://www.data.gouv.fr/datasets/ideo-fiches-metiers). Les données France Travail (ROME, BMO) sont en Licence Ouverte.

## Rafraîchir les fiches

L'Onisep publie une nouvelle extraction environ **10 fois par an** sur [data.gouv.fr/datasets/ideo-fiches-metiers](https://www.data.gouv.fr/datasets/ideo-fiches-metiers). Pas de clé d'API. L'API Onisep est en maintenance : on repart du zip et du CSV.

1. Télécharge le zip « Idéo - Fiches métiers » et le CSV des métiers (libellé, lien onisep.fr, domaines).
2. Remplace `data/source/fiches-metiers.zip` et `data/source/ideo-metiers.csv`.
3. Si les textes ont changé, recalcule les estimations :

   ```bash
   python3 scripts/build_data.py --export-textes
   python3 scripts/enrich.py
   ```

   `enrich.py` lit `data/work/fiches-textes.json` et réécrit `data/source/enrichi.json`. Il ne doit pas inventer un fait absent du texte (inconnu, sauf les défauts déjà décrits dans le script : utilité « en partie », contrainte géographique « faible »).

4. Recalcule la phase 2 (France Travail) puis reconstruis le JSON du site :

   ```bash
   python3 scripts/france_travail.py
   python3 scripts/build_data.py --no-fixture-check
   ```

Sans `--no-fixture-check`, le script vérifie la parité avec le prototype d'octobre 2026 **uniquement** si le zip est exactement l'extraction livrée (empreinte SHA-256 dans `scripts/onisep_parse.py`). Une extraction plus récente saute ce contrôle toute seule. Après un rafraîchissement, relis `DATASET.count` dans les tests si le nombre de métiers a changé.

Le workflow `.github/workflows/tests.yml` lance les tests et le build. Il ne télécharge pas data.gouv tout seul : une mise à jour des fiches reste un geste volontaire, le temps de relire les écarts.

## Ce que le score fait

- « Peu importe » (et « ce n'est pas mon critère n°1 » pour le salaire) ne compte pas.
- Un critère enrichi inconnu ne pénalise pas.
- Confiance **haute** : poids 1. Confiance **moyenne** ou **faible** : poids 0,5, et la fiche affiche « (estimation) ».
- Les centres d'intérêt mélangent précision et rappel (F1), plus un petit bonus plafonné à 0,12 quand plusieurs envies matchent.
- Le salaire de débutant est le premier montant mensuel brut clairement écrit dans `vie_professionnelle` (« à partir de », minimum d'une fourchette « entre A et B »). Un tarif à la journée ou une indemnité n'est pas retenu. S'il n'y a pas de montant, le métier n'est pas pénalisé.

## Réserves

- 793 fiches sur 1 138 ont un salaire mensuel de débutant parsable. Les autres n'affichent rien, et ne sont pas descendues dans le classement pour autant.
- Quelques fiches cinéma ne donnent qu'un minimum **hebdomadaire** : le chiffre Onisep est repris tel quel, comme dans le prototype, sans le convertir en mois.
- Les critères estimés peuvent se tromper. La page onisep.fr reste la référence. Le site ne republie pas le texte intégral des fiches, seulement l'accroche.
- « Être son propre patron » s'appuie sur les statuts indépendant / artisan / libéral. Ce n'est pas un parcours garanti vers la création d'entreprise.
- Les 7 familles sont un regroupement pour s'y retrouver, pas une classification Onisep.
- Les chiffres BMO concernent la **famille** de métiers (FAP-2021), pas le métier exact.
- Le stress affiché dans la grille est toujours une estimation.

## Licences et crédits

Plusieurs licences s'appliquent. Merci de toutes les respecter et de citer les personnes et les institutions concernées.

| Quoi | Licence | Qui citer |
| --- | --- | --- |
| Code source | [MIT](LICENSE) | Tristan Vilpont |
| Méthode, grille personnelle et guides | [CC BY 4.0](LICENSE-DOCS) | Tristan Vilpont |
| Données métiers Onisep et catalogue dérivé | [ODbL 1.0](LICENSE-DATA) | Onisep, Idéo-Fiches métiers |
| ROME 4.0 et enquête BMO | [Licence Ouverte 2.0](LICENSE-DATA) | France Travail |
| Table de passage FAP-2021 / ROME | Voir [LICENSE-DATA](LICENSE-DATA) (licence non nommée sur data.gouv.fr au 12 novembre 2026) | Dares |

Les données Onisep sont sous ODbL, **pas** sous Licence Ouverte. Si tu réutilises le catalogue dérivé, tu dois partager ta base adaptée sous ODbL aussi, et continuer à citer l'Onisep.

Citation suggérée : voir [CITATION.cff](CITATION.cff). En bref : citer Tristan Vilpont comme auteur de la méthode et du site d'origine, et citer chaque source officielle.

## Adapter à ton pays

Les données françaises ne sont qu'un exemple. La méthode est faite pour être copiée librement : on remplace la liste officielle des métiers, le référentiel public et les statistiques de recrutement par ceux de son pays, puis on traduit l'interface. Le guide pas à pas et un prompt prêt à copier pour une IA de code sont dans [docs/ADAPTER.fr.md](docs/ADAPTER.fr.md).

## Contribuer

Les issues et les pull requests sont les bienvenues, y compris pour adapter le projet à un autre pays. Merci de lire [CONTRIBUTING.md](CONTRIBUTING.md) et de garder les attributions des sources.

## Auteur

Créé par **Tristan Vilpont**.

Contact public : [contact@quelmetiermecorrespond.fr](mailto:contact@quelmetiermecorrespond.fr)

Site en ligne : [https://quelmetiermecorrespond.fr](https://quelmetiermecorrespond.fr)

Code source : [https://github.com/Tristan-VILPONT/find-my-career](https://github.com/Tristan-VILPONT/find-my-career)
