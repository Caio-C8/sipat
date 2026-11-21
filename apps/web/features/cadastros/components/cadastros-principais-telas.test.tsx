// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ListaFornecedores,
  ListaResponsaveis,
} from "./cadastros-principais-telas";

afterEach(cleanup);

const id = "7041c62b-5f83-432c-a178-889977d839b1";
const meta = { total: 1, pagina: 1, ultimaPagina: 1 };

describe("listas dos cadastros principais", () => {
  it("oferece rotas canônicas de criação e edição ao Administrador", () => {
    render(
      <ListaFornecedores
        admin
        meta={meta}
        registros={[
          {
            id,
            razaoSocial: "Fornecedor real",
            nomeFantasia: null,
            cnpj: null,
            ativo: true,
          },
        ]}
      />,
    );

    expect(
      screen
        .getByRole("link", { name: "Cadastrar fornecedor" })
        .getAttribute("href"),
    ).toBe("/cadastros/fornecedores/novo");
    expect(
      screen.getByRole("link", { name: "Editar" }).getAttribute("href"),
    ).toBe(`/cadastros/fornecedores/${id}/editar`);
    expect(
      screen.getByRole("link", { name: "Consultar" }).getAttribute("href"),
    ).toBe(`/cadastros/fornecedores/${id}`);
  });

  it("mantém somente consulta para o Diretor", () => {
    render(
      <ListaResponsaveis
        admin={false}
        meta={meta}
        registros={[
          {
            id,
            nome: "Responsável real",
            matricula: "001",
            ativo: false,
          },
        ]}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "Cadastrar responsável" }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: "Editar" })).toBeNull();
    expect(screen.getByRole("link", { name: "Consultar" })).toBeTruthy();
    expect(screen.getByText("Inativo")).toBeTruthy();
  });
});
