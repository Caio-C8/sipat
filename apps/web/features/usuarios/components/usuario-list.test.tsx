// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ListaUsuarios } from "./usuario-list";

afterEach(cleanup);

const id = "7041c62b-5f83-432c-a178-889977d839b1";

describe("ListaUsuarios", () => {
  it("segue o padrão de filtros, tabela e rotas canônicas dos cadastros", () => {
    render(
      <ListaUsuarios
        meta={{ total: 1, pagina: 1, ultimaPagina: 1 }}
        registros={[
          {
            id,
            nome: "Usuário de teste",
            email: "usuario@example.test",
            perfil: "DIRETOR_PATRIMONIO",
            ativo: true,
            createdAt: "2026-11-22T12:00:00.000Z",
            updatedAt: null,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Pesquisar usuários" }),
    ).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("Diretor de patrimônio")).toBeTruthy();
    expect(screen.getByText("Ativo")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Cadastrar usuário" })
        .getAttribute("href"),
    ).toBe("/usuarios/novo");
    expect(
      screen.getByRole("link", { name: "Consultar" }).getAttribute("href"),
    ).toBe(`/usuarios/${id}`);
    expect(
      screen.getByRole("link", { name: "Editar" }).getAttribute("href"),
    ).toBe(`/usuarios/${id}/editar`);
  });
});
