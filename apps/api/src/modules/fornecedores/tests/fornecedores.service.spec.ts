import { ConflictException, NotFoundException } from "@nestjs/common";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { Prisma } from "@repo/database";
import type { FornecedoresRepository } from "../fornecedores.repository";
import { FornecedoresService } from "../fornecedores.service";
import type { FornecedorDetalhePayload } from "../types";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const FORNECEDOR_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const CNPJ = "11222333000181";

const identidade: IdentidadeAutenticada = {
  id: ADMIN_ID,
  nome: "Administração",
  email: "admin@example.com",
  perfil: "ADMINISTRADOR",
};

function fornecedor(
  sobrescritas: Partial<FornecedorDetalhePayload> = {},
): FornecedorDetalhePayload {
  return {
    id: FORNECEDOR_ID,
    razaoSocial: "Fornecedor de Teste Ltda.",
    nomeFantasia: "Fornecedor Teste",
    nomeRepresentante: "Representante",
    cnpj: CNPJ,
    email: "contato@example.com",
    telefone: "(34) 3333-3333",
    endereco: "Rua de Teste, 1",
    ativo: true,
    createdAt: new Date("2026-10-19T12:00:00.000Z"),
    updatedAt: null,
    createdById: ADMIN_ID,
    ...sobrescritas,
  };
}

function criarDependencias() {
  const repository = {
    criar: jest.fn(),
    listar: jest.fn(),
    contar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarIdPorCnpj: jest.fn(),
    alterar: jest.fn(),
    alterarSituacao: jest.fn(),
  };

  return {
    repository,
    service: new FornecedoresService(
      repository as unknown as FornecedoresRepository,
    ),
  };
}

describe("FornecedoresService", () => {
  it("cria ativo e deriva a auditoria da sessão", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarIdPorCnpj.mockResolvedValue(null);
    repository.criar.mockResolvedValue(fornecedor());

    await service.criar(
      { razaoSocial: "Fornecedor de Teste Ltda.", cnpj: CNPJ },
      identidade,
    );

    expect(repository.criar).toHaveBeenCalledWith({
      razaoSocial: "Fornecedor de Teste Ltda.",
      nomeFantasia: undefined,
      nomeRepresentante: undefined,
      cnpj: CNPJ,
      email: undefined,
      telefone: undefined,
      endereco: undefined,
      ativo: true,
      createdBy: { connect: { id: ADMIN_ID } },
    });
  });

  it("traduz a corrida de unicidade para conflito público estável", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarIdPorCnpj.mockResolvedValue(null);
    repository.criar.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "7.8.0",
      }),
    );

    await expect(
      service.criar({ razaoSocial: "Fornecedor", cnpj: CNPJ }, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "CNPJ_FORNECEDOR_JA_EXISTENTE" },
    });
  });

  it("lista com filtros, busca normalizada, paginação e total", async () => {
    const { repository, service } = criarDependencias();
    repository.listar.mockResolvedValue([fornecedor()]);
    repository.contar.mockResolvedValue(21);

    const resultado = await service.listar({
      pagina: 2,
      limite: 20,
      busca: "11.222.333/0001-81",
      ativo: true,
    });

    expect(repository.listar).toHaveBeenCalledWith({
      where: {
        ativo: true,
        OR: expect.arrayContaining([
          {
            cnpj: {
              contains: CNPJ,
              mode: "insensitive",
            },
          },
        ]),
      },
      skip: 20,
      take: 20,
    });
    expect(resultado).toMatchObject({
      total: 21,
      pagina: 2,
      ultimaPagina: 2,
      limite: 20,
    });
  });

  it("rejeita consulta, alteração e situação de fornecedor inexistente", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(null);

    await expect(service.consultar(FORNECEDOR_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.alterar(FORNECEDOR_ID, { razaoSocial: "Outro nome" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.alterarSituacao(FORNECEDOR_ID, { ativo: false }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejeita CNPJ pertencente a outro fornecedor e permite removê-lo", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(fornecedor());
    repository.buscarIdPorCnpj.mockResolvedValue(
      "24df3a43-5c02-47fb-ab92-03757a058f9f",
    );

    await expect(
      service.alterar(FORNECEDOR_ID, { cnpj: CNPJ }),
    ).rejects.toBeInstanceOf(ConflictException);

    repository.alterar.mockResolvedValue(fornecedor({ cnpj: null }));
    await expect(
      service.alterar(FORNECEDOR_ID, { cnpj: null }),
    ).resolves.toMatchObject({ cnpj: null });
  });

  it("inativa sem excluir e trata repetição como idempotente", async () => {
    const { repository, service } = criarDependencias();
    const inativo = fornecedor({ ativo: false });
    repository.buscarPorId.mockResolvedValueOnce(fornecedor());
    repository.alterarSituacao.mockResolvedValue(inativo);

    await expect(
      service.alterarSituacao(FORNECEDOR_ID, { ativo: false }),
    ).resolves.toEqual(inativo);
    expect(repository.alterarSituacao).toHaveBeenCalledWith(
      FORNECEDOR_ID,
      false,
    );

    repository.buscarPorId.mockResolvedValueOnce(inativo);
    await expect(
      service.alterarSituacao(FORNECEDOR_ID, { ativo: false }),
    ).resolves.toEqual(inativo);
    expect(repository.alterarSituacao).toHaveBeenCalledTimes(1);
  });

  it("impede que fornecedor inativo seja usado em novo vínculo", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(fornecedor({ ativo: false }));

    await expect(
      service.consultarAtivoParaVinculo(FORNECEDOR_ID),
    ).rejects.toMatchObject({
      response: {
        codigo: "FORNECEDOR_INATIVO",
        erros: [{ campo: "fornecedorId", codigo: "RELACAO_INATIVA" }],
      },
    });
  });
});
