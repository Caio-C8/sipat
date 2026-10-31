import type {
  IdentidadeAutenticada,
  PreviaReavaliacaoBodyData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import type { ComissoesService } from "../../comissoes/comissoes.service";
import type { ReavaliacoesRepository } from "../reavaliacoes.repository";
import { ReavaliacoesService } from "../reavaliacoes.service";
import type { EstadoReavaliacao } from "../types";

const patrimonioId = "11111111-1111-4111-8111-111111111111";
const comissaoId = "22222222-2222-4222-8222-222222222222";
const identidade: IdentidadeAutenticada = {
  id: "33333333-3333-4333-8333-333333333333",
  nome: "Diretor",
  email: "diretor@example.com",
  perfil: "DIRETOR_PATRIMONIO",
  trocaSenhaObrigatoria: false,
};
const dados: PreviaReavaliacaoBodyData = {
  dataReferencia: "2026-10-29",
  comissaoId,
  itens: [
    {
      patrimonioId,
      valorReavaliado: "1200.0000000",
      vidaUtilNovaMeses: 60,
      residual: { tipo: "PERCENTUAL", percentual: "12.50" },
    },
  ],
};

function estado(
  alteracoes: Partial<EstadoReavaliacao> = {},
): EstadoReavaliacao {
  return {
    patrimonioId,
    numeroPatrimonio: "123",
    descricao: "Bem de teste",
    status: "ATIVO",
    situacaoContabilId: "44444444-4444-4444-8444-444444444444",
    valorBrutoAtual: new Prisma.Decimal("1000"),
    depreciacaoAcumuladaAtual: new Prisma.Decimal("100"),
    parametroDepreciacaoId: "55555555-5555-4555-8555-555555555555",
    quantidadeParametrosVigentes: 1n,
    quantidadeParametrosTotal: 1n,
    metodo: "LINEAR",
    vidaUtilInicialMeses: 100,
    percentualResidual: null,
    valorResidual: new Prisma.Decimal("100"),
    valorBaseInicial: new Prisma.Decimal("1000"),
    dataInicio: new Date("2026-01-01T00:00:00.000Z"),
    quantidadeRealizada: 10n,
    jaDepreciadoNaCompetencia: false,
    ...alteracoes,
  };
}

describe("ReavaliacoesService", () => {
  const repository = {
    buscarComissao: jest.fn(),
    consultarEstados: jest.fn(),
  };
  let service: ReavaliacoesService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-29T12:00:00.000Z"));
    jest.clearAllMocks();
    repository.buscarComissao.mockResolvedValue({
      id: comissaoId,
      nome: "Comissão",
      dataVigenciaInicio: new Date("2026-01-01T00:00:00.000Z"),
      dataVigenciaFim: new Date("2026-12-31T00:00:00.000Z"),
    });
    service = new ReavaliacoesService(
      repository as unknown as ReavaliacoesRepository,
      {} as ComissoesService,
    );
  });

  afterEach(() => jest.useRealTimers());

  it.each(["2026-09-30", "2026-10-30"])(
    "recusa data de referência fora do mês corrente até hoje: %s",
    async (dataReferencia) => {
      await expect(
        service.previa({ ...dados, dataReferencia }, identidade),
      ).rejects.toMatchObject({
        response: {
          codigo: "DATA_REFERENCIA_FORA_PERIODO",
          erros: [{ campo: "dataReferencia" }],
        },
      });
      expect(repository.buscarComissao).not.toHaveBeenCalled();
    },
  );

  it("usa o dia de São Paulo na virada do mês para validar a data", async () => {
    jest.setSystemTime(new Date("2026-11-01T02:30:00.000Z"));
    repository.consultarEstados.mockResolvedValue([
      estado({ jaDepreciadoNaCompetencia: true }),
    ]);
    await expect(
      service.previa({ ...dados, dataReferencia: "2026-10-31" }, identidade),
    ).resolves.toHaveProperty("itens");
    await expect(
      service.previa({ ...dados, dataReferencia: "2026-11-01" }, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "DATA_REFERENCIA_FORA_PERIODO" },
    });
  });

  it("bloqueia bem elegível com depreciação corrente pendente", async () => {
    repository.consultarEstados.mockResolvedValue([estado()]);
    const previa = await service.previa(dados, identidade);
    expect(previa.versaoPrevia).toBeNull();
    expect(previa.itens[0]).toMatchObject({
      elegivel: false,
      erros: [{ codigo: "DEPRECIACAO_CORRENTE_PENDENTE" }],
    });
  });

  it("solicita confirmação do primeiro parâmetro sem culpar o residual novo", async () => {
    repository.consultarEstados.mockResolvedValue([
      estado({
        parametroDepreciacaoId: null,
        quantidadeParametrosVigentes: 0n,
        quantidadeParametrosTotal: 0n,
        depreciacaoAcumuladaAtual: new Prisma.Decimal("0"),
        valorResidual: null,
        valorBaseInicial: null,
        vidaUtilInicialMeses: null,
        dataInicio: null,
      }),
    ]);
    const previa = await service.previa(dados, identidade);
    expect(previa.versaoPrevia).toBeNull();
    expect(previa.itens[0]).toMatchObject({
      elegivel: false,
      anterior: null,
      novo: { valorResidualNovo: "150.0000000" },
      erros: [
        {
          codigo: "PRIMEIRO_PARAMETRO_NECESSARIO",
          mensagem: expect.stringContaining("Deseja definir um agora?"),
        },
      ],
    });
  });

  it("aceita o primeiro parâmetro confirmado e preserva anterior nulo", async () => {
    repository.consultarEstados.mockResolvedValue([
      estado({
        parametroDepreciacaoId: null,
        quantidadeParametrosVigentes: 0n,
        quantidadeParametrosTotal: 0n,
        depreciacaoAcumuladaAtual: new Prisma.Decimal("0"),
        valorResidual: null,
        valorBaseInicial: null,
        vidaUtilInicialMeses: null,
        dataInicio: null,
      }),
    ]);
    const previa = await service.previa(
      {
        ...dados,
        itens: [{ ...dados.itens[0]!, definirPrimeiroParametro: true }],
      },
      identidade,
    );
    expect(previa.versaoPrevia).toMatch(/^[a-f0-9]{64}$/);
    expect(previa.itens[0]).toMatchObject({
      elegivel: true,
      anterior: null,
      novo: { valorResidualNovo: "150.0000000" },
      quotaMensalInicialEstimada: "17.5000000",
    });
  });

  it("calcula snapshots, residual e quota depois da depreciação corrente", async () => {
    repository.consultarEstados.mockResolvedValue([
      estado({ jaDepreciadoNaCompetencia: true }),
    ]);
    const previa = await service.previa(dados, identidade);
    expect(previa.versaoPrevia).toMatch(/^[a-f0-9]{64}$/);
    expect(previa.itens[0]).toMatchObject({
      elegivel: true,
      anterior: {
        valorBrutoAnterior: "1000.0000000",
        depreciacaoAcumuladaAnterior: "100.0000000",
        valorLiquidoAnterior: "900.0000000",
        vidaUtilRestanteAnteriorMeses: 90,
      },
      novo: {
        valorResidualNovo: "150.0000000",
        percentualResidualNovo: "12.50",
      },
      quotaMensalInicialEstimada: "17.5000000",
    });
  });

  it("permite bem no residual e rejeita baixado", async () => {
    repository.consultarEstados.mockResolvedValue([
      estado({
        depreciacaoAcumuladaAtual: new Prisma.Decimal("900"),
      }),
    ]);
    expect((await service.previa(dados, identidade)).itens[0]?.elegivel).toBe(
      true,
    );
    repository.consultarEstados.mockResolvedValue([
      estado({ status: "BAIXADO" }),
    ]);
    expect((await service.previa(dados, identidade)).itens[0]?.erros).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ codigo: "PATRIMONIO_BAIXADO" }),
      ]),
    );
  });

  it("não autoriza prévia para administrador", async () => {
    await expect(
      service.previa(dados, { ...identidade, perfil: "ADMINISTRADOR" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(repository.consultarEstados).not.toHaveBeenCalled();
  });
});
