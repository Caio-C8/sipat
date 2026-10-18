-- AlterTable
ALTER TABLE "sessoes_usuarios"
ADD COLUMN "last_activity_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "tentativas_login" (
    "chave_hash" CHAR(64) NOT NULL,
    "tentativas" INTEGER NOT NULL,
    "janela_expira_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "tentativas_login_pkey" PRIMARY KEY ("chave_hash")
);

-- CreateIndex
CREATE INDEX "tentativas_login_janela_expira_at_idx" ON "tentativas_login"("janela_expira_at");
