import type {
  CredenciaisMobile,
  IdentidadeAutenticada,
  IdentidadeAutenticadaInput,
} from "@repo/contracts";

type IdentidadePersistidaAtual = IdentidadeAutenticadaInput;

export interface RequisicaoAutenticada {
  cookies?: unknown;
  headers: Readonly<Record<string, string | readonly string[] | undefined>>;
  identidadeAutenticada?: IdentidadeAutenticada;
  transporteAutenticacao?: "cookie" | "bearer";
  method: string;
}

export interface SessaoParaAutenticacao {
  id: string;
  expiraAt: Date;
  ultimaAtividadeAt: Date;
  revogadoAt: Date | null;
  tipo: "WEB" | "MOBILE";
  accessExpiraAt: Date | null;
  usuario: IdentidadePersistidaAtual & {
    ativo: boolean;
  };
}

export interface UsuarioParaLogin extends IdentidadePersistidaAtual {
  ativo: boolean;
  senha: string;
}

export interface UsuarioParaAlteracaoSenha {
  ativo: boolean;
  senha: string;
}

export interface PrimeiroAcessoConcluido {
  token: string;
}

export interface UsuarioParaRecuperacaoSenha {
  id: string;
  email: string;
}

export interface RedefinicaoSenhaParaConsumo {
  id: string;
  tokenHash: string;
  expiraAt: Date;
  consumidoAt: Date | null;
  usuario: {
    id: string;
    email: string;
    ativo: boolean;
    senha: string;
  };
}

export interface LoginRealizado {
  identidade: IdentidadeAutenticada;
  token: string;
}

export interface LoginMobileRealizado {
  identidade: IdentidadeAutenticada;
  credenciais: CredenciaisMobile;
}

export interface RefreshMobileParaUso {
  id: string;
  tokenHash: string;
  expiraAt: Date;
  usadoAt: Date | null;
  sessao: SessaoParaAutenticacao;
}
