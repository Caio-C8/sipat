CREATE TABLE "substituicoes_numero_patrimonial" (
  "id" UUID NOT NULL,
  "patrimonio_id" UUID NOT NULL,
  "numero_anterior" VARCHAR(50) NOT NULL,
  "numero_novo" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by_id" UUID NOT NULL,

  CONSTRAINT "substituicoes_numero_patrimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "substituicoes_numero_patrimonial_patrimonio_id_created_at_idx"
ON "substituicoes_numero_patrimonial"("patrimonio_id", "created_at");

ALTER TABLE "substituicoes_numero_patrimonial"
ADD CONSTRAINT "substituicoes_numero_patrimonial_patrimonio_id_fkey"
FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "substituicoes_numero_patrimonial"
ADD CONSTRAINT "substituicoes_numero_patrimonial_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
