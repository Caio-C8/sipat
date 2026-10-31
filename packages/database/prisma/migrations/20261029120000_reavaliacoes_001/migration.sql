-- Campos opcionais preservam registros anteriores sem fabricar snapshots ausentes.
ALTER TABLE "reavaliacoes_patrimoniais"
  ADD COLUMN "data_referencia" DATE,
  ADD COLUMN "valor_bruto_anterior" DECIMAL(19,7),
  ADD COLUMN "depreciacao_acumulada_anterior" DECIMAL(19,7),
  ADD COLUMN "valor_base_anterior" DECIMAL(19,7),
  ADD COLUMN "percentual_residual_anterior" DECIMAL(5,2),
  ADD COLUMN "vida_util_inicial_anterior_meses" INTEGER,
  ADD COLUMN "quantidade_depreciacoes_anteriores" INTEGER,
  ADD COLUMN "data_inicio_anterior" DATE,
  ADD COLUMN "parametro_anterior_id" UUID,
  ADD COLUMN "valor_base_novo" DECIMAL(19,7),
  ADD COLUMN "percentual_residual_novo" DECIMAL(5,2),
  ADD COLUMN "numero_patrimonio_snapshot" VARCHAR(50),
  ADD COLUMN "descricao_patrimonio_snapshot" VARCHAR(1000),
  ADD COLUMN "nome_comissao_snapshot" VARCHAR(150),
  ADD COLUMN "nome_autor_snapshot" VARCHAR(150);

ALTER TABLE "reavaliacoes_patrimoniais"
  ADD CONSTRAINT "reavaliacoes_parametro_anterior_id_fkey"
  FOREIGN KEY ("parametro_anterior_id") REFERENCES "parametros_depreciacao"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "reavaliacoes_data_id_idx"
  ON "reavaliacoes_patrimoniais"("data_referencia" DESC, "data_reavaliacao" DESC, "id" DESC);
CREATE INDEX "reavaliacoes_patrimonio_data_idx"
  ON "reavaliacoes_patrimoniais"("patrimonio_id", "data_referencia" DESC, "id" DESC);

CREATE TABLE "idempotencias_reavaliacao" (
  "usuario_id" UUID NOT NULL,
  "chave" UUID NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "resultado" JSONB NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "idempotencias_reavaliacao_pkey" PRIMARY KEY ("usuario_id", "chave"),
  CONSTRAINT "idempotencias_reavaliacao_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
