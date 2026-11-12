import type { QuestionId } from "./types.ts"

export const NIVEAUX: string[] = [
  "CAP ou équivalent + 1 an",
  "3e",
  "diplôme national du brevet",
  "bac + 5",
  "bac + 2",
  "bac ou équivalent",
  "CAP ou équivalent",
  "sans diplôme",
  "autre formation",
  "bac + 1",
  "bac + 3",
  "bac + 4",
  "bac + 6",
  "bac + 7",
  "bac + 8",
  "bac + 9 et plus",
]

/** Années d'études après la 3e, alignées sur NIVEAUX. -1 = autre formation. */
export const ANNEE: number[] = [2, 0, 0, 8, 5, 3, 1, 0, -1, 4, 6, 7, 9, 10, 11, 12]

export const STATUTS: string[] = [
  "fonctionnaire",
  "artisan",
  "militaire",
  "intermittent du spectacle",
  "indépendant",
  "saisonnier",
  "contrat de volontariat",
  "libéral",
  "salarié",
]

export const INTERETS: string[] = [
  "j'ai le sens du contact",
  "j'aime le sport, l'activité physique",
  "je souhaite protéger et secourir",
  "j'aime la nature",
  "je souhaite protéger la planète",
  "j'aime organiser, planifier",
  "je souhaite prendre soin des autres",
  "je m'intéresse à d'autres cultures",
  "j'aime dessiner",
  "je souhaite enseigner, transmettre",
  "je souhaite m'occuper d'enfants",
  "j'aime les nouvelles technologies",
  "j'aime diriger",
  "j'aime manier les chiffres",
  "j'aime me déplacer, voyager",
  "j'aime m'occuper d'animaux",
  "j'ai le sens des affaires",
  "j'aime faire des découvertes",
  "j'aime le travail manuel",
  "j'aime communiquer, convaincre",
  "j'aime les sensations fortes",
  "j'ai envie de piloter, conduire",
  "j'ai envie de travailler dans les coulisses du spectacle",
  "je suis un / une artiste",
  "j'ai le sens du service public",
  "j'ai le souci du détail",
  "j'aime cuisiner",
  "j'aime jouer avec les mots",
  "je souhaite faire respecter la loi, les règles",
  "j'ai envie de créer, construire, rénover",
]

export const SECTEURS: string[] = [
  "Artisanat d'art",
  "Maintenance",
  "Enseignement",
  "Verre, béton, céramique",
  "Informatique et réseaux",
  "Architecture urbanisme paysage",
  "Hôtellerie - Restauration",
  "Audiovisuel",
  "Défense",
  "Culture - Patrimoine",
  "Logistique et transport",
  "Comptabilité, gestion, ressources humaines",
  "Industrie chimique",
  "Mode et luxe",
  "Recherche",
  "Fonction publique",
  "Sécurité",
  "Énergie",
  "Agroéquipement",
  "Arts du spectacle",
  "Banque - Assurances",
  "Agriculture",
  "Papiers Cartons",
  "Audit - Conseil",
  "Construction aéronautique, ferroviaire et navale",
  "Social",
  "Environnement",
  "Édition, librairie, bibliothèque",
  "Automobile",
  "Filière bois",
  "Électronique",
  "Sport",
  "Bâtiment et travaux publics (BTP)",
  "Marketing, publicité",
  "Commerce et distribution",
  "Droit et justice",
  "Mécanique",
  "Industrie alimentaire",
  "Santé",
  "Tourisme",
  "Services à la personne",
  "Industries",
  "Art et design",
  "Communication",
  "Immobilier",
  "Journalisme",
  "Jeu vidéo",
  "Traduction, interprétation",
]

export type FamilyIconName = "leaf" | "cpu" | "heart" | "palette" | "hammer" | "clipboard" | "messages"

export type Family = {
  titre: string
  ids: number[]
  color: string
  soft: string
  icon: FamilyIconName
}

export const FAMILIES: Family[] = [
  { titre: "Nature et animaux", ids: [3, 4, 15], color: "#1f7a4d", soft: "#e5f5ec", icon: "leaf" },
  { titre: "Tech et sciences", ids: [11, 13, 17], color: "#1d4ed8", soft: "#e7efff", icon: "cpu" },
  { titre: "Aider et soigner", ids: [2, 6, 10, 24, 28], color: "#be123c", soft: "#ffe4ea", icon: "heart" },
  { titre: "Créer et s'exprimer", ids: [8, 22, 23, 26, 27], color: "#6d28d9", soft: "#f3e8ff", icon: "palette" },
  { titre: "Bouger et construire", ids: [1, 14, 18, 20, 21, 29], color: "#92400e", soft: "#ffedd5", icon: "hammer" },
  { titre: "Organiser et gérer", ids: [5, 12, 16, 25], color: "#0f766e", soft: "#e6fffb", icon: "clipboard" },
  { titre: "Convaincre et échanger", ids: [0, 7, 9, 19], color: "#4338ca", soft: "#eef2ff", icon: "messages" },
]

export const QUESTIONS: {
  id: QuestionId
  titre: string
  precis?: string
  choices: { value: string; label: string }[]
}[] = [
  {
    id: "etudes",
    titre: "Jusqu'où tu te vois aller dans les études ?",
    precis:
      "On s'appuie sur le niveau d'études minimal indiqué par l'Onisep. Il n'y a pas de bon parcours : juste celui qui te convient.",
    choices: [
      { value: "court", label: "Des études plutôt courtes (jusqu'au bac + 2, BTS…)" },
      { value: "moyen", label: "Un bac + 3 ou bac + 4, comme une licence" },
      { value: "long", label: "Des études longues (bac + 5 et plus)" },
      { value: "egal", label: "Peu importe" },
    ],
  },
  {
    id: "lieu",
    titre: "Tu te vois plutôt travailler dehors ou au bureau ?",
    precis:
      "On s'appuie sur les textes des fiches Onisep. Quand le lieu n'est pas dit clairement, c'est une estimation : elle est indiquée dans la fiche et compte moins dans le score.",
    choices: [
      { value: "dehors", label: "Dehors, au grand air" },
      { value: "bureau", label: "Au bureau, ou en intérieur" },
      { value: "mixte", label: "Un peu des deux" },
      { value: "atelier", label: "En atelier, sur un chantier, en cuisine…" },
      { value: "egal", label: "Peu importe" },
    ],
  },
  {
    id: "teletravail",
    titre: "Le télétravail, c'est important pour toi ?",
    precis:
      "Très peu de fiches Onisep en parlent clairement. Si rien n'est dit, le métier n'est pas pénalisé. Un « non » est souvent déduit du lieu de travail : c'est alors une estimation.",
    choices: [
      { value: "oui", label: "Oui, je veux pouvoir travailler à distance" },
      { value: "mix", label: "Un mix sur place / à distance me va" },
      { value: "non", label: "Non, je préfère être sur place" },
      { value: "egal", label: "Peu importe" },
    ],
  },
  {
    id: "horaires",
    titre: "Tu préfères des horaires réguliers, ou ça ne te dérange pas de bosser la nuit ou le week-end ?",
    precis:
      "D'après ce que les fiches disent sur les gardes, le travail de nuit, les week-ends ou le rythme. Si ce n'est pas indiqué, le métier n'est pas pénalisé.",
    choices: [
      { value: "reguliers", label: "Des horaires plutôt réguliers" },
      { value: "okdecale", label: "Ça ne me dérange pas de bosser la nuit ou le week-end" },
      { value: "egal", label: "Peu importe" },
    ],
  },
  {
    id: "sante",
    titre: "Tu préfères un métier qui ménage ton corps et ta santé ?",
    precis:
      "D'après les conditions de travail du ROME : effort physique, risques, et quelques signes de stress (le stress est toujours une estimation).",
    choices: [
      { value: "oui", label: "Oui, plutôt peu physique et peu risqué" },
      { value: "risques", label: "Le physique ne me fait pas peur, mais pas trop de risques" },
      { value: "egal", label: "Peu importe" },
    ],
  },
  {
    id: "utilite",
    titre: "Tu as envie d'un métier utile aux autres ?",
    precis:
      "On reste prudent : « oui » surtout pour soigner, enseigner, protéger, aider. Le reste est souvent classé « en partie ». C'est une lecture des fiches, pas un jugement définitif.",
    choices: [
      { value: "oui", label: "Oui, c'est important pour moi" },
      { value: "unpeu", label: "Un peu, parmi d'autres choses" },
      { value: "egal", label: "Peu importe" },
    ],
  },
  {
    id: "sensibilite",
    titre: "Tu vises un métier qui résiste aux crises et aux robots ?",
    precis:
      "On croise ce que les fiches disent sur la stabilité, les besoins de recrutement ou l'automatisation, parfois seulement le secteur. Beaucoup de valeurs sont des estimations.",
    choices: [
      { value: "solide", label: "Oui, je préfère un métier plutôt solide" },
      { value: "plus", label: "C'est un plus, sans être obligatoire" },
      { value: "egal", label: "Peu importe" },
    ],
  },
  {
    id: "geo",
    titre: "Tu préfères rester dans ta région, ou tu es prêt à bouger ?",
    precis:
      "« Lié à un lieu précis » veut dire mer, montagne, un site particulier ou parfois les grandes villes, d'après la fiche. Si rien n'est dit, on considère que le métier peut s'exercer un peu partout (estimation).",
    choices: [
      { value: "rester", label: "Je préfère un métier possible un peu partout" },
      { value: "bouger", label: "Je suis prêt ou prête à bouger, même vers un lieu précis" },
      { value: "egal", label: "Peu importe" },
    ],
  },
  {
    id: "tempslibre",
    titre: "Garder du temps pour toi (soirées, week-ends, vacances), c'est important ?",
    precis:
      "On regarde les contextes de travail du ROME de France Travail : nuit, week-ends, astreintes, horaires décalés, déplacements. Quand le ROME ne dit rien, on lit la fiche Onisep (estimation).",
    choices: [
      { value: "oui", label: "Oui, c'est essentiel pour moi" },
      { value: "unpeu", label: "Un peu, j'accepte quelques contraintes" },
      { value: "egal", label: "Peu importe" },
    ],
  },
  {
    id: "patron",
    titre: "Plus tard, tu te vois plutôt salarié, à ton compte, ou avec ta propre entreprise ?",
    precis:
      "C'est le parcours Employé → Indépendant → Propriétaire : commencer salarié, se mettre à son compte, puis posséder son entreprise. On s'appuie sur les statuts Onisep, les statuts d'emploi du ROME et ce que disent les fiches. La dernière étape est souvent une estimation.",
    choices: [
      { value: "salarie", label: "Salarié, avec un employeur" },
      { value: "oui", label: "À mon compte, comme indépendant" },
      { value: "proprio", label: "Avoir un jour ma propre entreprise" },
      { value: "etp", label: "Passer par les trois : salarié, puis indépendant, puis propriétaire" },
      { value: "pourquoi", label: "Pourquoi pas être mon propre patron, je ne sais pas encore" },
      { value: "egal", label: "Peu importe" },
    ],
  },
  {
    id: "salaire",
    titre: "Le salaire, ça compte beaucoup pour toi ?",
    precis:
      "Quand l'Onisep indique un salaire mensuel brut de débutant, on s'en sert. Si le montant n'est pas connu, le métier n'est pas pénalisé.",
    choices: [
      { value: "important", label: "Oui, je vise un métier bien payé" },
      { value: "correct", label: "Un salaire correct me suffit" },
      { value: "egal", label: "Ce n'est pas mon critère n°1" },
    ],
  },
  {
    id: "invest",
    titre: "Tu aimerais qu'un métier t'aide aussi à investir ou à te construire un patrimoine ?",
    precis:
      "Par exemple comprendre la finance ou l'immobilier, savoir rénover, négocier, ou pouvoir posséder ton entreprise. C'est toujours une estimation : elle compte deux fois moins dans le score.",
    choices: [
      { value: "oui", label: "Oui, ça compte pour moi" },
      { value: "plus", label: "C'est un plus" },
      { value: "egal", label: "Peu importe" },
    ],
  },
]

export const TOTAL_ETAPES = 1 + QUESTIONS.length
export const PAGE_SIZE = 20
export const SEUIL_BIEN = 70
export const URL_DATA = "https://www.data.gouv.fr/datasets/ideo-fiches-metiers"

export const LIEU_LIB = ["", "Dehors", "Bureau ou intérieur", "Mixte", "Atelier, chantier ou cuisine"]
export const TT_LIB = ["", "Possible", "Partiel", "Pas vraiment possible"]
export const HOR_LIB = ["", "Réguliers", "Nuit, week-end ou horaires décalés", "Variables"]
export const UTI_LIB = ["", "Oui", "En partie", "Non"]
export const SEN_LIB = ["", "Plutôt solide", "Moyenne", "Plus exposé"]
export const GEO_LIB = ["", "Possible un peu partout", "Lié à un lieu précis (mer, montagne, grandes villes…)"]

export function ficheOnisep(id: string): string {
  return `https://www.onisep.fr/http/redirection/metier/slug/MET.${id}`
}

export function familyForInterest(id: number): Family | undefined {
  return FAMILIES.find((family) => family.ids.includes(id))
}
