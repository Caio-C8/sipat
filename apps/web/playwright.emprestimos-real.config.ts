import { randomBytes } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "emprestimos-real.e2e.ts",
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    [
      "html",
      { open: "never", outputFolder: "playwright-report/emprestimos-real" },
    ],
  ],
  outputDir: "test-results/emprestimos-real",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node apps/api/test/support/start-emprestimos-real.ts",
      cwd: "../..",
      url: "http://127.0.0.1:3202/api/health",
      timeout: 60000,
      reuseExistingServer: false,
      env: {
        NODE_ENV: "test",
        APP_ENV: "test",
        API_PORT: "3202",
        CORS_ORIGINS: "http://localhost:3100",
        AUTH_RATE_LIMIT_HMAC_SECRET: randomBytes(32).toString("base64url"),
        AUTH_ARGON2_MAX_CONCURRENCY: "1",
        AUTH_ARGON2_MAX_QUEUE: "2",
        AUTH_PASSWORD_RESET_ENABLED: "false",
      },
    },
    {
      command: "pnpm exec next start --port 3100",
      url: "http://localhost:3100",
      timeout: 30000,
      reuseExistingServer: false,
      env: { API_INTERNAL_URL: "http://127.0.0.1:3202", PLAYWRIGHT_TEST: "1" },
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
