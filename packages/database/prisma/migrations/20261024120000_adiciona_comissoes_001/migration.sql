DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "membros_comissao"
    WHERE "tipo_membro_comissao" IS NULL
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23502',
      MESSAGE = 'COMISSOES-001: existem integrantes sem papel; corrija os dados antes de aplicar a migration.';
  END IF;
END
$$;

ALTER TABLE "comissoes"
  ALTER COLUMN "numero_ato" TYPE VARCHAR(100)
  USING "numero_ato"::text;

ALTER TABLE "membros_comissao"
  ALTER COLUMN "tipo_membro_comissao" SET NOT NULL;

CREATE INDEX "comissoes_created_at_id_idx"
  ON "comissoes"("created_at", "id");

CREATE UNIQUE INDEX "membros_comissao_presidente_unico_idx"
  ON "membros_comissao"("comissao_id")
  WHERE "tipo_membro_comissao" = 'PRESIDENTE';

CREATE INDEX "transferencias_patrimoniais_comissao_id_idx"
  ON "transferencias_patrimoniais"("comissao_id");
CREATE INDEX "emprestimos_patrimoniais_comissao_id_idx"
  ON "emprestimos_patrimoniais"("comissao_id");
CREATE INDEX "devolucoes_patrimoniais_comissao_id_idx"
  ON "devolucoes_patrimoniais"("comissao_id");
CREATE INDEX "manutencoes_comissao_id_idx"
  ON "manutencoes"("comissao_id");
CREATE INDEX "inventarios_comissao_id_idx"
  ON "inventarios"("comissao_id");
CREATE INDEX "baixas_patrimoniais_comissao_id_idx"
  ON "baixas_patrimoniais"("comissao_id");
CREATE INDEX "depreciacoes_patrimoniais_comissao_id_idx"
  ON "depreciacoes_patrimoniais"("comissao_id");
CREATE INDEX "reavaliacoes_patrimoniais_comissao_id_idx"
  ON "reavaliacoes_patrimoniais"("comissao_id");
