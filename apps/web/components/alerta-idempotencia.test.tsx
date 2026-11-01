// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/core/api-error";
import { decidirAposFalha } from "@/lib/api/core/idempotencia";
import { AlertaIdempotencia } from "./alerta-idempotencia";

afterEach(cleanup);

function erro(codigo: string) {
  return new ApiError({
    status: 409,
    codigo,
    mensagem: codigo,
    categoria: "http",
  });
}

describe("AlertaIdempotencia", () => {
  it("informa a operação já concluída e oferece a consulta existente", () => {
    const falha = erro("OPERACAO_JA_PROCESSADA");
    render(
      <AlertaIdempotencia
        erro={falha}
        decisao={decidirAposFalha(falha)}
        destino={{ href: "/movimentacoes", rotulo: "Consultar" }}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "Esta operação já havia sido concluída. Nenhuma nova alteração foi feita.",
    );
    expect(
      screen.getByRole("link", { name: "Consultar" }).getAttribute("href"),
    ).toBe("/movimentacoes");
  });

  it("exige nova confirmação quando a chave foi reutilizada", () => {
    const falha = erro("CHAVE_IDEMPOTENCIA_REUTILIZADA");
    const confirmar = vi.fn();
    render(
      <AlertaIdempotencia
        erro={falha}
        decisao={decidirAposFalha(falha)}
        destino={{ href: "/movimentacoes", rotulo: "Consultar" }}
        onTentarNovamente={confirmar}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar novamente" }),
    );
    expect(confirmar).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert").textContent).toContain(
      "Revise o formulário e confirme novamente.",
    );
  });

  it("comunica o processamento temporário sem descartar a tentativa", () => {
    const falha = erro("OPERACAO_EM_PROCESSAMENTO");
    render(
      <AlertaIdempotencia
        erro={falha}
        decisao={decidirAposFalha(falha)}
        destino={{ href: "/movimentacoes", rotulo: "Consultar" }}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "os dados e a chave foram preservados",
    );
  });
});
