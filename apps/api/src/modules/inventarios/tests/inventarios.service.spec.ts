import type { IdentidadeAutenticada } from "@repo/contracts";
import type { ComissoesService } from "../../comissoes/comissoes.service";
import { InventariosRepository } from "../inventarios.repository";
import { InventariosService } from "../inventarios.service";

const IDENTIDADE: IdentidadeAutenticada = {
  id: "00000000-0000-4000-8000-000000000001",
  nome: "Diretor",
  email: "diretor@example.com",
  perfil: "DIRETOR_PATRIMONIO",
};
const COMISSAO_ID = "00000000-0000-4000-8000-000000000002";
const INVENTARIO_ID = "00000000-0000-4000-8000-000000000003";
const SETOR_ID = "00000000-0000-4000-8000-000000000004";
const SETOR_INVENTARIO_ID = "00000000-0000-4000-8000-000000000005";
const PATRIMONIO_ID = "00000000-0000-4000-8000-000000000006";

function progressoVazio() {
  return {
    totalSetores: 1,
    setoresPendentes: 1,
    setoresEmAndamento: 0,
    setoresConcluidos: 0,
    totalItens: 1,
    itensPendentes: 1,
    itensVerificados: 0,
    corretos: 0,
    divergencias: 0,
    naoLocalizados: 0,
    correcoesPendentes: 0,
    correcoesCorrigidas: 0,
  };
}

describe("InventariosService", () => {
  const repository = {
    executarTransacao: jest.fn(),
    bloquearComissao: jest.fn(),
    bloquearSetoresAtivos: jest.fn(),
    bloquearPatrimoniosAtivos: jest.fn(),
    criarInventario: jest.fn(),
    criarSetores: jest.fn(),
    criarItens: jest.fn(),
    obterProgressosInventarios: jest.fn(),
  };
  const comissoes = { consultarVigente: jest.fn() };
  const service = new InventariosService(
    repository as unknown as InventariosRepository,
    comissoes as unknown as ComissoesService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.executarTransacao.mockImplementation(
      (operacao: (repo: InventariosRepository) => Promise<unknown>) =>
        operacao(repository as unknown as InventariosRepository),
    );
    comissoes.consultarVigente.mockResolvedValue({ id: COMISSAO_ID });
    repository.bloquearComissao.mockResolvedValue({
      id: COMISSAO_ID,
      dataVigenciaInicio: new Date("2000-01-01T00:00:00.000Z"),
      dataVigenciaFim: new Date("2999-12-31T00:00:00.000Z"),
    });
    repository.bloquearSetoresAtivos.mockResolvedValue([{ id: SETOR_ID }]);
    repository.bloquearPatrimoniosAtivos.mockResolvedValue([
      { id: PATRIMONIO_ID, setorAtualId: SETOR_ID },
    ]);
    repository.criarInventario.mockResolvedValue({
      id: INVENTARIO_ID,
      nome: "Inventário anual",
      descricao: null,
      observacao: null,
      status: "PENDENTE",
      dataInicio: null,
      dataFim: null,
      iniciadoPorId: null,
      finalizadoPorId: null,
      createdById: IDENTIDADE.id,
      createdAt: new Date("2026-10-24T12:00:00.000Z"),
      updatedAt: null,
      comissao: { id: COMISSAO_ID, nome: "Comissão" },
    });
    repository.criarSetores.mockResolvedValue([
      { id: SETOR_INVENTARIO_ID, setorId: SETOR_ID },
    ]);
    repository.criarItens.mockResolvedValue(undefined);
    repository.obterProgressosInventarios.mockResolvedValue(
      new Map([[INVENTARIO_ID, progressoVazio()]]),
    );
  });

  it("materializa setores e patrimônios ativos na mesma transação", async () => {
    const resultado = await service.criar(
      { nome: "Inventário anual", comissaoId: COMISSAO_ID },
      IDENTIDADE,
    );

    expect(repository.executarTransacao).toHaveBeenCalledTimes(1);
    expect(repository.criarItens).toHaveBeenCalledWith(
      INVENTARIO_ID,
      [{ id: PATRIMONIO_ID, setorAtualId: SETOR_ID }],
      new Map([[SETOR_ID, SETOR_INVENTARIO_ID]]),
    );
    expect(resultado).toMatchObject({
      id: INVENTARIO_ID,
      status: "PENDENTE",
      progresso: { totalSetores: 1, totalItens: 1 },
    });
  });

  it("rejeita criação sem setor ativo antes de persistir o inventário", async () => {
    repository.bloquearSetoresAtivos.mockResolvedValue([]);

    await expect(
      service.criar(
        { nome: "Inventário anual", comissaoId: COMISSAO_ID },
        IDENTIDADE,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "INVENTARIO_SEM_SETOR_ATIVO" },
    });
    expect(repository.criarInventario).not.toHaveBeenCalled();
  });

  it("rejeita patrimônio ativo associado a setor inativo", async () => {
    repository.bloquearPatrimoniosAtivos.mockResolvedValue([
      {
        id: PATRIMONIO_ID,
        setorAtualId: "00000000-0000-4000-8000-000000000099",
      },
    ]);

    await expect(
      service.criar(
        { nome: "Inventário anual", comissaoId: COMISSAO_ID },
        IDENTIDADE,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "PATRIMONIO_ATIVO_EM_SETOR_INATIVO" },
    });
    expect(repository.criarInventario).not.toHaveBeenCalled();
  });
});
