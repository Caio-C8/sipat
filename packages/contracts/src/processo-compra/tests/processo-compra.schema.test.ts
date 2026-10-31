import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import {
  AlterarNotaFiscalBodySchema,
  AlterarProcessoCompraBodySchema,
  CAMPO_ANEXOS_CRIAR_PROCESSO_COMPRA,
  CAMPO_DADOS_CRIAR_PROCESSO_COMPRA,
  CriarNotaFiscalMultipartSchema,
  CriarProcessoCompraMultipartSchema,
  EXTENSAO_ANEXO_NOTA_FISCAL,
  LIMITE_ANEXOS_CRIAR_PROCESSO_COMPRA,
  LIMITE_BYTES_ANEXO_NOTA_FISCAL,
  LIMITE_CAMPOS_CRIAR_PROCESSO_COMPRA,
  LIMITE_NOTAS_CRIAR_PROCESSO_COMPRA,
  LIMITE_PARTES_CRIAR_PROCESSO_COMPRA,
  ListarNotasFiscaisQuerySchema,
  ListarProcessosCompraQuerySchema,
  NotaFiscalDetalheSchema,
  NotaFiscalParamsSchema,
  ProcessoCompraDetalheSchema,
  ProcessoCompraParamsSchema,
  SubstituirAnexoNotaFiscalMultipartSchema,
  TIPO_CONTEUDO_CRIAR_PROCESSO_COMPRA,
  TIPO_MIME_ANEXO_NOTA_FISCAL,
} from "../../index";

const uuids = {
  processo: "7041c62b-5f83-432c-a178-889977d839b1",
  nota: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
  fornecedor: "d4f7ccde-d880-4881-a547-a5c34bf263b2",
} as const;

const nota = (anexoIndice?: number) => ({
  numeroNotaFiscal: "NF-001",
  anoNotaFiscal: 2026,
  dataEmissao: "2026-10-19",
  fornecedorId: uuids.fornecedor,
  ...(anexoIndice === undefined ? {} : { anexoIndice }),
});

const dadosProcesso = (notas: unknown[] = []) =>
  JSON.stringify({
    chaveIdempotencia: uuids.processo,
    numeroProcesso: "123/2026",
    anoProcesso: 2026,
    numeroEmpenho: "456",
    anoEmpenho: 2026,
    valorTotal: "12345.6700000",
    observacao: "Compra de equipamentos",
    notas,
  });

describe("contratos multipart de processos de compra", () => {
  it("aceita processo sem nota e nota sem placeholder de arquivo", () => {
    assert.deepEqual(
      parseValido(CriarProcessoCompraMultipartSchema, {
        dados: dadosProcesso(),
        anexos: [],
      }).dados.notas,
      [],
    );

    assert.equal(
      parseValido(CriarProcessoCompraMultipartSchema, {
        dados: dadosProcesso([nota()]),
        anexos: [],
      }).dados.notas.at(0)?.anexoIndice,
      undefined,
    );
  });

  it("associa cada arquivo a exatamente uma nota pelo índice", () => {
    const arquivos = [{ nome: "a.pdf" }, { nome: "b.pdf" }];
    const resultado = parseValido(CriarProcessoCompraMultipartSchema, {
      dados: dadosProcesso([nota(1), nota(0)]),
      anexos: arquivos,
    });

    assert.equal(resultado.dados.notas.at(0)?.anexoIndice, 1);
    assert.deepEqual(resultado.anexos, arquivos);

    esperaInvalido(
      CriarProcessoCompraMultipartSchema,
      {
        dados: dadosProcesso([nota(0), nota(0)]),
        anexos: [arquivos[0]],
      },
      "dados.notas.1.anexoIndice",
    );
    esperaInvalido(
      CriarProcessoCompraMultipartSchema,
      { dados: dadosProcesso([nota(1)]), anexos: [arquivos[0]] },
      "dados.notas.0.anexoIndice",
    );
    esperaInvalido(
      CriarProcessoCompraMultipartSchema,
      { dados: dadosProcesso([nota()]), anexos: [arquivos[0]] },
      "anexos.0",
    );
  });

  it("rejeita a 21ª nota, o 21º arquivo e JSON ou campos extras", () => {
    esperaInvalido(CriarProcessoCompraMultipartSchema, {
      dados: dadosProcesso(
        Array.from({ length: LIMITE_NOTAS_CRIAR_PROCESSO_COMPRA + 1 }, () =>
          nota(),
        ),
      ),
      anexos: [],
    });
    esperaInvalido(CriarProcessoCompraMultipartSchema, {
      dados: dadosProcesso(
        Array.from(
          { length: LIMITE_ANEXOS_CRIAR_PROCESSO_COMPRA + 1 },
          (_, indice) => nota(indice),
        ),
      ),
      anexos: Array.from(
        { length: LIMITE_ANEXOS_CRIAR_PROCESSO_COMPRA + 1 },
        () => ({}),
      ),
    });
    esperaInvalidos(CriarProcessoCompraMultipartSchema, [
      { dados: "{", anexos: [] },
      { dados: dadosProcesso(), anexos: [], outroCampo: "não permitido" },
      { anexos: [] },
    ]);

    assert.equal(LIMITE_PARTES_CRIAR_PROCESSO_COMPRA, 21);
    assert.equal(LIMITE_CAMPOS_CRIAR_PROCESSO_COMPRA, 1);
    assert.equal(TIPO_CONTEUDO_CRIAR_PROCESSO_COMPRA, "multipart/form-data");
    assert.equal(CAMPO_DADOS_CRIAR_PROCESSO_COMPRA, "dados");
    assert.equal(CAMPO_ANEXOS_CRIAR_PROCESSO_COMPRA, "anexos");
  });
});

describe("contratos JSON de processos e notas fiscais", () => {
  it("expõe limites do arquivo e contratos das operações multipart unitárias", () => {
    assert.equal(LIMITE_BYTES_ANEXO_NOTA_FISCAL, 10 * 1024 * 1024);
    assert.equal(TIPO_MIME_ANEXO_NOTA_FISCAL, "application/pdf");
    assert.equal(EXTENSAO_ANEXO_NOTA_FISCAL, ".pdf");
    assert.equal(
      parseValido(CriarNotaFiscalMultipartSchema, {
        dados: JSON.stringify({
          chaveIdempotencia: uuids.nota,
          processoCompraId: uuids.processo,
          ...nota(),
        }),
        anexo: { nome: "nota.pdf" },
      }).dados.processoCompraId,
      uuids.processo,
    );
    assert.deepEqual(
      parseValido(SubstituirAnexoNotaFiscalMultipartSchema, {
        anexo: { nome: "substituta.pdf" },
      }).anexo,
      { nome: "substituta.pdf" },
    );
    esperaInvalido(SubstituirAnexoNotaFiscalMultipartSchema, {});
  });

  it("mantém PATCHes parciais não vazios e campos do servidor fora da entrada", () => {
    assert.deepEqual(
      parseValido(AlterarProcessoCompraBodySchema, { observacao: null }),
      { observacao: null },
    );
    assert.deepEqual(
      parseValido(AlterarNotaFiscalBodySchema, { dataEmissao: "2026-10-20" }),
      { dataEmissao: "2026-10-20" },
    );

    esperaInvalidos(AlterarProcessoCompraBodySchema, [
      {},
      { notas: [] },
      { createdById: uuids.fornecedor },
    ]);
    esperaInvalidos(AlterarNotaFiscalBodySchema, [
      {},
      { processoCompraId: uuids.processo },
      { caminhoAnexoNotaFiscal: "uploads/segredo.pdf" },
    ]);
  });

  it("valida params e queries paginadas com filtros finitos", () => {
    assert.deepEqual(
      parseValido(ProcessoCompraParamsSchema, {
        processoCompraId: uuids.processo,
      }),
      { processoCompraId: uuids.processo },
    );
    assert.deepEqual(
      parseValido(NotaFiscalParamsSchema, { notaFiscalId: uuids.nota }),
      { notaFiscalId: uuids.nota },
    );
    assert.equal(
      parseValido(ListarProcessosCompraQuerySchema, {
        anoProcesso: "2026",
      }).anoProcesso,
      2026,
    );
    assert.equal(
      parseValido(ListarNotasFiscaisQuerySchema, {
        anoNotaFiscal: "2026",
      }).anoNotaFiscal,
      2026,
    );

    esperaInvalidos(ListarProcessosCompraQuerySchema, [
      { limite: "51" },
      { anoProcesso: 2026 },
      { busca: " ", filtroInterno: "x" },
    ]);
  });

  it("expõe anexoUrl derivada do id e nunca o caminho persistido", () => {
    const resumoNota = {
      id: uuids.nota,
      numeroNotaFiscal: "NF-001",
      anoNotaFiscal: 2026,
      dataEmissao: "2026-10-19",
      fornecedor: {
        id: uuids.fornecedor,
        razaoSocial: "Fornecedor Ltda.",
      },
      anexoUrl: `/api/notas-fiscais/${uuids.nota}/anexo`,
    };
    const detalheNota = {
      ...resumoNota,
      processoCompra: {
        id: uuids.processo,
        numeroProcesso: "123/2026",
        anoProcesso: 2026,
      },
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: null,
    };
    const detalheProcesso = {
      id: uuids.processo,
      numeroProcesso: "123/2026",
      anoProcesso: 2026,
      numeroEmpenho: "456",
      anoEmpenho: 2026,
      valorTotal: "12345.6700000",
      quantidadeNotas: 1,
      observacao: null,
      notas: [resumoNota],
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: null,
    };

    assert.deepEqual(
      parseValido(NotaFiscalDetalheSchema, detalheNota),
      detalheNota,
    );
    assert.deepEqual(
      parseValido(ProcessoCompraDetalheSchema, detalheProcesso),
      detalheProcesso,
    );

    esperaInvalido(NotaFiscalDetalheSchema, {
      ...detalheNota,
      anexoUrl: "/data/uploads/nota.pdf",
    });
    esperaInvalido(ProcessoCompraDetalheSchema, {
      ...detalheProcesso,
      caminhoAnexoNotaFiscal: "uploads/notas-fiscais/nota.pdf",
    });
  });
});
