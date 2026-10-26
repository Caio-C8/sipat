"use client";

import { browserApiClient } from "@/lib/api/browser-api-client";
import { criarOperacoesAuth } from "./auth-operations";

export const browserAuth = criarOperacoesAuth(browserApiClient);
