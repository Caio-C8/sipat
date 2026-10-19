import { ConflictException, NotFoundException } from "@nestjs/common";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { Prisma } from "@repo/database";
import type { NaturezasRepository } from "../naturezas.repository";
import { NaturezasService } from "../naturezas.service";
import type { NaturezaDetalhePayload } from "../types";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const NATUREZA_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";

const identidade: IdentidadeAutenticada = {
  id: ADMIN_ID,
  nome: "Administração",
  email: "admin@example.com",
  perfil: "ADMINISTRADOR",
};

function natureza(
  sobrescritas: Partial<NaturezaDetalhePayload> = {},
): NaturezaDetalhePayload {
  return {
    id: NATUREZA_ID,
    nome: "Máquinas e equipamentos",
    nomeNormalizado: "MAQUINAS E EQUIPAMENTOS",
    descricao: "Bens de uso permanente",
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
    buscarIdPorNomeNormalizado: jest.fn(),
    alterar: jest.fn(),
  };

  return {
    repository,
    service: new NaturezasService(repository as unknown as NaturezasRepository),
  };
}

describe("NaturezasService", () => {
  it("normaliza o nome e deriva a auditoria da sessão", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarIdPorNomeNormalizado.mockResolvedValue(null);
    repository.criar.mockResolvedValue(natureza());

    await service.criar(
      {
        nome: "Máquinas e equipamentos",
        descricao: "Bens de uso permanente",
      },
      identidade,
    );

    expect(repository.buscarIdPorNomeNormalizado).toHaveBeenCalledWith(
      "MAQUINAS E EQUIPAMENTOS",
    );
    expect(repository.criar).toHaveBeenCalledWith({
      nome: "Máquinas e equipamentos",
      nomeNormalizado: "MAQUINAS E EQUIPAMENTOS",
      descricao: "Bens de uso permanente",
      createdBy: { connect: { id: ADMIN_ID } },
    });
  });

  it("traduz a corrida de unicidade para conflito público estável", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarIdPorNomeNormalizado.mockResolvedValue(null);
    repository.criar.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "7.8.0",
      }),
    );

    await expect(
      service.criar({ nome: "Máquinas" }, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "NOME_NATUREZA_JA_EXISTENTE" },
    });
  });

  it("lista com busca normalizada, paginação e total consistentes", async () => {
    const { repository, service } = criarDependencias();
    repository.listar.mockResolvedValue([natureza()]);
    repository.contar.mockResolvedValue(21);

    const resultado = await service.listar({
      pagina: 2,
      limite: 20,
      busca: "máquinas",
    });

    const where = {
      OR: [
        { nome: { contains: "máquinas", mode: "insensitive" } },
        { nomeNormalizado: { contains: "MAQUINAS" } },
      ],
    };
    expect(repository.listar).toHaveBeenCalledWith({
      where,
      skip: 20,
      take: 20,
    });
    expect(repository.contar).toHaveBeenCalledWith(where);
    expect(resultado).toMatchObject({
      total: 21,
      pagina: 2,
      ultimaPagina: 2,
      limite: 20,
    });
  });

  it("rejeita consulta e alteração de natureza inexistente", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(null);

    await expect(service.consultar(NATUREZA_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.alterar(NATUREZA_ID, { nome: "Outro nome" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejeita nome equivalente pertencente a outra natureza", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(natureza());
    repository.buscarIdPorNomeNormalizado.mockResolvedValue(
      "24df3a43-5c02-47fb-ab92-03757a058f9f",
    );

    await expect(
      service.alterar(NATUREZA_ID, { nome: "maquinas" }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("permite alterar descrição sem recalcular o nome", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(natureza());
    repository.alterar.mockResolvedValue(natureza({ descricao: null }));

    await service.alterar(NATUREZA_ID, { descricao: null });

    expect(repository.buscarIdPorNomeNormalizado).not.toHaveBeenCalled();
    expect(repository.alterar).toHaveBeenCalledWith(
      NATUREZA_ID,
      expect.objectContaining({ descricao: null, updatedAt: expect.any(Date) }),
    );
  });
});
