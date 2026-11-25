ALTER TABLE "manutencoes"
  ALTER COLUMN "data_envio" TYPE TIMESTAMP(6) USING "data_envio"::timestamp,
  ALTER COLUMN "data_retorno" TYPE TIMESTAMP(6) USING "data_retorno"::timestamp;

ALTER TABLE "itens_manutencao"
  ALTER COLUMN "data_retorno" TYPE TIMESTAMP(6) USING "data_retorno"::timestamp;

ALTER TABLE "baixas_patrimoniais"
  ALTER COLUMN "data_baixa" TYPE TIMESTAMP(6) USING "data_baixa"::timestamp;

ALTER TABLE "emprestimos_patrimoniais"
  ALTER COLUMN "data_prevista_devolucao" TYPE DATE USING "data_prevista_devolucao"::date;
