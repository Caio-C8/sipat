import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as z from "zod";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import {
  ErroCampoSchema,
  MetaPaginacaoSchema,
  RespostaErroSchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../resposta.schema";

const ID_VALIDO = "875035dc-7f98-4096-b062-11b72d07c427";

const ItemSchema = z.strictObject({
  id: z.uuid(),
});

const RespostaSucessoTesteSchema = criarRespostaSucessoSchema(ItemSchema);

const RespostaPaginadaTesteSchema =
  criarRespostaSucessoPaginadaSchema(ItemSchema);

describe("criarRespostaSucessoSchema", () => {
  it("aceita uma resposta de sucesso válida", () => {
    assert.deepEqual(
      parseValido(RespostaSucessoTesteSchema, {
        status: 200,
        sucesso: true,
        mensagem: " Item encontrado. ",
        dados: {
          id: ID_VALIDO,
        },
      }),
      {
        status: 200,
        sucesso: true,
        mensagem: "Item encontrado.",
        dados: {
          id: ID_VALIDO,
        },
      },
    );
  });

  it("rejeita status, discriminador e dados inválidos", () => {
    esperaInvalidos(RespostaSucessoTesteSchema, [
      {
        status: 199,
        sucesso: true,
        mensagem: "OK",
        dados: { id: ID_VALIDO },
      },
      {
        status: 300,
        sucesso: true,
        mensagem: "OK",
        dados: { id: ID_VALIDO },
      },
      {
        status: 200,
        sucesso: false,
        mensagem: "OK",
        dados: { id: ID_VALIDO },
      },
      {
        status: 200,
        sucesso: true,
        mensagem: "",
        dados: { id: ID_VALIDO },
      },
      {
        status: 200,
        sucesso: true,
        mensagem: "OK",
        dados: { id: "inválido" },
      },
    ]);
  });

  it("rejeita campos inesperados", () => {
    esperaInvalido(RespostaSucessoTesteSchema, {
      status: 200,
      sucesso: true,
      mensagem: "OK",
      dados: { id: ID_VALIDO },
      stack: "não deve vazar",
    });
  });
});

describe("MetaPaginacaoSchema", () => {
  it("aceita uma paginação consistente", () => {
    assert.deepEqual(
      parseValido(MetaPaginacaoSchema, {
        total: 25,
        pagina: 2,
        ultimaPagina: 3,
        limite: 10,
      }),
      {
        total: 25,
        pagina: 2,
        ultimaPagina: 3,
        limite: 10,
      },
    );
  });

  it("considera uma página quando o total é zero", () => {
    const resultado = parseValido(MetaPaginacaoSchema, {
      total: 0,
      pagina: 1,
      ultimaPagina: 1,
      limite: 20,
    });

    assert.equal(resultado.ultimaPagina, 1);
  });

  it("rejeita valores inválidos ou última página inconsistente", () => {
    esperaInvalidos(MetaPaginacaoSchema, [
      {
        total: -1,
        pagina: 1,
        ultimaPagina: 1,
        limite: 20,
      },
      {
        total: 10,
        pagina: 0,
        ultimaPagina: 1,
        limite: 20,
      },
      {
        total: 10,
        pagina: 1,
        ultimaPagina: 1,
        limite: 0,
      },
    ]);

    esperaInvalido(
      MetaPaginacaoSchema,
      {
        total: 25,
        pagina: 1,
        ultimaPagina: 2,
        limite: 10,
      },
      "ultimaPagina",
    );
  });
});

describe("criarRespostaSucessoPaginadaSchema", () => {
  it("aceita uma lista paginada válida", () => {
    const resultado = parseValido(RespostaPaginadaTesteSchema, {
      status: 200,
      sucesso: true,
      mensagem: "Itens encontrados.",
      dados: [{ id: ID_VALIDO }],
      meta: {
        total: 1,
        pagina: 1,
        ultimaPagina: 1,
        limite: 20,
      },
    });

    assert.equal(resultado.dados.length, 1);
  });

  it("rejeita quantidade de itens maior que o limite", () => {
    esperaInvalido(
      RespostaPaginadaTesteSchema,
      {
        status: 200,
        sucesso: true,
        mensagem: "Itens encontrados.",
        dados: [{ id: ID_VALIDO }, { id: ID_VALIDO }],
        meta: {
          total: 2,
          pagina: 1,
          ultimaPagina: 2,
          limite: 1,
        },
      },
      "dados",
    );
  });
});

describe("RespostaErroSchema", () => {
  it("aceita erro sem erros de campo", () => {
    const resultado = parseValido(RespostaErroSchema, {
      status: 404,
      sucesso: false,
      codigo: "RECURSO_NAO_ENCONTRADO",
      mensagem: "Recurso não encontrado.",
      erros: [],
      requisicaoId: "request-123",
    });

    assert.deepEqual(resultado.erros, []);
  });

  it("aceita erro de validação com campo, código e mensagem", () => {
    const erro = {
      campo: "preco",
      codigo: "FORMATO_INVALIDO",
      mensagem: "O preço é inválido.",
    };

    assert.deepEqual(parseValido(ErroCampoSchema, erro), erro);

    const resultado = parseValido(RespostaErroSchema, {
      status: 400,
      sucesso: false,
      codigo: "VALIDACAO_FALHOU",
      mensagem: "Verifique os campos informados.",
      erros: [erro],
      requisicaoId: "request-123",
    });

    assert.equal(resultado.erros.length, 1);
  });

  it("rejeita códigos fora do padrão", () => {
    for (const codigo of [
      "",
      "recurso_nao_encontrado",
      "RECURSO-NAO-ENCONTRADO",
      "1_RECURSO",
    ]) {
      esperaInvalido(
        RespostaErroSchema,
        {
          status: 400,
          sucesso: false,
          codigo,
          mensagem: "Erro.",
          erros: [],
          requisicaoId: "request-123",
        },
        "codigo",
      );
    }
  });

  it("rejeita status de sucesso, null e informações internas", () => {
    esperaInvalidos(RespostaErroSchema, [
      {
        status: 200,
        sucesso: false,
        codigo: "ERRO",
        mensagem: "Erro.",
        erros: [],
        requisicaoId: "request-123",
      },
      {
        status: 400,
        sucesso: false,
        codigo: "ERRO",
        mensagem: "Erro.",
        erros: null,
        requisicaoId: "request-123",
      },
      {
        status: 500,
        sucesso: false,
        codigo: "ERRO_INTERNO",
        mensagem: "Erro.",
        erros: [],
        requisicaoId: "request-123",
        stack: "não deve vazar",
      },
    ]);
  });
});
