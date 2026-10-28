import { describe, expect, it } from "vitest";
import { isCheckRouteAvailable, shouldBypassSessionGate } from "./check-access";

describe("política da rota /check", () => {
  it("é pública somente em development", () => {
    expect(isCheckRouteAvailable("development")).toBe(true);
    expect(isCheckRouteAvailable("staging")).toBe(false);
    expect(isCheckRouteAvailable("production")).toBe(false);
    expect(isCheckRouteAvailable("test")).toBe(false);
  });

  it("atravessa o gate global somente para /check em development", () => {
    expect(shouldBypassSessionGate("/check", "development")).toBe(true);
    expect(shouldBypassSessionGate("/", "development")).toBe(false);
    expect(shouldBypassSessionGate("/check", "production")).toBe(false);
  });
});
