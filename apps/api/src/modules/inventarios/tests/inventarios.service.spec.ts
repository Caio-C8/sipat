import type { IdentidadeAutenticada } from "@repo/contracts";
import type { ComissoesService } from "../../comissoes/comissoes.service";
import { InventariosRepository } from "../inventarios.repository";
import { InventariosService } from "../inventarios.service";

const IDENTIDADE: IdentidadeAutenticada = {
  id: "00000000-0000-4000-8000-000000000001",
  nome: "Diretor",
  email: "diretor@example.com",
  perfil: "DIRETOR_PATRIMONIO",
  trocaSenhaObrigatoria: false,
};
const COMISSAO_ID = "00000000-0000-4000-8000-000000000002";
const INVENTARIO_ID = "00000000-0000-4000-8000-000000000003";
const SETOR_ID = "00000000-0000-4000-8000-000000000004";
const SETOR_INVENTARIO_ID = "00000000-0000-4000-8000-000000000005";
const PATRIMONIO_ID = "00000000-0000-4000-8000-000000000006";
const ITEM_ID = "00000000-0000-4000-8000-000000000007";
const SETOR_ENCONTRADO_ID = "00000000-0000-4000-8000-000000000008";
const CHAVE_IDEMPOTENCIA = "00000000-0000-4000-8000-000000000009";

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
    obterProgressosSetores: jest.fn(),
    bloquearInventario: jest.fn(),
    bloquearSetorInventario: jest.fn(),
    bloquearItemPorNumero: jest.fn(),
    bloquearItem: jest.fn(),
    iniciarInventario: jest.fn(),
    iniciarSetor: jest.fn(),
    verificarItem: jest.fn(),
    buscarItem: jest.fn(),
    buscarSetorInventario: jest.fn(),
    buscarSetorPorId: jest.fn(),
    buscarTransferenciaPosterior: jest.fn(),
    bloquearUltimaLocalizacaoPosterior: jest.fn(),
    criarLocalizacaoPosterior: jest.fn(),
    corrigirRetorno: jest.fn(),
    corrigirComTransferencia: jest.fn(),
    corrigirLocalizacaoPosteriorRetorno: jest.fn(),
    corrigirLocalizacaoPosteriorComTransferencia: jest.fn(),
    concluirItensPendentes: jest.fn(),
    contarAusenciasSemJustificativaVigente: jest.fn(),
    concluirSetor: jest.fn(),
    contarSetoresNaoConcluidos: jest.fn(),
    contarCorrecoesPendentes: jest.fn(),
    finalizarInventario: jest.fn(),
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
    repository.bloquearInventario.mockResolvedValue({
      id: INVENTARIO_ID,
      status: "PENDENTE",
      comissaoId: COMISSAO_ID,
    });
    repository.bloquearSetorInventario.mockResolvedValue({
      id: SETOR_INVENTARIO_ID,
      inventarioId: INVENTARIO_ID,
      setorId: SETOR_ID,
      status: "PENDENTE",
    });
    repository.buscarSetorInventario.mockResolvedValue({
      id: SETOR_INVENTARIO_ID,
      status: "EM_ANDAMENTO",
      dataInicio: new Date(),
      dataFim: null,
      iniciadoPorId: IDENTIDADE.id,
      concluidoPorId: null,
      setor: { id: SETOR_ID, nome: "Almoxarifado" },
    });
    repository.obterProgressosSetores.mockResolvedValue(
      new Map([
        [
          SETOR_INVENTARIO_ID,
          {
            totalItens: 1,
            itensPendentes: 1,
            itensVerificados: 0,
            corretos: 0,
            divergencias: 0,
            naoLocalizados: 0,
          },
        ],
      ]),
    );
    repository.contarAusenciasSemJustificativaVigente.mockResolvedValue(0);
    repository.bloquearUltimaLocalizacaoPosterior.mockResolvedValue(null);
  });

  it("materializa setores e patrimônios ativos na mesma transação", async () => {
    const resultado = await service.criar(
      {
        chaveIdempotencia: CHAVE_IDEMPOTENCIA,
        nome: "Inventário anual",
        comissaoId: COMISSAO_ID,
      },
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
        {
          chaveIdempotencia: CHAVE_IDEMPOTENCIA,
          nome: "Inventário anual",
          comissaoId: COMISSAO_ID,
        },
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
        {
          chaveIdempotencia: CHAVE_IDEMPOTENCIA,
          nome: "Inventário anual",
          comissaoId: COMISSAO_ID,
        },
        IDENTIDADE,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "PATRIMONIO_ATIVO_EM_SETOR_INATIVO" },
    });
    expect(repository.criarInventario).not.toHaveBeenCalled();
  });

  it("inicia o primeiro setor e o inventário no mesmo commit", async () => {
    const resultado = await service.iniciarSetor(
      INVENTARIO_ID,
      SETOR_INVENTARIO_ID,
      IDENTIDADE,
    );

    expect(repository.iniciarInventario).toHaveBeenCalledWith(
      INVENTARIO_ID,
      expect.any(Date),
      IDENTIDADE.id,
    );
    expect(repository.iniciarSetor).toHaveBeenCalledWith(
      SETOR_INVENTARIO_ID,
      expect.any(Date),
      IDENTIDADE.id,
    );
    expect(resultado).toMatchObject({ status: "EM_ANDAMENTO" });
  });

  it("registra divergência e preserva a população fixa", async () => {
    repository.bloquearInventario.mockResolvedValue({
      id: INVENTARIO_ID,
      status: "EM_ANDAMENTO",
      comissaoId: COMISSAO_ID,
    });
    repository.bloquearSetorInventario.mockResolvedValue({
      id: SETOR_INVENTARIO_ID,
      inventarioId: INVENTARIO_ID,
      setorId: SETOR_ENCONTRADO_ID,
      status: "EM_ANDAMENTO",
    });
    repository.bloquearItemPorNumero.mockResolvedValue({
      id: ITEM_ID,
      inventarioId: INVENTARIO_ID,
      patrimonioId: PATRIMONIO_ID,
      setorEsperadoId: SETOR_ID,
      setorEncontradoId: null,
      statusVerificacao: "PENDENTE",
      situacao: null,
      statusCorrecao: null,
      dataVerificacao: null,
      patrimonioStatus: "ATIVO",
      patrimonioSetorAtualId: SETOR_ID,
    });
    repository.buscarItem.mockResolvedValue({ id: ITEM_ID });

    await expect(
      service.verificarItem(
        INVENTARIO_ID,
        SETOR_INVENTARIO_ID,
        { numeroPatrimonial: "1001" },
        IDENTIDADE,
      ),
    ).resolves.toMatchObject({ tipo: "CONFERENCIA_REGISTRADA" });
    expect(repository.verificarItem).toHaveBeenCalledWith(
      ITEM_ID,
      expect.objectContaining({
        situacao: "DIVERGENCIA",
        setorEncontradoId: SETOR_ENCONTRADO_ID,
        statusPatrimonio: "ATIVO",
      }),
    );
  });

  it("registra localização posterior sem sobrescrever o item não localizado", async () => {
    repository.bloquearInventario.mockResolvedValue({
      id: INVENTARIO_ID,
      status: "EM_ANDAMENTO",
      comissaoId: COMISSAO_ID,
    });
    repository.bloquearSetorInventario.mockResolvedValue({
      id: SETOR_INVENTARIO_ID,
      inventarioId: INVENTARIO_ID,
      setorId: SETOR_ENCONTRADO_ID,
      status: "EM_ANDAMENTO",
    });
    repository.bloquearItemPorNumero.mockResolvedValue({
      id: ITEM_ID,
      inventarioId: INVENTARIO_ID,
      patrimonioId: PATRIMONIO_ID,
      setorEsperadoId: SETOR_ID,
      setorEncontradoId: null,
      statusVerificacao: "VERIFICADO",
      situacao: "NAO_LOCALIZADO",
      statusCorrecao: null,
      dataVerificacao: new Date("2026-10-30T12:00:00.000Z"),
      patrimonioStatus: "ATIVO",
      patrimonioSetorAtualId: SETOR_ID,
    });
    repository.buscarItem.mockResolvedValue({ id: ITEM_ID });

    await expect(
      service.verificarItem(
        INVENTARIO_ID,
        SETOR_INVENTARIO_ID,
        { numeroPatrimonial: "1001" },
        IDENTIDADE,
      ),
    ).resolves.toMatchObject({ tipo: "LOCALIZACAO_POSTERIOR_REGISTRADA" });
    expect(repository.verificarItem).not.toHaveBeenCalled();
    expect(repository.criarLocalizacaoPosterior).toHaveBeenCalledWith(
      expect.objectContaining({
        itemInventarioId: ITEM_ID,
        inventarioId: INVENTARIO_ID,
        setorInventarioEncontradoId: SETOR_INVENTARIO_ID,
        usuarioId: IDENTIDADE.id,
      }),
    );
  });

  it("corrige localização posterior por retorno ou transferência sem alterar o resultado original", async () => {
    repository.bloquearInventario.mockResolvedValue({
      id: INVENTARIO_ID,
      status: "EM_ANDAMENTO",
      comissaoId: COMISSAO_ID,
    });
    repository.bloquearItem.mockResolvedValue({
      id: ITEM_ID,
      inventarioId: INVENTARIO_ID,
      patrimonioId: PATRIMONIO_ID,
      setorEsperadoId: SETOR_ID,
      setorEncontradoId: null,
      statusVerificacao: "VERIFICADO",
      situacao: "NAO_LOCALIZADO",
      statusCorrecao: null,
      dataVerificacao: new Date("2026-10-30T12:00:00.000Z"),
      patrimonioStatus: "ATIVO",
      patrimonioSetorAtualId: SETOR_ID,
    });
    repository.bloquearUltimaLocalizacaoPosterior.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000009",
      itemInventarioId: ITEM_ID,
      setorInventarioEncontradoId: SETOR_INVENTARIO_ID,
      setorEncontradoId: SETOR_ENCONTRADO_ID,
      statusCorrecao: "PENDENTE",
    });
    repository.buscarItem.mockResolvedValue({ id: ITEM_ID });

    await service.corrigirItem(
      INVENTARIO_ID,
      ITEM_ID,
      { tipoCorrecao: "TRANSFERENCIA_CADASTRAL" },
      IDENTIDADE,
    );

    expect(
      repository.corrigirLocalizacaoPosteriorComTransferencia,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        patrimonioId: PATRIMONIO_ID,
        setorAntigoId: SETOR_ID,
        setorAtualId: SETOR_ENCONTRADO_ID,
      }),
    );
    expect(repository.corrigirComTransferencia).not.toHaveBeenCalled();

    await service.corrigirItem(
      INVENTARIO_ID,
      ITEM_ID,
      { tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO" },
      IDENTIDADE,
    );
    expect(repository.corrigirLocalizacaoPosteriorRetorno).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000009",
      expect.any(Date),
      IDENTIDADE.id,
      undefined,
    );
    expect(repository.corrigirRetorno).not.toHaveBeenCalled();
  });

  it("cria transferência e corrige a divergência atomicamente", async () => {
    repository.bloquearInventario.mockResolvedValue({
      id: INVENTARIO_ID,
      status: "EM_ANDAMENTO",
      comissaoId: COMISSAO_ID,
    });
    repository.bloquearItem.mockResolvedValue({
      id: ITEM_ID,
      inventarioId: INVENTARIO_ID,
      patrimonioId: PATRIMONIO_ID,
      setorEsperadoId: SETOR_ID,
      setorEncontradoId: SETOR_ENCONTRADO_ID,
      statusVerificacao: "VERIFICADO",
      situacao: "DIVERGENCIA",
      statusCorrecao: "PENDENTE",
      dataVerificacao: new Date(),
      patrimonioStatus: "ATIVO",
      patrimonioSetorAtualId: SETOR_ID,
    });
    repository.buscarItem.mockResolvedValue({ id: ITEM_ID });

    await service.corrigirItem(
      INVENTARIO_ID,
      ITEM_ID,
      { tipoCorrecao: "TRANSFERENCIA_CADASTRAL" },
      IDENTIDADE,
    );

    expect(repository.corrigirComTransferencia).toHaveBeenCalledWith(
      expect.objectContaining({
        itemInventarioId: ITEM_ID,
        patrimonioId: PATRIMONIO_ID,
        setorAntigoId: SETOR_ID,
        setorAtualId: SETOR_ENCONTRADO_ID,
        comissaoId: COMISSAO_ID,
      }),
    );
  });

  it("exige confirmação para finalizar com correções pendentes", async () => {
    repository.bloquearInventario.mockResolvedValue({
      id: INVENTARIO_ID,
      status: "EM_ANDAMENTO",
      comissaoId: COMISSAO_ID,
    });
    repository.contarSetoresNaoConcluidos.mockResolvedValue(0);
    repository.contarCorrecoesPendentes.mockResolvedValue(1);

    await expect(
      service.finalizar(
        INVENTARIO_ID,
        { confirmarCorrecoesPendentes: false },
        IDENTIDADE,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "CORRECAO_ITEM_INVENTARIO_INCOMPATIVEL" },
    });
    expect(repository.finalizarInventario).not.toHaveBeenCalled();
  });
});
