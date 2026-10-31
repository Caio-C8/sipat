import { describe, expect, it, vi } from "vitest";
import { createMobileQueryClient } from "./mobile-query-client";
import { SessionQueryIsolation } from "./session-query-isolation";

describe("SessionQueryIsolation", () => {
  it("preserva o cache quando a identidade não muda", async () => {
    const client = createMobileQueryClient();
    const isolation = new SessionQueryIsolation(client);
    await isolation.synchronize("usuario-a");
    client.setQueryData(["privado"], "dado confirmado");

    await isolation.synchronize("usuario-a");

    expect(client.getQueryData(["privado"])).toBe("dado confirmado");
  });

  it.each([
    ["troca de identidade", "usuario-b"],
    ["fim da sessão", null],
  ])("cancela queries e limpa os dois caches na %s", async (_case, next) => {
    const client = createMobileQueryClient();
    const isolation = new SessionQueryIsolation(client);
    await isolation.synchronize("usuario-a");
    let aborted = false;
    const pendingQuery = client
      .fetchQuery({
        queryKey: ["privado", "em-voo"],
        queryFn: ({ signal }) =>
          new Promise<string>((resolve) => {
            signal.addEventListener("abort", () => {
              aborted = true;
              resolve("resposta obsoleta");
            });
          }),
      })
      .catch(() => undefined);
    client.getMutationCache().build(client, {
      mutationKey: ["mutation-privada"],
      mutationFn: vi.fn(async () => undefined),
    });

    await isolation.synchronize(next);
    await pendingQuery;

    expect(aborted).toBe(true);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  });
});
