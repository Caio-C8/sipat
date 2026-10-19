import { ConflictException, NotFoundException } from "@nestjs/common";
import type { IdentidadeAutenticada } from "@repo/contracts";
import type { ResponsaveisService } from "../../responsaveis/responsaveis.service";
import type { SetoresRepository } from "../setores.repository";
import { SetoresService } from "../setores.service";
import type { SetorDetalhePayload } from "../types";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const SETOR_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const RESPONSAVEL_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";

const identidade: IdentidadeAutenticada = {
  id: ADMIN_ID,
  nome: "Administração",
  email: "admin@example.com",
  perfil: "ADMINISTRADOR",
};

function setor(
  sobrescritas: Partial<SetorDetalhePayload> = {},
): SetorDetalhePayload {
  return {
    id: SETOR_ID,
    nome: "Almoxarifado",
    sala: "12",
    ramal: "123",
    ativo: true,
    responsavel: {
      id: RESPONSAVEL_ID,
      nome: "Responsável",
      matricula: "MAT-001",
      ativo: true,
    },
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
    alterar: jest.fn(),
    alterarSituacao: jest.fn(),
  };
  const responsaveis = { consultar: jest.fn() };

  return {
    repository,
    responsaveis,
    service: new SetoresService(
      repository as unknown as SetoresRepository,
      responsaveis as unknown as ResponsaveisService,
    ),
  };
}

describe("SetoresService", () => {
  it("cria ativo com responsável ativo e auditoria da sessão", async () => {
    const { repository, responsaveis, service } = criarDependencias();
    responsaveis.consultar.mockResolvedValue(setor().responsavel);
    repository.criar.mockResolvedValue(setor());

    await service.criar(
      {
        nome: "Almoxarifado",
        sala: "12",
        ramal: "123",
        responsavelId: RESPONSAVEL_ID,
      },
      identidade,
    );

    expect(responsaveis.consultar).toHaveBeenCalledWith(RESPONSAVEL_ID);
    expect(repository.criar).toHaveBeenCalledWith({
      nome: "Almoxarifado",
      sala: "12",
      ramal: "123",
      ativo: true,
      responsavel: { connect: { id: RESPONSAVEL_ID } },
      createdBy: { connect: { id: ADMIN_ID } },
    });
  });

  it("rejeita responsável inativo na criação e na troca", async () => {
    const { repository, responsaveis, service } = criarDependencias();
    responsaveis.consultar.mockResolvedValue({
      ...setor().responsavel,
      ativo: false,
    });
    repository.buscarPorId.mockResolvedValue(setor());

    await expect(
      service.criar(
        { nome: "Almoxarifado", responsavelId: RESPONSAVEL_ID },
        identidade,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "RESPONSAVEL_INATIVO" },
    });
    await expect(
      service.alterar(SETOR_ID, { responsavelId: RESPONSAVEL_ID }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.criar).not.toHaveBeenCalled();
    expect(repository.alterar).not.toHaveBeenCalled();
  });

  it("lista com busca, filtros, paginação e total consistentes", async () => {
    const { repository, service } = criarDependencias();
    repository.listar.mockResolvedValue([setor()]);
    repository.contar.mockResolvedValue(21);

    const resultado = await service.listar({
      pagina: 2,
      limite: 20,
      busca: "almox",
      responsavelId: RESPONSAVEL_ID,
      ativo: true,
    });

    const where = {
      ativo: true,
      responsavelId: RESPONSAVEL_ID,
      OR: [
        { nome: { contains: "almox", mode: "insensitive" } },
        { sala: { contains: "almox", mode: "insensitive" } },
        { ramal: { contains: "almox", mode: "insensitive" } },
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

  it("rejeita consulta, alteração e situação de setor inexistente", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(null);

    await expect(service.consultar(SETOR_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.alterar(SETOR_ID, { nome: "Outro nome" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.alterarSituacao(SETOR_ID, { ativo: false }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("altera sem revalidar vínculo existente e inativa idempotentemente", async () => {
    const { repository, responsaveis, service } = criarDependencias();
    const atual = setor();
    const inativo = setor({ ativo: false });
    repository.buscarPorId.mockResolvedValueOnce(atual);
    repository.alterar.mockResolvedValue(setor({ sala: null }));

    await service.alterar(SETOR_ID, { sala: null });
    expect(responsaveis.consultar).not.toHaveBeenCalled();
    expect(repository.alterar).toHaveBeenCalledWith(
      SETOR_ID,
      expect.objectContaining({ sala: null, updatedAt: expect.any(Date) }),
    );

    repository.buscarPorId.mockResolvedValueOnce(atual);
    repository.alterarSituacao.mockResolvedValue(inativo);
    await expect(
      service.alterarSituacao(SETOR_ID, { ativo: false }),
    ).resolves.toEqual(inativo);

    repository.buscarPorId.mockResolvedValueOnce(inativo);
    await expect(
      service.alterarSituacao(SETOR_ID, { ativo: false }),
    ).resolves.toEqual(inativo);
    expect(repository.alterarSituacao).toHaveBeenCalledTimes(1);
  });

  it("troca para responsável ativo e atualiza a auditoria", async () => {
    const { repository, responsaveis, service } = criarDependencias();
    const novoResponsavel = {
      ...setor().responsavel,
      id: "b5ff4952-c7a6-478c-bd2c-d713a6b28814",
      matricula: "MAT-002",
    };
    repository.buscarPorId.mockResolvedValue(setor());
    responsaveis.consultar.mockResolvedValue(novoResponsavel);
    repository.alterar.mockResolvedValue(
      setor({ responsavel: novoResponsavel, updatedAt: new Date() }),
    );

    await service.alterar(SETOR_ID, { responsavelId: novoResponsavel.id });

    expect(repository.alterar).toHaveBeenCalledWith(
      SETOR_ID,
      expect.objectContaining({
        responsavel: { connect: { id: novoResponsavel.id } },
        updatedAt: expect.any(Date),
      }),
    );
  });
});
