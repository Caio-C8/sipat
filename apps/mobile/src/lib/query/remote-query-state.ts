import type { UseQueryResult } from "@tanstack/react-query";
import { ApiError, isApiError } from "../api/api-error";

export type RemoteQueryState<T> =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "success"; data: T }>
  | Readonly<{ status: "error"; error: ApiError }>;

export function normalizeQueryError(error: unknown) {
  return isApiError(error) ? error : new ApiError("invalid-response");
}

export function remoteQueryState<T>(
  query: Pick<UseQueryResult<T, Error>, "data" | "error">,
): RemoteQueryState<T> {
  if (query.data !== undefined) return { status: "success", data: query.data };
  if (query.error)
    return { status: "error", error: normalizeQueryError(query.error) };
  return { status: "loading" };
}
