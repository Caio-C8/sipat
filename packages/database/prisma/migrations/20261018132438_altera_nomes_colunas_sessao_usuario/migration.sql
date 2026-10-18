/*
  Warnings:

  - You are about to drop the column `expires_at` on the `sessoes_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `last_activity_at` on the `sessoes_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `revoked_at` on the `sessoes_usuarios` table. All the data in the column will be lost.
  - Added the required column `expira_at` to the `sessoes_usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "sessoes_usuarios_usuario_id_revoked_at_idx";

-- AlterTable
ALTER TABLE "sessoes_usuarios" DROP COLUMN "expires_at",
DROP COLUMN "last_activity_at",
DROP COLUMN "revoked_at",
ADD COLUMN     "expira_at" TIMESTAMP(6) NOT NULL,
ADD COLUMN     "revogado_at" TIMESTAMP(6),
ADD COLUMN     "ultima_atividade_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "sessoes_usuarios_usuario_id_revogado_at_idx" ON "sessoes_usuarios"("usuario_id", "revogado_at");
