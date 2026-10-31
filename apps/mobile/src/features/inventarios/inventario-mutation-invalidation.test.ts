import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { homeQueryKeys } from "../home/home-query-keys";
import {
  invalidateInventarioConclusion,
  invalidateInventarioCorrection,
  invalidateInventarioStart,
  invalidateInventarioVerification,
} from "./inventario-mutation-invalidation";
import { inventarioQueryKeys } from "./inventario-query-keys";

const INVENTARIO_ID = "11111111-1111-4111-8111-111111111111";
const SETOR_ID = "22222222-2222-4222-8222-222222222222";

function subject() {
  const queryClient = new QueryClient();
  const invalidate = vi
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
  return { queryClient, invalidate };
}

describe("matriz de invalidação de inventários", () => {
  it("invalida as famílias do início de setor", async () => {
    const { queryClient, invalidate } = subject();

    await invalidateInventarioStart(queryClient, INVENTARIO_ID);

    expect(invalidate.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: inventarioQueryKeys.lists() },
      { queryKey: inventarioQueryKeys.detail(INVENTARIO_ID), exact: true },
      { queryKey: inventarioQueryKeys.sectors(INVENTARIO_ID) },
      { queryKey: homeQueryKeys.inventarios(), exact: true },
    ]);
  });

  it("invalida setor, itens e agregado após verificação", async () => {
    const { queryClient, invalidate } = subject();

    await invalidateInventarioVerification(
      queryClient,
      INVENTARIO_ID,
      SETOR_ID,
    );

    expect(invalidate.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: inventarioQueryKeys.detail(INVENTARIO_ID), exact: true },
      {
        queryKey: [...inventarioQueryKeys.sectors(INVENTARIO_ID), SETOR_ID],
      },
      { queryKey: inventarioQueryKeys.items(INVENTARIO_ID) },
    ]);
  });

  it("invalida setores, itens e agregado após correção", async () => {
    const { queryClient, invalidate } = subject();

    await invalidateInventarioCorrection(queryClient, INVENTARIO_ID);

    expect(invalidate.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: inventarioQueryKeys.detail(INVENTARIO_ID), exact: true },
      { queryKey: inventarioQueryKeys.sectors(INVENTARIO_ID) },
      { queryKey: inventarioQueryKeys.items(INVENTARIO_ID) },
    ]);
  });

  it("invalida todas as famílias afetadas pela conclusão do setor", async () => {
    const { queryClient, invalidate } = subject();

    await invalidateInventarioConclusion(queryClient, INVENTARIO_ID);

    expect(invalidate.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: inventarioQueryKeys.lists() },
      { queryKey: inventarioQueryKeys.detail(INVENTARIO_ID), exact: true },
      { queryKey: inventarioQueryKeys.sectors(INVENTARIO_ID) },
      { queryKey: inventarioQueryKeys.items(INVENTARIO_ID) },
      { queryKey: homeQueryKeys.inventarios(), exact: true },
    ]);
  });
});
