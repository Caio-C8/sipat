-- A FK e o CHECK não podem ser adicionados com segurança se o histórico já
-- contiver referências órfãs ou combinações incompatíveis. O preflight produz
-- erros distintos para orientar a correção da causa antes de reaplicar.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "idempotencias_manutencao" AS i
    LEFT JOIN "documentos_manutencao" AS d ON d."id" = i."documento_id"
    WHERE i."documento_id" IS NOT NULL AND d."id" IS NULL
  ) THEN
    RAISE EXCEPTION
      'IDEMPOTENCIA-002: existem referencias orfas em idempotencias_manutencao.documento_id';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "idempotencias_manutencao"
    WHERE ("tipo" = 'DOCUMENTO') IS DISTINCT FROM ("documento_id" IS NOT NULL)
  ) THEN
    RAISE EXCEPTION
      'IDEMPOTENCIA-002: existem combinacoes invalidas entre tipo e documento_id em idempotencias_manutencao';
  END IF;
END $$;

ALTER TABLE "idempotencias_manutencao"
  ADD CONSTRAINT "idempotencias_manutencao_tipo_documento_check"
  CHECK (("tipo" = 'DOCUMENTO') = ("documento_id" IS NOT NULL));

ALTER TABLE "idempotencias_manutencao"
  ADD CONSTRAINT "idempotencias_manutencao_documento_id_fkey"
  FOREIGN KEY ("documento_id") REFERENCES "documentos_manutencao"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
