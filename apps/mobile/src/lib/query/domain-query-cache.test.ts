import { CancelledError } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/api-error";
import { createMobileQueryClient } from "./mobile-query-client";
import { DOMAIN_STALE_TIME_MS } from "./query-policy";
import { remoteQueryState } from "./remote-query-state";

describe("cache de queries de domínio", () => {
  it("deduplica duas leituras concorrentes da mesma key", async () => {
    const client = createMobileQueryClient();
    let release!: (value: number) => void;
    const pending = new Promise<number>((resolve) => {
      release = resolve;
    });
    const queryFn = vi.fn(() => pending);
    const options = {
      queryKey: ["domain", "same-key"] as const,
      queryFn,
      staleTime: DOMAIN_STALE_TIME_MS,
    };

    const first = client.fetchQuery(options);
    const second = client.fetchQuery(options);
    expect(queryFn).toHaveBeenCalledTimes(1);
    release(42);

    await expect(Promise.all([first, second])).resolves.toEqual([42, 42]);
    client.clear();
  });

  it("reutiliza dado fresco e permite uma atualização manual", async () => {
    const client = createMobileQueryClient();
    const queryFn = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const queryKey = ["domain", "fresh"] as const;

    await expect(
      client.fetchQuery({ queryKey, queryFn, staleTime: DOMAIN_STALE_TIME_MS }),
    ).resolves.toBe(1);
    await expect(
      client.fetchQuery({ queryKey, queryFn, staleTime: DOMAIN_STALE_TIME_MS }),
    ).resolves.toBe(1);
    await expect(
      client.fetchQuery({ queryKey, queryFn, staleTime: 0 }),
    ).resolves.toBe(2);

    expect(queryFn).toHaveBeenCalledTimes(2);
    client.clear();
  });

  it("aborta a operação quando a query é cancelada", async () => {
    const client = createMobileQueryClient();
    let receivedSignal: AbortSignal | undefined;
    const promise = client.fetchQuery({
      queryKey: ["domain", "cancel"] as const,
      queryFn: ({ signal }) => {
        receivedSignal = signal;
        return new Promise<number>(() => undefined);
      },
    });

    await client.cancelQueries({ queryKey: ["domain", "cancel"], exact: true });

    expect(receivedSignal?.aborted).toBe(true);
    await expect(promise).rejects.toBeInstanceOf(CancelledError);
    client.clear();
  });

  it("preserva o último dado confirmado quando um refetch falha", () => {
    const error = new ApiError("network");

    expect(remoteQueryState({ data: 42, error })).toEqual({
      status: "success",
      data: 42,
    });
    expect(remoteQueryState<number>({ data: undefined, error })).toEqual({
      status: "error",
      error,
    });
  });
});
