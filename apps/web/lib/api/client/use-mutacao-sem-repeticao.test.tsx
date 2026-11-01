// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMutacaoSemRepeticao } from "./use-mutacao-sem-repeticao";

describe("useMutacaoSemRepeticao", () => {
  it("bloqueia o segundo clique enquanto a confirmação está em curso", async () => {
    let concluir!: (valor: string) => void;
    const operacao = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          concluir = resolve;
        }),
    );
    const { result } = renderHook(() => useMutacaoSemRepeticao(operacao));

    let primeira!: Promise<string | null>;
    let segunda!: Promise<string | null>;
    act(() => {
      primeira = result.current.confirmar("pedido");
      segunda = result.current.confirmar("pedido");
    });

    await expect(segunda).resolves.toBeNull();
    expect(operacao).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(true);

    await act(async () => concluir("ok"));
    await expect(primeira).resolves.toBe("ok");
    expect(result.current.pending).toBe(false);
  });
});
