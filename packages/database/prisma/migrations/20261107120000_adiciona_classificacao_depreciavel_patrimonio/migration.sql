ALTER TABLE "patrimonios"
ADD COLUMN "depreciavel" BOOLEAN NOT NULL;

CREATE OR REPLACE FUNCTION validar_classificacao_depreciavel_patrimonio(
  patrimonio_alvo UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  classificacao BOOLEAN;
  possui_parametro BOOLEAN;
BEGIN
  SELECT "depreciavel"
  INTO classificacao
  FROM "patrimonios"
  WHERE "id" = patrimonio_alvo;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM "parametros_depreciacao"
    WHERE "patrimonio_id" = patrimonio_alvo
  )
  INTO possui_parametro;

  IF classificacao AND NOT possui_parametro THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'patrimonios_depreciavel_parametro_ck',
      MESSAGE = 'Patrimônio depreciável deve possuir parâmetro de depreciação.';
  END IF;

  IF NOT classificacao AND possui_parametro THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'patrimonios_nao_depreciavel_sem_parametro_ck',
      MESSAGE = 'Patrimônio não depreciável não pode possuir parâmetro de depreciação.';
  END IF;

  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION validar_classificacao_apos_patrimonio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validar_classificacao_depreciavel_patrimonio(NEW."id");
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION validar_classificacao_apos_parametro()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validar_classificacao_depreciavel_patrimonio(
    COALESCE(NEW."patrimonio_id", OLD."patrimonio_id")
  );
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER patrimonios_classificacao_depreciavel_ct
AFTER INSERT OR UPDATE OF "depreciavel" ON "patrimonios"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validar_classificacao_apos_patrimonio();

CREATE CONSTRAINT TRIGGER parametros_depreciacao_classificacao_ct
AFTER INSERT OR UPDATE OF "patrimonio_id" OR DELETE ON "parametros_depreciacao"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validar_classificacao_apos_parametro();
