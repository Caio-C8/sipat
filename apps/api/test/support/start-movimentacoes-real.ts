import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
async function main() {
  const root = process.cwd();
  if (!process.env.MOVIMENTACOES_INTEGRATION_DATABASE_URL)
    throw new Error("Configure o banco isolado de movimentações.");
  process.env.DATABASE_URL = process.env.MOVIMENTACOES_INTEGRATION_DATABASE_URL;
  process.env.UPLOADS_ROOT_PATH = path.resolve(
    root,
    process.env.UPLOADS_ROOT_PATH ??
      "apps/web/test-results/uploads-movimentacoes-real",
  );
  mkdirSync(process.env.UPLOADS_ROOT_PATH, { recursive: true });
  const seed = spawnSync(
    process.execPath,
    [
      "--import",
      pathToFileURL(
        path.join(root, "packages/database/node_modules/tsx/dist/loader.mjs"),
      ).href,
      path.join(root, "apps/api/test/support/seed-movimentacoes-real.ts"),
    ],
    { cwd: root, env: process.env, stdio: "inherit" },
  );
  if (seed.status !== 0) process.exit(seed.status ?? 1);
  await import(pathToFileURL(path.join(root, "apps/api/dist/main.js")).href);
}
void main();
