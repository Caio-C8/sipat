import { ConflictException, NotFoundException } from "@nestjs/common";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { Prisma } from "@repo/database";
import type { ResponsavelDetalhePayload } from "../types";
import type { ResponsaveisRepository } from "../responsaveis.repository";
import { ResponsaveisService } from "../responsaveis.service";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const RESPONSAVEL_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";

const identidade: IdentidadeAutenticada = {
  id: ADMIN_ID,
  nome: "Administração",
  email: "admin@example.com",
  perfil: "ADMINISTRADOR",
  trocaSenhaObrigatoria: false,
};

function responsavel(
  sobrescritas: Partial<ResponsavelDetalhePayload> = {},
): ResponsavelDetalhePayload {
  return {
    id: RESPONSAVEL_ID,
    nome: "Responsável de Teste",
    matricula: "MAT-001",
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
    buscarIdPorMatricula: jest.fn(),
    alterar: jest.fn(),
    alterarSituacao: jest.fn(),
  };

  return {
    repository,
    service: new ResponsaveisService(
      repository as unknown as ResponsaveisRepository,
    ),
  };
}

describe("ResponsaveisService", () => {
  it("cria ativo e deriva a auditoria da sessão", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarIdPorMatricula.mockResolvedValue(null);
    repository.criar.mockResolvedValue(responsavel());

    await service.criar(
      { nome: "Responsável de Teste", matricula: "MAT-001" },
      identidade,
    );

    expect(repository.criar).toHaveBeenCalledWith({
      nome: "Responsável de Teste",
      matricula: "MAT-001",
      ativo: true,
      createdBy: { connect: { id: ADMIN_ID } },
    });
  });

  it("traduz a corrida de unicidade para conflito público estável", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarIdPorMatricula.mockResolvedValue(null);
    repository.criar.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "7.8.0",
      }),
    );

    await expect(
      service.criar({ nome: "Responsável", matricula: "MAT-001" }, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "MATRICULA_RESPONSAVEL_JA_EXISTENTE" },
    });
  });

  it("lista com filtros, paginação e total consistentes", async () => {
    const { repository, service } = criarDependencias();
    repository.listar.mockResolvedValue([responsavel()]);
    repository.contar.mockResolvedValue(21);

    const resultado = await service.listar({
      pagina: 2,
      limite: 20,
      busca: "MAT",
      ativo: true,
    });

    expect(repository.listar).toHaveBeenCalledWith({
      where: {
        ativo: true,
        OR: [
          { nome: { contains: "MAT", mode: "insensitive" } },
          { matricula: { contains: "MAT", mode: "insensitive" } },
        ],
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

  it("rejeita consulta, alteração e situação de responsável inexistente", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(null);

    await expect(service.consultar(RESPONSAVEL_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.alterar(RESPONSAVEL_ID, { nome: "Outro nome" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.alterarSituacao(RESPONSAVEL_ID, { ativo: false }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejeita matrícula pertencente a outro responsável", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(responsavel());
    repository.buscarIdPorMatricula.mockResolvedValue(
      "24df3a43-5c02-47fb-ab92-03757a058f9f",
    );

    await expect(
      service.alterar(RESPONSAVEL_ID, { matricula: "MAT-002" }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("inativa sem excluir e trata repetição como idempotente", async () => {
    const { repository, service } = criarDependencias();
    const inativo = responsavel({ ativo: false });
    repository.buscarPorId.mockResolvedValueOnce(responsavel());
    repository.alterarSituacao.mockResolvedValue(inativo);

    await expect(
      service.alterarSituacao(RESPONSAVEL_ID, { ativo: false }),
    ).resolves.toEqual(inativo);
    expect(repository.alterarSituacao).toHaveBeenCalledWith(
      RESPONSAVEL_ID,
      false,
    );

    repository.buscarPorId.mockResolvedValueOnce(inativo);
    await expect(
      service.alterarSituacao(RESPONSAVEL_ID, { ativo: false }),
    ).resolves.toEqual(inativo);
    expect(repository.alterarSituacao).toHaveBeenCalledTimes(1);
  });
});
