import type { IdentidadeAutenticada } from "@repo/contracts";
import { ComissoesRepository } from "../comissoes.repository";
import { ComissoesService } from "../comissoes.service";
import type { ComissaoDetalhePayload, MembroComissaoPayload } from "../types";

const COMISSAO_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const MEMBRO_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";
const RESPONSAVEL_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const USUARIO_ID = "c5c3cc23-a215-4bba-9ae0-671596433a36";

const identidade: IdentidadeAutenticada = {
  id: USUARIO_ID,
  nome: "Administrador",
  email: "admin@example.com",
  perfil: "ADMINISTRADOR",
  trocaSenhaObrigatoria: false,
};

function membroBase(): MembroComissaoPayload {
  return {
    id: MEMBRO_ID,
    tipoMembroComissao: "MEMBRO",
    createdAt: new Date("2026-10-24T12:00:00.000Z"),
    updatedAt: null,
    responsavel: {
      id: RESPONSAVEL_ID,
      nome: "Responsável",
      matricula: "MAT-001",
      ativo: true,
    },
  };
}

function comissaoBase(
  usada = false,
  membros: MembroComissaoPayload[] = [],
): ComissaoDetalhePayload {
  return {
    id: COMISSAO_ID,
    nome: "Comissão de inventário",
    descricao: null,
    numeroAto: "Portaria 10/2026",
    dataVigenciaInicio: new Date("2026-01-01T00:00:00.000Z"),
    dataVigenciaFim: new Date("2026-12-31T00:00:00.000Z"),
    createdById: USUARIO_ID,
    createdAt: new Date("2026-10-24T12:00:00.000Z"),
    updatedAt: null,
    membros,
    _count: {
      transferencias: usada ? 1 : 0,
      emprestimos: 0,
      manutencoes: 0,
      inventarios: 0,
      baixas: 0,
      devolucoes: 0,
      depreciacoes: 0,
      reavaliacoes: 0,
    },
  };
}

describe("ComissoesService", () => {
  let repository: jest.Mocked<ComissoesRepository>;
  let service: ComissoesService;

  beforeEach(() => {
    repository = {
      executarTransacao: jest.fn(),
      bloquearComissao: jest.fn(),
      bloquearResponsaveis: jest.fn(),
      criar: jest.fn(),
      listar: jest.fn(),
      contar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarVigente: jest.fn(),
      alterar: jest.fn(),
      contarMembros: jest.fn(),
      buscarMembro: jest.fn(),
      adicionarMembro: jest.fn(),
      alterarMembro: jest.fn(),
      removerMembro: jest.fn(),
    } as unknown as jest.Mocked<ComissoesRepository>;
    repository.executarTransacao.mockImplementation(async (operacao) =>
      operacao(repository),
    );
    repository.bloquearComissao.mockResolvedValue(true);
    repository.bloquearResponsaveis.mockResolvedValue(
      new Map([[RESPONSAVEL_ID, true]]),
    );
    repository.buscarPorId.mockResolvedValue(comissaoBase());
    repository.criar.mockResolvedValue(comissaoBase(false, [membroBase()]));
    repository.alterar.mockResolvedValue(comissaoBase());
    repository.buscarMembro.mockResolvedValue(membroBase());
    repository.adicionarMembro.mockResolvedValue(membroBase());
    repository.alterarMembro.mockResolvedValue({
      ...membroBase(),
      tipoMembroComissao: "PRESIDENTE",
    });
    repository.contarMembros.mockResolvedValue(1);
    service = new ComissoesService(repository);
  });

  it("cria comissão e integrantes atomicamente com auditoria da sessão", async () => {
    await service.criar(
      {
        nome: "Comissão de inventário",
        numeroAto: "Portaria 10/2026",
        dataVigenciaInicio: "2026-01-01",
        dataVigenciaFim: "2026-12-31",
        membros: [{ responsavelId: RESPONSAVEL_ID, papel: "MEMBRO" }],
      },
      identidade,
    );

    expect(repository.executarTransacao).toHaveBeenCalledTimes(1);
    expect(repository.bloquearResponsaveis).toHaveBeenCalledWith([
      RESPONSAVEL_ID,
    ]);
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: { connect: { id: USUARIO_ID } },
        membros: {
          create: [
            {
              tipoMembroComissao: "MEMBRO",
              responsavel: { connect: { id: RESPONSAVEL_ID } },
            },
          ],
        },
      }),
    );
  });

  it("rejeita responsável inexistente ou inativo antes de persistir", async () => {
    repository.bloquearResponsaveis.mockResolvedValueOnce(new Map());
    await expect(
      service.criar(
        {
          nome: "Comissão",
          dataVigenciaInicio: "2026-01-01",
          dataVigenciaFim: "2026-12-31",
          membros: [{ responsavelId: RESPONSAVEL_ID, papel: "MEMBRO" }],
        },
        identidade,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "RESPONSAVEL_NAO_ENCONTRADO" },
    });

    repository.bloquearResponsaveis.mockResolvedValueOnce(
      new Map([[RESPONSAVEL_ID, false]]),
    );
    await expect(
      service.adicionarMembro(COMISSAO_ID, {
        responsavelId: RESPONSAVEL_ID,
        papel: "MEMBRO",
      }),
    ).rejects.toMatchObject({ response: { codigo: "RESPONSAVEL_INATIVO" } });
    expect(repository.criar).not.toHaveBeenCalled();
    expect(repository.adicionarMembro).not.toHaveBeenCalled();
  });

  it("impede o 51º integrante", async () => {
    repository.contarMembros.mockResolvedValue(50);

    await expect(
      service.adicionarMembro(COMISSAO_ID, {
        responsavelId: RESPONSAVEL_ID,
        papel: "MEMBRO",
      }),
    ).rejects.toMatchObject({
      response: { codigo: "LIMITE_MEMBROS_COMISSAO_EXCEDIDO" },
    });
  });

  it("congela ato, vigência e composição depois do primeiro uso", async () => {
    repository.buscarPorId.mockResolvedValue(
      comissaoBase(true, [membroBase()]),
    );

    await expect(
      service.alterar(COMISSAO_ID, { numeroAto: "Nova portaria" }),
    ).rejects.toMatchObject({ response: { codigo: "COMISSAO_JA_UTILIZADA" } });
    await expect(
      service.removerMembro(COMISSAO_ID, MEMBRO_ID),
    ).rejects.toMatchObject({ response: { codigo: "COMISSAO_JA_UTILIZADA" } });

    repository.alterar.mockResolvedValue({
      ...comissaoBase(true),
      nome: "Nome permitido",
    });
    await expect(
      service.alterar(COMISSAO_ID, { nome: "Nome permitido" }),
    ).resolves.toMatchObject({ nome: "Nome permitido" });
  });

  it("valida o período resultante quando o PATCH informa apenas uma data", async () => {
    await expect(
      service.alterar(COMISSAO_ID, { dataVigenciaInicio: "2027-01-01" }),
    ).rejects.toMatchObject({
      response: { codigo: "PERIODO_VIGENCIA_INVALIDO" },
    });
  });

  it("exige vínculo da comissão e responsável ainda ativo ao alterar papel", async () => {
    repository.buscarMembro.mockResolvedValueOnce(null);
    await expect(
      service.alterarMembro(COMISSAO_ID, MEMBRO_ID, { papel: "PRESIDENTE" }),
    ).rejects.toMatchObject({
      response: { codigo: "MEMBRO_COMISSAO_NAO_ENCONTRADO" },
    });

    repository.buscarMembro.mockResolvedValueOnce(membroBase());
    repository.bloquearResponsaveis.mockResolvedValueOnce(
      new Map([[RESPONSAVEL_ID, false]]),
    );
    await expect(
      service.alterarMembro(COMISSAO_ID, MEMBRO_ID, { papel: "PRESIDENTE" }),
    ).rejects.toMatchObject({ response: { codigo: "RESPONSAVEL_INATIVO" } });
  });

  it("consulta vigência inclusiva e diferencia comissão inexistente", async () => {
    repository.buscarVigente.mockResolvedValueOnce(comissaoBase());
    await expect(
      service.consultarVigente(COMISSAO_ID, "2026-01-01"),
    ).resolves.toMatchObject({ id: COMISSAO_ID });
    expect(repository.buscarVigente).toHaveBeenCalledWith(
      COMISSAO_ID,
      new Date("2026-01-01T00:00:00.000Z"),
    );

    repository.buscarVigente.mockResolvedValueOnce(null);
    repository.buscarPorId.mockResolvedValueOnce(null);
    await expect(
      service.consultarVigente(COMISSAO_ID, "2026-12-31"),
    ).rejects.toMatchObject({
      response: { codigo: "COMISSAO_NAO_ENCONTRADA" },
    });
  });
});
