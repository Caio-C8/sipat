import { Prisma } from "@repo/database";
import {
  calcularDepreciacao,
  EstadoContabilDepreciacaoInconsistenteError,
} from "../depreciacao-calculo";
import type { LinhaDepreciacao } from "../types";

function linha(alteracoes: Partial<LinhaDepreciacao> = {}): LinhaDepreciacao {
  return {
    patrimonioId: "00000000-0000-4000-8000-000000000001",
    numeroPatrimonio: "1",
    descricao: "Bem",
    status: "ATIVO",
    situacaoContabilId: "00000000-0000-4000-8000-000000000002",
    valorBrutoAtual: new Prisma.Decimal("1000"),
    depreciacaoAcumuladaAtual: new Prisma.Decimal("100"),
    parametroDepreciacaoId: "00000000-0000-4000-8000-000000000003",
    quantidadeParametrosVigentes: 1n,
    vidaUtilInicialMeses: 10,
    valorResidual: new Prisma.Decimal("100"),
    dataInicio: new Date("2026-01-01T00:00:00.000Z"),
    quantidadeRealizada: 2n,
    jaDepreciadoNaCompetencia: false,
    ...alteracoes,
  };
}

describe("cálculo de depreciação linear", () => {
  it("calcula pelo saldo depreciável e vida útil restante sem number", () => {
    const resultado = calcularDepreciacao(linha());

    expect(resultado.vidaUtilRestanteMeses).toBe(8);
    expect(resultado.valorContabilAnterior.toString()).toBe("900");
    expect(resultado.valorDepreciado.toString()).toBe("100");
    expect(resultado.valorContabilNovo.toString()).toBe("800");
    expect(resultado.depreciacaoAcumuladaNova.toString()).toBe("200");
    expect(resultado.atingiraValorResidual).toBe(false);
  });

  it("arredonda a sete casas e absorve a diferença na última competência", () => {
    const arredondado = calcularDepreciacao(
      linha({
        valorBrutoAtual: new Prisma.Decimal("1"),
        depreciacaoAcumuladaAtual: new Prisma.Decimal("0"),
        valorResidual: new Prisma.Decimal("0"),
        vidaUtilInicialMeses: 3,
        quantidadeRealizada: 0n,
      }),
    );
    const ultimo = calcularDepreciacao(
      linha({
        valorBrutoAtual: new Prisma.Decimal("1"),
        depreciacaoAcumuladaAtual: new Prisma.Decimal("0.6666666"),
        valorResidual: new Prisma.Decimal("0"),
        vidaUtilInicialMeses: 3,
        quantidadeRealizada: 2n,
      }),
    );

    expect(arredondado.valorDepreciado.toString()).toBe("0.3333333");
    expect(ultimo.valorDepreciado.toString()).toBe("0.3333334");
    expect(ultimo.valorContabilNovo.toString()).toBe("0");
    expect(ultimo.atingiraValorResidual).toBe(true);
  });

  it.each([
    { depreciacaoAcumuladaAtual: new Prisma.Decimal("-1") },
    { depreciacaoAcumuladaAtual: new Prisma.Decimal("901") },
    { vidaUtilInicialMeses: 2, quantidadeRealizada: 2n },
    { quantidadeParametrosVigentes: 2n },
  ])("rejeita estado contábil inconsistente: %o", (alteracoes) => {
    expect(() => calcularDepreciacao(linha(alteracoes))).toThrow(
      EstadoContabilDepreciacaoInconsistenteError,
    );
  });
});
