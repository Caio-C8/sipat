import { describe, expect, it } from "vitest";
import { normalizarWebVital, type WebVitalMetric } from "../web-vitals";

function criarMetrica(
  sobrescritas: Partial<WebVitalMetric> = {},
): WebVitalMetric {
  return {
    name: "LCP",
    value: 2543.218,
    delta: 2543.218,
    id: "identificador-de-alta-cardinalidade",
    entries: [],
    navigationType: "navigate",
    rating: "needs-improvement",
    ...sobrescritas,
  } as WebVitalMetric;
}

describe("normalizarWebVital", () => {
  it("mantém somente campos seguros e úteis para agregação", () => {
    const evento = normalizarWebVital(criarMetrica(), "/");

    expect(evento).toEqual({
      name: "LCP",
      value: 2543.22,
      rating: "needs-improvement",
      navigationType: "navigate",
      route: "inicio",
    });

    expect(evento).not.toHaveProperty("id");
    expect(evento).not.toHaveProperty("entries");
    expect(JSON.stringify(evento)).not.toContain(
      "identificador-de-alta-cardinalidade",
    );
  });

  it("preserva precisão adequada para CLS", () => {
    const evento = normalizarWebVital(
      criarMetrica({
        name: "CLS",
        value: 0.123456,
        rating: "good",
      }),
      "/",
    );

    expect(evento.value).toBe(0.1235);
    expect(evento.route).toBe("inicio");
  });

  it("não expõe path de uma rota desconhecida", () => {
    const evento = normalizarWebVital(
      criarMetrica(),
      "/rota/privada/identificador-123",
    );

    expect(evento.route).toBe("rota.desconhecida");
    expect(JSON.stringify(evento)).not.toContain("identificador-123");
  });
});
