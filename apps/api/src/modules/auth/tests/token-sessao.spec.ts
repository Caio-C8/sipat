import { createHash } from "node:crypto";
import {
  calcularHashTokenSessao,
  extrairTokenSessao,
  obterNomeCookieSessao,
} from "../token-sessao";

describe("token de sessão", () => {
  const token = "A".repeat(43);

  it("escolhe o cookie conforme o ambiente", () => {
    expect(obterNomeCookieSessao("development")).toBe("sipat_session");
    expect(obterNomeCookieSessao("test")).toBe("sipat_session");
    expect(obterNomeCookieSessao("staging")).toBe("__Host-sipat_session");
    expect(obterNomeCookieSessao("production")).toBe("__Host-sipat_session");
  });

  it("extrai somente o cookie correspondente ao ambiente", () => {
    const cookies = {
      sipat_session: token,
      "__Host-sipat_session": "B".repeat(43),
    };

    expect(extrairTokenSessao(cookies, "test")).toBe(token);
    expect(extrairTokenSessao(cookies, "production")).toBe("B".repeat(43));
    expect(extrairTokenSessao(null, "test")).toBeUndefined();
  });

  it("rejeita tokens malformados", () => {
    for (const tokenInvalido of [
      undefined,
      null,
      "",
      "curto",
      "A".repeat(42),
      "A".repeat(44),
      `${"A".repeat(42)}=`,
      `${"A".repeat(42)}!`,
    ]) {
      expect(calcularHashTokenSessao(tokenInvalido)).toBeNull();
    }
  });

  it("calcula SHA-256 hexadecimal de forma determinística", () => {
    const hashEsperado = createHash("sha256")
      .update(token, "utf8")
      .digest("hex");

    expect(calcularHashTokenSessao(token)).toBe(hashEsperado);
    expect(calcularHashTokenSessao(token)).toHaveLength(64);
  });
});
