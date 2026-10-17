-- CreateTable
CREATE TABLE "sessoes_usuarios" (
    "id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "usuario_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "revoked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_usuarios_token_hash_key" ON "sessoes_usuarios"("token_hash");

-- CreateIndex
CREATE INDEX "sessoes_usuarios_usuario_id_revoked_at_idx" ON "sessoes_usuarios"("usuario_id", "revoked_at");

-- AddForeignKey
ALTER TABLE "sessoes_usuarios" ADD CONSTRAINT "sessoes_usuarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
