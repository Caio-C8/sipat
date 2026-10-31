import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import {
  AdicionarMembroComissaoBodySchema,
  AlterarComissaoBodySchema,
  AlterarMembroComissaoBodySchema,
  ComissaoDetalheSchema,
  ComissaoParamsSchema,
  CriarComissaoBodySchema,
  LIMITE_MEMBROS_COMISSAO,
  ListarComissoesQuerySchema,
  MembroComissaoParamsSchema,
  TipoMembroComissaoSchema,
  type CriarComissaoBodyData,
  type CriarComissaoBodyInput,
} from "../comissao.schema";

const uuids = {
  comissao: "7041c62b-5f83-432c-a178-889977d839b1",
  membro: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
  responsavel: "d4f7ccde-d880-4881-a547-a5c34bf263b2",
  outroResponsavel: "cd852ee6-63f1-46f6-98ae-d1ea5d5c6bed",
  criador: "7a1a9e90-67cf-4bab-b445-4bcfba82d3dd",
} as const;

const comissaoMinima = {
  chaveIdempotencia: uuids.comissao,
  nome: "Comissão de inventário",
  dataVigenciaInicio: "2026-01-01",
  dataVigenciaFim: "2026-12-31",
} as const;

describe("contratos de comissões", () => {
  it("aceita o payload mínimo e aplica a composição vazia somente no output", () => {
    const entrada: CriarComissaoBodyInput = comissaoMinima;
    const resultado: CriarComissaoBodyData = parseValido(
      CriarComissaoBodySchema,
      entrada,
    );

    assert.deepEqual(resultado, { ...comissaoMinima, membros: [] });
  });

  it("aceita payload completo com até 50 responsáveis distintos e um presidente", () => {
    const membros = Array.from(
      { length: LIMITE_MEMBROS_COMISSAO },
      (_, indice) => ({
        responsavelId: `00000000-0000-4000-8000-${String(indice).padStart(12, "0")}`,
        papel: indice === 0 ? ("PRESIDENTE" as const) : ("MEMBRO" as const),
      }),
    );

    const resultado = parseValido(CriarComissaoBodySchema, {
      ...comissaoMinima,
      nome: "  Comissão completa  ",
      descricao: "  Responsável pelo inventário anual.  ",
      numeroAto: "  Portaria 12/2026  ",
      membros,
    });

    assert.equal(resultado.nome, "Comissão completa");
    assert.equal(resultado.descricao, "Responsável pelo inventário anual.");
    assert.equal(resultado.numeroAto, "Portaria 12/2026");
    assert.equal(resultado.membros.length, LIMITE_MEMBROS_COMISSAO);
  });

  it("rejeita o 51º integrante, responsável repetido e segundo presidente nos paths corrigíveis", () => {
    const membrosDemais = Array.from(
      { length: LIMITE_MEMBROS_COMISSAO + 1 },
      (_, indice) => ({
        responsavelId: `00000000-0000-4000-8000-${String(indice).padStart(12, "0")}`,
        papel: "MEMBRO",
      }),
    );
    esperaInvalido(CriarComissaoBodySchema, {
      ...comissaoMinima,
      membros: membrosDemais,
    });

    esperaInvalido(
      CriarComissaoBodySchema,
      {
        ...comissaoMinima,
        membros: [
          { responsavelId: uuids.responsavel, papel: "MEMBRO" },
          { responsavelId: uuids.responsavel, papel: "MEMBRO" },
        ],
      },
      "membros.1.responsavelId",
    );

    esperaInvalido(
      CriarComissaoBodySchema,
      {
        ...comissaoMinima,
        membros: [
          { responsavelId: uuids.responsavel, papel: "PRESIDENTE" },
          { responsavelId: uuids.outroResponsavel, papel: "PRESIDENTE" },
        ],
      },
      "membros.1.papel",
    );
  });

  it("rejeita papel inválido, propriedades extras e campos controlados pelo servidor", () => {
    esperaInvalido(TipoMembroComissaoSchema, "SECRETARIO");
    esperaInvalidos(CriarComissaoBodySchema, [
      { ...comissaoMinima, createdById: uuids.criador },
      { ...comissaoMinima, id: uuids.comissao },
      { ...comissaoMinima, utilizada: false },
    ]);
    esperaInvalido(CriarComissaoBodySchema, {
      ...comissaoMinima,
      membros: [{ responsavelId: uuids.responsavel, papel: "SECRETARIO" }],
    });
  });

  it("valida datas civis e aponta a data final quando o período está invertido", () => {
    esperaInvalido(
      CriarComissaoBodySchema,
      {
        ...comissaoMinima,
        dataVigenciaInicio: "2026-12-31",
        dataVigenciaFim: "2026-01-01",
      },
      "dataVigenciaFim",
    );
    esperaInvalido(CriarComissaoBodySchema, {
      ...comissaoMinima,
      dataVigenciaInicio: "31/01/2026",
    });
    assert.equal(
      parseValido(CriarComissaoBodySchema, {
        ...comissaoMinima,
        dataVigenciaFim: comissaoMinima.dataVigenciaInicio,
      }).dataVigenciaFim,
      comissaoMinima.dataVigenciaInicio,
    );
  });

  it("mantém PATCH sem defaults e diferencia ausência de limpeza explícita", () => {
    esperaInvalido(AlterarComissaoBodySchema, {});
    esperaInvalido(AlterarComissaoBodySchema, { nome: null }, "nome");
    esperaInvalido(AlterarComissaoBodySchema, { dataVigenciaInicio: null });
    esperaInvalido(
      AlterarComissaoBodySchema,
      {
        dataVigenciaInicio: "2027-01-01",
        dataVigenciaFim: "2026-12-31",
      },
      "dataVigenciaFim",
    );

    assert.deepEqual(
      parseValido(AlterarComissaoBodySchema, {
        descricao: null,
        numeroAto: null,
      }),
      { descricao: null, numeroAto: null },
    );
    assert.deepEqual(parseValido(AlterarComissaoBodySchema, { nome: "Nova" }), {
      nome: "Nova",
    });
  });

  it("separa adição de integrante da alteração exclusiva de papel", () => {
    assert.deepEqual(
      parseValido(AdicionarMembroComissaoBodySchema, {
        responsavelId: uuids.responsavel,
        papel: "MEMBRO",
      }),
      { responsavelId: uuids.responsavel, papel: "MEMBRO" },
    );
    assert.deepEqual(
      parseValido(AlterarMembroComissaoBodySchema, { papel: "PRESIDENTE" }),
      { papel: "PRESIDENTE" },
    );
    esperaInvalido(AlterarMembroComissaoBodySchema, {
      responsavelId: uuids.outroResponsavel,
      papel: "MEMBRO",
    });
    esperaInvalido(AlterarMembroComissaoBodySchema, {});
  });

  it("mantém params UUID separados e listagem paginada finita", () => {
    assert.deepEqual(
      parseValido(ComissaoParamsSchema, { comissaoId: uuids.comissao }),
      {
        comissaoId: uuids.comissao,
      },
    );
    assert.deepEqual(
      parseValido(MembroComissaoParamsSchema, {
        comissaoId: uuids.comissao,
        membroComissaoId: uuids.membro,
      }),
      {
        comissaoId: uuids.comissao,
        membroComissaoId: uuids.membro,
      },
    );
    assert.deepEqual(parseValido(ListarComissoesQuerySchema, {}), {
      pagina: 1,
      limite: 20,
    });
    esperaInvalido(ListarComissoesQuerySchema, { limite: "51" }, "limite");
    esperaInvalido(ListarComissoesQuerySchema, { busca: "x".repeat(151) });
  });

  it("usa allowlist estrita e datas serializadas na resposta detalhada", () => {
    const detalhe = {
      id: uuids.comissao,
      nome: "Comissão de inventário",
      descricao: null,
      numeroAto: "Portaria 12/2026",
      dataVigenciaInicio: "2026-01-01",
      dataVigenciaFim: "2026-12-31",
      membros: [
        {
          id: uuids.membro,
          papel: "PRESIDENTE",
          responsavel: {
            id: uuids.responsavel,
            nome: "Ana",
            matricula: "123",
            ativo: true,
          },
          createdAt: "2026-10-24T12:00:00.000Z",
          updatedAt: null,
        },
      ],
      createdById: uuids.criador,
      createdAt: "2026-10-24T12:00:00.000Z",
      updatedAt: null,
    } as const;

    assert.deepEqual(parseValido(ComissaoDetalheSchema, detalhe), detalhe);
    esperaInvalido(ComissaoDetalheSchema, {
      ...detalhe,
      segredoInterno: "não pode vazar",
    });
    esperaInvalido(ComissaoDetalheSchema, {
      ...detalhe,
      dataVigenciaInicio: new Date("2026-01-01T00:00:00.000Z"),
    });
    esperaInvalido(
      ComissaoDetalheSchema,
      {
        ...detalhe,
        dataVigenciaInicio: "2027-01-01",
      },
      "dataVigenciaFim",
    );
    esperaInvalido(ComissaoDetalheSchema, {
      ...detalhe,
      membros: [
        {
          ...detalhe.membros[0],
          comissaoId: uuids.comissao,
        },
      ],
    });
  });
});
