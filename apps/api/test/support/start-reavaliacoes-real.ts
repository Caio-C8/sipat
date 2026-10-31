import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function main() {
  const root = process.cwd();
  const url = process.env.REAVALIACOES_INTEGRATION_DATABASE_URL;
  if (!url || !ehBancoIsolado(url))
    throw new Error("Configure somente o banco isolado de reavaliações.");
  process.env.DATABASE_URL = url;
  process.env.UPLOADS_ROOT_PATH = path.resolve(
    root,
    "apps/web/test-results/uploads-reavaliacoes-real",
  );
  mkdirSync(process.env.UPLOADS_ROOT_PATH, { recursive: true });
  const seed = spawnSync(
    process.execPath,
    [
      "--import",
      pathToFileURL(
        path.join(root, "packages/database/node_modules/tsx/dist/loader.mjs"),
      ).href,
      path.join(root, "apps/api/test/support/seed-reavaliacoes-real.ts"),
    ],
    { cwd: root, env: process.env, stdio: "inherit" },
  );
  if (seed.status !== 0) process.exit(seed.status ?? 1);
  await import(pathToFileURL(path.join(root, "apps/api/dist/main.js")).href);
}
void main();

function ehBancoIsolado(valor: string): boolean {
  const url = new URL(valor);
  return (
    url.protocol === "postgresql:" &&
    url.hostname === "127.0.0.1" &&
    url.port === "5435" &&
    url.pathname === "/sipat_reavaliacoes_test" &&
    url.username === "sipat_test" &&
    url.searchParams.get("schema") === "public"
  );
}
