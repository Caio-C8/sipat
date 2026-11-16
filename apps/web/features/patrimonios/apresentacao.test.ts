import type { EventoFicha } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import { apresentarEvento, formatarRotuloEnum } from "./apresentacao";

function criarEvento(
  tipo: EventoFicha["tipo"],
  atributos: Record<string, unknown>,
): EventoFicha {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    patrimonioId: "00000000-0000-4000-8000-000000000002",
    fonteId: "00000000-0000-4000-8000-000000000003",
    ocorrencia: null,
    precisao: "INSTANTE",
    registroEm: null,
    autor: null,
    comissao: null,
    tipo,
    atributos,
  } as unknown as EventoFicha;
}

describe("apresentação do histórico de patrimônios", () => {
  it.each([
    ["CORRETO", "Correto"],
    ["DIVERGENCIA", "Divergência"],
    ["NAO_LOCALIZADO", "Não localizado"],
    ["TRANSFERENCIA_CADASTRAL", "Transferência cadastral"],
    ["RETORNO_AO_SETOR_CADASTRADO", "Retorno ao setor cadastrado"],
    ["EM_MANUTENCAO", "Em manutenção"],
    ["ERRO_REGISTRO", "Erro de registro"],
    ["CONCLUIDA", "Concluída"],
  ])("formata o valor %s como %s", (valor, esperado) => {
    expect(formatarRotuloEnum(valor)).toBe(esperado);
  });

  it("mantém valores futuros legíveis sem expor snake case", () => {
    expect(formatarRotuloEnum("NOVO_ESTADO_OPERACIONAL")).toBe(
      "Novo estado operacional",
    );
  });

  it("formata situações e correções de inventário", () => {
    const conferencia = apresentarEvento(
      criarEvento("CONFERENCIA_INVENTARIO", {
        situacao: "DIVERGENCIA",
        observacao: null,
      }),
    );
    const correcao = apresentarEvento(
      criarEvento("CORRECAO_INVENTARIO", {
        tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
        observacao: null,
      }),
    );

    expect(conferencia.descricao).toBe("Divergência");
    expect(correcao.descricao).toBe("Transferência cadastral");
  });

  it("formata tipo e situação de manutenção", () => {
    const envio = apresentarEvento(
      criarEvento("ENVIO_MANUTENCAO", {
        tipo: "CORRETIVA",
        situacao: "PENDENTE",
        servico: null,
      }),
    );
    const retorno = apresentarEvento(
      criarEvento("RETORNO_MANUTENCAO", {
        situacao: "RETORNADO",
        servico: null,
      }),
    );

    expect(envio.descricao).toBe("Corretiva · Pendente");
    expect(retorno.descricao).toBe("Retorno da manutenção · Retornado");
  });

  it("formata o tipo da baixa", () => {
    const baixa = apresentarEvento(
      criarEvento("BAIXA", {
        tipo: "ERRO_REGISTRO",
        motivo: "Cadastro duplicado",
        observacao: null,
      }),
    );

    expect(baixa.descricao).toBe("Erro de registro: Cadastro duplicado");
  });
});
