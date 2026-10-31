import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SessionGate } from "./session-gate";

vi.mock("expo-router", () => ({ usePathname: () => "/" }));

vi.mock("../../../config/public-app-config", () => ({
  publicAppConfig: { environment: "development" },
}));

vi.mock("./session-context", () => ({
  useSession: () => ({
    manager: { restore: vi.fn() },
    state: { status: "restoring" },
  }),
}));

describe("SessionGate", () => {
  it("usa o azul interativo ao restaurar a sessão", () => {
    const markup = renderToStaticMarkup(
      <SessionGate>
        <div>Conteúdo</div>
      </SessionGate>,
    );

    expect(markup).toContain("Restaurando sessão segura");
    expect(markup.toLowerCase()).toContain("#2563eb");
    expect(markup).not.toContain("Conteúdo");
  });
});
