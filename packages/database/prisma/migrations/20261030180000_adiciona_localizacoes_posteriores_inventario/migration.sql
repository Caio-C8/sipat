CREATE TABLE "localizacoes_posteriores_inventario" (
  "id" UUID NOT NULL,
  "item_inventario_id" UUID NOT NULL,
  "inventario_id" UUID NOT NULL,
  "setor_inventario_encontrado_id" UUID NOT NULL,
  "data_localizacao" TIMESTAMP(6) NOT NULL,
  "localizado_por_id" UUID NOT NULL,
  "status_correcao" "StatusCorrecaoItemInventario" NOT NULL DEFAULT 'PENDENTE',
  "tipo_correcao" "TipoCorrecaoItemInventario",
  "data_correcao" TIMESTAMP(6),
  "corrigido_por_id" UUID,
  "transferencia_correcao_id" UUID,
  "observacao" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6),

  CONSTRAINT "localizacoes_posteriores_inventario_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "localizacoes_posteriores_correcao_check" CHECK (
    ("status_correcao" = 'PENDENTE'
      AND "tipo_correcao" IS NULL
      AND "data_correcao" IS NULL
      AND "corrigido_por_id" IS NULL
      AND "transferencia_correcao_id" IS NULL)
    OR ("status_correcao" = 'CORRIGIDO'
      AND "tipo_correcao" = 'RETORNO_AO_SETOR_CADASTRADO'
      AND "data_correcao" IS NOT NULL
      AND "corrigido_por_id" IS NOT NULL
      AND "transferencia_correcao_id" IS NULL)
    OR ("status_correcao" = 'CORRIGIDO'
      AND "tipo_correcao" = 'TRANSFERENCIA_CADASTRAL'
      AND "data_correcao" IS NOT NULL
      AND "corrigido_por_id" IS NOT NULL
      AND "transferencia_correcao_id" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "localizacoes_posteriores_transferencia_correcao_id_key"
  ON "localizacoes_posteriores_inventario"("transferencia_correcao_id");
CREATE UNIQUE INDEX "itens_inventario_vinculo_localizacao_key"
  ON "itens_inventario"("id", "inventario_id");
CREATE UNIQUE INDEX "setores_inventario_vinculo_localizacao_key"
  ON "setores_inventario"("id", "inventario_id");
CREATE UNIQUE INDEX "localizacoes_posteriores_item_key"
  ON "localizacoes_posteriores_inventario"("item_inventario_id");
CREATE INDEX "localizacoes_posteriores_inventario_status_idx"
  ON "localizacoes_posteriores_inventario"("inventario_id", "status_correcao", "data_localizacao" DESC, "id" DESC);
CREATE INDEX "localizacoes_posteriores_setor_encontrado_idx"
  ON "localizacoes_posteriores_inventario"("setor_inventario_encontrado_id", "data_localizacao" DESC, "id" DESC);

ALTER TABLE "localizacoes_posteriores_inventario"
  ADD CONSTRAINT "localizacoes_posteriores_item_inventario_fkey"
  FOREIGN KEY ("item_inventario_id", "inventario_id") REFERENCES "itens_inventario"("id", "inventario_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "localizacoes_posteriores_inventario_id_fkey"
  FOREIGN KEY ("inventario_id") REFERENCES "inventarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "localizacoes_posteriores_setor_inventario_fkey"
  FOREIGN KEY ("setor_inventario_encontrado_id", "inventario_id") REFERENCES "setores_inventario"("id", "inventario_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "localizacoes_posteriores_localizado_por_id_fkey"
  FOREIGN KEY ("localizado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "localizacoes_posteriores_corrigido_por_id_fkey"
  FOREIGN KEY ("corrigido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "localizacoes_posteriores_transferencia_correcao_id_fkey"
  FOREIGN KEY ("transferencia_correcao_id") REFERENCES "transferencias_patrimoniais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
