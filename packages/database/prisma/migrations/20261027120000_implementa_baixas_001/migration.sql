DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "baixas_patrimoniais"
    WHERE "tipo"::text IN ('INVERSIBILIDADE', 'PERDA_FISICA', 'AJUSTE_CONTABIL')
  ) THEN
    RAISE EXCEPTION
      'BAIXAS-001 exige mapeamento explícito dos tipos legados antes da migração';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "baixas_patrimoniais"
    WHERE "data_baixa" <> date_trunc('day', "data_baixa")
  ) THEN
    RAISE EXCEPTION
      'BAIXAS-001 não pode truncar horários significativos de data_baixa';
  END IF;
END
$$;

ALTER TYPE "TipoBaixa" RENAME TO "TipoBaixa_legado";

CREATE TYPE "TipoBaixa" AS ENUM (
  'ALIENACAO',
  'INUTILIZACAO',
  'SINISTRO',
  'FURTO',
  'EXTRAVIO',
  'TRANSFERENCIA',
  'RECLASSIFICACAO',
  'ABANDONO',
  'ERRO_REGISTRO',
  'OUTRO'
);

ALTER TABLE "baixas_patrimoniais"
  ALTER COLUMN "tipo" TYPE "TipoBaixa"
    USING ("tipo"::text::"TipoBaixa"),
  ALTER COLUMN "data_baixa" TYPE date
    USING ("data_baixa"::date);

DROP TYPE "TipoBaixa_legado";

CREATE UNIQUE INDEX "baixas_patrimoniais_patrimonio_id_key"
  ON "baixas_patrimoniais"("patrimonio_id");
