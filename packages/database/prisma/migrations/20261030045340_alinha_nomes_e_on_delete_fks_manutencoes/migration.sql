-- DropForeignKey
ALTER TABLE "documentos_manutencao" DROP CONSTRAINT "documentos_manutencao_autor_fkey";

-- DropForeignKey
ALTER TABLE "documentos_manutencao" DROP CONSTRAINT "documentos_manutencao_item_fkey";

-- DropForeignKey
ALTER TABLE "idempotencias_manutencao" DROP CONSTRAINT "idempotencias_manutencao_item_fkey";

-- DropForeignKey
ALTER TABLE "itens_manutencao" DROP CONSTRAINT "itens_manutencao_fornecedor_fkey";

-- DropForeignKey
ALTER TABLE "itens_manutencao" DROP CONSTRAINT "itens_manutencao_recebido_por_fkey";

-- DropForeignKey
ALTER TABLE "revisoes_orcamento_manutencao" DROP CONSTRAINT "revisoes_orcamento_fornecedor_fkey";

-- RenameForeignKey
ALTER TABLE "documentos_manutencao" RENAME CONSTRAINT "documentos_manutencao_pedido_fkey" TO "documentos_manutencao_manutencao_id_fkey";

-- RenameForeignKey
ALTER TABLE "idempotencias_manutencao" RENAME CONSTRAINT "idempotencias_manutencao_pedido_fkey" TO "idempotencias_manutencao_manutencao_id_fkey";

-- RenameForeignKey
ALTER TABLE "idempotencias_manutencao" RENAME CONSTRAINT "idempotencias_manutencao_usuario_fkey" TO "idempotencias_manutencao_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "revisoes_orcamento_manutencao" RENAME CONSTRAINT "revisoes_orcamento_autor_fkey" TO "revisoes_orcamento_manutencao_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "revisoes_orcamento_manutencao" RENAME CONSTRAINT "revisoes_orcamento_item_fkey" TO "revisoes_orcamento_manutencao_item_id_fkey";

-- AddForeignKey
ALTER TABLE "itens_manutencao" ADD CONSTRAINT "itens_manutencao_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_manutencao" ADD CONSTRAINT "itens_manutencao_recebido_por_id_fkey" FOREIGN KEY ("recebido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes_orcamento_manutencao" ADD CONSTRAINT "revisoes_orcamento_manutencao_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_manutencao" ADD CONSTRAINT "documentos_manutencao_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "itens_manutencao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_manutencao" ADD CONSTRAINT "documentos_manutencao_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotencias_manutencao" ADD CONSTRAINT "idempotencias_manutencao_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "itens_manutencao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
