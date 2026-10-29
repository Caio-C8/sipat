-- Migração aditiva. Nenhuma coluna ou vínculo legado é removido.
-- Duplicidades pré-existentes devem ser tratadas explicitamente antes de criar
-- índices únicos; uma falha aqui reverte a migration inteira.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM itens_manutencao
    GROUP BY manutencao_id, patrimonio_id HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Itens legados repetem patrimônio no mesmo pedido de manutenção';
  END IF;
  IF EXISTS (
    SELECT 1 FROM itens_manutencao WHERE data_retorno IS NULL
    GROUP BY patrimonio_id HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Patrimônio possui mais de um item de manutenção aberto';
  END IF;
END $$;

CREATE TYPE "FaseDocumentoManutencao" AS ENUM ('PEDIDO', 'ENVIO', 'RECEBIMENTO', 'LEGADO');

ALTER TABLE itens_manutencao
  ADD COLUMN tipo "TipoManutencao",
  ADD COLUMN fornecedor_id UUID,
  ADD COLUMN previsao_retorno DATE,
  ADD COLUMN versao_orcamento INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN descricao_garantia TEXT,
  ADD COLUMN data_fim_garantia DATE,
  ADD COLUMN recebido_por_id UUID,
  ADD COLUMN recebido_em TIMESTAMP(6);

UPDATE itens_manutencao i SET
  tipo = m.tipo,
  fornecedor_id = m.fornecedor_id,
  previsao_retorno = m.previsao_retorno
FROM manutencoes m WHERE m.id = i.manutencao_id;

ALTER TABLE itens_manutencao ALTER COLUMN tipo SET NOT NULL;
ALTER TABLE manutencoes ALTER COLUMN tipo DROP NOT NULL;

-- O orçamento legado completo vira a primeira revisão. Campos parciais
-- permanecem nas colunas antigas sem interpretação ou perda.
CREATE TABLE revisoes_orcamento_manutencao (
  id UUID NOT NULL,
  item_id UUID NOT NULL,
  versao INTEGER NOT NULL,
  data_orcamento DATE NOT NULL,
  descricao_orcamento TEXT NOT NULL,
  valor_orcamento DECIMAL(19,7) NOT NULL,
  fornecedor_id UUID,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_id UUID NOT NULL,
  CONSTRAINT revisoes_orcamento_manutencao_pkey PRIMARY KEY (id),
  CONSTRAINT revisoes_orcamento_item_versao_key UNIQUE (item_id, versao),
  CONSTRAINT revisoes_orcamento_item_fkey FOREIGN KEY (item_id) REFERENCES itens_manutencao(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT revisoes_orcamento_fornecedor_fkey FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT revisoes_orcamento_autor_fkey FOREIGN KEY (created_by_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO revisoes_orcamento_manutencao
  (id, item_id, versao, data_orcamento, descricao_orcamento, valor_orcamento, fornecedor_id, created_at, created_by_id)
SELECT gen_random_uuid(), i.id, 1, i.data_orcamento, i.descricao_orcamento,
  i.valor_orcamento, i.fornecedor_id, COALESCE(i.updated_at, i.created_at), m.created_by_id
FROM itens_manutencao i JOIN manutencoes m ON m.id = i.manutencao_id
WHERE i.data_orcamento IS NOT NULL AND i.descricao_orcamento IS NOT NULL AND i.valor_orcamento IS NOT NULL;

UPDATE itens_manutencao i SET versao_orcamento = 1
WHERE EXISTS (SELECT 1 FROM revisoes_orcamento_manutencao r WHERE r.item_id = i.id);

CREATE TABLE documentos_manutencao (
  id UUID NOT NULL,
  manutencao_id UUID NOT NULL,
  item_id UUID,
  fase "FaseDocumentoManutencao" NOT NULL,
  chave VARCHAR(500) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tamanho_bytes INTEGER,
  hash_sha256 CHAR(64),
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_id UUID,
  CONSTRAINT documentos_manutencao_pkey PRIMARY KEY (id),
  CONSTRAINT documentos_manutencao_pedido_fkey FOREIGN KEY (manutencao_id) REFERENCES manutencoes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT documentos_manutencao_item_fkey FOREIGN KEY (item_id) REFERENCES itens_manutencao(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT documentos_manutencao_autor_fkey FOREIGN KEY (created_by_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT documentos_manutencao_fase_check CHECK (
    (fase = 'PEDIDO' AND item_id IS NULL) OR
    (fase IN ('ENVIO', 'RECEBIMENTO') AND item_id IS NOT NULL) OR
    fase = 'LEGADO'
  )
);

-- A origem dos anexos antigos é desconhecida: LEGADO, sem inventar fase.
INSERT INTO documentos_manutencao
  (id, manutencao_id, item_id, fase, chave, nome, created_at)
SELECT gen_random_uuid(), m.id, NULL, 'LEGADO', m.caminho_anexo_observacao,
  'Documento legado do pedido.pdf', m.created_at
FROM manutencoes m WHERE m.caminho_anexo_observacao IS NOT NULL;
INSERT INTO documentos_manutencao
  (id, manutencao_id, item_id, fase, chave, nome, created_at)
SELECT gen_random_uuid(), i.manutencao_id, i.id, 'LEGADO', i.caminho_anexo_observacao,
  'Documento legado do item.pdf', i.created_at
FROM itens_manutencao i WHERE i.caminho_anexo_observacao IS NOT NULL;

CREATE TABLE idempotencias_manutencao (
  id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  chave UUID NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  hash_payload CHAR(64) NOT NULL,
  resultado JSONB NOT NULL,
  manutencao_id UUID NOT NULL,
  item_id UUID,
  documento_id UUID,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT idempotencias_manutencao_pkey PRIMARY KEY (id),
  CONSTRAINT idempotencias_manutencao_usuario_chave_key UNIQUE (usuario_id, chave),
  CONSTRAINT idempotencias_manutencao_usuario_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT idempotencias_manutencao_pedido_fkey FOREIGN KEY (manutencao_id) REFERENCES manutencoes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT idempotencias_manutencao_item_fkey FOREIGN KEY (item_id) REFERENCES itens_manutencao(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE itens_manutencao
  ADD CONSTRAINT itens_manutencao_fornecedor_fkey FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT itens_manutencao_recebido_por_fkey FOREIGN KEY (recebido_por_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX itens_manutencao_pedido_patrimonio_key ON itens_manutencao(manutencao_id, patrimonio_id);
CREATE UNIQUE INDEX itens_manutencao_abertos_patrimonio_key ON itens_manutencao(patrimonio_id) WHERE data_retorno IS NULL;
CREATE INDEX manutencoes_status_envio_id_idx ON manutencoes(status, data_envio DESC, id DESC);
CREATE INDEX manutencoes_envio_id_idx ON manutencoes(data_envio DESC, id DESC);
CREATE INDEX documentos_manutencao_pedido_data_idx ON documentos_manutencao(manutencao_id, created_at, id);
CREATE INDEX documentos_manutencao_item_data_idx ON documentos_manutencao(item_id, created_at, id);
