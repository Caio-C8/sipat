import { describe, expect, it } from "vitest";
import { appRoutes } from "./routes";

describe("appRoutes", () => {
  it("mantém os paths públicos sem os nomes dos grupos", () => {
    expect(Object.values(appRoutes)).toEqual([
      "/check",
      "/",
      "/login",
      "/redefinir-senha",
      "/senha-atualizada",
    ]);
  });
});
