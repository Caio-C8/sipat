const AMBIENTES_PERMITIDOS = new Set(["development", "staging"]);

export interface ConfiguracaoSeedGeral {
  ambiente: "development" | "staging";
  senhaAdministrador: string;
  senhaDiretor: string;
}

export function lerConfiguracaoSeedGeral(
  ambiente: NodeJS.ProcessEnv = process.env,
): ConfiguracaoSeedGeral {
  const appEnv = ambiente.APP_ENV;
  if (!appEnv || !AMBIENTES_PERMITIDOS.has(appEnv)) {
    throw new Error(
      "O seed geral só pode ser executado com APP_ENV=development ou APP_ENV=staging.",
    );
  }
  if (ambiente.SIPAT_ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Defina SIPAT_ALLOW_DEMO_SEED=true para habilitar o seed geral.",
    );
  }
  if (ambiente.SIPAT_DEMO_SEED_CONFIRMATION !== appEnv) {
    throw new Error(
      "SIPAT_DEMO_SEED_CONFIRMATION deve coincidir exatamente com APP_ENV.",
    );
  }
  const senhaAdministrador = ambiente.SIPAT_DEMO_ADMIN_PASSWORD;
  const senhaDiretor = ambiente.SIPAT_DEMO_DIRECTOR_PASSWORD;
  if (!senhaAdministrador || !senhaDiretor) {
    throw new Error(
      "SIPAT_DEMO_ADMIN_PASSWORD e SIPAT_DEMO_DIRECTOR_PASSWORD são obrigatórias.",
    );
  }
  return {
    ambiente: appEnv as ConfiguracaoSeedGeral["ambiente"],
    senhaAdministrador,
    senhaDiretor,
  };
}
