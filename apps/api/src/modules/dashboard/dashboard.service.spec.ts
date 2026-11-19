import type { IdentidadeAutenticada } from "@repo/contracts";
import type { DashboardRepository } from "./dashboard.repository";
import { DashboardService, subtrairDiasCivis } from "./dashboard.service";

describe("DashboardService", () => {
  const repository = { consultar: jest.fn() };
  const service = new DashboardService(
    repository as unknown as DashboardRepository,
  );
  const identidade: IdentidadeAutenticada = {
    id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
    nome: "Maria",
    email: "maria@example.com",
    perfil: "ADMINISTRADOR",
    trocaSenhaObrigatoria: false,
  };

  beforeEach(() => jest.clearAllMocks());

  it("calcula quatorze dias civis completos em São Paulo", async () => {
    repository.consultar.mockResolvedValueOnce({});
    await service.consultar(identidade, new Date("2026-11-17T02:30:00.000Z"));
    expect(repository.consultar).toHaveBeenCalledWith(
      identidade.id,
      "2026-11-02",
    );
  });

  it("atravessa virada de mês e ano sem depender da duração do dia", () => {
    expect(subtrairDiasCivis("2027-01-05", 14)).toBe("2026-12-22");
    expect(subtrairDiasCivis("2026-03-15", 14)).toBe("2026-03-01");
  });
});
