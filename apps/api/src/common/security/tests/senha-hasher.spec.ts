import { verify } from "argon2";
import { SenhaHasher } from "../senha-hasher";

describe("SenhaHasher", () => {
  it("produz hash Argon2id verificável sem conservar a senha em texto puro", async () => {
    const senha = "frase secreta inicial";
    const hash = await new SenhaHasher().criarHash(senha);

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain(senha);
    await expect(verify(hash, senha)).resolves.toBe(true);
    await expect(verify(hash, "senha incorreta")).resolves.toBe(false);
  });
});
