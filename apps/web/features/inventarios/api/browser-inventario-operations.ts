"use client";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { criarOperacoesInventarios } from "./inventario-operations";

export const browserInventarioOperations =
  criarOperacoesInventarios(browserApiClient);
