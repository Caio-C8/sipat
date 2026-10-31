import type { QueryClient } from "@tanstack/react-query";
import { homeQueryKeys } from "../home/home-query-keys";
import { patrimonioQueryKeys } from "./patrimonio-query-keys";

export function invalidatePatrimonioCreation(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: patrimonioQueryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: patrimonioQueryKeys.details() }),
    queryClient.invalidateQueries({
      queryKey: homeQueryKeys.patrimonios(),
      exact: true,
    }),
  ]);
}
