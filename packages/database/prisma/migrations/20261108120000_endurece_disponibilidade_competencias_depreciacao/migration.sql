ALTER TABLE "parametros_depreciacao"
  ALTER COLUMN "data_inicio" DROP NOT NULL;

ALTER TABLE "parametros_depreciacao"
  ADD CONSTRAINT "parametros_depreciacao_vida_util_ck"
    CHECK ("vida_util_inicial_meses" BETWEEN 1 AND 1200),
  ADD CONSTRAINT "parametros_depreciacao_base_positiva_ck"
    CHECK ("valor_base_inicial" > 0),
  ADD CONSTRAINT "parametros_depreciacao_residual_ck"
    CHECK ("valor_residual" >= 0 AND "valor_residual" <= "valor_base_inicial"),
  ADD CONSTRAINT "parametros_depreciacao_percentual_residual_ck"
    CHECK ("percentual_residual" IS NULL OR "percentual_residual" BETWEEN 0 AND 100),
  ADD CONSTRAINT "parametros_depreciacao_periodo_ck"
    CHECK ("data_fim" IS NULL OR "data_inicio" IS NULL OR "data_fim" >= "data_inicio");

ALTER TABLE "situacoes_contabeis_patrimoniais"
  ADD CONSTRAINT "situacoes_contabeis_valores_ck"
    CHECK (
      "valor_bruto_atual" > 0
      AND "depreciacao_acumulada_atual" >= 0
      AND "depreciacao_acumulada_atual" <= "valor_bruto_atual"
    );

ALTER TABLE "depreciacoes_patrimoniais"
  ADD CONSTRAINT "depreciacoes_competencia_primeiro_dia_ck"
    CHECK ("data_competencia" = date_trunc('month', "data_competencia")::date),
  ADD CONSTRAINT "depreciacoes_valor_positivo_ck"
    CHECK ("valor_depreciado" > 0),
  ADD CONSTRAINT "depreciacoes_evolucao_valor_ck"
    CHECK (
      "valor_contabil_anterior" > 0
      AND "valor_contabil_novo" >= 0
      AND "valor_contabil_novo" <= "valor_contabil_anterior"
      AND "valor_contabil_novo" = "valor_contabil_anterior" - "valor_depreciado"
    );

ALTER TABLE "parametros_depreciacao"
  ADD CONSTRAINT "parametros_depreciacao_id_patrimonio_key"
    UNIQUE ("id", "patrimonio_id");

ALTER TABLE "depreciacoes_patrimoniais"
  DROP CONSTRAINT "depreciacoes_patrimoniais_parametro_depreciacao_id_fkey";

ALTER TABLE "depreciacoes_patrimoniais"
  ADD CONSTRAINT "depreciacoes_parametro_patrimonio_fkey"
    FOREIGN KEY ("parametro_depreciacao_id", "patrimonio_id")
    REFERENCES "parametros_depreciacao"("id", "patrimonio_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "disponibilidades_uso_patrimonio" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "data_disponibilidade" DATE NOT NULL,
  "patrimonio_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by_id" UUID NOT NULL,
  CONSTRAINT "disponibilidades_uso_patrimonio_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "disponibilidades_uso_patrimonio_id_key" UNIQUE ("patrimonio_id"),
  CONSTRAINT "disponibilidades_uso_patrimonio_id_fkey"
    FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "disponibilidades_uso_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "idempotencias_disponibilidade_uso" (
  "usuario_id" UUID NOT NULL,
  "chave" UUID NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "patrimonio_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "idempotencias_disponibilidade_uso_pkey" PRIMARY KEY ("usuario_id", "chave"),
  CONSTRAINT "idempotencias_disponibilidade_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "idempotencias_disponibilidade_patrimonio_id_fkey"
    FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idempotencias_disponibilidade_patrimonio_id_idx"
  ON "idempotencias_disponibilidade_uso"("patrimonio_id");

CREATE OR REPLACE FUNCTION impedir_alteracao_fato_contabil()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '23514',
    CONSTRAINT = TG_TABLE_NAME || '_imutavel_ck',
    MESSAGE = 'Fatos de disponibilidade e depreciação são imutáveis.';
END;
$$;

CREATE TRIGGER disponibilidades_uso_imutaveis_trg
BEFORE UPDATE OR DELETE ON "disponibilidades_uso_patrimonio"
FOR EACH ROW EXECUTE FUNCTION impedir_alteracao_fato_contabil();

CREATE TRIGGER depreciacoes_patrimoniais_imutaveis_trg
BEFORE UPDATE OR DELETE ON "depreciacoes_patrimoniais"
FOR EACH ROW EXECUTE FUNCTION impedir_alteracao_fato_contabil();

CREATE OR REPLACE FUNCTION validar_integridade_depreciacao_patrimonio(
  patrimonio_alvo UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  classificacao BOOLEAN;
  data_disponibilidade DATE;
  parametro_vigente RECORD;
  situacao RECORD;
  acumulado_parametro NUMERIC(19,7);
BEGIN
  SELECT p."depreciavel"
  INTO classificacao
  FROM "patrimonios" p
  WHERE p."id" = patrimonio_alvo;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT d."data_disponibilidade"
  INTO data_disponibilidade
  FROM "disponibilidades_uso_patrimonio" d
  WHERE d."patrimonio_id" = patrimonio_alvo;

  IF NOT classificacao AND EXISTS (
    SELECT 1 FROM "parametros_depreciacao" pd
    WHERE pd."patrimonio_id" = patrimonio_alvo
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      CONSTRAINT = 'patrimonios_nao_depreciavel_sem_parametro_ck',
      MESSAGE = 'Patrimônio não depreciável não pode possuir parâmetro.';
  END IF;

  IF NOT classificacao AND EXISTS (
    SELECT 1 FROM "depreciacoes_patrimoniais" dp
    WHERE dp."patrimonio_id" = patrimonio_alvo
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      CONSTRAINT = 'patrimonios_nao_depreciavel_sem_depreciacao_ck',
      MESSAGE = 'Patrimônio não depreciável não pode possuir depreciação.';
  END IF;

  IF classificacao AND NOT EXISTS (
    SELECT 1 FROM "parametros_depreciacao" pd
    WHERE pd."patrimonio_id" = patrimonio_alvo
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      CONSTRAINT = 'patrimonios_depreciavel_parametro_ck',
      MESSAGE = 'Patrimônio depreciável deve possuir parâmetro.';
  END IF;

  IF data_disponibilidade IS NULL AND EXISTS (
    SELECT 1 FROM "parametros_depreciacao" pd
    WHERE pd."patrimonio_id" = patrimonio_alvo
      AND pd."data_inicio" IS NOT NULL
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      CONSTRAINT = 'parametros_exigem_disponibilidade_ck',
      MESSAGE = 'Parâmetro não pode iniciar antes da disponibilidade do patrimônio.';
  END IF;

  IF data_disponibilidade IS NULL AND EXISTS (
    SELECT 1 FROM "depreciacoes_patrimoniais" dp
    WHERE dp."patrimonio_id" = patrimonio_alvo
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      CONSTRAINT = 'depreciacoes_exigem_disponibilidade_ck',
      MESSAGE = 'Depreciação exige disponibilidade do patrimônio.';
  END IF;

  IF data_disponibilidade IS NOT NULL AND classificacao AND EXISTS (
    SELECT 1 FROM "parametros_depreciacao" pd
    WHERE pd."patrimonio_id" = patrimonio_alvo
      AND pd."data_fim" IS NULL
      AND pd."data_inicio" IS NULL
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      CONSTRAINT = 'parametro_vigente_disponivel_data_inicio_ck',
      MESSAGE = 'Parâmetro vigente de patrimônio disponível deve possuir início.';
  END IF;

  IF data_disponibilidade IS NOT NULL AND EXISTS (
    SELECT 1 FROM "parametros_depreciacao" pd
    WHERE pd."patrimonio_id" = patrimonio_alvo
      AND pd."reavaliacao_id" IS NULL
      AND pd."data_inicio" IS DISTINCT FROM data_disponibilidade
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      CONSTRAINT = 'parametro_inicial_disponibilidade_ck',
      MESSAGE = 'O parâmetro inicial deve começar na disponibilidade do patrimônio.';
  END IF;

  SELECT pd."id", pd."valor_base_inicial", pd."valor_residual"
  INTO parametro_vigente
  FROM "parametros_depreciacao" pd
  WHERE pd."patrimonio_id" = patrimonio_alvo AND pd."data_fim" IS NULL;

  IF FOUND THEN
    SELECT sc."valor_bruto_atual", sc."depreciacao_acumulada_atual"
    INTO situacao
    FROM "situacoes_contabeis_patrimoniais" sc
    WHERE sc."patrimonio_id" = patrimonio_alvo;

    IF NOT FOUND OR situacao."valor_bruto_atual" IS DISTINCT FROM parametro_vigente."valor_base_inicial" THEN
      RAISE EXCEPTION USING ERRCODE = '23514',
        CONSTRAINT = 'situacao_parametro_vigente_base_ck',
        MESSAGE = 'Situação contábil e parâmetro vigente possuem bases incompatíveis.';
    END IF;

    SELECT COALESCE(SUM(dp."valor_depreciado"), 0)::numeric(19,7)
    INTO acumulado_parametro
    FROM "depreciacoes_patrimoniais" dp
    WHERE dp."parametro_depreciacao_id" = parametro_vigente."id";

    IF situacao."depreciacao_acumulada_atual" IS DISTINCT FROM acumulado_parametro THEN
      RAISE EXCEPTION USING ERRCODE = '23514',
        CONSTRAINT = 'situacao_depreciacao_acumulada_ck',
        MESSAGE = 'A depreciação acumulada não corresponde ao histórico vigente.';
    END IF;

    IF situacao."valor_bruto_atual" - situacao."depreciacao_acumulada_atual" < parametro_vigente."valor_residual" THEN
      RAISE EXCEPTION USING ERRCODE = '23514',
        CONSTRAINT = 'situacao_valor_residual_ck',
        MESSAGE = 'O valor líquido não pode ficar abaixo do residual vigente.';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "depreciacoes_patrimoniais" dp
    JOIN "parametros_depreciacao" pd ON pd."id" = dp."parametro_depreciacao_id"
    WHERE dp."patrimonio_id" = patrimonio_alvo
      AND dp."valor_contabil_novo" < pd."valor_residual"
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      CONSTRAINT = 'depreciacoes_valor_residual_ck',
      MESSAGE = 'Depreciação não pode reduzir o valor abaixo do residual.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "parametros_depreciacao" pd
    JOIN LATERAL (
      SELECT
        COUNT(*)::integer AS quantidade,
        MIN(dp."data_competencia") AS primeira,
        MAX(dp."data_competencia") AS ultima
      FROM "depreciacoes_patrimoniais" dp
      WHERE dp."parametro_depreciacao_id" = pd."id"
    ) historico ON TRUE
    WHERE pd."patrimonio_id" = patrimonio_alvo
      AND historico.quantidade > 0
      AND (
        pd."data_inicio" IS NULL
        OR historico.primeira IS DISTINCT FROM
          (date_trunc('month', pd."data_inicio") + interval '1 month')::date
        OR historico.ultima IS DISTINCT FROM
          (
            date_trunc('month', pd."data_inicio")
            + historico.quantidade * interval '1 month'
          )::date
      )
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      CONSTRAINT = 'depreciacoes_competencias_contiguas_ck',
      MESSAGE = 'As competências depreciadas devem ser mensais, contíguas e iniciar no mês seguinte à disponibilidade.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION validar_integridade_depreciacao_apos_mutacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validar_integridade_depreciacao_patrimonio(
    COALESCE(NEW."patrimonio_id", OLD."patrimonio_id")
  );
  IF TG_OP = 'UPDATE' AND OLD."patrimonio_id" IS DISTINCT FROM NEW."patrimonio_id" THEN
    PERFORM validar_integridade_depreciacao_patrimonio(OLD."patrimonio_id");
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER disponibilidade_integridade_depreciacao_ct
AFTER INSERT ON "disponibilidades_uso_patrimonio"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION validar_integridade_depreciacao_apos_mutacao();

CREATE CONSTRAINT TRIGGER parametros_integridade_depreciacao_ct
AFTER INSERT OR UPDATE OR DELETE ON "parametros_depreciacao"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION validar_integridade_depreciacao_apos_mutacao();

CREATE CONSTRAINT TRIGGER depreciacoes_integridade_depreciacao_ct
AFTER INSERT ON "depreciacoes_patrimoniais"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION validar_integridade_depreciacao_apos_mutacao();

CREATE CONSTRAINT TRIGGER situacoes_integridade_depreciacao_ct
AFTER INSERT OR UPDATE OR DELETE ON "situacoes_contabeis_patrimoniais"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION validar_integridade_depreciacao_apos_mutacao();

CREATE OR REPLACE FUNCTION validar_integridade_depreciacao_apos_patrimonio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validar_integridade_depreciacao_patrimonio(NEW."id");
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER patrimonios_integridade_depreciacao_ct
AFTER INSERT OR UPDATE OF "depreciavel" ON "patrimonios"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION validar_integridade_depreciacao_apos_patrimonio();
