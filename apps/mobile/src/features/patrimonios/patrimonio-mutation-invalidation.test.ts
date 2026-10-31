import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { homeQueryKeys } from "../home/home-query-keys";
import { invalidatePatrimonioCreation } from "./patrimonio-mutation-invalidation";
import { patrimonioQueryKeys } from "./patrimonio-query-keys";

describe("invalidação após cadastrar patrimônio", () => {
  it("aguarda e limita a reconciliação às listas, detalhes e Home", async () => {
    const queryClient = new QueryClient();
    let releaseFirstInvalidation: (() => void) | undefined;
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseFirstInvalidation = resolve;
          }),
      )
      .mockResolvedValue(undefined);

    const reconciliation = invalidatePatrimonioCreation(queryClient);
    let reconciled = false;
    void reconciliation.then(() => {
      reconciled = true;
    });

    await Promise.resolve();
    expect(reconciled).toBe(false);
    releaseFirstInvalidation?.();
    await reconciliation;
    expect(reconciled).toBe(true);

    expect(invalidate.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: patrimonioQueryKeys.lists() },
      { queryKey: patrimonioQueryKeys.details() },
      { queryKey: homeQueryKeys.patrimonios(), exact: true },
    ]);
  });

  it("marca dado confirmado como obsoleto sem substituição otimista", async () => {
    const queryClient = new QueryClient();
    const detailKey = patrimonioQueryKeys.detail(
      "11111111-1111-4111-8111-111111111111",
    );
    const confirmed = { descricao: "Dado confirmado pela API" };
    queryClient.setQueryData(detailKey, confirmed);

    await invalidatePatrimonioCreation(queryClient);

    expect(queryClient.getQueryData(detailKey)).toBe(confirmed);
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
  });
});
