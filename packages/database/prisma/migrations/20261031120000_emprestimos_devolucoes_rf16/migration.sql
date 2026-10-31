CREATE TYPE "ModoAgrupamentoEmprestimo" AS ENUM ('EM_GRUPO', 'SEPARADAMENTE');

ALTER TABLE "emprestimos_patrimoniais"
  ADD COLUMN "modo_agrupamento" "ModoAgrupamentoEmprestimo",
  ADD COLUMN "setor_vinculo_id" UUID;

ALTER TABLE "devolucoes_patrimoniais"
  ADD COLUMN "created_by_id" UUID;

ALTER TABLE "emprestimos_patrimoniais"
  ADD CONSTRAINT "emprestimos_patrimoniais_setor_vinculo_id_fkey"
  FOREIGN KEY ("setor_vinculo_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "devolucoes_patrimoniais"
  ADD CONSTRAINT "devolucoes_patrimoniais_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "emprestimos_grupo_created_id_idx"
  ON "emprestimos_patrimoniais"("grupo_emprestimo_id", "created_at" DESC, "id" DESC);

CREATE TABLE "idempotencias_emprestimo" (
  "usuario_id" UUID NOT NULL,
  "chave" UUID NOT NULL,
  "tipo_operacao" VARCHAR(20) NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "resultado" JSONB NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "idempotencias_emprestimo_pkey" PRIMARY KEY ("usuario_id", "chave"),
  CONSTRAINT "idempotencias_emprestimo_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
