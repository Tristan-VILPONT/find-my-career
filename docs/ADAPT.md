# Adapt this project to your country

This guide explains the method behind [Quel métier me correspond ?](https://quelmetiermecorrespond.fr) and how to rebuild a similar free site with **your** official occupations, **your** public data, and **your** language.

The original site is French and uses Onisep and France Travail. That is only one implementation. The method itself is meant to be copied.

Please credit **Tristan Vilpont** as the author of the method and of the original site (CC BY 4.0, see [LICENSE-DOCS](../LICENSE-DOCS)). Also respect the licences of every official dataset you use, and of the French data if you keep any of it (see [LICENSE-DATA](../LICENSE-DATA)).

A French version of this guide is in [ADAPTER.fr.md](ADAPTER.fr.md).

## 1. The idea, in one page

A 15-year-old is often asked “what do you want to do later?”. A more useful question is “what matters to you?”.

The site:

1. Asks what the person likes and what they care about (interests, then 12 questions).
2. Compares those answers to a large official list of occupations.
3. Shows a ranking, with short reasons, and a link to the official sheet. It is a starting point, not a career verdict.

There is no account and no tracking of answers on a server. Everything stays in the browser.

The questions come from a **personal grid** that Tristan Vilpont built for himself when choosing a path: what he was drawn to, being useful to others, working outdoors or in an office, length of studies, daily life, pay, the option to stay or to move, free time, health, and a possible path from employee to self-employed to business owner.

## 2. The grid: what is recorded for each occupation

Each occupation in the catalogue has two layers of criteria.

### Criteria taken from the official sheet (or estimated from its text)

These six are stored for every French occupation. When the official text does not state them clearly, the value is marked as an **estimate** and counts half as much in the score.

| Criterion | Typical values |
| --- | --- |
| Place of work | outdoors / office or indoors / mixed / workshop, site or kitchen |
| Remote work | possible / partial / not really possible |
| Hours | regular / nights, weekends or shifts / variable |
| Useful to others | yes / partly / no |
| Resilience to crises and automation | rather solid / medium / more exposed |
| Geographic constraint | possible almost everywhere / tied to a specific place (sea, mountains, big cities…) |

The sheet also keeps, when the official source provides them: the minimum education level, employment statuses (employee, civil servant, self-employed, craft, freelance…), official interest tags, sectors, and a starting salary.

### Criteria from the author’s grid (phase 2)

| Criterion | Typical values |
| --- | --- |
| Path employee → self-employed → owner | for each step: yes / possible / rare |
| Useful for investing or building assets | yes / a small advantage / not particularly (always an estimate) |
| Free time (evenings, weekends, on-call) | rather protected / some constraints / constrained |
| Health (physical effort, risks, stress) | rather protected / to watch / demanding |

Labour-market figures, when a public source exists, are shown separately on the sheet: expected recruitment, and how often employers say hiring is difficult. In the French site these figures describe a **family** of occupations, not always the exact one. That limit should stay visible.

A simple rule, wherever you are: if a fact is not clearly written in an official source, either leave it unknown (and do not penalise the occupation) or mark it as an estimate and give it a lower weight.

## 3. The quiz, in order

The quiz starts with tastes, not with money. That order is intentional: the site should not feel as if the main goal is to earn a lot and work little.

**Step 1 — What feels like you**

1. The person picks one or more of seven broad families (nature, tech, helping, creating, building, organising, talking to people). These families are only a way to browse. They are **not** an official classification.
2. Inside the chosen families, they tick official interest tags (in France: the 30 Onisep “centres d’intérêt”). At least one, no maximum.

**Step 2 — Twelve questions** (the person can always answer “it doesn’t matter”)

1. How far do you see yourself going in your studies?
2. Would you rather work outdoors or in an office?
3. Does remote work matter to you?
4. Do you prefer regular hours, or are nights and weekends fine?
5. Do you prefer a job that is easier on your body and your health?
6. Do you want a job that is useful to other people?
7. Are you aiming for a job that holds up in a crisis and against automation?
8. Would you rather stay in your area, or are you ready to move?
9. Is keeping time for yourself (evenings, weekends, holidays) important?
10. Later on, do you see yourself as an employee, self-employed, or running your own business?
11. Does pay matter a lot to you?
12. Would you like a job that also helps you invest or build assets?

Questions 9 to 12, about free time and money, come last.

## 4. How answers become a ranking

The code that does this is in `src/lib/scoring.ts` and `src/lib/grille.ts`. The idea is simple.

- Each answered question gives the occupation a score between 0 and 1.
- “It doesn’t matter” is skipped: that question is not used.
- If a criterion is unknown, the occupation is not punished.
- An official, clearly stated value has weight 1. An estimate has weight 0.5.
- Interests are scored with an F1 measure (a balance between “the occupation matches what I ticked” and “it is not tagged with lots of other things I did not tick”), plus a small bonus when several interests match, capped at 0.12.
- The final percentage is the weighted average of all the parts that were actually used, rounded to a whole number.
- Occupations are sorted by that percentage, then by name.

The result screen shows the best matches and a few short reasons (the criteria that scored at least 0.8). Each sheet links back to the official source. The site is a compass, not a decision.

You can change the weights, the thresholds or the questions. If you do, say so in your documentation, and keep the estimates labelled.

## 5. What data you need

You do not need a copy of the French files. You need the equivalent in your country, preferably official and reusable.

### A. An official list of occupations, with sheets

For each occupation, as many of these as you can find:

- a stable identifier and a name
- a short official description (or a hook you are allowed to quote)
- a link to the official sheet
- minimum education level
- typical statuses (employee, self-employed, civil service…)
- interests or personality/work tags, if the source has them
- sectors
- a starting wage, if it is clearly published

### B. A public occupation classification

A standard code list used by the public employment service (in France: ROME). It helps you describe working conditions (hours, physical effort, risks, self-employment) in a regular way, and to join other datasets.

### C. Recruitment or labour-market data

Public figures that say, for a family of occupations or for a single occupation: how many hirings are expected, and whether employers have a hard time recruiting. Always write down the year, the geography, and whether the figure is for a family or for one occupation.

Before you reuse a file, read its licence. Some official datasets can be copied freely if you credit the source (for example the French Licence Ouverte, or O*NET’s CC BY 4.0). Others, like Onisep’s ODbL data, also require you to share adaptations under the same terms. When a catalogue does not name a licence, check with the publisher.

## 6. Example official sources, by country and region

The links below were checked on **12 November 2026**. They are starting points, not a complete legal review. Always re-read the licence on the page before you download or republish anything. A useful catalogue run by a charity or a private organisation is mentioned only when it helps, and it is labelled as such.

If your country has no complete official occupation sheets, start from a national classification if one exists, then add:

- **ESCO** (European Union, many languages) for Europe;
- **ISCO-08** (International Labour Organization) as a shared international classification;
- **O*NET** (United States, CC BY 4.0) as a detailed fallback for occupation descriptions, to be adapted and translated, not copied as if it described your own labour market.

### International references

| Source | Type | Languages | Licence |
| --- | --- | --- | --- |
| [ISCO-08](https://isco.ilo.org/), International Labour Organization. Method page: [ILOSTAT](https://ilostat.ilo.org/methods/concepts-and-definitions/classification-occupation/) | Classification (and short group definitions) | English, and other ILO languages | Cite the ILO. The 2008 volume predates the ILO’s open-access policy (May 2023). Check [rights and permissions](https://www.ilo.org/rights-and-permissions) before republishing the full text. |
| [ESCO](https://esco.ec.europa.eu/en), European Commission | Occupations, skills and qualifications, downloadable | Official EU languages (and several others) | Free reuse, including commercially, under Commission Decision 2011/833/EU. You must publish the credit: “This service uses the ESCO classification of the European Commission.” Mark any modified version clearly. See the [ESCO FAQ](https://esco.ec.europa.eu/en/about-esco/faq). |
| [O*NET database](https://www.onetcenter.org/database.html) and [O*NET OnLine](https://www.onetonline.org/), U.S. Department of Labor / ETA | Occupation sheets, skills, downloadable database | English | [CC BY 4.0](https://www.onetcenter.org/license_db.html): credit O*NET and the U.S. Department of Labor / ETA. A good fallback when a country has no official sheets; say clearly that the descriptions come from the United States. |

### Europe

European Union countries can also use ESCO, in addition to the national sources below.

| Country | Source | Type | Language | Licence |
| --- | --- | --- | --- | --- |
| France | [Onisep, Idéo-Fiches métiers](https://www.data.gouv.fr/datasets/ideo-fiches-metiers) | Occupation sheets | French | ODbL 1.0 |
| France | [France Travail, ROME 4.0](https://www.data.gouv.fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome) and [BMO survey](https://www.data.gouv.fr/datasets/enquete-besoins-en-main-doeuvre-bmo) | Classification, working conditions, recruitment figures | French | Licence Ouverte 2.0 |
| Belgium | [Le Forem, Infos Métiers](https://www.leforem.be/infos-metiers.html) | Occupation sheets | French | Cite the source |
| Belgium | [Competent](https://extranet.vdab.be/competent) (VDAB, Le Forem, Actiris, ADG) and the [open API](https://developer.vdab.be/opendata/product/397) | Classification and competencies | Dutch, French | Open data, no special conditions stated for the competency data; credit the source |
| Belgium | [Shortage occupations](https://www.leforem.be/citoyens/choisir-metier/metiers-penurie.html) and [job offers in open data](https://www.leforem.be/open-data.html) (Le Forem) | Recruitment / labour market | French | Cite the source |
| Belgium | [SIEP, métiers.be](https://metiers.siep.be/metier/) | Occupation sheets (about 1,256) | French | Unofficial: SIEP is a guidance non-profit, not a government agency |
| Switzerland | [orientation.ch](https://www.orientation.ch/fr/accueil-recherche/professions) (CSFO / SDBB). German: [berufsberatung.ch](https://www.berufsberatung.ch/) | Occupation sheets | French, German, Italian | Cite the source |
| Switzerland | [Federal Statistical Office (OFS / BFS)](https://www.bfs.admin.ch/) | Labour-market statistics | German, French, Italian, English | Cite the source |
| United Kingdom | [National Careers Service job profiles](https://nationalcareers.service.gov.uk/explore-careers) and the [developer portal](https://portal.api.nationalcareers.service.gov.uk/) | Occupation sheets | English | Cite the source |
| United Kingdom | [Office for National Statistics](https://www.ons.gov.uk/) | Labour-market statistics | English | Cite the source. The former “LMI for All” API closed in October 2025: do not use it. |
| Germany | [BERUFENET](https://web.arbeitsagentur.de/berufenet/) (Federal Employment Agency). Presentation: [berufenet-info](https://www.arbeitsagentur.de/berufenet-info) | Occupation sheets | German | Cite the source; check the licence before republishing figures |
| Spain | [TodoFP professional profiles](https://www.todofp.es/orientacion-profesional/notengoclaroqueestudiar/perfiles-profesionales.html) (Ministry of Education and Vocational Training) | Professional / training profiles | Spanish | Cite the source |
| Spain | [SEPE Occupations Observatory](https://www.sepe.es/HomeSepe/que-es-el-sepe/comunicacion-institucional/publicaciones/publicaciones-oficiales/listado-pub-mercado-trabajo/observatorio-ocupaciones.html) | Labour-market reports | Spanish | Cite the source |
| Italy | [INAPP, Atlante del Lavoro](https://www.inapp.gov.it/atlantelavoro/) | Occupations, activities and links to official codes | Italian | Cite the source |
| Italy | [ISTAT, Classificazione delle professioni (CP)](https://www.istat.it/classificazione/classificazione-delle-professioni/) | Classification | Italian | Cite the source |
| Portugal | [Statistics Portugal, Classificação Portuguesa das Profissões](https://www.ine.pt/xportal/xmain?PUBLICACOESmodo=2&PUBLICACOESpub_boui=107961853&xpgid=ine_publicacoes&xpid=INE) | Classification | Portuguese | Cite the source |
| Portugal | [ANQEP, Catálogo Nacional de Qualificações](https://catalogo.anqep.gov.pt/) | Official qualifications linked to occupations | Portuguese | Cite the source |
| Netherlands | [SBB, trends and occupations](https://www.s-bb.nl/activiteiten/onderzoek-en-informatie/trends-en-beroepen) and [CompetentNL](https://www.s-bb.nl/activiteiten/competentnl) | Occupation and skills information (especially vocational) | Dutch | Cite the source |
| Netherlands | [UWV, occupations in demand](https://www.uwv.nl/nl/arbeidsmarktinformatie/kansen-beroep/regionale-kansrijke-beroepen) | Recruitment / labour market | Dutch | Cite the source |
| Sweden | [Arbetsförmedlingen, Yrkesatlas](https://yrkesatlas.arbetsformedlingen.se/) | Occupation sheets | Swedish | Cite the source |
| Sweden | [SSYK classification, open data](https://data.arbetsformedlingen.se/dataset/the-ssyk-hierarchy-with-occupations/) | Classification | Swedish, English | Open data; check the licence on the portal |
| Norway | [Utdanning.no](https://utdanning.no/) (official career and education portal) | Occupation sheets and education pathways | Norwegian | Cite the source |
| Denmark | [UddannelsesGuiden (ug.dk)](https://www.ug.dk/) | Occupation sheets and education pathways | Danish | Cite the source |
| Finland | [Työmarkkinatori, Ammattitieto](https://tyomarkkinatori.fi/henkiloasiakkaat/ammattitieto) (public employment portal) | Occupation sheets, skills, pay, labour demand | Finnish, Swedish | Cite the source |
| Poland | [Klasyfikacja zawodów i specjalności (KZiS)](https://psz.praca.gov.pl/rynek-pracy/bazy-danych/klasyfikacja-zawodow-i-specjalnosci) | Classification (aligned with ISCO-08) | Polish | Cite the source |
| Poland | [Infodoradca+](https://psz.praca.gov.pl/rynek-pracy/bazy-danych/infodoradca) (Public Employment Services) | Occupation sheets | Polish | Cite the source |
| Poland | [Barometr zawodów](https://www.barometrzawodow.pl/) | Recruitment / shortage and surplus occupations | Polish | Cite the source |

### North America

| Country | Source | Type | Language | Licence |
| --- | --- | --- | --- | --- |
| Canada (Quebec) | [Explore occupations](https://www.quebec.ca/emploi/informer-metier-profession/explorer-metiers-professions) and [labour-market information (IMT)](https://www.quebec.ca/emploi/informer-metier-profession/marche-travail), including the [outlook for 516 occupations](https://www.quebec.ca/emploi/informer-metier-profession/marche-travail/etat-equilibre) | Occupation sheets and labour-market outlook | French | Cite the source |
| Canada | [National Occupational Classification (NOC)](https://noc.esdc.gc.ca/) | Classification | English, French | Cite the source |
| Canada | [Job Bank](https://www.jobbank.gc.ca/career-planning): [career planning](https://www.jobbank.gc.ca/career-planning) and [labour-market trends](https://www.jobbank.gc.ca/trend-analysis) | Career information and labour-market figures | English, French | Cite the source |
| United States | [O*NET OnLine](https://www.onetonline.org/) and the [O*NET database](https://www.onetcenter.org/database.html) | Occupation sheets and downloadable database | English | [CC BY 4.0](https://www.onetcenter.org/license_db.html) |
| United States | [Occupational Outlook Handbook](https://www.bls.gov/ooh/) (Bureau of Labor Statistics) | Outlook and wages | English | Cite the source |

### Latin America

| Country | Source | Type | Language | Licence |
| --- | --- | --- | --- | --- |
| Brazil | [Classificação Brasileira de Ocupações (CBO)](https://cbo.mte.gov.br/cbosite/pages/home.jsf), Ministry of Labour and Employment. Presentation: [gov.br](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/cbo) | Classification and official occupation descriptions | Portuguese | Cite the source |
| Argentina | [Observatory of Occupations (OOA)](https://www.argentina.gob.ar/observatorio-de-ocupaciones-de-argentina-ooa): [occupation profiles](https://www.argentina.gob.ar/trabajo/estadisticas/caracteristicas-de-las-ocupaciones) | Occupation sheets and registered-employment figures | Spanish | Cite the source. The ministry notes that the site is still being built. |
| Argentina | [Clasificador Nacional de Ocupaciones (CNO 2017)](https://www.indec.gob.ar/ftp/cuadros/menusuperior/clasificadores/CNO_2017.pdf), INDEC | Classification | Spanish | Cite INDEC (reproduction allowed with mention of the source, as stated on related INDEC documents) |
| Mexico | [Observatorio Laboral (OLA)](https://observatoriolaboral.gob.mx/), STPS | Occupations, careers and labour-market figures | Spanish | Cite the source (see the site’s terms of use) |
| Mexico | Sistema Nacional de Clasificación de Ocupaciones (SINCO 2019), INEGI / STPS | Classification | Spanish | Cite the source |
| Chile | [ChileValora](https://chilevalora.gob.cl/) and the [public catalogue of occupational profiles](https://certificacion.chilevalora.gob.cl/ChileValora-publica/perfilesList.html) | Occupational competency profiles | Spanish | Cite the source |
| Chile | [SENCE, catalogue of occupational profiles](https://sence.gob.cl/empresas/franquicia/tramites_servicios/informacion-del-catalogo-de-perfiles-ocupacionales) | Occupational profiles | Spanish | Cite the source |
| Colombia | [SENA Labour and Occupational Observatory](https://observatorio.sena.edu.co/), including the [Clasificación Nacional de Ocupaciones (CNO)](https://observatorio.sena.edu.co/Clasificacion/Cno) | Classification, occupation information and labour-market data | Spanish | Cite the source |

### Asia

| Country | Source | Type | Language | Licence |
| --- | --- | --- | --- | --- |
| India | [National Career Service (NCS)](https://ncs.gov.in/), Ministry of Labour and Employment | Official career and employment portal | English, Hindi | Cite the source (the service is free) |
| India | [National Classification of Occupations (NCO 2015)](https://dge.gov.in/index.php/nco-2015), Directorate General of Employment | Classification | English | Cite the source |
| Japan | [job tag](https://shigoto.mhlw.go.jp/User/top), Ministry of Health, Labour and Welfare (MHLW) | Occupation sheets (tasks, skills, more than 500 occupations) | Japanese | Cite the source |
| South Korea | [CareerNet](https://www.career.go.kr/), Korea Research Institute for Vocational Education and Training | Occupation encyclopaedia for career guidance | Korean (some English) | Cite the source |
| South Korea | [KNOW (Korean Occupational Information System)](https://www.work.go.kr/consltJobCarpa/srch/jobInfoSrch/srchJobInfo.do) on WorkNet, Ministry of Employment and Labor / KEIS | Occupation sheets, job characteristics and outlook | Korean | Cite the source. Some WorkNet data are also published as public open data. |
| China | Official notice of the [National Occupational Classification (2022 edition)](https://chinajob.mohrss.gov.cn/c/2022-07-14/356103.shtml), Ministry of Human Resources and Social Security | Classification (8 major groups, 1,636 occupations) | Chinese | Cite the source. No stable public sheet browser was verified here; complement with ISCO-08 or O*NET and say so clearly. |
| Singapore | [MySkillsFuture, occupations](https://www.myskillsfuture.gov.sg/content/portal/en/occupation/occupation.html), SkillsFuture Singapore | Occupation information, wages and job-posting counts | English | Cite the source |
| Singapore | [Singapore Standard Occupational Classification (SSOC)](https://www.singstat.gov.sg/standards/standards-and-classifications/ssoc), Department of Statistics | Classification | English | Cite the source |
| Vietnam | [Vietnam Standard Classification of Occupations (VSCO 2020)](https://www.nso.gov.vn/phuong-phap-luan-thong-ke/danh-muc/nghe-nghiep/), National Statistics Office | Classification | Vietnamese | Cite the source. No public national sheet catalogue was verified; complement with ISCO-08 or O*NET. |

### Oceania

| Country | Source | Type | Language | Licence |
| --- | --- | --- | --- | --- |
| Australia | [Your Career](https://www.yourcareer.gov.au/), Australian Government | Occupation sheets (tasks, skills, pay, outlook) | English | Cite the source |
| Australia | [ANZSCO](https://www.abs.gov.au/statistics/classifications/australian-and-new-zealand-standard-classification-occupation-anzsco), Australian Bureau of Statistics | Classification (shared with New Zealand) | English | Cite the source |
| Australia | [Jobs and Skills Australia, employment projections](https://www.jobsandskills.gov.au/data/employment-projections/occupation) | Labour-market outlook | English | Cite the source |
| New Zealand | [Careers New Zealand](https://www.careers.govt.nz/) (Tertiary Education Commission) | Occupation sheets (pay, training, tasks), in English and te reo Māori | English, Māori | Cite the source |
| New Zealand | ANZSCO (same classification as Australia, link above) | Classification | English | Cite the source |

### Africa

| Country | Source | Type | Language | Licence |
| --- | --- | --- | --- | --- |
| Morocco | [Nomenclatures of the Haut-Commissariat au Plan](https://www.hcp.ma/downloads/Nomenclatures_t22462.html), including the analytical nomenclature of occupations | Classification | French, Arabic | Cite the source. No complete public national sheet catalogue was verified; complement with ISCO-08 or O*NET. |
| Tunisia | [Référentiel Tunisien des Métiers et des Compétences (RTMC)](https://www.emploi.gov.tn/fr/126/le-referentiel-tunisien-des-metiers-et-des-competences), Ministry of Employment / ANETI. Consultation: [rtmc.emploi.nat.tn](https://rtmc.emploi.nat.tn/) | Occupation and skills sheets | French, Arabic | Cite the source |
| South Africa | [National Career Advice Portal (NCAP)](https://ncap.careerhelp.org.za/occupations) and [Career Help / Khetha](https://www.careerhelp.org.za/), Department of Higher Education and Training | Occupation sheets and training pathways | English | Cite the source |
| Côte d'Ivoire | [AGEFOP, les métiers](https://www.agefop.ci/les-metiers) | Official list of training trades (limited coverage, not a full national catalogue) | French | Cite the source. Complement with ISCO-08 or O*NET for a broader list. |
| Senegal | No reliable public national occupation catalogue was found on a working official URL. | — | — | Use [ISCO-08](https://isco.ilo.org/) or [O*NET](https://www.onetonline.org/) as a starting point, and look again for a national source before you publish. |

If your country is not in these tables, look for: the national careers-guidance service, the public employment service, the statistical office, and any official open-data portal. Prefer those over commercial sites. If nothing solid turns up, use ESCO (in Europe), ISCO-08 or O*NET, and say clearly where the descriptions come from.

## 7. Where to change the code

The French site is a static web app (React + Vite). There is no server-side database. You adapt the data, the texts and sometimes the scoring, then you rebuild.

| What you want to change | Where |
| --- | --- |
| Site name, tagline, public URL, author credit | `src/lib/site.ts` (keep a credit to Tristan Vilpont, and add your name) |
| The 12 questions, their order, the families, the interest labels, education levels | `src/lib/vocab.ts` |
| How answers are turned into a score | `src/lib/scoring.ts` |
| Grid criteria, labour-market thresholds, labels on the sheet | `src/lib/grille.ts` |
| Shape of an occupation in the catalogue | `src/lib/types.ts` (`Metier`, `Grille`) |
| About page, legal wording, data sources | `src/pages/AboutPage.tsx` |
| Footer, explorer filters, occupation sheet layout | `src/components/`, `src/pages/MetierPage.tsx`, `src/pages/ExplorerPage.tsx` |
| Official catalogue build (France: Onisep XML/CSV) | `scripts/onisep_parse.py`, `scripts/build_data.py`, `scripts/enrich.py` |
| Labour-market join (France: ROME + BMO + Dares) | `scripts/france_travail.py` → writes `data/source/grille.json` |
| File served to the browser | `public/data/catalog.json` (generated, do not edit by hand) |
| Counts and source attributions generated at build time | `src/generated/dataset.ts` |
| Tests | `tests/` and `scripts/test_parse.py` |

Suggested steps:

1. Run the French project once (`npm install`, `npm run dev`, `npm test`) so you can see the target behaviour.
2. Put your official files in a new folder, for example `data/source/your-country/`. Do not overwrite the French sources until you no longer need them as an example.
3. Write a small script that reads your files and writes a `catalog.json` with the same fields as `Metier` in `src/lib/types.ts` (and a `g` object if you have labour-market or grid data). Look at `scripts/build_data.py` and `public/data/catalog.json` for the expected shape.
4. Replace or remap the interest tags and families in `src/lib/vocab.ts`. If your source has no interest tags, you can build a short official list, or temporarily skip that step of the quiz.
5. Translate the interface: questions in `src/lib/vocab.ts`, then the pages, buttons, About text and footer. Adapt education levels and salary units (the French score uses a monthly gross wage in euros).
6. Plug in your labour-market source by replacing the ideas in `scripts/france_travail.py`. Keep family-level figures labelled as family-level.
7. Update `src/lib/site.ts`, the About page, `LICENSE-DATA` (or your equivalent) and the footer with **your** sources and licences, plus the credit to Tristan Vilpont.
8. Adapt the tests in `tests/` to your counts, labels and scoring rules. Keep the spirit of the existing tests: scoring must stay predictable, and estimates must stay labelled.
9. Rebuild (`python3 scripts/build_data.py` or your script, then `npm test` and `npm run build`) and deploy the static `dist/` folder.

You do not need to keep the French occupations in a site about another country. If you do keep any Onisep-derived file, the ODbL share-alike rule still applies.

## 8. Ready-to-copy prompt for a coding assistant

Copy everything in the block below and fill in the bracketed bits. Then give it to a coding assistant together with this repository.

```
I want you to adapt the open-source project “Quel métier me correspond ?”
(a free career-exploration site for teenagers, created by Tristan Vilpont,
live at https://quelmetiermecorrespond.fr) to my country.

Goal
- Keep the method: interests first, then 12 questions, with money-related
  questions at the end; rank official occupations; no user account; answers
  stay in the browser.
- Replace the French occupations and the French labour-market data with
  official sources from my country.
- Translate the entire interface into [LANGUAGE].
- Credit Tristan Vilpont as the author of the original method and site
  (CC BY 4.0). Also credit every official data source and respect its licence.
- Do not publish anything until I have reviewed a local preview.

My country and sources
- Country: [COUNTRY]
- Language of the site: [LANGUAGE]
- Official occupation list / sheets: [NAME + URL]
- Public occupation classification: [NAME + URL]
- Recruitment or labour-market data: [NAME + URL]
- Licence of each source, if you already know it: [LICENCES]
- Site name and public URL I want: [NAME + URL]
- My name, for the credit line: [NAME]

Please do the following
1. Read docs/ADAPT.md, LICENSE, LICENSE-DATA, LICENSE-DOCS, src/lib/types.ts,
   src/lib/vocab.ts, src/lib/scoring.ts, src/lib/grille.ts and
   src/lib/site.ts.
2. Propose a mapping: which field of my official data fills which field of
   the Metier / Grille types. Flag anything that is missing or that would
   have to be estimated.
3. After I agree, write import scripts (do not invent figures). Mark
   estimates clearly and give them a lower weight, as the original project
   does.
4. Translate the 12 questions and the rest of the interface. Keep the same
   question order unless I say otherwise. Adapt education levels and salary
   units to this country.
5. Update the About page, the footer and the data-licence file with the new
   sources and a credit to Tristan Vilpont.
6. Adapt or rewrite the tests. All tests must pass.
7. Show me how to run the site locally, and do not deploy it yourself.

If a source cannot be downloaded legally, or its licence is unclear, stop
and tell me. Prefer official public sources over commercial ones.
```

If you publish a version for your country, please say so in your README, keep the credit, and, if you can, tell others where to find your code so the idea can travel again.
