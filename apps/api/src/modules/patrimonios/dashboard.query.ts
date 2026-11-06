import { Prisma } from "@repo/database";

// Uma única leitura mantém contagens, distribuição e eventos no mesmo instante.
export const consultaDashboard = Prisma.sql`
  WITH situacoes AS (
    SELECT status, count(*) AS total FROM patrimonios GROUP BY status
  ), setores_painel AS (
    SELECT s.id, s.nome, count(*) AS total
    FROM patrimonios p JOIN setores s ON s.id = p.setor_atual_id
    GROUP BY s.id, s.nome ORDER BY total DESC, s.nome, s.id LIMIT 4
  ), eventos (patrimonio_id, evento_id, instante, titulo) AS (
    SELECT id, id, created_at, 'Patrimônio cadastrado' FROM patrimonios
    UNION ALL SELECT patrimonio_id, id, created_at, 'Número patrimonial substituído' FROM substituicoes_numero_patrimonial
    UNION ALL SELECT patrimonio_id, id, created_at, 'Movimentação registrada' FROM transferencias_patrimoniais t
      WHERE NOT EXISTS (SELECT 1 FROM itens_inventario i WHERE i.transferencia_correcao_id = t.id)
        AND NOT EXISTS (SELECT 1 FROM localizacoes_posteriores_inventario l WHERE l.transferencia_correcao_id = t.id)
    UNION ALL SELECT patrimonio_id, id, created_at, 'Baixa registrada' FROM baixas_patrimoniais
    UNION ALL SELECT patrimonio_id, id, created_at, 'Empréstimo registrado' FROM emprestimos_patrimoniais
    UNION ALL SELECT e.patrimonio_id, d.id, d.created_at, 'Devolução de empréstimo' FROM devolucoes_patrimoniais d JOIN emprestimos_patrimoniais e ON e.id = d.emprestimo_id
    UNION ALL SELECT patrimonio_id, id, created_at, 'Envio para manutenção' FROM itens_manutencao
    UNION ALL SELECT patrimonio_id, id, recebido_em, 'Retorno de manutenção' FROM itens_manutencao WHERE recebido_em IS NOT NULL
    UNION ALL SELECT i.patrimonio_id, v.id, v.created_at, 'Orçamento de manutenção revisado' FROM revisoes_orcamento_manutencao v JOIN itens_manutencao i ON i.id = v.item_id
    UNION ALL SELECT patrimonio_id, id, created_at, 'Reavaliação registrada' FROM reavaliacoes_patrimoniais
    UNION ALL SELECT patrimonio_id, id, created_at, 'Depreciação registrada' FROM depreciacoes_patrimoniais
    UNION ALL SELECT patrimonio_id, id, data_verificacao, 'Conferência de inventário' FROM itens_inventario WHERE data_verificacao IS NOT NULL
    UNION ALL SELECT patrimonio_id, id, data_correcao, 'Inconsistência corrigida' FROM itens_inventario WHERE data_correcao IS NOT NULL
    UNION ALL SELECT i.patrimonio_id, l.id, l.data_localizacao, 'Bem localizado após conferência' FROM localizacoes_posteriores_inventario l JOIN itens_inventario i ON i.id = l.item_inventario_id
    UNION ALL SELECT i.patrimonio_id, l.id, l.data_correcao, 'Localização posterior corrigida' FROM localizacoes_posteriores_inventario l JOIN itens_inventario i ON i.id = l.item_inventario_id WHERE l.data_correcao IS NOT NULL
  ), recentes AS (
    SELECT * FROM eventos ORDER BY instante DESC, titulo, evento_id LIMIT 3
  )
  SELECT jsonb_build_object(
    'total', (SELECT coalesce(sum(total), 0) FROM situacoes),
    'porStatus', (SELECT jsonb_object_agg(s.status, coalesce(t.total,0)) FROM unnest(enum_range(NULL::"StatusPatrimonio")) s(status) LEFT JOIN situacoes t USING (status)),
    'correcoesPendentes', (SELECT count(*) FROM itens_inventario WHERE status_correcao = 'PENDENTE')
      + (SELECT count(*) FROM localizacoes_posteriores_inventario WHERE status_correcao = 'PENDENTE'),
    'setores', (SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY total DESC, nome, id), '[]') FROM setores_painel s),
    'atividades', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'patrimonioId', p.id, 'numero', p.numero_patrimonio, 'titulo', r.titulo,
      'registradoEm', to_char(r.instante, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) ORDER BY r.instante DESC, r.titulo, r.evento_id), '[]') FROM recentes r JOIN patrimonios p ON p.id = r.patrimonio_id)
  ) AS dados
`;
