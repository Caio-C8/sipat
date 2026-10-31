export interface EstadoMigrationSeed {
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
}

const ULTIMA_MIGRATION =
  "20261030180000_adiciona_localizacoes_posteriores_inventario";
const TOTAL_MIGRATIONS = 23;

export function exigirMigrationsAtuais(
  migrations: readonly EstadoMigrationSeed[],
): void {
  const aplicadas = migrations.filter(
    (item) => item.finished_at && !item.rolled_back_at,
  );
  if (
    aplicadas.length !== TOTAL_MIGRATIONS ||
    aplicadas.at(-1)?.migration_name !== ULTIMA_MIGRATION ||
    migrations.some((item) => !item.finished_at && !item.rolled_back_at)
  ) {
    const ultimaAplicada = aplicadas.at(-1)?.migration_name ?? "nenhuma";
    throw new Error(
      "O banco não possui exatamente as migrations esperadas pelo build da API. " +
        `Esperado: ${TOTAL_MIGRATIONS} migrations, última ${ULTIMA_MIGRATION}. ` +
        `Encontrado: ${aplicadas.length} migrations aplicadas, última ${ultimaAplicada}.`,
    );
  }
}

export function exigirBancoDominioVazio(contagens: readonly number[]): void {
  if (contagens.some((total) => total !== 0)) {
    throw new Error("O seed geral exige banco sem qualquer dado de domínio.");
  }
}
