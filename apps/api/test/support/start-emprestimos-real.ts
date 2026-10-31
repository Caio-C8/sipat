import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";

async function main() {
  const root = process.cwd();
  const url = process.env.EMPRESTIMOS_INTEGRATION_DATABASE_URL;
  if (!url || !ehBancoIsolado(url))
    throw new Error("Use somente o PostgreSQL RF16 descartável.");
  process.env.DATABASE_URL = url;
  const seed = spawnSync(
    process.execPath,
    [
      "--import",
      pathToFileURL(
        path.join(root, "packages/database/node_modules/tsx/dist/loader.mjs"),
      ).href,
      path.join(root, "apps/api/test/support/seed-emprestimos-real.ts"),
    ],
    { cwd: root, env: process.env, stdio: "inherit" },
  );
  if (seed.status !== 0) process.exit(seed.status ?? 1);
  await import(pathToFileURL(path.join(root, "apps/api/dist/main.js")).href);
}
void main();

function ehBancoIsolado(valor: string) {
  const url = new URL(valor);
  return (
    url.protocol === "postgresql:" &&
    url.hostname === "127.0.0.1" &&
    url.port === "55416" &&
    url.pathname === "/sipat_rf16" &&
    url.searchParams.get("schema") === "public"
  );
}
