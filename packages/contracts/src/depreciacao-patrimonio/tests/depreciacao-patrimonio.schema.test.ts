import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import { PatrimonioParamsSchema } from "../../patrimonio";
import {
  CODIGOS_ERRO_DEPRECIACAO_PATRIMONIO,
  CodigoErroDepreciacaoPatrimonioSchema,
  CompetenciaMensalSchema,
  ExecutarDepreciacaoPatrimonioBodySchema,
  ExecutarDepreciacaoPatrimonioResponseSchema,
  ExecutarDepreciacoesEmMassaBodySchema,
  ExecutarDepreciacoesEmMassaResponseSchema,
  ItemDepreciacaoPendenteSchema,
  ListarDepreciacoesPendentesQuerySchema,
  ListarDepreciacoesPendentesResponseSchema,
  MOTIVOS_INELEGIBILIDADE_DEPRECIACAO,
  MotivoInelegibilidadeDepreciacaoSchema,
  ResultadoDepreciacaoIndividualSchema,
  ResultadoDepreciacoesEmMassaSchema,
} from "..";

const ids = {
  depreciacao: "36db147d-0f25-4da4-8ab2-45e1c038d85a",
  patrimonio: "7041c62b-5f83-432c-a178-889977d839b1",
  comissao: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
  usuario: "d4f7ccde-d880-4881-a547-a5c34bf263b2",
} as const;

const bodyExecucao = {
  competencia: "2026-10",
  comissaoId: ids.comissao,
  confirmarIgnorarValorResidual: false,
} as const;

const itemPendente = {
  patrimonioId: ids.patrimonio,
  numeroPatrimonio: "12345",
  descricao: "Notebook para uso administrativo",
  status: "ATIVO",
  valorBrutoAtual: "10000.0000000",
  depreciacaoAcumuladaAtual: "2500.1234567",
  valorLiquidoAtual: "7499.8765433",
  valorResidual: "1000.0000000",
  vidaUtilRestanteMeses: 24,
  quotaPrevista: "270.8281893",
  atingiraValorResidual: false,
} as const;

const depreciacaoRealizada = {
  resultado: "DEPRECIADO",
  id: ids.depreciacao,
  competencia: "2026-10",
  dataDepreciacao: "2026-10-27T15:30:00.000Z",
  valorContabilAnterior: "7499.8765433",
  valorDepreciado: "270.8281893",
  valorContabilNovo: "7229.0483540",
  patrimonio: {
    id: ids.patrimonio,
    numeroPatrimonio: "12345",
    descricao: "Notebook para uso administrativo",
  },
  comissao: {
    id: ids.comissao,
    nome: "Comissão de avaliação patrimonial",
  },
  createdById: ids.usuario,
  createdAt: "2026-10-27T15:30:00.000Z",
} as const;

const resultadoEmMassa = {
  competencia: "2026-10",
  comissao: {
    id: ids.comissao,
    nome: "Comissão de avaliação patrimonial",
  },
  dataDepreciacao: "2026-10-27T15:30:00.000Z",
  quantidadeProcessada: 120,
  quantidadeAtingiuValorResidual: 3,
  quantidadesInelegiveis: {
    baixado: 2,
    semParametroVigente: 4,
    dataInicioNaoAtingida: 1,
    jaDepreciadoNaCompetencia: 5,
    valorResidualAtingido: 6,
  },
} as const;

describe("primitive e entradas da depreciação patrimonial", () => {
  it("aceita somente competência mensal canônica", () => {
    assert.equal(parseValido(CompetenciaMensalSchema, "2026-01"), "2026-01");
    assert.equal(parseValido(CompetenciaMensalSchema, "2026-12"), "2026-12");

    esperaInvalidos(CompetenciaMensalSchema, [
      "2026-00",
      "2026-13",
      "2026-1",
      "026-01",
      "2026-01-01",
      "2026-01T00:00:00.000Z",
      " 2026-01",
      "2026-01 ",
      "",
      null,
      undefined,
    ]);
  });

  it("aplica paginação 20/50 à consulta e preserva input e output distintos", () => {
    assert.deepEqual(
      parseValido(ListarDepreciacoesPendentesQuerySchema, {
        competencia: "2026-10",
      }),
      { competencia: "2026-10", pagina: 1, limite: 20 },
    );

    assert.deepEqual(
      parseValido(ListarDepreciacoesPendentesQuerySchema, {
        competencia: "2026-10",
        pagina: "2",
        limite: "50",
      }),
      { competencia: "2026-10", pagina: 2, limite: 50 },
    );

    esperaInvalidos(ListarDepreciacoesPendentesQuerySchema, [
      { competencia: "2026-10", limite: "51" },
      { competencia: "2026-10", limite: 20 },
      { competencia: "2026-10", pagina: "0" },
      { competencia: "2026-10", status: "ATIVO" },
      { competencia: "2026-10", patrimonioIds: [ids.patrimonio] },
    ]);
  });

  it("mantém bodies individual e em massa estritos, separados e equivalentes", () => {
    assert.deepEqual(
      parseValido(ExecutarDepreciacaoPatrimonioBodySchema, bodyExecucao),
      bodyExecucao,
    );
    assert.deepEqual(
      parseValido(ExecutarDepreciacoesEmMassaBodySchema, bodyExecucao),
      bodyExecucao,
    );

    for (const schema of [
      ExecutarDepreciacaoPatrimonioBodySchema,
      ExecutarDepreciacoesEmMassaBodySchema,
    ]) {
      esperaInvalidos(schema, [
        {
          competencia: bodyExecucao.competencia,
          comissaoId: bodyExecucao.comissaoId,
        },
        { ...bodyExecucao, confirmarIgnorarValorResidual: "false" },
        { ...bodyExecucao, confirmarIgnorarValorResidual: null },
        { ...bodyExecucao, comissaoId: "invalido" },
        { ...bodyExecucao, patrimonioId: ids.patrimonio },
        { ...bodyExecucao, patrimonioIds: [ids.patrimonio] },
        { ...bodyExecucao, quantidade: 1 },
        { ...bodyExecucao, valorDepreciado: "1.0000000" },
        { ...bodyExecucao, parametroDepreciacaoId: ids.depreciacao },
        { ...bodyExecucao, createdById: ids.usuario },
      ]);
    }
  });

  it("reutiliza params patrimoniais estritos para a execução individual", () => {
    assert.deepEqual(
      parseValido(PatrimonioParamsSchema, {
        patrimonioId: ids.patrimonio,
      }),
      { patrimonioId: ids.patrimonio },
    );

    esperaInvalidos(PatrimonioParamsSchema, [
      { patrimonioId: "invalido" },
      { patrimonioId: ids.patrimonio, outro: "campo" },
    ]);
  });

  it("publica catálogos fechados de motivos e códigos de erro", () => {
    assert.deepEqual(
      MotivoInelegibilidadeDepreciacaoSchema.options,
      MOTIVOS_INELEGIBILIDADE_DEPRECIACAO,
    );
    assert.deepEqual(
      CodigoErroDepreciacaoPatrimonioSchema.options,
      CODIGOS_ERRO_DEPRECIACAO_PATRIMONIO,
    );
    esperaInvalido(MotivoInelegibilidadeDepreciacaoSchema, "OUTRO");
    esperaInvalido(CodigoErroDepreciacaoPatrimonioSchema, "ERRO_INTERNO");
  });
});

describe("responses da depreciação patrimonial", () => {
  it("aceita item pendente serializado com até sete casas decimais", () => {
    assert.deepEqual(
      parseValido(ItemDepreciacaoPendenteSchema, itemPendente),
      itemPendente,
    );

    esperaInvalidos(ItemDepreciacaoPendenteSchema, [
      { ...itemPendente, quotaPrevista: "270.12345678" },
      { ...itemPendente, valorLiquidoAtual: 7499.87 },
      { ...itemPendente, valorResidual: "01.0000000" },
      { ...itemPendente, vidaUtilRestanteMeses: 0 },
      { ...itemPendente, status: "BAIXADO" },
      { ...itemPendente, parametroDepreciacaoId: ids.depreciacao },
    ]);
  });

  it("preserva metadata comum e acrescenta resumo agregado à prévia", () => {
    const response = {
      status: 200,
      sucesso: true,
      mensagem: "Pendências consultadas com sucesso.",
      dados: [itemPendente],
      meta: { total: 1, pagina: 1, ultimaPagina: 1, limite: 20 },
      resumo: { totalElegiveis: 1, totalNoValorResidual: 6 },
    } as const;

    assert.deepEqual(
      parseValido(ListarDepreciacoesPendentesResponseSchema, response),
      response,
    );

    esperaInvalidos(ListarDepreciacoesPendentesResponseSchema, [
      { ...response, resumo: undefined },
      { ...response, resumo: { ...response.resumo, total: 7 } },
      {
        ...response,
        dados: [...response.dados, { ...itemPendente }],
        meta: { total: 1, pagina: 1, ultimaPagina: 1, limite: 1 },
      },
    ]);
  });

  it("discrimina depreciação criada de um único motivo de inelegibilidade", () => {
    assert.deepEqual(
      parseValido(ResultadoDepreciacaoIndividualSchema, depreciacaoRealizada),
      depreciacaoRealizada,
    );

    for (const motivo of MOTIVOS_INELEGIBILIDADE_DEPRECIACAO) {
      assert.deepEqual(
        parseValido(ResultadoDepreciacaoIndividualSchema, {
          resultado: "INELEGIVEL",
          motivo,
        }),
        { resultado: "INELEGIVEL", motivo },
      );
    }

    esperaInvalidos(ResultadoDepreciacaoIndividualSchema, [
      { resultado: "INELEGIVEL", motivo: "OUTRO" },
      {
        resultado: "INELEGIVEL",
        motivo: "BAIXADO",
        patrimonioId: ids.patrimonio,
      },
      { ...depreciacaoRealizada, dataDepreciacao: new Date() },
      { ...depreciacaoRealizada, createdAt: undefined },
      { ...depreciacaoRealizada, parametroDepreciacaoId: ids.depreciacao },
    ]);
  });

  it("aceita os envelopes da execução individual", () => {
    for (const dados of [
      depreciacaoRealizada,
      { resultado: "INELEGIVEL", motivo: "VALOR_RESIDUAL_ATINGIDO" },
    ] as const) {
      const response = {
        status: 200,
        sucesso: true,
        mensagem: "Execução individual concluída.",
        dados,
      } as const;

      assert.deepEqual(
        parseValido(ExecutarDepreciacaoPatrimonioResponseSchema, response),
        response,
      );
    }
  });

  it("mantém o resultado em massa finito e composto somente por agregados", () => {
    assert.deepEqual(
      parseValido(ResultadoDepreciacoesEmMassaSchema, resultadoEmMassa),
      resultadoEmMassa,
    );

    const response = {
      status: 200,
      sucesso: true,
      mensagem: "Depreciações executadas com sucesso.",
      dados: resultadoEmMassa,
    } as const;
    assert.deepEqual(
      parseValido(ExecutarDepreciacoesEmMassaResponseSchema, response),
      response,
    );

    esperaInvalidos(ResultadoDepreciacoesEmMassaSchema, [
      { ...resultadoEmMassa, quantidadeProcessada: -1 },
      {
        ...resultadoEmMassa,
        quantidadesInelegiveis: {
          ...resultadoEmMassa.quantidadesInelegiveis,
          outro: 1,
        },
      },
      { ...resultadoEmMassa, depreciacoes: [depreciacaoRealizada] },
      { ...resultadoEmMassa, patrimonioIds: [ids.patrimonio] },
    ]);
  });
});
