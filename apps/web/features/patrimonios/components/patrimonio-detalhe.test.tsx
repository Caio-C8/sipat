// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EventosFichaResponse, PatrimonioDetalhe } from "@repo/contracts";
import { PatrimonioDetalheView } from "./patrimonio-detalhe";

vi.mock("./patrimonio-acoes", () => ({ PatrimonioAcoes: () => null }));

afterEach(cleanup);

const id = "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab";
const patrimonio = {
  id,
  numeroPatrimonio: "1",
  tipoNumeroPatrimonial: "OFICIAL",
  descricao: "Computador",
  marca: "Fabricante",
  modelo: null,
  numeroSerie: "SERIE-1",
  status: "ATIVO",
  depreciavel: false,
  situacaoContabil: {
    valorBrutoAtual: "1000.0000000",
    depreciacaoAcumuladaAtual: "100.0000000",
  },
  setorAtual: {
    id,
    nome: "Tecnologia",
    responsavel: { id, nome: "Responsável" },
  },
  especie: {
    id,
    nome: "Computador",
    natureza: { id, nome: "Equipamento" },
  },
  dataTombamento: "2026-10-18",
  tipoIncorporacao: "AQUISICAO",
  valorIncorporacao: "1000.0000000",
  processoCompra: null,
  cadastradoPor: { id, nome: "Operador" },
  parametroDepreciacaoAtual: null,
  createdAt: "2026-10-18T12:00:00.000Z",
  updatedAt: null,
} satisfies PatrimonioDetalhe;

const historicoVazio = {
  status: 200,
  sucesso: true,
  mensagem: "Eventos consultados.",
  tipo: "ficha-bem",
  dados: [],
  resumo: { quantidade: 0, porTipo: [] },
  meta: { total: 0, pagina: 1, limite: 20, ultimaPagina: 1 },
  consulta: {
    id,
    instante: "2026-11-02T12:00:00.000Z",
    filtros: { patrimonioId: id },
    criterioTemporal: "Ocorrência",
    ordenacao: "Crescente",
    avisos: [],
    excluidosDataDesconhecida: 0,
  },
} satisfies EventosFichaResponse;

describe("PatrimonioDetalheView", () => {
  it("exibe a classificação não depreciável sem tratar a ausência como cadastro incompleto", () => {
    render(
      <PatrimonioDetalheView
        patrimonio={patrimonio}
        eventos={historicoVazio}
        erroEventos={null}
        valores={{ aba: "dados" }}
        diretor={false}
        usuarioId={id}
      />,
    );

    expect(screen.getByText("Bem depreciável")).toBeTruthy();
    expect(screen.getByText("Não", { selector: "dd" })).toBeTruthy();
    expect(screen.getByText("Não se aplica")).toBeTruthy();
  });

  it("diferencia um histórico consultado sem registros", () => {
    render(
      <PatrimonioDetalheView
        patrimonio={patrimonio}
        eventos={historicoVazio}
        erroEventos={null}
        valores={{ aba: "historico" }}
        diretor={false}
        usuarioId={id}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "Histórico ainda sem registros",
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("mantém a aba de histórico e apresenta falha como erro", () => {
    render(
      <PatrimonioDetalheView
        patrimonio={patrimonio}
        eventos={null}
        erroEventos="Falha ao carregar eventos."
        valores={{ aba: "historico" }}
        diretor={false}
        usuarioId={id}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Não foi possível carregar o histórico",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain(
      "Falha ao carregar eventos.",
    );
    expect(
      screen.queryByRole("heading", {
        name: "Identificação e classificação",
      }),
    ).toBeNull();
  });
});
