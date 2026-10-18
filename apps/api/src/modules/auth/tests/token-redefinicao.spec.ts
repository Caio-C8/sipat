import {
  calcularHashTokenRedefinicaoSenha,
  gerarTokenRedefinicaoSenha,
} from "../token-redefinicao";

describe("token de redefinição de senha", () => {
  it("gera 32 bytes em Base64url sem padding e persiste hash SHA-256", () => {
    const token = gerarTokenRedefinicaoSenha();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(calcularHashTokenRedefinicaoSenha(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(calcularHashTokenRedefinicaoSenha(token)).not.toContain(token);
  });

  it("gera tokens distintos", () => {
    expect(gerarTokenRedefinicaoSenha()).not.toBe(gerarTokenRedefinicaoSenha());
  });
});
