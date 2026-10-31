import type { QueryClient } from "@tanstack/react-query";
import { homeQueryKeys } from "../home/home-query-keys";
import { inventarioQueryKeys } from "./inventario-query-keys";

function invalidateInventarioDetail(
  queryClient: QueryClient,
  inventarioId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: inventarioQueryKeys.detail(inventarioId),
    exact: true,
  });
}

export function invalidateInventarioStart(
  queryClient: QueryClient,
  inventarioId: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: inventarioQueryKeys.lists() }),
    invalidateInventarioDetail(queryClient, inventarioId),
    queryClient.invalidateQueries({
      queryKey: inventarioQueryKeys.sectors(inventarioId),
    }),
    queryClient.invalidateQueries({
      queryKey: homeQueryKeys.inventarios(),
      exact: true,
    }),
  ]);
}

export function invalidateInventarioVerification(
  queryClient: QueryClient,
  inventarioId: string,
  setorInventarioId: string,
) {
  return Promise.all([
    invalidateInventarioDetail(queryClient, inventarioId),
    queryClient.invalidateQueries({
      queryKey: [
        ...inventarioQueryKeys.sectors(inventarioId),
        setorInventarioId,
      ],
    }),
    queryClient.invalidateQueries({
      queryKey: inventarioQueryKeys.items(inventarioId),
    }),
  ]);
}

export function invalidateInventarioCorrection(
  queryClient: QueryClient,
  inventarioId: string,
) {
  return Promise.all([
    invalidateInventarioDetail(queryClient, inventarioId),
    queryClient.invalidateQueries({
      queryKey: inventarioQueryKeys.sectors(inventarioId),
    }),
    queryClient.invalidateQueries({
      queryKey: inventarioQueryKeys.items(inventarioId),
    }),
  ]);
}

export function invalidateInventarioConclusion(
  queryClient: QueryClient,
  inventarioId: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: inventarioQueryKeys.lists() }),
    invalidateInventarioDetail(queryClient, inventarioId),
    queryClient.invalidateQueries({
      queryKey: inventarioQueryKeys.sectors(inventarioId),
    }),
    queryClient.invalidateQueries({
      queryKey: inventarioQueryKeys.items(inventarioId),
    }),
    queryClient.invalidateQueries({
      queryKey: homeQueryKeys.inventarios(),
      exact: true,
    }),
  ]);
}
