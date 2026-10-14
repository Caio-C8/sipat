import { expect, test } from "./support/test";

declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

const caminhos = ["/", "/api/health"] as const;

for (const caminho of caminhos) {
  test(`envia headers de segurança em ${caminho}`, async ({ request }) => {
    const response = await request.get(caminho);

    expect(response.ok()).toBe(true);

    const headers = response.headers();
    const contentSecurityPolicy = headers["content-security-policy"];

    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).not.toContain("'unsafe-eval'");

    expect(headers["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    );
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
}

test("carrega a aplicação sem violar a CSP", async ({ page }) => {
  await page.addInitScript(() => {
    window.__cspViolations = [];

    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations?.push(
        `${event.violatedDirective}: ${event.blockedURI}`,
      );
    });
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
    }),
  ).toBeVisible();

  const cspViolations = await page.evaluate(() => window.__cspViolations ?? []);

  expect(cspViolations).toEqual([]);
});
