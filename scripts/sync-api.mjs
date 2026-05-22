#!/usr/bin/env node
// Sync openapi.yaml from the backend repo and regenerate TS types.
// Usage:  npm run sync-api
// Env:    BACKEND_REPO_PATH (defaults to ../simple-forum-backend)

import { execSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const localSpec = path.join(repoRoot, "api/openapi.yaml");

const backendPath = process.env.BACKEND_REPO_PATH
  ?? path.resolve(repoRoot, "../simple-forum-backend");
const backendSpec = path.join(backendPath, "openapi.yaml");

if (existsSync(backendSpec)) {
  copyFileSync(backendSpec, localSpec);
  console.log(`Copied ${backendSpec} → ${localSpec}`);
} else {
  console.warn(`Backend spec not found at ${backendSpec} — regenerating from existing ${localSpec}`);
}

execSync(
  `node --experimental-vm-modules node_modules/.bin/openapi-typescript "${localSpec}" --output src/lib/api/schema.ts`,
  { stdio: "inherit", cwd: repoRoot }
);
console.log("Regenerated src/lib/api/schema.ts");
