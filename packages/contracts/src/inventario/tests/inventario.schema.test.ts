import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import {
  CODIGOS_ERRO_INVENTARIO,
  CodigoErroInventarioSchema,
  ConcluirSetorInventarioBodySchema,
  CorrigirItemInventarioBodySchema,
  CriarInventarioBodySchema,
  FinalizarInventarioBodySchema,
  InventarioDetalheSchema,
  InventarioParamsSchema,
  ItemInventarioParamsSchema,
  ItemInventarioResponseSchema,
  ItemJaVerificadoOutroSetorResponseSchema,
  IniciarSetorInventarioBodySchema,
  ListarInventariosQuerySchema,
  ListarItensInventarioQuerySchema,
  ListarSetoresInventarioQuerySchema,
  ProgressoInventarioSchema,
  SetorInventarioParamsSchema,
  StatusInventarioSchema,
  TipoCorrecaoItemInventarioSchema,
  VerificarItemInventarioBodySchema,
  VerificarItemInventarioResultadoSchema,
  type CriarInventarioBodyData,
  type CriarInventarioBodyInput,
} from "../index";

const ids = {
  inventario: "7041c62b-5f83-432c-a178-889977d839b1",
  comissao: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
  setorInventario: "d4f7ccde-d880-4881-a547-a5c34bf263b2",
  itemInventario: "cd852ee6-63f1-46f6-98ae-d1ea5d5c6bed",
  patrimonio: "7a1a9e90-67cf-4bab-b445-4bcfba82d3dd",
  setorEsperado: "8c1a5c23-4e58-49f6-9a0f-4a2e1532c219",
  setorEncontrado: "3c76275f-3f95-4a5c-8c68-a0a5f2bec9f5",
  usuario: "b3ca2dc2-6f78-486d-a7d2-dfd4b8a503ea",
  transferencia: "e7d68164-b4d6-4a99-83fd-bdcb9fd557f1",
  emprestimo: "b9270b14-d96f-4a26-aa85-b1a284e23b91",
} as const;

const progressoVazio = {
  totalSetores: 2,
  setoresPendentes: 2,
  setoresEmAndamento: 0,
  setoresConcluidos: 0,
  totalItens: 0,
  itensPendentes: 0,
  itensVerificados: 0,
  corretos: 0,
  divergencias: 0,
  naoLocalizados: 0,
  correcoesPendentes: 0,
  correcoesCorrigidas: 0,
} as const;

const itemBase = {
  id: ids.itemInventario,
  patrimonio: {
    id: ids.patrimonio,
    numeroPatrimonio: "123",
    descricao: "Notebook",
  },
  setorEsperado: { id: ids.setorEsperado, nome: "Contabilidade" },
  observacao: null,
} as const;

const itemDivergentePendente = {
  ...itemBase,
  statusVerificacao: "VERIFICADO",
  situacao: "DIVERGENCIA",
  setorEncontrado: { id: ids.setorEncontrado, nome: "Financeiro" },
  dataVerificacao: "2026-10-24T12:00:00.000Z",
  verificadoPorId: ids.usuario,
  statusPatrimonioNaVerificacao: "ATIVO",
  ausenciaJustificada: null,
  statusCorrecao: "PENDENTE",
  tipoCorrecao: null,
  dataCorrecao: null,
  corrigidoPorId: null,
  transferenciaCorrecaoId: null,
} as const;

describe("contratos de inventários", () => {
  it("expõe os enums do domínio e os códigos públicos estáveis", () => {
    assert.equal(
      parseValido(StatusInventarioSchema, "FINALIZADO"),
      "FINALIZADO",
    );
    assert.equal(
      parseValido(TipoCorrecaoItemInventarioSchema, "TRANSFERENCIA_CADASTRAL"),
      "TRANSFERENCIA_CADASTRAL",
    );
    assert.deepEqual(
      CodigoErroInventarioSchema.options,
      CODIGOS_ERRO_INVENTARIO,
    );
    esperaInvalido(StatusInventarioSchema, "CANCELADO");
    esperaInvalido(CodigoErroInventarioSchema, "ERRO_INTERNO");
  });

  it("aceita criação mínima e completa sem campos derivados pelo servidor", () => {
    const entrada: CriarInventarioBodyInput = {
      nome: "  Inventário anual  ",
      comissaoId: ids.comissao,
    };
    const resultado: CriarInventarioBodyData = parseValido(
      CriarInventarioBodySchema,
      entrada,
    );

    assert.deepEqual(resultado, {
      nome: "Inventário anual",
      comissaoId: ids.comissao,
    });
    assert.deepEqual(
      parseValido(CriarInventarioBodySchema, {
        nome: "Inventário anual",
        descricao: "  Conferência de 2026.  ",
        observacao: "  Realizar por setor.  ",
        comissaoId: ids.comissao,
      }),
      {
        nome: "Inventário anual",
        descricao: "Conferência de 2026.",
        observacao: "Realizar por setor.",
        comissaoId: ids.comissao,
      },
    );

    esperaInvalidos(CriarInventarioBodySchema, [
      { nome: "Inventário", comissaoId: ids.comissao, status: "PENDENTE" },
      {
        nome: "Inventário",
        comissaoId: ids.comissao,
        dataInicio: "2026-10-24",
      },
      { nome: "Inventário", comissaoId: ids.comissao, setores: [] },
      { nome: "Inventário", comissaoId: ids.comissao, itens: [] },
      {
        nome: "Inventário",
        comissaoId: ids.comissao,
        createdById: ids.usuario,
      },
    ]);
  });

  it("mantém params UUID próprios e listagens paginadas com filtros finitos", () => {
    assert.deepEqual(
      parseValido(InventarioParamsSchema, { inventarioId: ids.inventario }),
      { inventarioId: ids.inventario },
    );
    assert.deepEqual(
      parseValido(SetorInventarioParamsSchema, {
        inventarioId: ids.inventario,
        setorInventarioId: ids.setorInventario,
      }),
      {
        inventarioId: ids.inventario,
        setorInventarioId: ids.setorInventario,
      },
    );
    assert.deepEqual(
      parseValido(ItemInventarioParamsSchema, {
        inventarioId: ids.inventario,
        itemInventarioId: ids.itemInventario,
      }),
      {
        inventarioId: ids.inventario,
        itemInventarioId: ids.itemInventario,
      },
    );

    assert.deepEqual(parseValido(ListarInventariosQuerySchema, {}), {
      pagina: 1,
      limite: 20,
    });
    assert.deepEqual(
      parseValido(ListarSetoresInventarioQuerySchema, { status: "CONCLUIDO" }),
      { pagina: 1, limite: 20, status: "CONCLUIDO" },
    );
    assert.deepEqual(
      parseValido(ListarItensInventarioQuerySchema, {
        pagina: "2",
        limite: "50",
        statusVerificacao: "VERIFICADO",
        situacao: "DIVERGENCIA",
        statusCorrecao: "PENDENTE",
      }),
      {
        pagina: 2,
        limite: 50,
        statusVerificacao: "VERIFICADO",
        situacao: "DIVERGENCIA",
        statusCorrecao: "PENDENTE",
      },
    );
    esperaInvalido(ListarInventariosQuerySchema, { limite: "51" }, "limite");
    esperaInvalido(ListarInventariosQuerySchema, { busca: "x".repeat(201) });
    esperaInvalido(ListarItensInventarioQuerySchema, { situacao: "AUSENTE" });
  });

  it("separa identificação, correções e finalização sem aceitar estado derivado", () => {
    assert.deepEqual(parseValido(IniciarSetorInventarioBodySchema, {}), {});
    assert.deepEqual(parseValido(ConcluirSetorInventarioBodySchema, {}), {});
    esperaInvalido(IniciarSetorInventarioBodySchema, {
      status: "EM_ANDAMENTO",
    });
    esperaInvalido(ConcluirSetorInventarioBodySchema, {
      dataFim: "2026-10-24",
    });

    assert.deepEqual(
      parseValido(VerificarItemInventarioBodySchema, {
        numeroPatrimonial: "SP-12",
      }),
      { numeroPatrimonial: "SP-12" },
    );
    esperaInvalido(VerificarItemInventarioBodySchema, {
      numeroPatrimonial: "SP-12",
      origem: "CAMERA",
    });

    assert.deepEqual(
      parseValido(CorrigirItemInventarioBodySchema, {
        tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO",
      }),
      { tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO" },
    );
    assert.deepEqual(
      parseValido(CorrigirItemInventarioBodySchema, {
        tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
        observacao: "  Cadastro alinhado ao local encontrado.  ",
      }),
      {
        tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
        observacao: "Cadastro alinhado ao local encontrado.",
      },
    );
    esperaInvalidos(CorrigirItemInventarioBodySchema, [
      {
        tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
        transferenciaCorrecaoId: ids.transferencia,
      },
      {
        tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO",
        setorDestinoId: ids.setorEsperado,
      },
      { statusCorrecao: "CORRIGIDO" },
    ]);

    assert.deepEqual(
      parseValido(FinalizarInventarioBodySchema, {
        confirmarCorrecoesPendentes: false,
      }),
      { confirmarCorrecoesPendentes: false },
    );
    esperaInvalido(FinalizarInventarioBodySchema, {});
  });

  it("valida agregados e usa DateOnly somente nas datas operacionais do inventário", () => {
    assert.deepEqual(
      parseValido(ProgressoInventarioSchema, progressoVazio),
      progressoVazio,
    );
    esperaInvalido(
      ProgressoInventarioSchema,
      {
        ...progressoVazio,
        totalItens: 1,
      },
      "totalItens",
    );

    const detalhe = {
      id: ids.inventario,
      nome: "Inventário anual",
      status: "EM_ANDAMENTO",
      dataInicio: "2026-10-24",
      dataFim: null,
      iniciadoPorId: ids.usuario,
      finalizadoPorId: null,
      comissao: { id: ids.comissao, nome: "Comissão anual" },
      progresso: progressoVazio,
      createdAt: "2026-10-24T09:00:00.000Z",
      updatedAt: null,
      descricao: null,
      observacao: null,
      createdById: ids.usuario,
    } as const;

    assert.deepEqual(parseValido(InventarioDetalheSchema, detalhe), detalhe);
    esperaInvalido(InventarioDetalheSchema, {
      ...detalhe,
      dataInicio: "2026-10-24T00:00:00.000Z",
    });
    esperaInvalido(
      InventarioDetalheSchema,
      {
        ...detalhe,
        status: "PENDENTE",
      },
      "status",
    );
    esperaInvalido(
      InventarioDetalheSchema,
      {
        ...detalhe,
        iniciadoPorId: null,
      },
      "status",
    );
    esperaInvalido(InventarioDetalheSchema, {
      ...detalhe,
      caminhoInterno: "C:/uploads/segredo",
    });
  });

  it("discrimina estados válidos de item e rejeita combinações incompatíveis", () => {
    const itemCorreto = {
      ...itemBase,
      statusVerificacao: "VERIFICADO",
      situacao: "CORRETO",
      setorEncontrado: null,
      dataVerificacao: "2026-10-24T12:00:00.000Z",
      verificadoPorId: ids.usuario,
      statusPatrimonioNaVerificacao: "ATIVO",
      ausenciaJustificada: null,
      statusCorrecao: null,
      tipoCorrecao: null,
      dataCorrecao: null,
      corrigidoPorId: null,
      transferenciaCorrecaoId: null,
    } as const;

    assert.deepEqual(
      parseValido(ItemInventarioResponseSchema, itemCorreto),
      itemCorreto,
    );
    assert.deepEqual(
      parseValido(ItemInventarioResponseSchema, itemDivergentePendente),
      itemDivergentePendente,
    );
    assert.deepEqual(
      parseValido(ItemInventarioResponseSchema, {
        ...itemDivergentePendente,
        statusCorrecao: "CORRIGIDO",
        tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
        dataCorrecao: "2026-10-24T13:00:00.000Z",
        corrigidoPorId: ids.usuario,
        transferenciaCorrecaoId: ids.transferencia,
      }),
      {
        ...itemDivergentePendente,
        statusCorrecao: "CORRIGIDO",
        tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
        dataCorrecao: "2026-10-24T13:00:00.000Z",
        corrigidoPorId: ids.usuario,
        transferenciaCorrecaoId: ids.transferencia,
      },
    );
    esperaInvalido(ItemInventarioResponseSchema, {
      ...itemDivergentePendente,
      statusCorrecao: "CORRIGIDO",
      tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO",
      dataCorrecao: "2026-10-24T13:00:00.000Z",
      corrigidoPorId: ids.usuario,
      transferenciaCorrecaoId: ids.transferencia,
    });
    esperaInvalido(ItemInventarioResponseSchema, {
      ...itemDivergentePendente,
      situacao: "CORRETO",
    });
    esperaInvalido(ItemInventarioResponseSchema, {
      ...itemDivergentePendente,
      statusPatrimonioNaVerificacao: "BAIXADO",
    });
  });

  it("preserva o snapshot e exige justificativa compatível para não localizado", () => {
    const naoLocalizado = {
      ...itemBase,
      statusVerificacao: "VERIFICADO",
      situacao: "NAO_LOCALIZADO",
      setorEncontrado: null,
      dataVerificacao: "2026-10-24T12:00:00.000Z",
      verificadoPorId: ids.usuario,
      statusPatrimonioNaVerificacao: "EMPRESTADO",
      ausenciaJustificada: {
        tipo: "EMPRESTIMO",
        emprestimoPatrimonioId: ids.emprestimo,
      },
      statusCorrecao: null,
      tipoCorrecao: null,
      dataCorrecao: null,
      corrigidoPorId: null,
      transferenciaCorrecaoId: null,
    } as const;

    assert.deepEqual(
      parseValido(ItemInventarioResponseSchema, naoLocalizado),
      naoLocalizado,
    );
    esperaInvalido(
      ItemInventarioResponseSchema,
      {
        ...naoLocalizado,
        statusPatrimonioNaVerificacao: "ATIVO",
      },
      "ausenciaJustificada",
    );
    esperaInvalido(
      ItemInventarioResponseSchema,
      {
        ...naoLocalizado,
        ausenciaJustificada: null,
      },
      "ausenciaJustificada",
    );
  });

  it("distingue conferência nova, leitura idempotente e conflito em outro setor", () => {
    assert.deepEqual(
      parseValido(VerificarItemInventarioResultadoSchema, {
        tipo: "CONFERENCIA_REGISTRADA",
        item: itemDivergentePendente,
      }),
      { tipo: "CONFERENCIA_REGISTRADA", item: itemDivergentePendente },
    );
    assert.deepEqual(
      parseValido(VerificarItemInventarioResultadoSchema, {
        tipo: "LEITURA_IDEMPOTENTE",
        item: itemDivergentePendente,
      }),
      { tipo: "LEITURA_IDEMPOTENTE", item: itemDivergentePendente },
    );

    const conflito = {
      status: 409,
      sucesso: false,
      codigo: "ITEM_INVENTARIO_JA_VERIFICADO",
      mensagem: "O patrimônio já foi verificado em outro setor.",
      erros: [],
      requisicaoId: "req-123",
      dados: {
        itemInventarioId: ids.itemInventario,
        setorPrimeiraVerificacao: {
          id: ids.setorEsperado,
          nome: "Contabilidade",
        },
        verificadoEm: "2026-10-24T12:00:00.000Z",
        contextoLocalizacao: "TRANSFERENCIA_POSTERIOR_REGISTRADA",
        transferenciaId: ids.transferencia,
      },
    } as const;

    assert.deepEqual(
      parseValido(ItemJaVerificadoOutroSetorResponseSchema, conflito),
      conflito,
    );
    esperaInvalido(ItemJaVerificadoOutroSetorResponseSchema, {
      ...conflito,
      dados: {
        ...conflito.dados,
        contextoLocalizacao: "MOVIMENTACAO_FISICA_SEM_HISTORICO",
      },
    });
  });
});
