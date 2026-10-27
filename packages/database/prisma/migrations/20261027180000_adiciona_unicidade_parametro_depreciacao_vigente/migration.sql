-- Garante a regra estrutural de no máximo um parâmetro vigente por patrimônio.
-- O índice parcial não é representável diretamente no schema Prisma atual.
CREATE UNIQUE INDEX "parametros_depreciacao_patrimonio_vigente_uidx"
ON "parametros_depreciacao" ("patrimonio_id")
WHERE "data_fim" IS NULL;
