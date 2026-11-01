import { lerConfiguracaoSeedGeral } from "./seed-geral.config";
import {
  criarChaveIdempotenciaSeed,
  criarCnpjSintetico,
  dataCivilSaoPaulo,
  deslocarDataCivil,
} from "./seed-geral.matriz";
import { ChaveIdempotenciaSchema, CnpjFornecedorSchema } from "@repo/contracts";
import {
  exigirBancoDominioVazio,
  exigirMigrationsAtuais,
} from "./seed-geral.preflight";

const ambienteValido = {
  APP_ENV: "development",
  SIPAT_ALLOW_DEMO_SEED: "true",
  SIPAT_DEMO_SEED_CONFIRMATION: "development",
  SIPAT_DEMO_ADMIN_PASSWORD: "Senha-Demo-Admin-123!",
  SIPAT_DEMO_DIRECTOR_PASSWORD: "Senha-Demo-Diretor-123!",
} satisfies NodeJS.ProcessEnv;

describe("seed geral", () => {
  it.each(["production", "test", undefined])(
    "recusa APP_ENV=%s antes do bootstrap",
    (APP_ENV) => {
      expect(() =>
        lerConfiguracaoSeedGeral({ ...ambienteValido, APP_ENV }),
      ).toThrow("APP_ENV=development ou APP_ENV=staging");
    },
  );

  it("exige opt-in, confirmação e as duas senhas", () => {
    expect(() =>
      lerConfiguracaoSeedGeral({
        ...ambienteValido,
        SIPAT_ALLOW_DEMO_SEED: "false",
      }),
    ).toThrow("SIPAT_ALLOW_DEMO_SEED=true");
    expect(() =>
      lerConfiguracaoSeedGeral({
        ...ambienteValido,
        SIPAT_DEMO_SEED_CONFIRMATION: "staging",
      }),
    ).toThrow("coincidir exatamente");
    expect(() =>
      lerConfiguracaoSeedGeral({
        ...ambienteValido,
        SIPAT_DEMO_ADMIN_PASSWORD: undefined,
      }),
    ).toThrow("são obrigatórias");
  });

  it("captura a data civil de São Paulo e desloca sem aleatoriedade", () => {
    expect(dataCivilSaoPaulo(new Date("2026-10-30T02:30:00.000Z"))).toBe(
      "2026-10-29",
    );
    expect(deslocarDataCivil("2026-10-30", -1)).toBe("2026-10-29");
  });

  it("produz CNPJs sintéticos distintos aceitos pelo contrato", () => {
    const valores = Array.from({ length: 5 }, (_, indice) =>
      CnpjFornecedorSchema.parse(criarCnpjSintetico(indice + 1)),
    );
    expect(new Set(valores).size).toBe(5);
  });

  it("produz chaves de idempotência determinísticas, válidas e distintas", () => {
    const valores = Array.from({ length: 6 }, (_, grupo) =>
      Array.from({ length: 50 }, (_, indice) =>
        ChaveIdempotenciaSchema.parse(
          criarChaveIdempotenciaSeed(grupo + 1, indice + 1),
        ),
      ),
    ).flat();

    expect(new Set(valores).size).toBe(valores.length);
    expect(criarChaveIdempotenciaSeed(5, 1)).toBe(
      "00000000-0000-4000-8000-050000000001",
    );
  });

  it("recusa migration pendente ou build com histórico diferente", () => {
    const concluidas = Array.from({ length: 26 }, (_, indice) => ({
      migration_name:
        indice === 25
          ? "20261101120000_adiciona_integridade_documento_idempotencia_manutencao"
          : `migration-${indice}`,
      finished_at: new Date(),
      rolled_back_at: null,
    }));
    expect(() => exigirMigrationsAtuais(concluidas)).not.toThrow();
    expect(() =>
      exigirMigrationsAtuais([
        ...concluidas,
        {
          migration_name: "migration-pendente",
          finished_at: null,
          rolled_back_at: null,
        },
      ]),
    ).toThrow("migrations esperadas");
    expect(() => exigirMigrationsAtuais(concluidas.slice(0, -1))).toThrow(
      "Esperado: 26 migrations, última " +
        "20261101120000_adiciona_integridade_documento_idempotencia_manutencao",
    );
  });

  it("recusa qualquer contagem de domínio preexistente", () => {
    expect(() => exigirBancoDominioVazio([0, 0, 0])).not.toThrow();
    expect(() => exigirBancoDominioVazio([0, 1, 0])).toThrow(
      "banco sem qualquer dado de domínio",
    );
  });
});
