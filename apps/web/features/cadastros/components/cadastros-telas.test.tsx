// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CadastrosTelas } from "./cadastros-telas";
import {
  FormularioNatureza,
  FormularioResponsavel,
} from "./formularios-basicos";
import { FormularioCadastro } from "./formulario-cadastro";
import { ApiError } from "@/lib/api/core/api-error";
import { browserApiClient } from "@/lib/api/browser-api-client";
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/api/browser-api-client", () => ({
  browserApiClient: { request: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const id = "7041c62b-5f83-432c-a178-889977d839b1";
describe("cadastros integrados", () => {
  it("gera navegação de seleção e paginação com filtros reais", () => {
    render(
      <CadastrosTelas
        secao="naturezas"
        registros={[{ id, titulo: "Natureza real", detalhe: "Patrimonial" }]}
        meta={{ total: 25, pagina: 1, ultimaPagina: 2 }}
        busca="Natureza"
        id={id}
      >
        <p>Formulário</p>
      </CadastrosTelas>,
    );
    expect(
      screen.getByRole("link", { name: /Natureza real/ }).getAttribute("href"),
    ).toContain("id=" + id);
    expect(
      screen.getByRole("link", { name: "Próxima" }).getAttribute("href"),
    ).toContain("pagina=2");
    expect(screen.queryByText(/de exemplo/)).toBeNull();
  });
  it("cadastra natureza sem campos ilustrativos e atualiza a consulta", async () => {
    vi.mocked(browserApiClient.request).mockResolvedValue({ dados: { id } });
    render(<FormularioNatureza />);
    fireEvent.change(screen.getByLabelText("Nome da natureza *"), {
      target: { value: " Bem móvel " },
    });
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Descrição real" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar natureza" }));
    await waitFor(() =>
      expect(browserApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          path: "/naturezas",
          body: { nome: "Bem móvel", descricao: "Descrição real" },
          headers: { "X-SIPAT-CSRF": "1" },
        }),
      ),
    );
    expect(router.replace).toHaveBeenCalledWith(
      "/cadastros/naturezas?id=" + id + "&salvo=1",
    );
  });
  it("limpa descrição por null na edição e preserva campos após erro", async () => {
    vi.mocked(browserApiClient.request).mockRejectedValue(
      new ApiError({
        status: 409,
        codigo: "NATUREZA_DUPLICADA",
        mensagem: "Nome já cadastrado.",
        categoria: "http",
      }),
    );
    render(
      <FormularioNatureza
        registro={{
          id,
          nome: "Natureza",
          descricao: "Antes",
          nomeNormalizado: "natureza",
          createdById: id,
          createdAt: "2026-11-02T00:00:00.000Z",
          updatedAt: null,
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar natureza" }));
    await screen.findByRole("alert");
    expect(browserApiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PATCH",
        body: { nome: "Natureza", descricao: null },
      }),
    );
    expect(
      (screen.getByLabelText("Nome da natureza *") as HTMLInputElement).value,
    ).toBe("Natureza");
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("solicita confirmação antes de inativar e usa a operação de situação", async () => {
    vi.mocked(browserApiClient.request).mockResolvedValue({ dados: { id } });
    render(
      <FormularioResponsavel
        registro={{
          id,
          nome: "Responsável",
          matricula: "001",
          ativo: true,
          createdById: id,
          createdAt: "2026-11-02T00:00:00.000Z",
          updatedAt: null,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Inativar cadastro" }));
    expect(browserApiClient.request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar situação" }));
    await waitFor(() =>
      expect(browserApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/responsaveis/" + id + "/situacao",
          method: "PATCH",
          body: { ativo: false },
        }),
      ),
    );
  });
  it("preserva a mesma chave e o formulário em timeout e falha conclusiva posterior", async () => {
    const salvar = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          status: 503,
          codigo: "TEMPORARIO",
          mensagem: "Indisponível",
          categoria: "http",
        }),
      )
      .mockRejectedValueOnce(
        new ApiError({
          status: 401,
          codigo: "SESSAO",
          mensagem: "Sessão inválida",
          categoria: "http",
        }),
      )
      .mockResolvedValue({ id });
    render(
      <FormularioCadastro
        titulo="Novo cadastro"
        destino="/cadastros"
        idempotente
        salvar={salvar}
      >
        <label>
          Nome
          <input name="nome" defaultValue="Preservado" />
        </label>
      </FormularioCadastro>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await screen.findByRole("button", { name: "Confirmar novamente" });
    const chave = salvar.mock.calls[0]![1];
    const dados = salvar.mock.calls[0]![0];
    expect(
      screen.getByRole("textbox", { name: "Nome" }).matches(":disabled"),
    ).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar novamente" }),
    );
    await waitFor(() => expect(salvar).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Confirmar novamente",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar novamente" }),
    );
    await waitFor(() => expect(salvar).toHaveBeenCalledTimes(3));
    expect(salvar.mock.calls.map((c) => c[1])).toEqual([chave, chave, chave]);
    expect(salvar.mock.calls[2]![0]).toBe(dados);
  });
  it("impede confirmação duplicada enquanto a operação está em andamento", async () => {
    let resolver!: (value: { id: string }) => void;
    const salvar = vi.fn(
      () =>
        new Promise<{ id: string }>((resolve) => {
          resolver = resolve;
        }),
    );
    render(
      <FormularioCadastro
        titulo="Novo cadastro"
        destino="/cadastros"
        salvar={salvar}
      >
        <input name="nome" />
      </FormularioCadastro>,
    );
    const form = screen.getByRole("form", { name: "Novo cadastro" });
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(salvar).toHaveBeenCalledTimes(1);
    resolver({ id });
    await waitFor(() => expect(router.replace).toHaveBeenCalled());
  });
});
