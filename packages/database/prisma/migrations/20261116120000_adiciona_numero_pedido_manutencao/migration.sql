CREATE SEQUENCE "manutencoes_numero_pedido_seq";

ALTER TABLE "manutencoes"
  ADD COLUMN "numero_pedido" BIGINT;

ALTER SEQUENCE "manutencoes_numero_pedido_seq"
  OWNED BY "manutencoes"."numero_pedido";

WITH "numerados" AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "created_at", "id")::BIGINT AS "numero_pedido"
  FROM "manutencoes"
)
UPDATE "manutencoes" AS "m"
SET "numero_pedido" = "n"."numero_pedido"
FROM "numerados" AS "n"
WHERE "m"."id" = "n"."id";

SELECT setval(
  '"manutencoes_numero_pedido_seq"',
  COALESCE((SELECT MAX("numero_pedido") FROM "manutencoes"), 1),
  EXISTS (SELECT 1 FROM "manutencoes")
);

ALTER TABLE "manutencoes"
  ALTER COLUMN "numero_pedido" SET DEFAULT nextval('"manutencoes_numero_pedido_seq"'),
  ALTER COLUMN "numero_pedido" SET NOT NULL;

CREATE UNIQUE INDEX "manutencoes_numero_pedido_key"
  ON "manutencoes"("numero_pedido");
