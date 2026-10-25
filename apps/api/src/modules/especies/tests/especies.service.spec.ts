import { ConflictException, NotFoundException } from "@nestjs/common";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { Prisma } from "@repo/database";
import type { NaturezasService } from "../../naturezas/naturezas.service";
import type { EspeciesRepository } from "../especies.repository";
import { EspeciesService } from "../especies.service";
import type { EspecieDetalhePayload } from "../types";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const ESPECIE_ID = "e288f366-9f8e-46f9-804c-d5876aa74c78";
const NATUREZA_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const OUTRA_NATUREZA_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";

const identidade: IdentidadeAutenticada = {
  id: ADMIN_ID,
  nome: "Administração",
  email: "admin@example.com",
  perfil: "ADMINISTRADOR",
  trocaSenhaObrigatoria: false,
};

function especie(
  sobrescritas: Partial<EspecieDetalhePayload> = {},
): EspecieDetalhePayload {
  return {
    id: ESPECIE_ID,
    nome: "Notebook",
    nomeNormalizado: "NOTEBOOK",
    descricao: "Computador portátil",
    natureza: { id: NATUREZA_ID, nome: "Equipamentos" },
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
  const naturezas = { consultar: jest.fn() };

  return {
    repository,
    naturezas,
    service: new EspeciesService(
      repository as unknown as EspeciesRepository,
      naturezas as unknown as NaturezasService,
    ),
  };
}

describe("EspeciesService", () => {
  it("valida a natureza, normaliza o nome e deriva a auditoria", async () => {
    const { repository, naturezas, service } = criarDependencias();
    repository.buscarIdPorNomeNormalizado.mockResolvedValue(null);
    naturezas.consultar.mockResolvedValue({ id: NATUREZA_ID });
    repository.criar.mockResolvedValue(especie());

    await service.criar(
      {
        nome: "Notebóok",
        descricao: "Computador portátil",
        naturezaId: NATUREZA_ID,
      },
      identidade,
    );

    expect(naturezas.consultar).toHaveBeenCalledWith(NATUREZA_ID);
    expect(repository.buscarIdPorNomeNormalizado).toHaveBeenCalledWith(
      "NOTEBOOK",
    );
    expect(repository.criar).toHaveBeenCalledWith({
      nome: "Notebóok",
      nomeNormalizado: "NOTEBOOK",
      descricao: "Computador portátil",
      natureza: { connect: { id: NATUREZA_ID } },
      createdBy: { connect: { id: ADMIN_ID } },
    });
  });

  it("traduz a corrida de unicidade para conflito público estável", async () => {
    const { repository, naturezas, service } = criarDependencias();
    repository.buscarIdPorNomeNormalizado.mockResolvedValue(null);
    naturezas.consultar.mockResolvedValue({ id: NATUREZA_ID });
    repository.criar.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "7.8.0",
      }),
    );

    await expect(
      service.criar({ nome: "Notebook", naturezaId: NATUREZA_ID }, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "NOME_ESPECIE_JA_EXISTENTE" },
    });
  });

  it("lista por natureza com busca normalizada e paginação", async () => {
    const { repository, service } = criarDependencias();
    repository.listar.mockResolvedValue([especie()]);
    repository.contar.mockResolvedValue(21);

    const resultado = await service.listar({
      pagina: 2,
      limite: 20,
      busca: "notebóok",
      naturezaId: NATUREZA_ID,
    });

    const where = {
      naturezaId: NATUREZA_ID,
      OR: [
        { nome: { contains: "notebóok", mode: "insensitive" } },
        { nomeNormalizado: { contains: "NOTEBOOK" } },
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

  it("rejeita consulta e alteração de espécie inexistente", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(null);

    await expect(service.consultar(ESPECIE_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.alterar(ESPECIE_ID, { nome: "Monitor" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejeita nome equivalente pertencente a outra espécie", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(especie());
    repository.buscarIdPorNomeNormalizado.mockResolvedValue(
      "f60f9f41-885d-41ba-8dc3-d55ec903c426",
    );

    await expect(
      service.alterar(ESPECIE_ID, { nome: "notebook" }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("valida e altera somente o vínculo informado", async () => {
    const { repository, naturezas, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(especie());
    naturezas.consultar.mockResolvedValue({ id: OUTRA_NATUREZA_ID });
    repository.alterar.mockResolvedValue(
      especie({
        natureza: { id: OUTRA_NATUREZA_ID, nome: "Mobiliário" },
      }),
    );

    await service.alterar(ESPECIE_ID, { naturezaId: OUTRA_NATUREZA_ID });

    expect(naturezas.consultar).toHaveBeenCalledWith(OUTRA_NATUREZA_ID);
    expect(repository.buscarIdPorNomeNormalizado).not.toHaveBeenCalled();
    expect(repository.alterar).toHaveBeenCalledWith(
      ESPECIE_ID,
      expect.objectContaining({
        natureza: { connect: { id: OUTRA_NATUREZA_ID } },
        updatedAt: expect.any(Date),
      }),
    );
  });
});
