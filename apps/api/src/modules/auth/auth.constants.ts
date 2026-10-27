export const CHAVE_ROTA_PUBLICA = "sipat:rota-publica";
export const CHAVE_PERFIS_PERMITIDOS = "sipat:perfis-permitidos";
export const CHAVE_PERMITE_TROCA_SENHA_OBRIGATORIA =
  "sipat:permite-troca-senha-obrigatoria";
export const CHAVE_TRANSPORTE_AUTH_MOBILE = "sipat:transporte-auth-mobile";

export const DURACAO_ABSOLUTA_SESSAO_MS = 8 * 60 * 60 * 1_000;
export const DURACAO_ACCESS_TOKEN_MOBILE_MS = 10 * 60 * 1_000;
export const INATIVIDADE_NOMINAL_SESSAO_MS = 30 * 60 * 1_000;
export const INTERVALO_ATUALIZACAO_ATIVIDADE_MS = 5 * 60 * 1_000;
export const MAXIMO_SESSOES_ATIVAS = 5;
export const TAMANHO_LOTE_LIMPEZA_RATE_LIMIT = 100;
export const MAXIMO_TENTATIVAS_TRANSACAO = 3;
export const DURACAO_TOKEN_REDEFINICAO_SENHA_MS = 15 * 60 * 1_000;

export const POLITICA_RATE_LIMIT_LOGIN = {
  development: { tentativas: 20, janelaMs: 15 * 60 * 1_000 },
  test: { tentativas: 3, janelaMs: 60 * 1_000 },
  staging: { tentativas: 5, janelaMs: 15 * 60 * 1_000 },
  production: { tentativas: 5, janelaMs: 15 * 60 * 1_000 },
} as const;

export const METODOS_PROTEGIDOS_POR_CSRF = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);
