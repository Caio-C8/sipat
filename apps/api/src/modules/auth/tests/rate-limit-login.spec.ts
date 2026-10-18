import {
  criarChaveRateLimitAlteracaoSenha,
  criarChaveRateLimitLogin,
} from "../rate-limit-login";

describe("chaves de rate limit de autenticação", () => {
  const segredo = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY";

  it("mantém login e alteração de senha em escopos HMAC distintos", () => {
    const identidade = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
    const chaveLogin = criarChaveRateLimitLogin(identidade, segredo);
    const chaveAlteracao = criarChaveRateLimitAlteracaoSenha(
      identidade,
      segredo,
    );

    expect(chaveLogin).toMatch(/^[a-f0-9]{64}$/);
    expect(chaveAlteracao).toMatch(/^[a-f0-9]{64}$/);
    expect(chaveAlteracao).not.toBe(chaveLogin);
    expect(chaveAlteracao).not.toContain(identidade);
  });
});
