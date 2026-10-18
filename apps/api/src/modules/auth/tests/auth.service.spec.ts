import type { PerfilUsuario } from "@repo/contracts";
import { AuthService } from "../auth.service";
import type { SessaoRepository } from "../sessao.repository";
import type { SessaoParaAutenticacao } from "../auth.types";

describe("AuthService", () => {
  const token = "A".repeat(43);
  const identidadeBase = {
    id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
    nome: "Maria da Silva",
    email: "maria@example.com",
  } as const;

  const buscarPorTokenHash = jest.fn();
  const repository = {
    buscarPorTokenHash,
  } as unknown as SessaoRepository;
  const service = new AuthService(repository);

  function sessaoValida(
    perfil: PerfilUsuario = "ADMINISTRADOR",
  ): SessaoParaAutenticacao {
    return {
      expiresAt: new Date("2999-01-01T00:00:00.000Z"),
      revokedAt: null,
      usuario: {
        ...identidadeBase,
        perfil,
        ativo: true,
      },
    };
  }

  beforeEach(() => {
    buscarPorTokenHash.mockReset();
  });

  it.each(["ADMINISTRADOR", "DIRETOR_PATRIMONIO"] as const)(
    "autentica sessão válida do perfil %s",
    async (perfil) => {
      buscarPorTokenHash.mockResolvedValue(sessaoValida(perfil));

      await expect(service.autenticar(token)).resolves.toEqual({
        ...identidadeBase,
        perfil,
      });
      expect(buscarPorTokenHash).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]{64}$/),
      );
    },
  );

  it("rejeita token malformado sem consultar o banco", async () => {
    await expect(service.autenticar("invalido")).resolves.toBeNull();
    expect(buscarPorTokenHash).not.toHaveBeenCalled();
  });

  it("rejeita sessão inexistente", async () => {
    buscarPorTokenHash.mockResolvedValue(null);

    await expect(service.autenticar(token)).resolves.toBeNull();
  });

  it("rejeita sessão expirada", async () => {
    buscarPorTokenHash.mockResolvedValue({
      ...sessaoValida(),
      expiresAt: new Date("2000-01-01T00:00:00.000Z"),
    });

    await expect(service.autenticar(token)).resolves.toBeNull();
  });

  it("rejeita sessão revogada", async () => {
    buscarPorTokenHash.mockResolvedValue({
      ...sessaoValida(),
      revokedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await expect(service.autenticar(token)).resolves.toBeNull();
  });

  it("rejeita usuário inativo", async () => {
    const sessao = sessaoValida();
    buscarPorTokenHash.mockResolvedValue({
      ...sessao,
      usuario: { ...sessao.usuario, ativo: false },
    });

    await expect(service.autenticar(token)).resolves.toBeNull();
  });
});
