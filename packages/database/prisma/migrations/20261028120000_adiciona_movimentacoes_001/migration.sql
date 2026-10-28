-- Aditiva: preserva observações antigas, IDs e vínculos de correções.
CREATE TABLE "idempotencias_movimentacao" (
  "usuario_id" UUID NOT NULL,
  "chave" UUID NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "resultado" JSONB NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "idempotencias_movimentacao_pkey" PRIMARY KEY ("usuario_id", "chave"),
  CONSTRAINT "idempotencias_movimentacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "transferencias_data_id_idx" ON "transferencias_patrimoniais"("data_transferencia" DESC, "id" DESC);
CREATE INDEX "transferencias_origem_data_id_idx" ON "transferencias_patrimoniais"("setor_antigo_id", "data_transferencia" DESC, "id" DESC);
CREATE INDEX "transferencias_destino_data_id_idx" ON "transferencias_patrimoniais"("setor_atual_id", "data_transferencia" DESC, "id" DESC);
CREATE INDEX "transferencias_comissao_data_id_idx" ON "transferencias_patrimoniais"("comissao_id", "data_transferencia" DESC, "id" DESC);
