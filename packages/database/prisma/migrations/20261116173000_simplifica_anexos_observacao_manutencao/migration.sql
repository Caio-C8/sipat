-- Consolida a multiplicidade anterior em um único anexo da observação por
-- pedido e por item. Quando a coleção possui registros, o documento mais
-- recente passa a ser o anexo canônico.
UPDATE "manutencoes" AS m
SET "caminho_anexo_observacao" = (
  SELECT d."chave"
  FROM "documentos_manutencao" AS d
  WHERE d."manutencao_id" = m."id" AND d."item_id" IS NULL
  ORDER BY d."created_at" DESC, d."id" DESC
  LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM "documentos_manutencao" AS d
    WHERE d."manutencao_id" = m."id" AND d."item_id" IS NULL
  );

UPDATE "itens_manutencao" AS i
SET "caminho_anexo_observacao" = (
  SELECT d."chave"
  FROM "documentos_manutencao" AS d
  WHERE d."item_id" = i."id"
  ORDER BY d."created_at" DESC, d."id" DESC
  LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM "documentos_manutencao" AS d WHERE d."item_id" = i."id"
  );

ALTER TABLE "idempotencias_manutencao"
  DROP CONSTRAINT IF EXISTS "idempotencias_manutencao_tipo_documento_check",
  DROP CONSTRAINT IF EXISTS "idempotencias_manutencao_documento_id_fkey",
  DROP COLUMN "documento_id";

DROP TABLE "documentos_manutencao";
DROP TYPE "FaseDocumentoManutencao";
