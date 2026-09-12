#!/usr/bin/env node
/**
 * Repo style convention: ": " (space, em dash, space) reads as ": " instead.
 *
 * Runs over every git-tracked source/doc file (extensions below), skipping
 * generated files like package-lock.json. Wired up as a SessionStart hook in
 * .claude/settings.json so this stays applied automatically; run by hand with
 * `node scripts/fix-em-dashes.js`.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Anchor to the repo root regardless of the caller's cwd (a SessionStart
// hook's cwd isn't guaranteed): git ls-files returns repo-root-relative
// paths, so reading/writing them only works once we're standing there.
process.chdir(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

const EM_DASH_PATTERN = /: /g;

const TEXT_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "css",
  "md",
  "html",
  "json",
]);

const EXCLUDED_FILES = new Set(["package-lock.json"]);

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .filter((file) => {
      const ext = file.split(".").pop();
      return TEXT_EXTENSIONS.has(ext) && !EXCLUDED_FILES.has(file);
    });
}

function main() {
  let changedCount = 0;

  for (const file of trackedFiles()) {
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue; // unreadable: skip rather than guess
    }

    if (!EM_DASH_PATTERN.test(content)) continue;
    EM_DASH_PATTERN.lastIndex = 0;

    const updated = content.replace(EM_DASH_PATTERN, ": ");
    if (updated !== content) {
      writeFileSync(file, updated);
      changedCount++;
      console.log(`fixed: ${file}`);
    }
  }

  console.log(`fix-em-dashes: ${changedCount} file(s) updated`);
}

main();
