import { describe, expect, it } from "vitest";
import { createMobileQueryClient } from "./mobile-query-client";

describe("createMobileQueryClient", () => {
  it("desabilita retry sem substituir o gcTime padrão", () => {
    const client = createMobileQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.queries).toMatchObject({ retry: false });
    expect(defaults.queries).not.toHaveProperty("gcTime");
    expect(defaults.mutations).toMatchObject({ retry: false });
  });
});
