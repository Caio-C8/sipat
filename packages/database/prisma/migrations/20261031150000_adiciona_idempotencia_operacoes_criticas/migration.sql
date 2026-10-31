-- Reduz os registros técnicos existentes ao mínimo necessário para impedir
-- repetição, sem preservar snapshots de resposta.
ALTER TABLE "idempotencias_movimentacao" DROP COLUMN "resultado";
ALTER TABLE "idempotencias_manutencao" DROP COLUMN "resultado";
ALTER TABLE "idempotencias_reavaliacao" DROP COLUMN "resultado";
ALTER TABLE "idempotencias_emprestimo" DROP COLUMN "resultado";

-- A chave e o hash permanecem opcionais para registros legados e seeds que não
-- atravessam os contratos HTTP. Novas criações da API sempre os preenchem.
ALTER TABLE "patrimonios"
  ADD COLUMN "chave_criacao" UUID,
  ADD COLUMN "hash_criacao" CHAR(64);
ALTER TABLE "inventarios"
  ADD COLUMN "chave_criacao" UUID,
  ADD COLUMN "hash_criacao" CHAR(64);
ALTER TABLE "processos_compra"
  ADD COLUMN "chave_criacao" UUID,
  ADD COLUMN "hash_criacao" CHAR(64);
ALTER TABLE "notas_fiscais"
  ADD COLUMN "chave_criacao" UUID,
  ADD COLUMN "hash_criacao" CHAR(64);
ALTER TABLE "comissoes"
  ADD COLUMN "chave_criacao" UUID,
  ADD COLUMN "hash_criacao" CHAR(64);
ALTER TABLE "setores"
  ADD COLUMN "chave_criacao" UUID,
  ADD COLUMN "hash_criacao" CHAR(64);
ALTER TABLE "fornecedores"
  ADD COLUMN "chave_criacao" UUID,
  ADD COLUMN "hash_criacao" CHAR(64);

CREATE UNIQUE INDEX "patrimonios_created_by_chave_criacao_key"
  ON "patrimonios"("created_by_id", "chave_criacao");
CREATE UNIQUE INDEX "inventarios_created_by_chave_criacao_key"
  ON "inventarios"("created_by_id", "chave_criacao");
CREATE UNIQUE INDEX "processos_compra_created_by_chave_criacao_key"
  ON "processos_compra"("created_by_id", "chave_criacao");
CREATE UNIQUE INDEX "notas_fiscais_created_by_chave_criacao_key"
  ON "notas_fiscais"("created_by_id", "chave_criacao");
CREATE UNIQUE INDEX "comissoes_created_by_chave_criacao_key"
  ON "comissoes"("created_by_id", "chave_criacao");
CREATE UNIQUE INDEX "setores_created_by_chave_criacao_key"
  ON "setores"("created_by_id", "chave_criacao");
CREATE UNIQUE INDEX "fornecedores_created_by_chave_criacao_key"
  ON "fornecedores"("created_by_id", "chave_criacao");
