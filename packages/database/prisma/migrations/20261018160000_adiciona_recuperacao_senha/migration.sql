-- CreateTable
CREATE TABLE "tentativas_operacoes_senha" (
    "chave_hash" CHAR(64) NOT NULL,
    "tentativas" INTEGER NOT NULL,
    "janela_expira_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "tentativas_operacoes_senha_pkey" PRIMARY KEY ("chave_hash")
);

-- CreateTable
CREATE TABLE "redefinicoes_senha" (
    "id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expira_at" TIMESTAMP(6) NOT NULL,
    "consumido_at" TIMESTAMP(6),
    "usuario_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "redefinicoes_senha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tentativas_operacoes_senha_janela_expira_at_idx" ON "tentativas_operacoes_senha"("janela_expira_at");

-- CreateIndex
CREATE UNIQUE INDEX "redefinicoes_senha_token_hash_key" ON "redefinicoes_senha"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "redefinicoes_senha_usuario_id_key" ON "redefinicoes_senha"("usuario_id");

-- CreateIndex
CREATE INDEX "redefinicoes_senha_expira_at_idx" ON "redefinicoes_senha"("expira_at");

-- AddForeignKey
ALTER TABLE "redefinicoes_senha" ADD CONSTRAINT "redefinicoes_senha_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
