ALTER TABLE "itens_inventario"
  ADD CONSTRAINT "itens_inventario_situacao_localizacao_check" CHECK (
    ("situacao" IS NULL AND "setor_encontrado_id" IS NULL)
    OR ("situacao" = 'CORRETO' AND "setor_encontrado_id" IS NULL)
    OR ("situacao" = 'DIVERGENCIA' AND "setor_encontrado_id" IS NOT NULL)
    OR ("situacao" = 'NAO_LOCALIZADO' AND "setor_encontrado_id" IS NULL)
  ),
  ADD CONSTRAINT "itens_inventario_correcao_check" CHECK (
    ("situacao" IS DISTINCT FROM 'DIVERGENCIA'
      AND "status_correcao" IS NULL
      AND "tipo_correcao" IS NULL
      AND "data_correcao" IS NULL
      AND "corrigido_por_id" IS NULL
      AND "transferencia_correcao_id" IS NULL)
    OR ("situacao" = 'DIVERGENCIA'
      AND "status_correcao" = 'PENDENTE'
      AND "tipo_correcao" IS NULL
      AND "data_correcao" IS NULL
      AND "corrigido_por_id" IS NULL
      AND "transferencia_correcao_id" IS NULL)
    OR ("situacao" = 'DIVERGENCIA'
      AND "status_correcao" = 'CORRIGIDO'
      AND "tipo_correcao" = 'RETORNO_AO_SETOR_CADASTRADO'
      AND "data_correcao" IS NOT NULL
      AND "corrigido_por_id" IS NOT NULL
      AND "transferencia_correcao_id" IS NULL)
    OR ("situacao" = 'DIVERGENCIA'
      AND "status_correcao" = 'CORRIGIDO'
      AND "tipo_correcao" = 'TRANSFERENCIA_CADASTRAL'
      AND "data_correcao" IS NOT NULL
      AND "corrigido_por_id" IS NOT NULL
      AND "transferencia_correcao_id" IS NOT NULL)
  );

CREATE INDEX "transferencias_patrimonio_data_id_idx"
  ON "transferencias_patrimoniais"("patrimonio_id", "data_transferencia" DESC, "id" DESC);
CREATE INDEX "emprestimos_patrimonio_data_id_idx"
  ON "emprestimos_patrimoniais"("patrimonio_id", "data_emprestimo" DESC, "id" DESC);
CREATE INDEX "itens_manutencao_patrimonio_id_idx"
  ON "itens_manutencao"("patrimonio_id", "id");
CREATE INDEX "setores_inventario_setor_inventario_idx"
  ON "setores_inventario"("setor_id", "inventario_id");

CREATE FUNCTION "impedir_inativacao_setor_inventario_aberto"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."ativo" = true AND NEW."ativo" = false AND EXISTS (
    SELECT 1
    FROM "setores_inventario" si
    JOIN "inventarios" i ON i."id" = si."inventario_id"
    WHERE si."setor_id" = NEW."id" AND i."status" <> 'FINALIZADO'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'setores_inventario_aberto_check',
      MESSAGE = 'setor participante de inventario aberto';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "setores_impedir_inativacao_inventario_aberto"
BEFORE UPDATE OF "ativo" ON "setores"
FOR EACH ROW
EXECUTE FUNCTION "impedir_inativacao_setor_inventario_aberto"();

CREATE FUNCTION "impedir_baixa_patrimonio_inventario_aberto"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "itens_inventario" ii
    JOIN "inventarios" i ON i."id" = ii."inventario_id"
    WHERE ii."patrimonio_id" = NEW."patrimonio_id"
      AND i."status" <> 'FINALIZADO'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'patrimonio_inventario_aberto_check',
      MESSAGE = 'patrimonio participante de inventario aberto';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "baixas_impedir_patrimonio_inventario_aberto"
BEFORE INSERT OR UPDATE OF "patrimonio_id" ON "baixas_patrimoniais"
FOR EACH ROW
EXECUTE FUNCTION "impedir_baixa_patrimonio_inventario_aberto"();
