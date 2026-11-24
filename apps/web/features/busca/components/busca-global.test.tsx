// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DominiosBuscaGlobal } from "@repo/contracts";
import { BuscaGlobal } from "./busca-global";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/api/browser-api-client", () => ({
  browserApiClient: { request },
}));

const gruposVazios = DominiosBuscaGlobal.map((dominio) => ({
  dominio,
  rotulo: dominio,
  total: 0,
  truncado: false,
  verTodosDestino: null,
  itens: [],
}));

beforeEach(() => {
  request.mockReset();
});
afterEach(cleanup);

describe("busca global", () => {
  it("aguarda o debounce e mostra os grupos retornados", async () => {
    request.mockResolvedValue({
      dados: {
        termo: "mesa",
        grupos: gruposVazios.map((grupo) =>
          grupo.dominio === "PATRIMONIOS"
            ? {
                ...grupo,
                rotulo: "Patrimônios",
                total: 1,
                itens: [
                  {
                    id: "11111111-1111-4111-8111-111111111111",
                    identificador: "123",
                    titulo: "Mesa de reunião",
                    complemento: "Mobiliário",
                    destino:
                      "/patrimonios/11111111-1111-4111-8111-111111111111",
                  },
                ],
              }
            : grupo,
        ),
      },
    });
    render(<BuscaGlobal />);
    fireEvent.click(screen.getByRole("button", { name: /Pesquisar no SIPAT/ }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Termo da busca global" }),
      {
        target: { value: "mesa" },
      },
    );

    await waitFor(() => expect(request).toHaveBeenCalledTimes(1), {
      timeout: 1000,
    });
    expect(await screen.findByText("Mesa de reunião")).toBeTruthy();
    expect(screen.queryByText("USUARIOS")).toBeNull();
  });

  it("cancela a requisição anterior quando o termo muda", async () => {
    const sinais: AbortSignal[] = [];
    request.mockImplementation(({ signal }: { signal: AbortSignal }) => {
      sinais.push(signal);
      return new Promise(() => undefined);
    });
    render(<BuscaGlobal />);
    fireEvent.click(screen.getByRole("button", { name: /Pesquisar no SIPAT/ }));
    const input = screen.getByRole("textbox", {
      name: "Termo da busca global",
    });
    fireEvent.change(input, { target: { value: "mesa" } });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1), {
      timeout: 1000,
    });
    fireEvent.change(input, { target: { value: "cadeira" } });
    expect(sinais[0]?.aborted).toBe(true);
  });
});
