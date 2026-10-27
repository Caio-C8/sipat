import {
  calcularHashTokenMobile,
  extrairBearer,
  gerarTokenMobile,
} from "../token-mobile";

describe("credenciais mobile", () => {
  it("gera 32 bytes em Base64url canônico e calcula hash SHA-256", () => {
    const token = gerarTokenMobile();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(calcularHashTokenMobile(token)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("aceita somente o esquema Bearer e token canônicos", () => {
    const token = "A".repeat(43);
    expect(extrairBearer({ authorization: `Bearer ${token}` })).toBe(token);
    expect(extrairBearer({ authorization: `bearer ${token}` })).toBeNull();
    expect(extrairBearer({ authorization: `Bearer ${token}=` })).toBeNull();
    expect(extrairBearer({ authorization: ["Bearer", token] })).toBeNull();
    expect(calcularHashTokenMobile("curto")).toBeNull();
  });
});
