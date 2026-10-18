import { SetMetadata } from "@nestjs/common";
import type { PerfilUsuario } from "@repo/contracts";
import { CHAVE_PERFIS_PERMITIDOS } from "../auth.constants";

export const PerfisPermitidos = (...perfis: readonly PerfilUsuario[]) =>
  SetMetadata(CHAVE_PERFIS_PERMITIDOS, perfis);
