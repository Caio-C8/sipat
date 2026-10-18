import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import {
  CriarPatrimonioBodySchema,
  DataCivilSchema,
  Decimal19_7Schema,
  ListarPatrimoniosQuerySchema,
  PatrimonioDetalheSchema,
  PatrimonioParamsSchema,
  PatrimonioResumoSchema,
  SubstituirNumeroPatrimonialBodySchema,
} from "../index";

const uuids = {
  patrimonio: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
  setor: "d4f7ccde-d880-4881-a547-a5c34bf263b2",
  responsavel: "47c53ba5-2ea3-494a-b5ea-b1b52181b752",
  especie: "e288f366-9f8e-46f9-804c-d5876aa74c78",
  natureza: "f93101e7-d480-4afd-968d-ddbdc5143286",
  processo: "7041c62b-5f83-432c-a178-889977d839b1",
} as const;

const patrimonioResumo = {
  id: uuids.patrimonio,
  numeroPatrimonio: "1",
  tipoNumeroPatrimonial: "OFICIAL",
  descricao: "COMPUTADOR",
  marca: "FABRICANTE",
  modelo: null,
  numeroSerie: "SERIE-1",
  status: "ATIVO",
  setorAtual: {
    id: uuids.setor,
    nome: "Tecnologia",
    responsavel: {
      id: uuids.responsavel,
      nome: "Maria da Silva",
    },
  },
  especie: {
    id: uuids.especie,
    nome: "Computador",
    natureza: {
      id: uuids.natureza,
      nome: "Equipamento de processamento de dados",
    },
  },
} as const;

const patrimonioDetalhe = {
  ...patrimonioResumo,
  dataTombamento: "2026-10-18",
  tipoIncorporacao: "AQUISICAO",
  valorIncorporacao: "12345.6700000",
  processoCompra: {
    id: uuids.processo,
    numeroProcesso: "123/2026",
    anoProcesso: 2026,
  },
  situacaoContabil: {
    valorBrutoAtual: "12345.6700000",
    depreciacaoAcumuladaAtual: "0",
  },
  parametroDepreciacaoAtual: {
    metodo: "LINEAR",
    vidaUtilInicialMeses: 60,
    percentualResidual: "10.00",
    valorResidual: "1234.567",
    valorBaseInicial: "12345.6700000",
    dataInicio: "2026-10-18",
    dataFim: null,
  },
  createdAt: "2026-10-18T12:00:00.000Z",
  updatedAt: null,
} as const;

function criarBodyValido() {
  return {
    semNumeroOficial: false,
    dataTombamento: "2026-10-18",
    tipoIncorporacao: "AQUISICAO",
    descricao: "  Computador portátil  ",
    marca: "  Fabricante  ",
    modelo: "Modelo 1",
    numeroSerie: "Serie 1",
    valorIncorporacao: "12345.6700000",
    especieId: uuids.especie,
    setorAtualId: uuids.setor,
    processoCompraId: uuids.processo,
    parametrosDepreciacao: {
      metodo: "LINEAR",
      vidaUtilInicialMeses: 60,
      percentualResidual: "10.00",
      valorResidual: "1234.567",
      valorBaseInicial: "12345.6700000",
      dataInicio: "2026-10-18",
    },
  };
}

describe("contratos de patrimônios", () => {
  it("aceita e normaliza somente a representação aprovada do cadastro", () => {
    const resultado = parseValido(CriarPatrimonioBodySchema, criarBodyValido());

    assert.equal(resultado.descricao, "Computador portátil");
    assert.equal(resultado.marca, "Fabricante");
    assert.equal(resultado.valorIncorporacao, "12345.6700000");
  });

  it("torna o bloco inicial de depreciação realmente opcional", () => {
    const entrada: Partial<ReturnType<typeof criarBodyValido>> =
      criarBodyValido();
    delete entrada.parametrosDepreciacao;

    const resultado = parseValido(CriarPatrimonioBodySchema, entrada);
    assert.equal(resultado.parametrosDepreciacao, undefined);
  });

  it("rejeita campos controlados pelo servidor e propriedades extras", () => {
    for (const campo of [
      "numeroPatrimonio",
      "tipoNumeroPatrimonial",
      "status",
      "textoBusca",
      "createdAt",
      "updatedAt",
      "createdById",
    ] as const) {
      esperaInvalido(CriarPatrimonioBodySchema, {
        ...criarBodyValido(),
        [campo]: "valor-controlado",
      });
    }

    esperaInvalido(CriarPatrimonioBodySchema, {
      ...criarBodyValido(),
      parametrosDepreciacao: {
        ...criarBodyValido().parametrosDepreciacao,
        patrimonioId: uuids.patrimonio,
      },
    });
  });

  it("valida datas civis sem conversão de fuso e decimais sem perda", () => {
    assert.equal(parseValido(DataCivilSchema, "2024-02-29"), "2024-02-29");
    assert.equal(
      parseValido(Decimal19_7Schema, "999999999999.9999999"),
      "999999999999.9999999",
    );

    esperaInvalidos(DataCivilSchema, [
      "2023-02-29",
      "2026-2-01",
      "2026-10-18T00:00:00.000Z",
    ]);
    esperaInvalidos(Decimal19_7Schema, [
      1,
      "01",
      "1e3",
      "1000000000000",
      "1.12345678",
      "-1",
    ]);
    esperaInvalido(
      CriarPatrimonioBodySchema,
      {
        ...criarBodyValido(),
        valorIncorporacao: "0.0000000",
      },
      "valorIncorporacao",
    );
  });

  it("aplica paginação, busca e todos os filtros da listagem", () => {
    assert.deepEqual(
      parseValido(ListarPatrimoniosQuerySchema, {
        busca: "  computador  ",
        status: "ATIVO",
        setorId: uuids.setor,
        especieId: uuids.especie,
        naturezaId: uuids.natureza,
        tipoNumeroPatrimonial: "SEM_NUMERO_OFICIAL",
      }),
      {
        pagina: 1,
        limite: 20,
        busca: "computador",
        status: "ATIVO",
        setorId: uuids.setor,
        especieId: uuids.especie,
        naturezaId: uuids.natureza,
        tipoNumeroPatrimonial: "SEM_NUMERO_OFICIAL",
      },
    );

    esperaInvalidos(ListarPatrimoniosQuerySchema, [
      { limite: "51" },
      { busca: " " },
      { busca: "a".repeat(201) },
      { status: "INATIVO" },
      { setorId: "invalido" },
      { tipoNumeroPatrimonial: "SP" },
      { filtroDesconhecido: "valor" },
    ]);
  });

  it("valida o parâmetro UUID e exige somente o número oficial atual", () => {
    assert.deepEqual(
      parseValido(PatrimonioParamsSchema, { patrimonioId: uuids.patrimonio }),
      { patrimonioId: uuids.patrimonio },
    );
    assert.deepEqual(
      parseValido(SubstituirNumeroPatrimonialBodySchema, {
        numeroPatrimonioAtual: "123",
      }),
      { numeroPatrimonioAtual: "123" },
    );

    esperaInvalidos(SubstituirNumeroPatrimonialBodySchema, [
      { numeroPatrimonioAtual: "000123" },
      { numeroPatrimonioAtual: "SP-123" },
      { numeroPatrimonioAtual: "000.123" },
      { numeroPatrimonioAtual: "123", numeroPatrimonioNovo: "124" },
    ]);
    esperaInvalido(PatrimonioParamsSchema, { patrimonioId: "invalido" });
  });

  it("valida responses resumida e detalhada como allowlists estritas", () => {
    assert.deepEqual(
      parseValido(PatrimonioResumoSchema, patrimonioResumo),
      patrimonioResumo,
    );
    assert.deepEqual(
      parseValido(PatrimonioDetalheSchema, patrimonioDetalhe),
      patrimonioDetalhe,
    );

    esperaInvalido(PatrimonioResumoSchema, {
      ...patrimonioResumo,
      textoBusca: "CAMPO INTERNO",
    });
    esperaInvalido(PatrimonioDetalheSchema, {
      ...patrimonioDetalhe,
      createdById: uuids.responsavel,
    });
  });

  it("mantém número canônico coerente com o tipo explícito da response", () => {
    assert.equal(
      parseValido(PatrimonioResumoSchema, {
        ...patrimonioResumo,
        numeroPatrimonio: "SP-1",
        tipoNumeroPatrimonial: "SEM_NUMERO_OFICIAL",
      }).numeroPatrimonio,
      "SP-1",
    );

    esperaInvalido(
      PatrimonioResumoSchema,
      {
        ...patrimonioResumo,
        numeroPatrimonio: "SP-000001",
        tipoNumeroPatrimonial: "SEM_NUMERO_OFICIAL",
      },
      "numeroPatrimonio",
    );
    esperaInvalido(
      PatrimonioResumoSchema,
      {
        ...patrimonioResumo,
        numeroPatrimonio: "SP-1",
        tipoNumeroPatrimonial: "OFICIAL",
      },
      "numeroPatrimonio",
    );
  });
});
