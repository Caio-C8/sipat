import {
  diaSaoPaulo,
  inicioDiaSaoPaulo,
  proximoDiaCivil,
} from "./datas-movimentacao";
describe("dias civis de movimentação em São Paulo", () => {
  it("avalia fronteiras de vigência e dias inteiros no fuso", () => {
    expect(diaSaoPaulo(new Date("2026-10-28T02:59:59.999Z"))).toBe(
      "2026-10-27",
    );
    expect(diaSaoPaulo(new Date("2026-10-28T03:00:00.000Z"))).toBe(
      "2026-10-28",
    );
    expect(inicioDiaSaoPaulo("2026-10-28").toISOString()).toBe(
      "2026-10-28T03:00:00.000Z",
    );
    expect(proximoDiaCivil("2024-02-29")).toBe("2024-03-01");
  });
  it("respeita o início do horário de verão histórico sem meia-noite", () => {
    expect(inicioDiaSaoPaulo("2018-11-04").toISOString()).toBe(
      "2018-11-04T03:00:00.000Z",
    );
    expect(inicioDiaSaoPaulo("2018-11-05").toISOString()).toBe(
      "2018-11-05T02:00:00.000Z",
    );
  });
});
