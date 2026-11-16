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

  IF NOT FOUND THEN RETURN; END IF;

  SELECT d."data_disponibilidade"
  INTO data_disponibilidade
  FROM "disponibilidades_uso_patrimonio" d
  WHERE d."patrimonio_id" = patrimonio_alvo;

  IF NOT classificacao AND EXISTS (
    SELECT 1 FROM "parametros_depreciacao" pd
    WHERE pd."patrimonio_id" = patrimonio_alvo
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'patrimonios_nao_depreciavel_sem_parametro_ck',
      MESSAGE = 'Patrimônio não depreciável não pode possuir parâmetro.';
  END IF;

  IF NOT classificacao AND EXISTS (
    SELECT 1 FROM "depreciacoes_patrimoniais" dp
    WHERE dp."patrimonio_id" = patrimonio_alvo
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'patrimonios_nao_depreciavel_sem_depreciacao_ck',
      MESSAGE = 'Patrimônio não depreciável não pode possuir depreciação.';
  END IF;

  IF classificacao AND NOT EXISTS (
    SELECT 1 FROM "parametros_depreciacao" pd
    WHERE pd."patrimonio_id" = patrimonio_alvo
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'patrimonios_depreciavel_parametro_ck',
      MESSAGE = 'Patrimônio depreciável deve possuir parâmetro.';
  END IF;

  IF data_disponibilidade IS NULL AND EXISTS (
    SELECT 1 FROM "parametros_depreciacao" pd
    WHERE pd."patrimonio_id" = patrimonio_alvo AND pd."data_inicio" IS NOT NULL
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'parametros_exigem_disponibilidade_ck',
      MESSAGE = 'Parâmetro não pode iniciar antes da disponibilidade do patrimônio.';
  END IF;

  IF data_disponibilidade IS NULL AND EXISTS (
    SELECT 1 FROM "depreciacoes_patrimoniais" dp
    WHERE dp."patrimonio_id" = patrimonio_alvo
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'depreciacoes_exigem_disponibilidade_ck',
      MESSAGE = 'Depreciação exige disponibilidade do patrimônio.';
  END IF;

  IF data_disponibilidade IS NOT NULL AND classificacao AND EXISTS (
    SELECT 1 FROM "parametros_depreciacao" pd
    WHERE pd."patrimonio_id" = patrimonio_alvo
      AND pd."data_fim" IS NULL AND pd."data_inicio" IS NULL
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'parametro_vigente_disponivel_data_inicio_ck',
      MESSAGE = 'Parâmetro vigente de patrimônio disponível deve possuir início.';
  END IF;

  -- O parâmetro inicial só precisa coincidir com a disponibilidade quando
  -- ainda é o vigente. Se uma reavaliação ocorreu antes da disponibilidade,
  -- o parâmetro encerrado permanece sem início e o vigente é iniciado.
  IF data_disponibilidade IS NOT NULL AND EXISTS (
    SELECT 1 FROM "parametros_depreciacao" pd
    WHERE pd."patrimonio_id" = patrimonio_alvo
      AND pd."reavaliacao_id" IS NULL
      AND pd."data_fim" IS NULL
      AND pd."data_inicio" IS DISTINCT FROM data_disponibilidade
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'parametro_inicial_disponibilidade_ck',
      MESSAGE = 'O parâmetro inicial vigente deve começar na disponibilidade do patrimônio.';
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
      RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'situacao_parametro_vigente_base_ck',
        MESSAGE = 'Situação contábil e parâmetro vigente possuem bases incompatíveis.';
    END IF;

    SELECT COALESCE(SUM(dp."valor_depreciado"), 0)::numeric(19,7)
    INTO acumulado_parametro
    FROM "depreciacoes_patrimoniais" dp
    WHERE dp."parametro_depreciacao_id" = parametro_vigente."id";

    IF situacao."depreciacao_acumulada_atual" IS DISTINCT FROM acumulado_parametro THEN
      RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'situacao_depreciacao_acumulada_ck',
        MESSAGE = 'A depreciação acumulada não corresponde ao histórico vigente.';
    END IF;

    IF situacao."valor_bruto_atual" - situacao."depreciacao_acumulada_atual" < parametro_vigente."valor_residual" THEN
      RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'situacao_valor_residual_ck',
        MESSAGE = 'O valor líquido não pode ficar abaixo do residual vigente.';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM "depreciacoes_patrimoniais" dp
    JOIN "parametros_depreciacao" pd ON pd."id" = dp."parametro_depreciacao_id"
    WHERE dp."patrimonio_id" = patrimonio_alvo
      AND dp."valor_contabil_novo" < pd."valor_residual"
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'depreciacoes_valor_residual_ck',
      MESSAGE = 'Depreciação não pode reduzir o valor abaixo do residual.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "parametros_depreciacao" pd
    JOIN LATERAL (
      SELECT COUNT(*)::integer AS quantidade,
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
          (date_trunc('month', pd."data_inicio") + historico.quantidade * interval '1 month')::date
      )
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'depreciacoes_competencias_contiguas_ck',
      MESSAGE = 'As competências depreciadas devem ser mensais, contíguas e iniciar no mês seguinte à disponibilidade.';
  END IF;
END;
$$;
