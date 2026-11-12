import { EnviesScreen, FamillesScreen, IntroScreen, QuestionScreen } from "../quiz/QuizScreens.tsx"
import { ResultsScreen } from "../quiz/ResultsScreen.tsx"
import { useQuiz } from "../state/QuizProvider.tsx"

export function QuizPage() {
  const quiz = useQuiz()
  if (quiz.screen === "familles") return <FamillesScreen />
  if (quiz.screen === "envies") return <EnviesScreen />
  if (quiz.screen === "quiz") return <QuestionScreen />
  if (quiz.screen === "results") return <ResultsScreen />
  return <IntroScreen />
}
