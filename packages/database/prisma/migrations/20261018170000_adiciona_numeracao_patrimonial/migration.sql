DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "patrimonios"
    WHERE NOT (
      "numero_patrimonio" ~ '^[1-9][0-9]*$'
      OR "numero_patrimonio" ~ '^SP-[1-9][0-9]*$'
    )
  ) THEN
    RAISE EXCEPTION
      'Não é possível classificar a numeração patrimonial: existem valores legados fora dos formatos canônicos.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "patrimonios"
    WHERE CASE
      WHEN "numero_patrimonio" LIKE 'SP-%'
        THEN substring("numero_patrimonio" FROM 4)::numeric
      ELSE "numero_patrimonio"::numeric
    END > 9223372036854775807
  ) THEN
    RAISE EXCEPTION
      'Não é possível inicializar as sequences: existe número patrimonial acima do limite bigint.';
  END IF;
END $$;

CREATE TYPE "TipoNumeroPatrimonial" AS ENUM ('OFICIAL', 'SEM_NUMERO_OFICIAL');

ALTER TABLE "patrimonios"
ADD COLUMN "tipo_numero_patrimonial" "TipoNumeroPatrimonial";

UPDATE "patrimonios"
SET "tipo_numero_patrimonial" = CASE
  WHEN "numero_patrimonio" LIKE 'SP-%'
    THEN 'SEM_NUMERO_OFICIAL'::"TipoNumeroPatrimonial"
  ELSE 'OFICIAL'::"TipoNumeroPatrimonial"
END;

ALTER TABLE "patrimonios"
ALTER COLUMN "tipo_numero_patrimonial" SET NOT NULL;

CREATE SEQUENCE "patrimonios_numero_oficial_seq" AS BIGINT START WITH 1;
CREATE SEQUENCE "patrimonios_sem_numero_oficial_seq" AS BIGINT START WITH 1;

SELECT setval(
  'patrimonios_numero_oficial_seq',
  COALESCE(MAX("numero_patrimonio"::bigint), 1),
  COUNT(*) > 0
)
FROM "patrimonios"
WHERE "tipo_numero_patrimonial" = 'OFICIAL';

SELECT setval(
  'patrimonios_sem_numero_oficial_seq',
  COALESCE(MAX(substring("numero_patrimonio" FROM 4)::bigint), 1),
  COUNT(*) > 0
)
FROM "patrimonios"
WHERE "tipo_numero_patrimonial" = 'SEM_NUMERO_OFICIAL';
