import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type {
  CriarPatrimonioBodyData,
  IdentidadeAutenticada,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import type { PatrimoniosRepository } from "../patrimonios.repository";
import { PatrimoniosService } from "../patrimonios.service";

const DIRETOR_ID = "c5c3cc23-a215-4bba-9ae0-671596433a36";

const identidade: IdentidadeAutenticada = {
  id: DIRETOR_ID,
  nome: "Diretor",
  email: "diretor@example.com",
  perfil: "DIRETOR_PATRIMONIO",
};

function dados(
  sobrescritas: Partial<CriarPatrimonioBodyData> = {},
): CriarPatrimonioBodyData {
  return {
    semNumeroOficial: false,
    dataTombamento: "2026-10-18",
    tipoIncorporacao: "AQUISICAO",
    descricao: "Câmera fotográfica",
    marca: "São José",
    modelo: "Óptico",
    numeroSerie: "série-á1",
    valorIncorporacao: "1000.00",
    especieId: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
    setorAtualId: "fbcb9251-7ad8-4d64-ad1f-1fd3b5545fc8",
    parametrosDepreciacao: {
      metodo: "LINEAR",
      vidaUtilInicialMeses: 60,
      percentualResidual: "10",
      valorResidual: "100",
      valorBaseInicial: "1000",
      dataInicio: "2026-10-18",
    },
    ...sobrescritas,
  };
}

describe("PatrimoniosService", () => {
  const repository = {
    executarTransacao: jest.fn(),
    buscarSetor: jest.fn(),
    especieExiste: jest.fn(),
    processoCompraExiste: jest.fn(),
    gerarProximoNumero: jest.fn(),
    criar: jest.fn(),
  };
  const service = new PatrimoniosService(
    repository as unknown as PatrimoniosRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.executarTransacao.mockImplementation(
      (operacao: (repo: PatrimoniosRepository) => Promise<unknown>) =>
        operacao(repository as unknown as PatrimoniosRepository),
    );
    repository.buscarSetor.mockResolvedValue({ ativo: true });
    repository.especieExiste.mockResolvedValue(true);
    repository.processoCompraExiste.mockResolvedValue(true);
    repository.gerarProximoNumero.mockResolvedValue("1");
    repository.criar.mockResolvedValue({ id: "patrimonio" });
  });

  it("normaliza, gera o número e persiste os registros iniciais atomicamente", async () => {
    await expect(service.criar(dados(), identidade)).resolves.toEqual({
      id: "patrimonio",
    });

    expect(repository.executarTransacao).toHaveBeenCalledTimes(1);
    expect(repository.gerarProximoNumero).toHaveBeenCalledWith("OFICIAL");
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        numeroPatrimonio: "1",
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: "CAMERA FOTOGRAFICA",
        marca: "SAO JOSE",
        modelo: "OPTICO",
        numeroSerie: "SERIE-A1",
        textoBusca: "CAMERA FOTOGRAFICA SAO JOSE OPTICO SERIE-A1",
        status: "ATIVO",
        createdBy: { connect: { id: DIRETOR_ID } },
        situacaoContabil: {
          create: {
            valorBrutoAtual: "1000.00",
            depreciacaoAcumuladaAtual: "0",
          },
        },
        parametrosDepreciacao: {
          create: expect.objectContaining({
            vidaUtilInicialMeses: 60,
            valorResidual: "100",
            valorBaseInicial: "1000",
          }),
        },
      }),
    );
  });

  it("usa a sequence independente para patrimônio sem número oficial", async () => {
    repository.gerarProximoNumero.mockResolvedValue("SP-1");

    await service.criar(
      dados({ semNumeroOficial: true, parametrosDepreciacao: undefined }),
      identidade,
    );

    expect(repository.gerarProximoNumero).toHaveBeenCalledWith(
      "SEM_NUMERO_OFICIAL",
    );
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        numeroPatrimonio: "SP-1",
        tipoNumeroPatrimonial: "SEM_NUMERO_OFICIAL",
      }),
    );
  });

  it("rejeita setor ausente ou inativo antes de consumir a sequence", async () => {
    repository.buscarSetor.mockResolvedValueOnce(null);
    await expect(service.criar(dados(), identidade)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    repository.buscarSetor.mockResolvedValueOnce({ ativo: false });
    await expect(service.criar(dados(), identidade)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(repository.gerarProximoNumero).not.toHaveBeenCalled();
    expect(repository.criar).not.toHaveBeenCalled();
  });

  it("rejeita espécie e processo de compra inexistentes", async () => {
    repository.especieExiste.mockResolvedValueOnce(false);
    await expect(service.criar(dados(), identidade)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    repository.especieExiste.mockResolvedValueOnce(true);
    repository.processoCompraExiste.mockResolvedValueOnce(false);
    await expect(
      service.criar(
        dados({
          processoCompraId: "24df3a43-5c02-47fb-ab92-03757a058f9f",
        }),
        identidade,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("valida base, residual e percentual antes de abrir a transação", async () => {
    const casos: CriarPatrimonioBodyData["parametrosDepreciacao"][] = [
      {
        metodo: "LINEAR",
        vidaUtilInicialMeses: 60,
        valorResidual: "100",
        valorBaseInicial: "1001",
        dataInicio: "2026-10-18",
      },
      {
        metodo: "LINEAR",
        vidaUtilInicialMeses: 60,
        valorResidual: "101",
        valorBaseInicial: "100",
        dataInicio: "2026-10-18",
      },
      {
        metodo: "LINEAR",
        vidaUtilInicialMeses: 60,
        percentualResidual: "101",
        valorResidual: "100",
        valorBaseInicial: "1000",
        dataInicio: "2026-10-18",
      },
      {
        metodo: "LINEAR",
        vidaUtilInicialMeses: 60,
        percentualResidual: "10",
        valorResidual: "99",
        valorBaseInicial: "1000",
        dataInicio: "2026-10-18",
      },
    ];

    for (const parametrosDepreciacao of casos) {
      await expect(
        service.criar(dados({ parametrosDepreciacao }), identidade),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    }

    expect(repository.executarTransacao).not.toHaveBeenCalled();
  });

  it("traduz unicidade de série e de identificador para conflitos públicos", async () => {
    repository.executarTransacao.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "7.10.1",
        meta: { target: ["numero_serie"] },
      }),
    );
    await expect(service.criar(dados(), identidade)).rejects.toMatchObject({
      response: expect.objectContaining({
        codigo: "NUMERO_SERIE_JA_EXISTENTE",
      }),
    });

    repository.executarTransacao.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "7.10.1",
        meta: { target: ["numero_patrimonio"] },
      }),
    );
    await expect(service.criar(dados(), identidade)).rejects.toMatchObject({
      response: expect.objectContaining({
        codigo: "IDENTIFICADOR_PATRIMONIAL_CONFLITANTE",
      }),
    });
  });
});
