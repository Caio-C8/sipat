import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import {
  BaixaPatrimonioDetalheSchema,
  BaixarPatrimonioDadosSchema,
  BaixarPatrimonioMultipartSchema,
  BaixarPatrimonioResponseSchema,
  CAMPO_DADOS_BAIXAR_PATRIMONIO,
  CAMPO_DOCUMENTO_BAIXAR_PATRIMONIO,
  CODIGOS_ERRO_BAIXA_PATRIMONIO,
  CodigoErroBaixaPatrimonioSchema,
  ConsultarBaixaPatrimonioResponseSchema,
  EXTENSAO_DOCUMENTO_BAIXA_PATRIMONIO,
  LIMITE_ARQUIVOS_BAIXAR_PATRIMONIO,
  LIMITE_BYTES_DOCUMENTO_BAIXA_PATRIMONIO,
  LIMITE_CAMPOS_BAIXAR_PATRIMONIO,
  LIMITE_CARACTERES_TEXTO_BAIXA_PATRIMONIO,
  LIMITE_PARTES_BAIXAR_PATRIMONIO,
  TIPOS_BAIXA_PATRIMONIO,
  TIPO_CONTEUDO_BAIXAR_PATRIMONIO,
  TIPO_MIME_DOCUMENTO_BAIXA_PATRIMONIO,
  TipoBaixaPatrimonioSchema,
} from "..";

const ids = {
  baixa: "38bb16f9-f8e7-4f99-861f-5cbb93b7fe75",
  patrimonio: "7041c62b-5f83-432c-a178-889977d839b1",
  comissao: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
  usuario: "d4f7ccde-d880-4881-a547-a5c34bf263b2",
} as const;

const dadosMinimos = {
  dataBaixa: "2026-10-27",
  tipo: "ALIENACAO",
  motivo: "Bem sem interesse para o acervo",
  comissaoId: ids.comissao,
} as const;

const detalheBaixa = {
  id: ids.baixa,
  patrimonio: {
    id: ids.patrimonio,
    numeroPatrimonio: "12345",
    descricao: "Notebook para uso administrativo",
  },
  comissao: {
    id: ids.comissao,
    nome: "Comissão de baixa patrimonial",
  },
  tipo: "ALIENACAO",
  dataBaixa: "2026-10-27",
  motivo: "Bem sem interesse para o acervo",
  observacao: null,
  createdById: ids.usuario,
  createdAt: "2026-10-27T15:30:00.000Z",
  anexoUrl: `/api/patrimonios/${ids.patrimonio}/baixa/anexo`,
} as const;

describe("contratos de entrada da baixa patrimonial", () => {
  it("aceita os payloads mínimo e completo e normaliza espaços externos", () => {
    assert.deepEqual(
      parseValido(BaixarPatrimonioDadosSchema, dadosMinimos),
      dadosMinimos,
    );

    assert.deepEqual(
      parseValido(BaixarPatrimonioDadosSchema, {
        ...dadosMinimos,
        motivo: "  Motivo detalhado  ",
        observacao: "  Observação complementar  ",
      }),
      {
        ...dadosMinimos,
        motivo: "Motivo detalhado",
        observacao: "Observação complementar",
      },
    );

    assert.equal(
      Object.hasOwn(
        parseValido(BaixarPatrimonioDadosSchema, dadosMinimos),
        "observacao",
      ),
      false,
    );
  });

  it("aceita os dez tipos aprovados e rejeita valores fora do catálogo", () => {
    assert.deepEqual(TipoBaixaPatrimonioSchema.options, TIPOS_BAIXA_PATRIMONIO);

    for (const tipo of TIPOS_BAIXA_PATRIMONIO) {
      assert.equal(
        parseValido(BaixarPatrimonioDadosSchema, {
          ...dadosMinimos,
          tipo,
        }).tipo,
        tipo,
      );
    }

    esperaInvalido(BaixarPatrimonioDadosSchema, {
      ...dadosMinimos,
      tipo: "DOACAO",
    });
  });

  it("valida somente a representação civil da data", () => {
    assert.equal(
      parseValido(BaixarPatrimonioDadosSchema, {
        ...dadosMinimos,
        dataBaixa: "2999-12-31",
      }).dataBaixa,
      "2999-12-31",
    );

    for (const dataBaixa of [
      "27/10/2026",
      "2026-02-30",
      "2026-10-27T00:00:00.000Z",
    ]) {
      esperaInvalido(BaixarPatrimonioDadosSchema, {
        ...dadosMinimos,
        dataBaixa,
      });
    }
  });

  it("rejeita textos vazios, excesso, null indevido, UUID inválido e extras", () => {
    const textoExcedente = "a".repeat(
      LIMITE_CARACTERES_TEXTO_BAIXA_PATRIMONIO + 1,
    );

    esperaInvalidos(BaixarPatrimonioDadosSchema, [
      { ...dadosMinimos, motivo: "" },
      { ...dadosMinimos, motivo: "   " },
      { ...dadosMinimos, motivo: textoExcedente },
      { ...dadosMinimos, motivo: null },
      { ...dadosMinimos, observacao: "" },
      { ...dadosMinimos, observacao: "   " },
      { ...dadosMinimos, observacao: textoExcedente },
      { ...dadosMinimos, observacao: null },
      { ...dadosMinimos, comissaoId: "invalido" },
      { ...dadosMinimos, status: "BAIXADO" },
      { ...dadosMinimos, createdById: ids.usuario },
      { ...dadosMinimos, caminhoDocumento: "uploads/baixas/segredo.pdf" },
      { ...dadosMinimos, anexoUrl: "/api/segredo" },
    ]);
  });

  it("publica os cinco códigos de erro estáveis", () => {
    assert.deepEqual(
      CodigoErroBaixaPatrimonioSchema.options,
      CODIGOS_ERRO_BAIXA_PATRIMONIO,
    );
    esperaInvalido(CodigoErroBaixaPatrimonioSchema, "ERRO_INTERNO");
  });
});

describe("boundary multipart da baixa patrimonial", () => {
  it("interpreta o JSON de dados e aceita o documento opcional", () => {
    const semDocumento = parseValido(BaixarPatrimonioMultipartSchema, {
      dados: JSON.stringify(dadosMinimos),
    });
    assert.deepEqual(semDocumento.dados, dadosMinimos);
    assert.equal(Object.hasOwn(semDocumento, "documento"), false);

    const documento = { nome: "comprovante.pdf" };
    assert.deepEqual(
      parseValido(BaixarPatrimonioMultipartSchema, {
        dados: JSON.stringify(dadosMinimos),
        documento,
      }).documento,
      documento,
    );
  });

  it("rejeita JSON inválido, dados inválidos e propriedades extras", () => {
    esperaInvalidos(BaixarPatrimonioMultipartSchema, [
      { dados: "{" },
      { dados: JSON.stringify({ ...dadosMinimos, motivo: " " }) },
      { dados: JSON.stringify(dadosMinimos), outroCampo: "não permitido" },
      { documento: { nome: "sem-dados.pdf" } },
    ]);
  });

  it("expõe limites suficientes para configurar o parser antes do upload", () => {
    assert.equal(LIMITE_BYTES_DOCUMENTO_BAIXA_PATRIMONIO, 10 * 1024 * 1024);
    assert.equal(LIMITE_ARQUIVOS_BAIXAR_PATRIMONIO, 1);
    assert.equal(LIMITE_CAMPOS_BAIXAR_PATRIMONIO, 1);
    assert.equal(LIMITE_PARTES_BAIXAR_PATRIMONIO, 2);
    assert.equal(TIPO_CONTEUDO_BAIXAR_PATRIMONIO, "multipart/form-data");
    assert.equal(TIPO_MIME_DOCUMENTO_BAIXA_PATRIMONIO, "application/pdf");
    assert.equal(EXTENSAO_DOCUMENTO_BAIXA_PATRIMONIO, ".pdf");
    assert.equal(CAMPO_DADOS_BAIXAR_PATRIMONIO, "dados");
    assert.equal(CAMPO_DOCUMENTO_BAIXAR_PATRIMONIO, "documento");
  });
});

describe("responses da baixa patrimonial", () => {
  it("aceita detalhe serializado e os envelopes de criação e consulta", () => {
    assert.deepEqual(
      parseValido(BaixaPatrimonioDetalheSchema, detalheBaixa),
      detalheBaixa,
    );

    for (const schema of [
      BaixarPatrimonioResponseSchema,
      ConsultarBaixaPatrimonioResponseSchema,
    ]) {
      const response = {
        status: 200,
        sucesso: true,
        mensagem: "Baixa patrimonial consultada com sucesso.",
        dados: detalheBaixa,
      } as const;
      assert.deepEqual(parseValido(schema, response), response);
    }
  });

  it("representa documento ausente com null e exige a URL derivada", () => {
    assert.equal(
      parseValido(BaixaPatrimonioDetalheSchema, {
        ...detalheBaixa,
        anexoUrl: null,
      }).anexoUrl,
      null,
    );

    esperaInvalido(BaixaPatrimonioDetalheSchema, {
      ...detalheBaixa,
      anexoUrl: "/data/uploads/baixas/documento.pdf",
    });
  });

  it("usa allowlist e mantém datas na representação JSON", () => {
    esperaInvalidos(BaixaPatrimonioDetalheSchema, [
      { ...detalheBaixa, caminhoDocumento: "uploads/baixas/segredo.pdf" },
      { ...detalheBaixa, dataBaixa: new Date("2026-10-27T00:00:00.000Z") },
      { ...detalheBaixa, createdAt: new Date("2026-10-27T15:30:00.000Z") },
      { ...detalheBaixa, observacao: undefined },
    ]);
  });
});
