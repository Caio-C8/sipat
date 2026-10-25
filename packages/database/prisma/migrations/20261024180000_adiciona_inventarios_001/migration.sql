ALTER TABLE "inventarios"
  ADD COLUMN "iniciado_por_id" UUID,
  ADD COLUMN "finalizado_por_id" UUID;

ALTER TABLE "setores_inventario"
  ADD COLUMN "iniciado_por_id" UUID,
  ADD COLUMN "concluido_por_id" UUID;

ALTER TABLE "itens_inventario"
  ADD COLUMN "verificado_por_id" UUID,
  ADD COLUMN "corrigido_por_id" UUID,
  ADD COLUMN "status_patrimonio_na_verificacao" "StatusPatrimonio",
  ADD COLUMN "emprestimo_patrimonio_id" UUID,
  ADD COLUMN "item_manutencao_id" UUID;

CREATE UNIQUE INDEX "emprestimos_patrimonio_id_patrimonio_id_key"
  ON "emprestimos_patrimoniais"("id", "patrimonio_id");
CREATE UNIQUE INDEX "itens_manutencao_id_patrimonio_id_key"
  ON "itens_manutencao"("id", "patrimonio_id");
CREATE UNIQUE INDEX "setores_inventario_vinculo_item_key"
  ON "setores_inventario"("id", "inventario_id", "setor_id");

ALTER TABLE "itens_inventario"
  DROP CONSTRAINT IF EXISTS "itens_inventario_setor_inventario_id_fkey";
ALTER TABLE "itens_inventario"
  ADD CONSTRAINT "itens_inventario_setor_inventario_vinculo_fkey"
  FOREIGN KEY ("setor_inventario_id", "inventario_id", "setor_esperado_id")
  REFERENCES "setores_inventario"("id", "inventario_id", "setor_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventarios"
  ADD CONSTRAINT "inventarios_iniciado_por_id_fkey"
    FOREIGN KEY ("iniciado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "inventarios_finalizado_por_id_fkey"
    FOREIGN KEY ("finalizado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "inventarios_estado_auditoria_check" CHECK (
    ("status" = 'PENDENTE' AND "data_inicio" IS NULL AND "iniciado_por_id" IS NULL AND "data_fim" IS NULL AND "finalizado_por_id" IS NULL)
    OR ("status" = 'EM_ANDAMENTO' AND "data_inicio" IS NOT NULL AND "iniciado_por_id" IS NOT NULL AND "data_fim" IS NULL AND "finalizado_por_id" IS NULL)
    OR ("status" = 'FINALIZADO' AND "data_inicio" IS NOT NULL AND "iniciado_por_id" IS NOT NULL AND "data_fim" IS NOT NULL AND "finalizado_por_id" IS NOT NULL)
  );

ALTER TABLE "setores_inventario"
  ADD CONSTRAINT "setores_inventario_iniciado_por_id_fkey"
    FOREIGN KEY ("iniciado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "setores_inventario_concluido_por_id_fkey"
    FOREIGN KEY ("concluido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "setores_inventario_estado_auditoria_check" CHECK (
    ("status" = 'PENDENTE' AND "data_inicio" IS NULL AND "iniciado_por_id" IS NULL AND "data_fim" IS NULL AND "concluido_por_id" IS NULL)
    OR ("status" = 'EM_ANDAMENTO' AND "data_inicio" IS NOT NULL AND "iniciado_por_id" IS NOT NULL AND "data_fim" IS NULL AND "concluido_por_id" IS NULL)
    OR ("status" = 'CONCLUIDO' AND "data_inicio" IS NOT NULL AND "iniciado_por_id" IS NOT NULL AND "data_fim" IS NOT NULL AND "concluido_por_id" IS NOT NULL)
  );

ALTER TABLE "itens_inventario"
  ADD CONSTRAINT "itens_inventario_verificado_por_id_fkey"
    FOREIGN KEY ("verificado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "itens_inventario_corrigido_por_id_fkey"
    FOREIGN KEY ("corrigido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "itens_inventario_emprestimo_patrimonio_fkey"
    FOREIGN KEY ("emprestimo_patrimonio_id", "patrimonio_id")
    REFERENCES "emprestimos_patrimoniais"("id", "patrimonio_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "itens_inventario_item_manutencao_fkey"
    FOREIGN KEY ("item_manutencao_id", "patrimonio_id")
    REFERENCES "itens_manutencao"("id", "patrimonio_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "itens_inventario_verificacao_check" CHECK (
    ("status_verificacao" = 'PENDENTE' AND "situacao" IS NULL AND "data_verificacao" IS NULL AND "verificado_por_id" IS NULL AND "status_patrimonio_na_verificacao" IS NULL AND "emprestimo_patrimonio_id" IS NULL AND "item_manutencao_id" IS NULL)
    OR ("status_verificacao" = 'VERIFICADO' AND "situacao" IS NOT NULL AND "data_verificacao" IS NOT NULL AND "verificado_por_id" IS NOT NULL AND "status_patrimonio_na_verificacao" IS NOT NULL)
  ),
  ADD CONSTRAINT "itens_inventario_ausencia_check" CHECK (
    ("status_patrimonio_na_verificacao" IS NULL AND "emprestimo_patrimonio_id" IS NULL AND "item_manutencao_id" IS NULL)
    OR ("status_patrimonio_na_verificacao" = 'ATIVO' AND "emprestimo_patrimonio_id" IS NULL AND "item_manutencao_id" IS NULL)
    OR ("status_patrimonio_na_verificacao" = 'EMPRESTADO' AND "situacao" = 'NAO_LOCALIZADO' AND "emprestimo_patrimonio_id" IS NOT NULL AND "item_manutencao_id" IS NULL)
    OR ("status_patrimonio_na_verificacao" = 'EM_MANUTENCAO' AND "situacao" = 'NAO_LOCALIZADO' AND "emprestimo_patrimonio_id" IS NULL AND "item_manutencao_id" IS NOT NULL)
  );

CREATE UNIQUE INDEX "setores_inventario_um_em_andamento_por_inventario_idx"
  ON "setores_inventario"("inventario_id")
  WHERE "status" = 'EM_ANDAMENTO';
CREATE UNIQUE INDEX "setores_inventario_setor_fisico_em_andamento_idx"
  ON "setores_inventario"("setor_id")
  WHERE "status" = 'EM_ANDAMENTO';
CREATE INDEX "inventarios_status_created_at_id_idx"
  ON "inventarios"("status", "created_at" DESC, "id" DESC);
CREATE INDEX "setores_inventario_inventario_status_idx"
  ON "setores_inventario"("inventario_id", "status", "id");
CREATE INDEX "itens_inventario_pendencias_idx"
  ON "itens_inventario"("inventario_id", "status_verificacao", "situacao", "status_correcao");
CREATE INDEX "itens_inventario_patrimonio_id_idx"
  ON "itens_inventario"("patrimonio_id");
