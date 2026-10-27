CREATE TYPE "TipoSessaoUsuario" AS ENUM ('WEB', 'MOBILE');

ALTER TABLE "sessoes_usuarios"
ADD COLUMN "access_expira_at" TIMESTAMP(6),
ADD COLUMN "tipo" "TipoSessaoUsuario" NOT NULL DEFAULT 'WEB';

CREATE TABLE "sessoes_mobile_refresh" (
  "id" UUID NOT NULL,
  "token_hash" CHAR(64) NOT NULL,
  "expira_at" TIMESTAMP(6) NOT NULL,
  "usado_at" TIMESTAMP(6),
  "sessao_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessoes_mobile_refresh_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessoes_mobile_refresh_sessao_id_fkey"
    FOREIGN KEY ("sessao_id") REFERENCES "sessoes_usuarios"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "sessoes_mobile_refresh_token_hash_key"
ON "sessoes_mobile_refresh"("token_hash");

CREATE INDEX "sessoes_mobile_refresh_sessao_id_usado_at_idx"
ON "sessoes_mobile_refresh"("sessao_id", "usado_at");
