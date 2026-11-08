import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { esperaInvalido, parseValido } from "./contract-assertions";
import {
  AlterarEspecieSchema,
  AlterarFornecedorSchema,
  AlterarNaturezaSchema,
  AlterarResponsavelSchema,
  AlterarSetorSchema,
  CnpjFornecedorSchema,
  CriarEspecieSchema,
  CriarFornecedorSchema,
  CriarNaturezaSchema,
  CriarResponsavelSchema,
  CriarSetorSchema,
  EspecieDetalheSchema,
  FornecedorDetalheSchema,
  ListarEspeciesQuerySchema,
  ListarFornecedoresQuerySchema,
  ListarNaturezasQuerySchema,
  ListarResponsaveisQuerySchema,
  ListarSetoresQuerySchema,
  NaturezaDetalheSchema,
  ResponsavelDetalheSchema,
  SetorDetalheSchema,
} from "./index";

const UUID = "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab";
const OUTRO_UUID = "d4f7ccde-d880-4881-a547-a5c34bf263b2";
const AUDITORIA = {
  createdById: OUTRO_UUID,
  createdAt: "2026-10-19T12:00:00.000Z",
  updatedAt: null,
} as const;

describe("contratos dos cadastros patrimoniais relacionados", () => {
  it("protege situação, normalização e auditoria nos inputs", () => {
    esperaInvalido(CriarResponsavelSchema, {
      nome: "Ana",
      matricula: "123",
      ativo: false,
    });
    esperaInvalido(CriarNaturezaSchema, {
      nome: "Informática",
      nomeNormalizado: "informatica",
    });
    esperaInvalido(CriarEspecieSchema, {
      nome: "Notebook",
      naturezaId: UUID,
      createdById: OUTRO_UUID,
    });
    esperaInvalido(CriarSetorSchema, {
      nome: "Patrimônio",
      responsavelId: UUID,
      createdAt: "2026-10-19T12:00:00.000Z",
    });
    esperaInvalido(CriarFornecedorSchema, {
      razaoSocial: "Fornecedor Ltda.",
      ativo: false,
    });
  });

  it("distingue ausência, null e limpeza permitida nos PATCHes", () => {
    for (const schema of [
      AlterarResponsavelSchema,
      AlterarNaturezaSchema,
      AlterarEspecieSchema,
      AlterarSetorSchema,
      AlterarFornecedorSchema,
    ]) {
      esperaInvalido(schema, {});
    }

    esperaInvalido(AlterarResponsavelSchema, { nome: null }, "nome");
    esperaInvalido(AlterarEspecieSchema, { naturezaId: null }, "naturezaId");
    esperaInvalido(
      AlterarSetorSchema,
      { responsavelId: null },
      "responsavelId",
    );
    esperaInvalido(
      AlterarFornecedorSchema,
      { razaoSocial: null },
      "razaoSocial",
    );

    assert.deepEqual(parseValido(AlterarNaturezaSchema, { descricao: null }), {
      descricao: null,
    });
    assert.deepEqual(
      parseValido(AlterarSetorSchema, { sala: null, ramal: null }),
      {
        sala: null,
        ramal: null,
      },
    );
    assert.deepEqual(parseValido(AlterarFornecedorSchema, { cnpj: null }), {
      cnpj: null,
    });
  });

  it("exige os vínculos de espécie e setor e permite alterá-los", () => {
    esperaInvalido(CriarEspecieSchema, { nome: "Notebook" }, "naturezaId");
    esperaInvalido(CriarSetorSchema, { nome: "Patrimônio" }, "responsavelId");

    assert.equal(
      parseValido(AlterarEspecieSchema, { naturezaId: UUID }).naturezaId,
      UUID,
    );
    assert.equal(
      parseValido(AlterarSetorSchema, { responsavelId: UUID }).responsavelId,
      UUID,
    );
  });

  it("normaliza e valida CNPJ numérico e alfanumérico", () => {
    assert.equal(
      parseValido(CnpjFornecedorSchema, "04.252.011/0001-10"),
      "04252011000110",
    );
    assert.equal(
      parseValido(CnpjFornecedorSchema, "12.abc.345/01de-35"),
      "12ABC34501DE35",
    );
    esperaInvalido(CnpjFornecedorSchema, "12.ABC.345/01DE-34");
    esperaInvalido(CnpjFornecedorSchema, "00.000.000/0000-00");
  });

  it("mantém paginação e filtros finitos", () => {
    for (const schema of [
      ListarResponsaveisQuerySchema,
      ListarNaturezasQuerySchema,
      ListarEspeciesQuerySchema,
      ListarSetoresQuerySchema,
      ListarFornecedoresQuerySchema,
    ]) {
      esperaInvalido(schema, { limite: "51" }, "limite");
      esperaInvalido(schema, { busca: "x".repeat(151) }, "busca");
    }

    assert.deepEqual(
      parseValido(ListarSetoresQuerySchema, {
        ativo: "FALSE",
        responsavelId: UUID,
      }),
      { pagina: 1, limite: 20, ativo: false, responsavelId: UUID },
    );
  });

  it("usa allowlists estritas nas respostas", () => {
    const responsavel = {
      id: UUID,
      nome: "Ana",
      matricula: "123",
      ativo: true,
      ...AUDITORIA,
    };
    const natureza = {
      id: UUID,
      nome: "Informática",
      descricao: null,
      nomeNormalizado: "informatica",
      ...AUDITORIA,
    };
    const especie = {
      id: UUID,
      nome: "Notebook",
      descricao: null,
      nomeNormalizado: "notebook",
      natureza: { id: UUID, nome: "Informática" },
      ...AUDITORIA,
    };
    const setor = {
      id: UUID,
      nome: "Patrimônio",
      sala: null,
      ramal: null,
      ativo: true,
      responsavel: { id: UUID, nome: "Ana", matricula: "123", ativo: true },
      ...AUDITORIA,
    };
    const fornecedor = {
      id: UUID,
      razaoSocial: "Fornecedor Ltda.",
      nomeFantasia: null,
      nomeRepresentante: null,
      cnpj: "12ABC34501DE35",
      email: null,
      telefone: null,
      endereco: null,
      ativo: true,
      ...AUDITORIA,
    };

    for (const [schema, valor] of [
      [ResponsavelDetalheSchema, responsavel],
      [NaturezaDetalheSchema, natureza],
      [EspecieDetalheSchema, especie],
      [SetorDetalheSchema, setor],
      [FornecedorDetalheSchema, fornecedor],
    ] as const) {
      assert.deepEqual(parseValido(schema, valor), valor);
      esperaInvalido(schema, { ...valor, segredoInterno: "não pode vazar" });
    }
  });
});
