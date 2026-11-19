import assert from "node:assert/strict";
import test from "node:test";
import { DashboardOperacionalResponseSchema } from "../dashboard.schema";

const resposta = {
  status: 200,
  sucesso: true,
  mensagem: "Dashboard operacional consultado.",
  dados: {
    totais: {
      total: 2,
      porStatus: {
        ATIVO: 1,
        BAIXADO: 0,
        EMPRESTADO: 1,
        EM_MANUTENCAO: 0,
      },
    },
    pendencias: {
      inventarios: [],
      manutencoes: [],
      depreciacao: null,
    },
    setores: [],
    atividades: [],
  },
};

test("aceita o dashboard operacional vazio e com totais", () => {
  assert.equal(
    DashboardOperacionalResponseSchema.parse(resposta).dados.totais.total,
    2,
  );
});

test("rejeita limites e destinos que não são internos", () => {
  const setores = Array.from({ length: 6 }, (_, indice) => ({
    id: "7041c62b-5f83-432c-a178-889977d839b1",
    nome: `Setor ${indice}`,
    total: 1,
    destino: "https://example.com",
  }));
  assert.equal(
    DashboardOperacionalResponseSchema.safeParse({
      ...resposta,
      dados: { ...resposta.dados, setores },
    }).success,
    false,
  );
});
