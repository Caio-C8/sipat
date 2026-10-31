import { ConflictException, NotFoundException } from "@nestjs/common";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { Prisma } from "@repo/database";
import type { ComissoesService } from "../../comissoes/comissoes.service";
import type { DepreciacoesRepository } from "../depreciacoes.repository";
import { DepreciacoesService } from "../depreciacoes.service";
import type { LinhaDepreciacao } from "../types";

const IDENTIDADE: IdentidadeAutenticada = {
  id: "00000000-0000-4000-8000-000000000001",
  nome: "Diretor",
  email: "diretor@example.com",
  perfil: "DIRETOR_PATRIMONIO",
  trocaSenhaObrigatoria: false,
};
const COMISSAO_ID = "00000000-0000-4000-8000-000000000002";

function linha(
  indice: number,
  alteracoes: Partial<LinhaDepreciacao> = {},
): LinhaDepreciacao {
  return {
    patrimonioId: `00000000-0000-4000-8000-${indice.toString().padStart(12, "0")}`,
    numeroPatrimonio: indice.toString(),
    descricao: `Bem ${indice}`,
    status: "ATIVO",
    situacaoContabilId: `10000000-0000-4000-8000-${indice.toString().padStart(12, "0")}`,
    valorBrutoAtual: new Prisma.Decimal("1000"),
    depreciacaoAcumuladaAtual: new Prisma.Decimal("0"),
    parametroDepreciacaoId: `20000000-0000-4000-8000-${indice.toString().padStart(12, "0")}`,
    quantidadeParametrosVigentes: 1n,
    vidaUtilInicialMeses: 10,
    valorResidual: new Prisma.Decimal("100"),
    dataInicio: new Date("2026-01-01T00:00:00.000Z"),
    quantidadeRealizada: 0n,
    jaDepreciadoNaCompetencia: false,
    ...alteracoes,
  };
}

describe("DepreciacoesService", () => {
  const repository = {
    executarTransacao: jest.fn(),
    bloquearComissao: jest.fn(),
    bloquearAcervo: jest.fn(),
    persistirEmLote: jest.fn(),
    listarPendentes: jest.fn(),
    obterResumoPendentes: jest.fn(),
  };
  const comissoes = {
    consultarVigente: jest.fn(),
    validarVigenciaBloqueada: jest.fn(),
  };
  let service: DepreciacoesService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-27T12:00:00.000Z"));
    jest.clearAllMocks();
    repository.executarTransacao.mockImplementation(
      (operacao: (repo: typeof repository) => unknown) => operacao(repository),
    );
    repository.bloquearComissao.mockResolvedValue({
      id: COMISSAO_ID,
      nome: "Comissão",
      dataVigenciaInicio: new Date("2026-01-01T00:00:00.000Z"),
      dataVigenciaFim: new Date("2026-12-31T00:00:00.000Z"),
    });
    repository.persistirEmLote.mockResolvedValue([]);
    comissoes.consultarVigente.mockResolvedValue({ id: COMISSAO_ID });
    service = new DepreciacoesService(
      repository as unknown as DepreciacoesRepository,
      comissoes as unknown as ComissoesService,
    );
  });

  afterEach(() => jest.useRealTimers());

  const body = (confirmarIgnorarValorResidual = true) => ({
    competencia: "2026-10",
    comissaoId: COMISSAO_ID,
    confirmarIgnorarValorResidual,
  });

  it("usa a competência de São Paulo na virada do mês", async () => {
    repository.listarPendentes.mockResolvedValue([]);
    repository.obterResumoPendentes.mockResolvedValue({
      totalPendentes: 0,
      totalNoValorResidual: 0,
    });
    jest.setSystemTime(new Date("2026-11-01T02:30:00.000Z"));
    await expect(
      service.listarPendentes({
        competencia: "2026-10",
        pagina: 1,
        limite: 20,
      }),
    ).resolves.toMatchObject({ total: 0 });
    jest.setSystemTime(new Date("2026-11-01T03:30:00.000Z"));
    await expect(
      service.listarPendentes({
        competencia: "2026-10",
        pagina: 1,
        limite: 20,
      }),
    ).rejects.toMatchObject({
      response: { codigo: "COMPETENCIA_NAO_CORRENTE" },
    });
  });

  it("rejeita competência passada antes da transação", async () => {
    await expect(
      service.executarEmMassa(
        { ...body(), competencia: "2026-09" },
        IDENTIDADE,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "COMPETENCIA_NAO_CORRENTE" },
    });
    expect(repository.executarTransacao).not.toHaveBeenCalled();
  });

  it("rejeita comissão inexistente com código público estável", async () => {
    comissoes.consultarVigente.mockRejectedValueOnce(new NotFoundException());

    await expect(
      service.executarEmMassa(body(), IDENTIDADE),
    ).rejects.toMatchObject({ response: { codigo: "COMISSAO_INVALIDA" } });
    expect(repository.executarTransacao).not.toHaveBeenCalled();
  });

  it("revalida a competência dentro da transação após a virada do mês", async () => {
    repository.executarTransacao.mockImplementationOnce(
      (operacao: (repo: typeof repository) => unknown) => {
        jest.setSystemTime(new Date("2026-11-01T12:00:00.000Z"));
        return operacao(repository);
      },
    );

    await expect(
      service.executarEmMassa(body(), IDENTIDADE),
    ).rejects.toMatchObject({
      response: { codigo: "COMPETENCIA_NAO_CORRENTE" },
    });
    expect(repository.bloquearAcervo).not.toHaveBeenCalled();
  });

  it("exige confirmação e não persiste quando há item no residual", async () => {
    repository.bloquearAcervo.mockResolvedValue([
      linha(3, {
        depreciacaoAcumuladaAtual: new Prisma.Decimal("900"),
      }),
      linha(4),
    ]);

    await expect(
      service.executarEmMassa(body(false), IDENTIDADE),
    ).rejects.toMatchObject({
      response: { codigo: "CONFIRMACAO_VALOR_RESIDUAL_NECESSARIA" },
    });
    expect(repository.persistirEmLote).not.toHaveBeenCalled();
  });

  it("classifica inelegíveis e persiste os elegíveis em uma operação de lote", async () => {
    repository.bloquearAcervo.mockResolvedValue([
      linha(3),
      linha(4, { status: "BAIXADO" }),
      linha(5, {
        parametroDepreciacaoId: null,
        quantidadeParametrosVigentes: 0n,
        vidaUtilInicialMeses: null,
        valorResidual: null,
        dataInicio: null,
      }),
      linha(6, { dataInicio: new Date("2026-10-01T00:00:00.000Z") }),
      linha(7, { jaDepreciadoNaCompetencia: true }),
      linha(8, {
        depreciacaoAcumuladaAtual: new Prisma.Decimal("900"),
      }),
    ]);

    const resultado = await service.executarEmMassa(body(), IDENTIDADE);

    expect(resultado.quantidadeProcessada).toBe(1);
    expect(resultado.quantidadesInelegiveis).toEqual({
      baixado: 1,
      semParametroVigente: 1,
      dataInicioNaoAtingida: 1,
      jaDepreciadoNaCompetencia: 1,
      valorResidualAtingido: 1,
    });
    expect(repository.persistirEmLote).toHaveBeenCalledTimes(1);
    expect(repository.persistirEmLote.mock.calls[0]?.[0].calculos).toHaveLength(
      1,
    );
  });

  it("cancela todo o lote diante de estado contábil inconsistente", async () => {
    repository.bloquearAcervo.mockResolvedValue([
      linha(3),
      linha(4, { depreciacaoAcumuladaAtual: new Prisma.Decimal("901") }),
    ]);

    await expect(
      service.executarEmMassa(body(), IDENTIDADE),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.persistirEmLote).not.toHaveBeenCalled();
  });
});
