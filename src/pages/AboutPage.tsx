import { DATASET, FT_SOURCES } from "../generated/dataset.ts"
import { formatNombre } from "../lib/format.ts"
import { SITE, SOURCE_REPO_URL } from "../lib/site.ts"
import { URL_DATA } from "../lib/vocab.ts"

export function AboutPage() {
  return (
    <article className="mx-auto grid w-full max-w-2xl gap-4 text-base leading-relaxed">
      <h1 className="font-display text-4xl font-semibold text-balance">À propos</h1>
      <p>
        J'ai créé « {SITE.name} » à partir d'une grille personnelle que je m'étais faite pour choisir mon métier : ce qui m'attirait, être utile aux autres, travailler dehors ou dans un bureau, le niveau d'études, le quotidien, le salaire, la possibilité de rester ou de bouger. J'aurais aimé avoir ça plus tôt, vers 15 ans, au collège ou au lycée, quand on te demande déjà « tu veux faire quoi plus tard ? ». Alors qu'au fond, la vraie question est plutôt « qu'est-ce qui compte pour toi ? ».
      </p>
      <p>
        « {SITE.name} » reprend cette idée. {SITE.tagline}. Ce n'est pas un test psychologique et ce n'est pas un verdict. C'est une façon de parcourir les {formatNombre(DATASET.count)} fiches métiers de l'Onisep avec tes critères, pour décider de manière plus éclairée.
      </p>
      <p>
        Il n'y a pas de compte. Tes réponses, tes favoris et ta comparaison restent dans ton navigateur. Rien n'est envoyé à un serveur.
      </p>
      <p>
        Le code et la méthode sont en accès libre :{" "}
        <a
          className="font-semibold text-ink underline decoration-accent underline-offset-4"
          href={SOURCE_REPO_URL}
          target="_blank"
          rel="noreferrer"
        >
          Code source et méthode libres
        </a>
        .
      </p>
      <h2 className="font-display text-2xl font-semibold">D'où viennent les infos</h2>
      <p>
        Les fiches viennent du jeu{" "}
        <a className="font-semibold text-ink underline decoration-accent underline-offset-4" href={URL_DATA}>
          Données Onisep (Idéo-Fiches métiers) – licence ODbL
        </a>
        , extraction d'{DATASET.sourceLabel}. L'Onisep met à jour ce jeu environ dix fois par an sur data.gouv.fr. Il n'y a pas de clé d'API à demander : l'API Onisep est en maintenance, donc le site lit une copie statique.
      </p>
      <p>
        Le niveau d'études, les statuts, les centres d'intérêt, les secteurs et le salaire de débutant (quand un montant mensuel brut est clairement écrit) viennent directement des fiches. Le lieu de travail, le télétravail, les horaires, l'utilité, la résistance aux crises et aux robots, et la contrainte géographique sont parfois des estimations déduites des textes. Une estimation est marquée comme telle et pèse deux fois moins dans le score. Elle peut être fausse : la page Onisep reste la référence.
      </p>
      <p>
        Les données sur le marché du travail viennent de France Travail, en open data (Licence Ouverte) : le{" "}
        <a className="font-semibold text-ink underline decoration-accent underline-offset-4" href={FT_SOURCES.rome.url}>
          ROME 4.0
        </a>{" "}
        (version d'octobre 2026) pour les conditions de travail et les statuts d'emploi, et l'
        <a className="font-semibold text-ink underline decoration-accent underline-offset-4" href={FT_SOURCES.bmo.url}>
          enquête Besoins en Main-d'Œuvre (BMO) {FT_SOURCES.bmo.annee}
        </a>{" "}
        pour les projets de recrutement et les difficultés de recrutement. La BMO compte par famille de métiers (FAP-2021), reliée au ROME par la{" "}
        <a className="font-semibold text-ink underline decoration-accent underline-offset-4" href={FT_SOURCES.fap.url}>
          table de passage de la Dares
        </a>
        : ce sont les chiffres de la famille, pas du métier exact. Les critères de ma grille (parcours salarié → indépendant → propriétaire, investissement, temps libre, santé) sont déduits de ces données et des fiches Onisep, et marqués « (estimation) » quand ce n'est pas écrit noir sur blanc.
      </p>
      <p>
        Le jeu de données dérivé publié avec ce site reste sous licence ODbL : si tu le réutilises, tu dois le partager aux mêmes conditions et citer l'Onisep.
      </p>
      <p>
        Une idée, une remarque, un métier qui manque ? Écris-moi :{" "}
        <a
          className="font-semibold text-ink underline decoration-accent underline-offset-4"
          href="mailto:contact@quelmetiermecorrespond.fr"
        >
          contact@quelmetiermecorrespond.fr
        </a>
      </p>
    </article>
  )
}
