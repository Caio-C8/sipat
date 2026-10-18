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
  id: string;
  expiraAt: Date;
  ultimaAtividadeAt: Date;
  revogadoAt: Date | null;
  usuario: IdentidadeAutenticadaInput & {
    ativo: boolean;
  };
}

export interface UsuarioParaLogin extends IdentidadeAutenticadaInput {
  ativo: boolean;
  senha: string;
}

export interface UsuarioParaAlteracaoSenha {
  ativo: boolean;
  senha: string;
}

export interface LoginRealizado {
  identidade: IdentidadeAutenticada;
  token: string;
}
