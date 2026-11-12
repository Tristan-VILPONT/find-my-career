import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { prerenderPlugin } from "./scripts/prerender.ts"
import { SITE_HTML } from "./src/lib/site.ts"

function siteHtml(): Plugin {
  return {
    name: "site-html",
    transformIndexHtml(html) {
      return Object.entries(SITE_HTML).reduce((current, [token, value]) => current.replaceAll(token, value), html)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteHtml(), prerenderPlugin()],
  server: {
    host: "127.0.0.1",
    port: 43123,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 43123,
    strictPort: true,
  },
})
