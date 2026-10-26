import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

const baseURL = externalBaseUrl ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalTimeout: process.env.CI ? 10 * 60 * 1000 : undefined,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  outputDir: "test-results",

  webServer: externalBaseUrl
    ? undefined
    : [
        {
          command: "node e2e/support/auth-api-server.mjs",
          url: "http://127.0.0.1:3201/api/health",
          reuseExistingServer: false,
          timeout: 30_000,
          stdout: "pipe",
          stderr: "pipe",
        },
        {
          command: `pnpm build && pnpm exec next start --port ${port}`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 180_000,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            ...process.env,
            API_INTERNAL_URL: "http://127.0.0.1:3201",
            PLAYWRIGHT_TEST: "1",
          },
        },
      ],

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
