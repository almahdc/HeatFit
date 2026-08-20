import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves a project site from /<repo-name>/, not the domain root.
// Without this, the built index.html asks for /assets/... which 404s, because
// the real path is /<repo-name>/assets/....
//
// Must match the repository name exactly, including case.
const REPO_NAME = "HeatFit";

// `mode` is Vite's own build flag, passed with --mode. Using it instead of an
// environment variable means this file needs no Node globals, so it typechecks
// in the editor without @types/node and drops the cross-env dependency.
//
// Environment variables are strings, never booleans, which makes them a poor
// switch: GH_PAGES=false would set the string "false", and every non-empty
// string is truthy, so a local build would silently get the Pages base.
// A mode either is "pages" or it is not.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: `/${REPO_NAME}/`,
}));
