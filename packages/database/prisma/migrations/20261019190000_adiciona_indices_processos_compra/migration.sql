CREATE INDEX "processos_compra_created_at_id_idx"
ON "processos_compra"("created_at" DESC, "id" DESC);

CREATE INDEX "processos_compra_ano_processo_idx"
ON "processos_compra"("ano_processo");

CREATE INDEX "processos_compra_ano_empenho_idx"
ON "processos_compra"("ano_empenho");

CREATE INDEX "notas_fiscais_processo_compra_created_at_id_idx"
ON "notas_fiscais"("processo_compra_id", "created_at", "id");

CREATE INDEX "notas_fiscais_fornecedor_processo_compra_idx"
ON "notas_fiscais"("fornecedor_id", "processo_compra_id");
