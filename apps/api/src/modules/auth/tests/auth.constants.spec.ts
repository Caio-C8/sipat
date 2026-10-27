import {
  DURACAO_ABSOLUTA_SESSAO_MS,
  DURACAO_ACCESS_TOKEN_MOBILE_MS,
  INATIVIDADE_NOMINAL_SESSAO_MS,
  INTERVALO_ATUALIZACAO_ATIVIDADE_MS,
  MAXIMO_SESSOES_ATIVAS,
  POLITICA_RATE_LIMIT_LOGIN,
} from "../auth.constants";

describe("políticas de autenticação do SIPAT", () => {
  it("fixa os limites temporais e de sessões confirmados", () => {
    expect(DURACAO_ABSOLUTA_SESSAO_MS).toBe(8 * 60 * 60 * 1_000);
    expect(DURACAO_ACCESS_TOKEN_MOBILE_MS).toBe(10 * 60 * 1_000);
    expect(INATIVIDADE_NOMINAL_SESSAO_MS).toBe(30 * 60 * 1_000);
    expect(INTERVALO_ATUALIZACAO_ATIVIDADE_MS).toBe(5 * 60 * 1_000);
    expect(MAXIMO_SESSOES_ATIVAS).toBe(5);
  });

  it("mantém as janelas de rate limit decididas por ambiente", () => {
    expect(POLITICA_RATE_LIMIT_LOGIN).toEqual({
      development: { tentativas: 20, janelaMs: 15 * 60 * 1_000 },
      test: { tentativas: 3, janelaMs: 60 * 1_000 },
      staging: { tentativas: 5, janelaMs: 15 * 60 * 1_000 },
      production: { tentativas: 5, janelaMs: 15 * 60 * 1_000 },
    });
  });
});
