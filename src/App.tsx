import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Layout } from "./components/Layout.tsx"
import { AboutPage } from "./pages/AboutPage.tsx"
import { ComparePage } from "./pages/ComparePage.tsx"
import { ExplorerPage } from "./pages/ExplorerPage.tsx"
import { FavorisPage } from "./pages/FavorisPage.tsx"
import { MetierPage } from "./pages/MetierPage.tsx"
import { QuizPage } from "./pages/QuizPage.tsx"
import { CatalogProvider } from "./state/CatalogProvider.tsx"
import { LibraryProvider } from "./state/LibraryProvider.tsx"
import { QuizProvider } from "./state/QuizProvider.tsx"

export default function App() {
  return (
    <BrowserRouter>
      <CatalogProvider>
        <QuizProvider>
          <LibraryProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<QuizPage />} />
                <Route path="/explorer" element={<ExplorerPage />} />
                <Route path="/metier/:id" element={<MetierPage />} />
                <Route path="/comparer" element={<ComparePage />} />
                <Route path="/favoris" element={<FavorisPage />} />
                <Route path="/a-propos" element={<AboutPage />} />
                <Route
                  path="*"
                  element={
                    <div className="mx-auto max-w-xl">
                      <h1 className="font-display text-4xl font-semibold">Page introuvable</h1>
                      <p className="mt-2 text-muted">Ce lien ne mène nulle part. Reviens au quiz ou à l'explorateur.</p>
                    </div>
                  }
                />
              </Routes>
            </Layout>
          </LibraryProvider>
        </QuizProvider>
      </CatalogProvider>
    </BrowserRouter>
  )
}
