import { Prisma } from "@repo/database";
import { DepreciacaoResponseMapper } from "../mappers";
import type { DepreciacaoCalculadaComLinha } from "../types";

describe("DepreciacaoResponseMapper", () => {
  it("mapeia um item pendente quando o metodo e usado como callback", () => {
    const calculo: DepreciacaoCalculadaComLinha = {
      patrimonioId: "00000000-0000-4000-8000-000000000001",
      situacaoContabilId: "00000000-0000-4000-8000-000000000002",
      parametroDepreciacaoId: "00000000-0000-4000-8000-000000000003",
      valorContabilAnterior: new Prisma.Decimal("900.00"),
      valorDepreciado: new Prisma.Decimal("10.00"),
      valorContabilNovo: new Prisma.Decimal("890.00"),
      depreciacaoAcumuladaNova: new Prisma.Decimal("110.00"),
      atingiraValorResidual: false,
      vidaUtilRestanteMeses: 89,
      linha: {
        patrimonioId: "00000000-0000-4000-8000-000000000001",
        numeroPatrimonio: "PAT-001",
        descricao: "Patrimonio de teste",
        status: "ATIVO",
        depreciavel: true,
        disponibilidadeId: "00000000-0000-4000-8000-000000000004",
        situacaoContabilId: "00000000-0000-4000-8000-000000000002",
        valorBrutoAtual: new Prisma.Decimal("1000.00"),
        depreciacaoAcumuladaAtual: new Prisma.Decimal("100.00"),
        parametroDepreciacaoId: "00000000-0000-4000-8000-000000000003",
        quantidadeParametrosVigentes: 1n,
        vidaUtilInicialMeses: 100,
        valorResidual: new Prisma.Decimal("100.00"),
        dataInicio: new Date("2026-07-01T00:00:00.000Z"),
        quantidadeRealizada: 10n,
        jaDepreciadoNaCompetencia: false,
        primeiraCompetencia: new Date("2026-08-01T00:00:00.000Z"),
        ultimaCompetenciaProcessada: new Date("2026-07-01T00:00:00.000Z"),
        competenciaEsperada: new Date("2026-08-01T00:00:00.000Z"),
      },
    };

    const [resultado] = [calculo].map(DepreciacaoResponseMapper.paraPendente);

    expect(resultado).toMatchObject({
      numeroPatrimonio: "PAT-001",
      primeiraCompetencia: "2026-08",
      ultimaCompetenciaProcessada: "2026-07",
      competenciaEsperada: "2026-08",
    });
  });
});
