import "server-only";

import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesPatrimonios } from "./patrimonio-operations";

export const serverPatrimonioOperations =
  criarOperacoesPatrimonios(serverApiClient);
