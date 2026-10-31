ALTER TABLE "reavaliacoes_patrimoniais"
  ALTER COLUMN "valor_residual_anterior" DROP NOT NULL,
  ALTER COLUMN "vida_util_restante_anterior_meses" DROP NOT NULL;