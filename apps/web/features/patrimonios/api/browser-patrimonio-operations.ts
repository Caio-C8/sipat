"use client";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { criarOperacoesPatrimonios } from "./patrimonio-operations";
export const browserPatrimonioOperations =
  criarOperacoesPatrimonios(browserApiClient);
