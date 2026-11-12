# Adapter ce projet à ton pays

Ce guide explique la méthode de [Quel métier me correspond ?](https://quelmetiermecorrespond.fr) et comment reconstruire un site gratuit du même type avec **tes** métiers officiels, **tes** données publiques et **ta** langue.

Le site d'origine est français et s'appuie sur l'Onisep et France Travail. Ce n'est qu'un exemple. La méthode, elle, est faite pour être copiée.

Merci de citer **Tristan Vilpont** comme auteur de la méthode et du site d'origine (CC BY 4.0, voir [LICENSE-DOCS](../LICENSE-DOCS)). Respecte aussi les licences de chaque jeu de données officiel que tu utilises, et celles des données françaises si tu en gardes une partie (voir [LICENSE-DATA](../LICENSE-DATA)).

English version: [ADAPT.md](ADAPT.md).

## 1. L'idée, en une page

On demande souvent à un jeune de 15 ans « tu veux faire quoi plus tard ? ». Une question plus utile est « qu'est-ce qui compte pour toi ? ».

Le site :

1. Demande ce qui attire la personne et ce qui compte pour elle (des envies, puis 12 questions).
2. Compare ces réponses à une grande liste officielle de métiers.
3. Affiche un classement, avec de courtes raisons, et un lien vers la fiche officielle. C'est un point de départ, pas un verdict d'orientation.

Il n'y a pas de compte, et les réponses ne sont pas envoyées sur un serveur. Tout reste dans le navigateur.

Les questions viennent d'une **grille personnelle** que Tristan Vilpont s'était faite pour choisir son chemin : ce qui l'attirait, être utile aux autres, travailler dehors ou dans un bureau, la durée des études, le quotidien, le salaire, la possibilité de rester ou de bouger, le temps libre, la santé, et un éventuel parcours salarié → à son compte → propriétaire de son entreprise.

## 2. La grille : ce qui est enregistré pour chaque métier

Chaque métier du catalogue a deux couches de critères.

### Critères tirés de la fiche officielle (ou estimés d'après son texte)

Ces six critères sont remplis pour chaque métier français. Quand le texte officiel ne les dit pas clairement, la valeur est marquée **estimation** et compte deux fois moins dans le score.

| Critère | Valeurs typiques |
| --- | --- |
| Lieu de travail | dehors / bureau ou intérieur / mixte / atelier, chantier ou cuisine |
| Télétravail | possible / partiel / pas vraiment possible |
| Horaires | réguliers / nuit, week-end ou horaires décalés / variables |
| Utile aux autres | oui / en partie / non |
| Résistance aux crises et à l'automatisation | plutôt solide / moyenne / plus exposé |
| Contrainte géographique | possible un peu partout / lié à un lieu précis (mer, montagne, grandes villes…) |

La fiche garde aussi, quand la source officielle les fournit : le niveau d'études minimal, les statuts (salarié, fonctionnaire, indépendant, artisan, libéral…), les centres d'intérêt officiels, les secteurs, et un salaire de débutant.

### Critères de la grille de l'auteur (phase 2)

| Critère | Valeurs typiques |
| --- | --- |
| Parcours Employé → Indépendant → Propriétaire | pour chaque étape : oui / possible / rare |
| Utile pour investir ou se construire un patrimoine | oui / un petit avantage / pas particulièrement (toujours une estimation) |
| Temps libre (soirées, week-ends, astreintes) | plutôt préservé / quelques contraintes / contraint |
| Santé (effort physique, risques, stress) | plutôt préservée / à surveiller / exigeante |

Les chiffres sur le marché du travail, quand une source publique existe, sont montrés à part sur la fiche : recrutements prévus, et part des projets jugés difficiles par les employeurs. Sur le site français, ces chiffres décrivent une **famille** de métiers, pas toujours le métier exact. Cette limite doit rester visible.

Une règle simple, quel que soit le pays : si un fait n'est pas clairement écrit dans une source officielle, soit tu le laisses inconnu (et tu ne pénalises pas le métier), soit tu le marques comme une estimation et tu lui donnes un poids plus faible.

## 3. Le quiz, dans l'ordre

Le quiz commence par les goûts, pas par l'argent. Cet ordre est voulu : le site ne doit pas donner l'impression que le but principal est de gagner beaucoup et de travailler peu.

**Étape 1 — Ce qui te ressemble**

1. La personne choisit une ou plusieurs des sept grandes familles (nature, tech, aider, créer, construire, organiser, échanger). Ces familles servent juste à s'y retrouver. Ce n'est **pas** une classification officielle.
2. Dans les familles choisies, elle coche des centres d'intérêt officiels (en France : les 30 centres d'intérêt de l'Onisep). Au moins une envie, pas de maximum.

**Étape 2 — Douze questions** (on peut toujours répondre « peu importe »)

1. Jusqu'où tu te vois aller dans les études ?
2. Tu te vois plutôt travailler dehors ou au bureau ?
3. Le télétravail, c'est important pour toi ?
4. Tu préfères des horaires réguliers, ou ça ne te dérange pas de bosser la nuit ou le week-end ?
5. Tu préfères un métier qui ménage ton corps et ta santé ?
6. Tu as envie d'un métier utile aux autres ?
7. Tu vises un métier qui résiste aux crises et aux robots ?
8. Tu préfères rester dans ta région, ou tu es prêt à bouger ?
9. Garder du temps pour toi (soirées, week-ends, vacances), c'est important ?
10. Plus tard, tu te vois plutôt salarié, à ton compte, ou avec ta propre entreprise ?
11. Le salaire, ça compte beaucoup pour toi ?
12. Tu aimerais qu'un métier t'aide aussi à investir ou à te construire un patrimoine ?

Les questions 9 à 12, sur le temps libre et l'argent, viennent en dernier.

## 4. Comment les réponses deviennent un classement

Le code qui fait cela est dans `src/lib/scoring.ts` et `src/lib/grille.ts`. L'idée est simple.

- Chaque question réellement répondue donne au métier une note entre 0 et 1.
- « Peu importe » est ignoré : cette question n'est pas utilisée.
- Si un critère est inconnu, le métier n'est pas pénalisé.
- Une valeur officielle, clairement écrite, a un poids de 1. Une estimation a un poids de 0,5.
- Les centres d'intérêt sont notés avec une mesure F1 (un équilibre entre « le métier correspond à ce que j'ai coché » et « il n'est pas aussi tagué avec beaucoup d'autres choses que je n'ai pas cochées »), plus un petit bonus quand plusieurs envies correspondent, plafonné à 0,12.
- Le pourcentage final est la moyenne pondérée de toutes les parties réellement utilisées, arrondie à l'entier.
- Les métiers sont triés selon ce pourcentage, puis selon le nom.

L'écran de résultats montre les meilleures correspondances et quelques raisons courtes (les critères qui ont eu au moins 0,8). Chaque fiche renvoie vers la source officielle. Le site est une boussole, pas une décision.

Tu peux changer les poids, les seuils ou les questions. Si tu le fais, dis-le dans ta documentation, et garde les estimations signalées.

## 5. Quelles données il te faut

Tu n'as pas besoin d'une copie des fichiers français. Tu as besoin de l'équivalent dans ton pays, de préférence officiel et réutilisable.

### A. Une liste officielle de métiers, avec des fiches

Pour chaque métier, autant d'éléments que tu peux trouver :

- un identifiant stable et un nom
- une courte description officielle (ou une accroche que tu as le droit de citer)
- un lien vers la fiche officielle
- le niveau d'études minimal
- les statuts typiques (salarié, indépendant, fonction publique…)
- des centres d'intérêt ou des tags, si la source en a
- les secteurs
- un salaire de débutant, s'il est clairement publié

### B. Un référentiel public des métiers

Une liste de codes utilisée par le service public de l'emploi (en France : le ROME). Elle aide à décrire les conditions de travail (horaires, effort physique, risques, travail indépendant) de façon régulière, et à relier d'autres jeux de données.

### C. Des données de recrutement ou de marché du travail

Des chiffres publics qui disent, pour une famille de métiers ou pour un métier précis : combien de recrutements sont prévus, et si les employeurs ont du mal à embaucher. Note toujours l'année, le territoire, et si le chiffre concerne une famille ou un seul métier.

Avant de réutiliser un fichier, lis sa licence. Certaines données officielles se copient librement si tu cites la source (par exemple la Licence Ouverte française, ou le CC BY 4.0 d'O*NET). D'autres, comme les données Onisep en ODbL, demandent aussi de partager tes adaptations aux mêmes conditions. Quand un catalogue ne nomme pas de licence, vérifie auprès de l'éditeur.

## 6. Exemples de sources officielles, par pays et par région

Les liens ci-dessous ont été vérifiés le **12 novembre 2026**. Ce sont des points de départ, pas une revue juridique complète. Relis toujours la licence sur la page avant de télécharger ou de republier quoi que ce soit. Un catalogue utile tenu par une association ou un organisme privé n'est mentionné que s'il aide, et il est signalé comme tel.

Si ton pays n'a pas de fiches métiers officielles complètes, pars d'un référentiel national s'il existe, puis ajoute :

- **ESCO** (Union européenne, nombreuses langues) pour l'Europe ;
- **ISCO-08** (Organisation internationale du Travail) comme classification internationale commune ;
- **O*NET** (États-Unis, CC BY 4.0) comme solution de repli détaillée pour les descriptions de métiers, à adapter et à traduire, sans les présenter comme le marché du travail de ton pays.

### Références internationales

| Source | Type | Langues | Licence |
| --- | --- | --- | --- |
| [ISCO-08](https://isco.ilo.org/), Organisation internationale du Travail. Page de méthode : [ILOSTAT](https://ilostat.ilo.org/methods/concepts-and-definitions/classification-occupation/) | Référentiel (avec de courtes définitions de groupes) | Anglais, et d'autres langues de l'OIT | Citer l'OIT. Le volume de 2008 est antérieur à la politique d'accès ouvert de l'OIT (mai 2023). Vérifier les [droits et autorisations](https://www.ilo.org/rights-and-permissions) avant de republier le texte intégral. |
| [ESCO](https://esco.ec.europa.eu/en), Commission européenne | Métiers, compétences et certifications, téléchargeable | Langues officielles de l'UE (et quelques autres) | Réutilisation libre, y compris commerciale, selon la décision 2011/833/UE. Il faut publier la mention : « This service uses the ESCO classification of the European Commission. » Signaler clairement toute version modifiée. Voir la [FAQ ESCO](https://esco.ec.europa.eu/en/about-esco/faq). |
| [Base O*NET](https://www.onetcenter.org/database.html) et [O*NET OnLine](https://www.onetonline.org/), département du Travail des États-Unis / ETA | Fiches métiers, compétences, base téléchargeable | Anglais | [CC BY 4.0](https://www.onetcenter.org/license_db.html) : citer O*NET et le U.S. Department of Labor / ETA. Bonne solution de repli quand un pays n'a pas de fiches officielles ; dire clairement que les descriptions viennent des États-Unis. |

### Europe

Les pays de l'Union européenne peuvent aussi s'appuyer sur ESCO, en plus des sources nationales ci-dessous.

| Pays | Source | Type | Langue | Licence |
| --- | --- | --- | --- | --- |
| France | [Onisep, Idéo-Fiches métiers](https://www.data.gouv.fr/datasets/ideo-fiches-metiers) | Fiches métiers | Français | ODbL 1.0 |
| France | [France Travail, ROME 4.0](https://www.data.gouv.fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome) et [enquête BMO](https://www.data.gouv.fr/datasets/enquete-besoins-en-main-doeuvre-bmo) | Référentiel, conditions de travail, chiffres de recrutement | Français | Licence Ouverte 2.0 |
| Belgique | [Le Forem, Infos Métiers](https://www.leforem.be/infos-metiers.html) | Fiches métiers | Français | Citer la source |
| Belgique | [Competent](https://extranet.vdab.be/competent) (VDAB, Forem, Actiris, ADG) et l'[API ouverte](https://developer.vdab.be/opendata/product/397) | Référentiel et compétences | Néerlandais, français | Données ouvertes, sans condition particulière indiquée pour les données de compétences ; citer la source |
| Belgique | [Métiers en pénurie](https://www.leforem.be/citoyens/choisir-metier/metiers-penurie.html) et [offres d'emploi en open data](https://www.leforem.be/open-data.html) (Forem) | Recrutement / marché du travail | Français | Citer la source |
| Belgique | [SIEP, métiers.be](https://metiers.siep.be/metier/) | Fiches métiers (environ 1 256) | Français | Non officiel : le SIEP est une association d'orientation, pas un service de l'État |
| Suisse | [orientation.ch](https://www.orientation.ch/fr/accueil-recherche/professions) (CSFO / SDBB). En allemand : [berufsberatung.ch](https://www.berufsberatung.ch/) | Fiches métiers | Français, allemand, italien | Citer la source |
| Suisse | [Office fédéral de la statistique (OFS / BFS)](https://www.bfs.admin.ch/) | Statistiques du marché du travail | Allemand, français, italien, anglais | Citer la source |
| Royaume-Uni | [Fiches du National Careers Service](https://nationalcareers.service.gov.uk/explore-careers) et [portail développeurs](https://portal.api.nationalcareers.service.gov.uk/) | Fiches métiers | Anglais | Citer la source |
| Royaume-Uni | [Office for National Statistics](https://www.ons.gov.uk/) | Statistiques du marché du travail | Anglais | Citer la source. L'ancienne API « LMI for All » a fermé en octobre 2025 : ne plus l'utiliser. |
| Allemagne | [BERUFENET](https://web.arbeitsagentur.de/berufenet/) (Agence fédérale pour l'emploi). Présentation : [berufenet-info](https://www.arbeitsagentur.de/berufenet-info) | Fiches métiers | Allemand | Citer la source ; vérifier la licence avant de republier des chiffres |
| Espagne | [Profils professionnels TodoFP](https://www.todofp.es/orientacion-profesional/notengoclaroqueestudiar/perfiles-profesionales.html) (ministère de l'Éducation et de la Formation professionnelle) | Profils professionnels / de formation | Espagnol | Citer la source |
| Espagne | [Observatoire des occupations du SEPE](https://www.sepe.es/HomeSepe/que-es-el-sepe/comunicacion-institucional/publicaciones/publicaciones-oficiales/listado-pub-mercado-trabajo/observatorio-ocupaciones.html) | Rapports sur le marché du travail | Espagnol | Citer la source |
| Italie | [INAPP, Atlante del Lavoro](https://www.inapp.gov.it/atlantelavoro/) | Métiers, activités et liens vers les codes officiels | Italien | Citer la source |
| Italie | [ISTAT, Classificazione delle professioni (CP)](https://www.istat.it/classificazione/classificazione-delle-professioni/) | Référentiel | Italien | Citer la source |
| Portugal | [Statistics Portugal, Classificação Portuguesa das Profissões](https://www.ine.pt/xportal/xmain?PUBLICACOESmodo=2&PUBLICACOESpub_boui=107961853&xpgid=ine_publicacoes&xpid=INE) | Référentiel | Portugais | Citer la source |
| Portugal | [ANQEP, Catálogo Nacional de Qualificações](https://catalogo.anqep.gov.pt/) | Certifications officielles liées aux métiers | Portugais | Citer la source |
| Pays-Bas | [SBB, tendances et métiers](https://www.s-bb.nl/activiteiten/onderzoek-en-informatie/trends-en-beroepen) et [CompetentNL](https://www.s-bb.nl/activiteiten/competentnl) | Informations sur les métiers et les compétences (surtout en formation professionnelle) | Néerlandais | Citer la source |
| Pays-Bas | [UWV, métiers demandés](https://www.uwv.nl/nl/arbeidsmarktinformatie/kansen-beroep/regionale-kansrijke-beroepen) | Recrutement / marché du travail | Néerlandais | Citer la source |
| Suède | [Arbetsförmedlingen, Yrkesatlas](https://yrkesatlas.arbetsformedlingen.se/) | Fiches métiers | Suédois | Citer la source |
| Suède | [Classification SSYK, données ouvertes](https://data.arbetsformedlingen.se/dataset/the-ssyk-hierarchy-with-occupations/) | Référentiel | Suédois, anglais | Données ouvertes ; vérifier la licence sur le portail |
| Norvège | [Utdanning.no](https://utdanning.no/) (portail officiel d'orientation et de formation) | Fiches métiers et parcours de formation | Norvégien | Citer la source |
| Danemark | [UddannelsesGuiden (ug.dk)](https://www.ug.dk/) | Fiches métiers et parcours de formation | Danois | Citer la source |
| Finlande | [Työmarkkinatori, Ammattitieto](https://tyomarkkinatori.fi/henkiloasiakkaat/ammattitieto) (portail public de l'emploi) | Fiches métiers, compétences, salaires, demande | Finnois, suédois | Citer la source |
| Pologne | [Klasyfikacja zawodów i specjalności (KZiS)](https://psz.praca.gov.pl/rynek-pracy/bazy-danych/klasyfikacja-zawodow-i-specjalnosci) | Référentiel (aligné sur ISCO-08) | Polonais | Citer la source |
| Pologne | [Infodoradca+](https://psz.praca.gov.pl/rynek-pracy/bazy-danych/infodoradca) (services publics de l'emploi) | Fiches métiers | Polonais | Citer la source |
| Pologne | [Barometr zawodów](https://www.barometrzawodow.pl/) | Recrutement / métiers en pénurie ou en excès | Polonais | Citer la source |

### Amérique du Nord

| Pays | Source | Type | Langue | Licence |
| --- | --- | --- | --- | --- |
| Canada (Québec) | [Explorer des métiers](https://www.quebec.ca/emploi/informer-metier-profession/explorer-metiers-professions) et [information sur le marché du travail (IMT)](https://www.quebec.ca/emploi/informer-metier-profession/marche-travail), dont l'[état d'équilibre pour 516 professions](https://www.quebec.ca/emploi/informer-metier-profession/marche-travail/etat-equilibre) | Fiches métiers et perspectives | Français | Citer la source |
| Canada | [Classification nationale des professions (CNP / NOC)](https://noc.esdc.gc.ca/) | Référentiel | Anglais, français | Citer la source |
| Canada | [Guichet-Emplois](https://www.jobbank.gc.ca/career-planning) : [planification de carrière](https://www.jobbank.gc.ca/career-planning) et [tendances du marché](https://www.jobbank.gc.ca/trend-analysis) | Information d'orientation et chiffres du marché du travail | Anglais, français | Citer la source |
| États-Unis | [O*NET OnLine](https://www.onetonline.org/) et la [base O*NET](https://www.onetcenter.org/database.html) | Fiches métiers et base téléchargeable | Anglais | [CC BY 4.0](https://www.onetcenter.org/license_db.html) |
| États-Unis | [Occupational Outlook Handbook](https://www.bls.gov/ooh/) (Bureau of Labor Statistics) | Perspectives et salaires | Anglais | Citer la source |

### Amérique latine

| Pays | Source | Type | Langue | Licence |
| --- | --- | --- | --- | --- |
| Brésil | [Classificação Brasileira de Ocupações (CBO)](https://cbo.mte.gov.br/cbosite/pages/home.jsf), ministère du Travail et de l'Emploi. Présentation : [gov.br](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/cbo) | Référentiel et descriptions officielles de métiers | Portugais | Citer la source |
| Argentine | [Observatoire des occupations (OOA)](https://www.argentina.gob.ar/observatorio-de-ocupaciones-de-argentina-ooa) : [profils d'occupations](https://www.argentina.gob.ar/trabajo/estadisticas/caracteristicas-de-las-ocupaciones) | Fiches métiers et chiffres de l'emploi enregistré | Espagnol | Citer la source. Le ministère indique que le site est encore en construction. |
| Argentine | [Clasificador Nacional de Ocupaciones (CNO 2017)](https://www.indec.gob.ar/ftp/cuadros/menusuperior/clasificadores/CNO_2017.pdf), INDEC | Référentiel | Espagnol | Citer l'INDEC (reproduction autorisée avec mention de la source, d'après des documents INDEC liés) |
| Mexique | [Observatorio Laboral (OLA)](https://observatoriolaboral.gob.mx/), STPS | Métiers, formations et chiffres du marché du travail | Espagnol | Citer la source (voir les conditions d'utilisation du site) |
| Mexique | Sistema Nacional de Clasificación de Ocupaciones (SINCO 2019), INEGI / STPS | Référentiel | Espagnol | Citer la source |
| Chili | [ChileValora](https://chilevalora.gob.cl/) et le [catalogue public des profils occupationnels](https://certificacion.chilevalora.gob.cl/ChileValora-publica/perfilesList.html) | Profils de compétences professionnelles | Espagnol | Citer la source |
| Chili | [SENCE, catalogue des profils occupationnels](https://sence.gob.cl/empresas/franquicia/tramites_servicios/informacion-del-catalogo-de-perfiles-ocupacionales) | Profils occupationnels | Espagnol | Citer la source |
| Colombie | [Observatoire du travail et des occupations du SENA](https://observatorio.sena.edu.co/), dont la [Clasificación Nacional de Ocupaciones (CNO)](https://observatorio.sena.edu.co/Clasificacion/Cno) | Référentiel, information sur les métiers et données du marché du travail | Espagnol | Citer la source |

### Asie

| Pays | Source | Type | Langue | Licence |
| --- | --- | --- | --- | --- |
| Inde | [National Career Service (NCS)](https://ncs.gov.in/), ministère du Travail et de l'Emploi | Portail officiel d'orientation et d'emploi | Anglais, hindi | Citer la source (le service est gratuit) |
| Inde | [National Classification of Occupations (NCO 2015)](https://dge.gov.in/index.php/nco-2015), Directorate General of Employment | Référentiel | Anglais | Citer la source |
| Japon | [job tag](https://shigoto.mhlw.go.jp/User/top), ministère de la Santé, du Travail et des Affaires sociales (MHLW) | Fiches métiers (tâches, compétences, plus de 500 métiers) | Japonais | Citer la source |
| Corée du Sud | [CareerNet](https://www.career.go.kr/), institut coréen de recherche sur l'enseignement professionnel | Encyclopédie des métiers pour l'orientation | Coréen (un peu d'anglais) | Citer la source |
| Corée du Sud | [KNOW (système coréen d'information sur les métiers)](https://www.work.go.kr/consltJobCarpa/srch/jobInfoSrch/srchJobInfo.do) sur WorkNet, ministère de l'Emploi et du Travail / KEIS | Fiches métiers, caractéristiques et perspectives | Coréen | Citer la source. Une partie des données WorkNet est aussi publiée en open data. |
| Chine | Avis officiel sur la [classification nationale des professions (édition 2022)](https://chinajob.mohrss.gov.cn/c/2022-07-14/356103.shtml), ministère des Ressources humaines et de la Sécurité sociale | Référentiel (8 grands groupes, 1 636 professions) | Chinois | Citer la source. Aucun catalogue public stable de fiches n'a été vérifié ici ; compléter avec ISCO-08 ou O*NET et le dire clairement. |
| Singapour | [MySkillsFuture, occupations](https://www.myskillsfuture.gov.sg/content/portal/en/occupation/occupation.html), SkillsFuture Singapore | Information sur les métiers, salaires et volume d'offres | Anglais | Citer la source |
| Singapour | [Singapore Standard Occupational Classification (SSOC)](https://www.singstat.gov.sg/standards/standards-and-classifications/ssoc), Department of Statistics | Référentiel | Anglais | Citer la source |
| Vietnam | [Classification standard des professions (VSCO 2020)](https://www.nso.gov.vn/phuong-phap-luan-thong-ke/danh-muc/nghe-nghiep/), office national de statistique | Référentiel | Vietnamien | Citer la source. Aucun catalogue public national de fiches n'a été vérifié ; compléter avec ISCO-08 ou O*NET. |

### Océanie

| Pays | Source | Type | Langue | Licence |
| --- | --- | --- | --- | --- |
| Australie | [Your Career](https://www.yourcareer.gov.au/), gouvernement australien | Fiches métiers (tâches, compétences, salaire, perspectives) | Anglais | Citer la source |
| Australie | [ANZSCO](https://www.abs.gov.au/statistics/classifications/australian-and-new-zealand-standard-classification-occupation-anzsco), Australian Bureau of Statistics | Référentiel (partagé avec la Nouvelle-Zélande) | Anglais | Citer la source |
| Australie | [Jobs and Skills Australia, projections d'emploi](https://www.jobsandskills.gov.au/data/employment-projections/occupation) | Perspectives du marché du travail | Anglais | Citer la source |
| Nouvelle-Zélande | [Careers New Zealand](https://www.careers.govt.nz/) (Tertiary Education Commission) | Fiches métiers (salaire, formation, tâches), en anglais et en te reo Māori | Anglais, māori | Citer la source |
| Nouvelle-Zélande | ANZSCO (même référentiel que l'Australie, lien ci-dessus) | Référentiel | Anglais | Citer la source |

### Afrique

| Pays | Source | Type | Langue | Licence |
| --- | --- | --- | --- | --- |
| Maroc | [Nomenclatures du Haut-Commissariat au Plan](https://www.hcp.ma/downloads/Nomenclatures_t22462.html), dont la nomenclature analytique des professions | Référentiel | Français, arabe | Citer la source. Aucun catalogue public complet de fiches n'a été vérifié ; compléter avec ISCO-08 ou O*NET. |
| Tunisie | [Référentiel Tunisien des Métiers et des Compétences (RTMC)](https://www.emploi.gov.tn/fr/126/le-referentiel-tunisien-des-metiers-et-des-competences), ministère de l'Emploi / ANETI. Consultation : [rtmc.emploi.nat.tn](https://rtmc.emploi.nat.tn/) | Fiches métiers et compétences | Français, arabe | Citer la source |
| Afrique du Sud | [National Career Advice Portal (NCAP)](https://ncap.careerhelp.org.za/occupations) et [Career Help / Khetha](https://www.careerhelp.org.za/), Department of Higher Education and Training | Fiches métiers et parcours de formation | Anglais | Citer la source |
| Côte d'Ivoire | [AGEFOP, les métiers](https://www.agefop.ci/les-metiers) | Liste officielle de métiers de formation (couverture limitée, pas un catalogue national complet) | Français | Citer la source. Compléter avec ISCO-08 ou O*NET pour une liste plus large. |
| Sénégal | Aucun catalogue public national de métiers fiable n'a été trouvé sur une URL officielle qui fonctionne. | — | — | Partir d'[ISCO-08](https://isco.ilo.org/) ou d'[O*NET](https://www.onetonline.org/), et chercher à nouveau une source nationale avant de publier. |

Si ton pays n'est pas dans ces tableaux, cherche : le service national d'orientation, le service public de l'emploi, l'office de statistique, et le portail officiel de données ouvertes. Préfère ces sources à des sites commerciaux. Si rien de solide n'apparaît, utilise ESCO (en Europe), ISCO-08 ou O*NET, et dis clairement d'où viennent les descriptions.

## 7. Où changer le code

Le site français est une application web statique (React + Vite). Il n'y a pas de base de données côté serveur. Tu adaptes les données, les textes, et parfois le barème, puis tu reconstruis le site.

| Ce que tu veux changer | Où le faire |
| --- | --- |
| Nom du site, accroche, adresse publique, crédit de l'auteur | `src/lib/site.ts` (garde un crédit à Tristan Vilpont, et ajoute ton nom) |
| Les 12 questions, leur ordre, les familles, les libellés d'intérêts, les niveaux d'études | `src/lib/vocab.ts` |
| Comment les réponses deviennent un score | `src/lib/scoring.ts` |
| Critères de la grille, seuils du marché du travail, libellés sur la fiche | `src/lib/grille.ts` |
| Forme d'un métier dans le catalogue | `src/lib/types.ts` (`Metier`, `Grille`) |
| Page « À propos », mentions légales, sources | `src/pages/AboutPage.tsx` |
| Pied de page, filtres de l'explorateur, mise en page d'une fiche | `src/components/`, `src/pages/MetierPage.tsx`, `src/pages/ExplorerPage.tsx` |
| Construction du catalogue officiel (France : XML/CSV Onisep) | `scripts/onisep_parse.py`, `scripts/build_data.py`, `scripts/enrich.py` |
| Jointure avec le marché du travail (France : ROME + BMO + Dares) | `scripts/france_travail.py` → écrit `data/source/grille.json` |
| Fichier servi au navigateur | `public/data/catalog.json` (généré, à ne pas modifier à la main) |
| Compteurs et attributions générés au build | `src/generated/dataset.ts` |
| Tests | `tests/` et `scripts/test_parse.py` |

Étapes conseillées :

1. Lance une fois le projet français (`npm install`, `npm run dev`, `npm test`) pour voir le comportement visé.
2. Place tes fichiers officiels dans un nouveau dossier, par exemple `data/source/ton-pays/`. N'écrase pas les sources françaises tant que tu en as besoin comme exemple.
3. Écris un petit script qui lit tes fichiers et produit un `catalog.json` avec les mêmes champs que le type `Metier` dans `src/lib/types.ts` (et un objet `g` si tu as des données de marché ou de grille). Regarde `scripts/build_data.py` et `public/data/catalog.json` pour la forme attendue.
4. Remplace ou fais correspondre les centres d'intérêt et les familles dans `src/lib/vocab.ts`. Si ta source n'a pas de tags d'intérêt, tu peux dresser une courte liste officielle, ou sauter provisoirement cette étape du quiz.
5. Traduis l'interface : les questions dans `src/lib/vocab.ts`, puis les pages, les boutons, la page « À propos » et le pied de page. Adapte les niveaux d'études et l'unité de salaire (le score français utilise un salaire mensuel brut en euros).
6. Branche ta source de marché du travail en reprenant les idées de `scripts/france_travail.py`. Laisse les chiffres de famille clairement présentés comme des chiffres de famille.
7. Mets à jour `src/lib/site.ts`, la page « À propos », `LICENSE-DATA` (ou l'équivalent) et le pied de page avec **tes** sources et licences, plus le crédit à Tristan Vilpont.
8. Adapte les tests dans `tests/` à tes effectifs, tes libellés et tes règles de score. Garde l'esprit des tests existants : le barème doit rester prévisible, et les estimations doivent rester signalées.
9. Reconstruis (`python3 scripts/build_data.py` ou ton script, puis `npm test` et `npm run build`) et déploie le dossier statique `dist/`.

Tu n'as pas besoin de garder les métiers français dans un site consacré à un autre pays. Si tu conserves un fichier dérivé de l'Onisep, la règle de partage à l'identique de l'ODbL s'applique toujours.

## 8. Prompt prêt à copier pour une IA de code

Copie tout le bloc ci-dessous et remplis les passages entre crochets. Donne-le ensuite à une IA de code, avec ce dépôt.

```
Je veux que tu adaptes le projet libre « Quel métier me correspond ? »
(un site gratuit d'exploration des métiers pour les ados, créé par
Tristan Vilpont, en ligne sur https://quelmetiermecorrespond.fr)
à mon pays.

Objectif
- Garder la méthode : d'abord les envies, puis 12 questions, avec les
  questions sur l'argent à la fin ; classer des métiers officiels ; pas
  de compte utilisateur ; les réponses restent dans le navigateur.
- Remplacer les métiers français et les données françaises sur le marché
  du travail par des sources officielles de mon pays.
- Traduire toute l'interface en [LANGUE].
- Citer Tristan Vilpont comme auteur de la méthode et du site d'origine
  (CC BY 4.0). Citer aussi chaque source officielle et respecter sa licence.
- Ne rien publier tant que je n'ai pas vu un aperçu en local.

Mon pays et mes sources
- Pays : [PAYS]
- Langue du site : [LANGUE]
- Liste / fiches officielles de métiers : [NOM + URL]
- Référentiel public des métiers : [NOM + URL]
- Données de recrutement ou de marché du travail : [NOM + URL]
- Licence de chaque source, si tu la connais déjà : [LICENCES]
- Nom du site et adresse publique souhaités : [NOM + URL]
- Mon nom, pour la ligne de crédit : [NOM]

Merci de faire ceci
1. Lis docs/ADAPTER.fr.md (ou docs/ADAPT.md), LICENSE, LICENSE-DATA,
   LICENSE-DOCS, src/lib/types.ts, src/lib/vocab.ts, src/lib/scoring.ts,
   src/lib/grille.ts et src/lib/site.ts.
2. Propose une correspondance : quel champ de mes données officielles
   remplit quel champ des types Metier / Grille. Signale ce qui manque
   ou ce qui devrait être une estimation.
3. Quand je serai d'accord, écris les scripts d'import (n'invente aucun
   chiffre). Signale clairement les estimations et donne-leur un poids
   plus faible, comme dans le projet d'origine.
4. Traduis les 12 questions et le reste de l'interface. Garde le même
   ordre des questions, sauf si je dis le contraire. Adapte les niveaux
   d'études et l'unité de salaire à ce pays.
5. Mets à jour la page « À propos », le pied de page et le fichier de
   licence des données avec les nouvelles sources et un crédit à
   Tristan Vilpont.
6. Adapte ou réécris les tests. Tous les tests doivent passer.
7. Montre-moi comment lancer le site en local, et ne le déploie pas
   toi-même.

Si une source ne peut pas être téléchargée légalement, ou si sa licence
n'est pas claire, arrête-toi et dis-le-moi. Préfère les sources
publiques officielles aux sources commerciales.
```

Si tu publies une version pour ton pays, merci de le dire dans ton README, de garder le crédit, et, si tu le peux, d'indiquer où trouver ton code, pour que l'idée puisse voyager à nouveau.
