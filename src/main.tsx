import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/fraunces"
import "@fontsource-variable/outfit"
import App from "./App.tsx"
import "./index.css"

const root = document.getElementById("root")
if (!root) throw new Error("Racine introuvable")

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // L'application reste utilisable sans cache hors-ligne.
    })
  })
}
