import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves a project site from /<repo-name>/, not the domain root.
// Without this, the built index.html asks for /assets/... which 404s, because
// the real path is /<repo-name>/assets/.... Set REPO_NAME to your exact repo
// name (case-sensitive) before running `npm run build` for a Pages deploy.
// Leave it as "/" for local dev and for a user/org page (yourname.github.io).
const REPO_NAME = "your-repo-name";

export default defineConfig({
  plugins: [react()],
  base: process.env.GH_PAGES ? `/${REPO_NAME}/` : "/",
});
