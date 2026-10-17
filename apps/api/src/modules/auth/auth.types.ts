import type {
  IdentidadeAutenticada,
  IdentidadeAutenticadaInput,
} from "@repo/contracts";

export interface RequisicaoAutenticada {
  cookies?: unknown;
  headers: Readonly<Record<string, string | readonly string[] | undefined>>;
  identidadeAutenticada?: IdentidadeAutenticada;
  method: string;
}

export interface SessaoParaAutenticacao {
  expiresAt: Date;
  revokedAt: Date | null;
  usuario: IdentidadeAutenticadaInput & {
    ativo: boolean;
  };
}
