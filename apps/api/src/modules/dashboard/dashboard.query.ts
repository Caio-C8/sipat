import { Prisma } from "@repo/database";

export function consultaDashboard(usuarioId: string, dataCorte: string) {
  return Prisma.sql`
    WITH situacoes AS (
      SELECT p.status, count(*)::int AS total
      FROM patrimonios p
      GROUP BY p.status
    ), inventario_origens AS (
      SELECT i.inventario_id, i.data_verificacao AS origem
      FROM itens_inventario i
      WHERE i.status_correcao = 'PENDENTE'
        AND i.data_verificacao IS NOT NULL
        AND (i.data_verificacao AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date <= ${dataCorte}::date
      UNION ALL
      SELECT l.inventario_id, l.data_localizacao
      FROM localizacoes_posteriores_inventario l
      WHERE l.status_correcao = 'PENDENTE'
        AND (l.data_localizacao AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date <= ${dataCorte}::date
    ), inventarios_pendentes AS (
      SELECT inv.id, inv.nome, count(*)::int AS quantidade,
             min(o.origem) AS origem
      FROM inventario_origens o
      JOIN inventarios inv ON inv.id = o.inventario_id
      GROUP BY inv.id, inv.nome
      ORDER BY origem, inv.nome, inv.id
      LIMIT 3
    ), manutencoes_pendentes AS (
      SELECT m.id, m.numero_pedido, m.data_envio,
             count(i.id) FILTER (WHERE i.recebido_em IS NULL)::int AS quantidade
      FROM manutencoes m
      JOIN itens_manutencao i ON i.manutencao_id = m.id
      WHERE m.data_envio <= ${dataCorte}::date
      GROUP BY m.id, m.numero_pedido, m.data_envio
      HAVING count(i.id) FILTER (WHERE i.recebido_em IS NULL) > 0
      ORDER BY m.data_envio, m.numero_pedido, m.id
      LIMIT 3
    ), depreciacao_estados AS (
      SELECT ((date_trunc('month', pd.data_inicio) + interval '1 month')::date
              + (SELECT count(*) FROM depreciacoes_patrimoniais d
                 WHERE d.parametro_depreciacao_id = pd.id) * interval '1 month')::date AS competencia
      FROM patrimonios p
      JOIN situacoes_contabeis_patrimoniais sc ON sc.patrimonio_id = p.id
      JOIN parametros_depreciacao pd
        ON pd.patrimonio_id = p.id AND pd.data_fim IS NULL
      JOIN disponibilidades_uso_patrimonio du ON du.patrimonio_id = p.id
      WHERE p.depreciavel
        AND p.status IN ('ATIVO', 'EMPRESTADO', 'EM_MANUTENCAO')
        AND pd.data_inicio IS NOT NULL
        AND sc.valor_bruto_atual - sc.depreciacao_acumulada_atual > pd.valor_residual
    ), competencia_mais_antiga AS (
      SELECT min(competencia) AS competencia
      FROM depreciacao_estados
      WHERE competencia <= ${dataCorte}::date
    ), depreciacao_pendente AS (
      SELECT c.competencia, count(e.competencia)::int AS quantidade
      FROM competencia_mais_antiga c
      JOIN depreciacao_estados e ON e.competencia = c.competencia
      WHERE c.competencia IS NOT NULL
      GROUP BY c.competencia
    ), setores_painel AS (
      SELECT s.id, s.nome, count(*)::int AS total
      FROM patrimonios p
      JOIN setores s ON s.id = p.setor_atual_id
      WHERE p.status <> 'BAIXADO'
      GROUP BY s.id, s.nome
      ORDER BY total DESC, s.nome, s.id
      LIMIT 5
    ), eventos (patrimonio_id, evento_id, instante, tipo, titulo) AS (
      SELECT p.id, p.id, p.created_at, 'CADASTRO', 'Patrimônio cadastrado'
      FROM patrimonios p WHERE p.created_by_id = ${usuarioId}::uuid
      UNION ALL
      SELECT s.patrimonio_id, s.id, s.created_at, 'SUBSTITUICAO_NUMERO', 'Número patrimonial substituído'
      FROM substituicoes_numero_patrimonial s WHERE s.created_by_id = ${usuarioId}::uuid
      UNION ALL
      SELECT t.patrimonio_id, t.id, t.created_at, 'MOVIMENTACAO', 'Movimentação registrada'
      FROM transferencias_patrimoniais t
      WHERE t.created_by_id = ${usuarioId}::uuid
        AND NOT EXISTS (SELECT 1 FROM itens_inventario i WHERE i.transferencia_correcao_id = t.id)
        AND NOT EXISTS (SELECT 1 FROM localizacoes_posteriores_inventario l WHERE l.transferencia_correcao_id = t.id)
      UNION ALL
      SELECT b.patrimonio_id, b.id, b.created_at, 'BAIXA', 'Baixa registrada'
      FROM baixas_patrimoniais b WHERE b.created_by_id = ${usuarioId}::uuid
      UNION ALL
      SELECT e.patrimonio_id, e.id, e.created_at, 'EMPRESTIMO', 'Empréstimo registrado'
      FROM emprestimos_patrimoniais e WHERE e.created_by_id = ${usuarioId}::uuid
      UNION ALL
      SELECT e.patrimonio_id, d.id, d.created_at, 'DEVOLUCAO', 'Devolução registrada'
      FROM devolucoes_patrimoniais d
      JOIN emprestimos_patrimoniais e ON e.id = d.emprestimo_id
      WHERE d.created_by_id = ${usuarioId}::uuid
      UNION ALL
      SELECT i.patrimonio_id, i.id, m.created_at, 'MANUTENCAO_ENVIO', 'Envio para manutenção'
      FROM itens_manutencao i
      JOIN manutencoes m ON m.id = i.manutencao_id
      WHERE m.created_by_id = ${usuarioId}::uuid
      UNION ALL
      SELECT i.patrimonio_id, i.id, i.recebido_em, 'MANUTENCAO_RETORNO', 'Retorno de manutenção'
      FROM itens_manutencao i
      WHERE i.recebido_por_id = ${usuarioId}::uuid AND i.recebido_em IS NOT NULL
      UNION ALL
      SELECT r.patrimonio_id, r.id, r.created_at, 'REAVALIACAO', 'Reavaliação registrada'
      FROM reavaliacoes_patrimoniais r WHERE r.created_by_id = ${usuarioId}::uuid
      UNION ALL
      SELECT d.patrimonio_id, d.id, d.created_at, 'DEPRECIACAO', 'Depreciação registrada'
      FROM depreciacoes_patrimoniais d WHERE d.created_by_id = ${usuarioId}::uuid
      UNION ALL
      SELECT i.patrimonio_id, i.id, i.data_verificacao, 'INVENTARIO_VERIFICACAO', 'Conferência de inventário'
      FROM itens_inventario i
      WHERE i.verificado_por_id = ${usuarioId}::uuid AND i.data_verificacao IS NOT NULL
      UNION ALL
      SELECT i.patrimonio_id, i.id, i.data_correcao, 'INVENTARIO_CORRECAO', 'Divergência de inventário corrigida'
      FROM itens_inventario i
      WHERE i.corrigido_por_id = ${usuarioId}::uuid AND i.data_correcao IS NOT NULL
      UNION ALL
      SELECT i.patrimonio_id, l.id, l.data_localizacao, 'INVENTARIO_VERIFICACAO', 'Bem localizado no inventário'
      FROM localizacoes_posteriores_inventario l
      JOIN itens_inventario i ON i.id = l.item_inventario_id
      WHERE l.localizado_por_id = ${usuarioId}::uuid
      UNION ALL
      SELECT i.patrimonio_id, l.id, l.data_correcao, 'INVENTARIO_CORRECAO', 'Localização de inventário corrigida'
      FROM localizacoes_posteriores_inventario l
      JOIN itens_inventario i ON i.id = l.item_inventario_id
      WHERE l.corrigido_por_id = ${usuarioId}::uuid AND l.data_correcao IS NOT NULL
    ), recentes AS (
      SELECT * FROM eventos
      ORDER BY instante DESC, tipo, evento_id
      LIMIT 3
    )
    SELECT jsonb_build_object(
      'totais', jsonb_build_object(
        'total', (SELECT coalesce(sum(total), 0)::int FROM situacoes),
        'porStatus', (SELECT jsonb_object_agg(s.status, coalesce(t.total, 0))
          FROM unnest(enum_range(NULL::"StatusPatrimonio")) s(status)
          LEFT JOIN situacoes t USING (status))
      ),
      'pendencias', jsonb_build_object(
        'inventarios', (SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', i.id, 'nome', i.nome, 'quantidadeCorrecoes', i.quantidade,
          'pendenciaMaisAntigaEm', to_char(i.origem, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'destino', '/inventarios/' || i.id || '?visao=pendentes'
        ) ORDER BY i.origem, i.nome, i.id), '[]'::jsonb) FROM inventarios_pendentes i),
        'manutencoes', (SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', m.id, 'numeroPedido', m.numero_pedido::text,
          'dataEnvio', to_char(m.data_envio, 'YYYY-MM-DD'),
          'quantidadeItensSemRetorno', m.quantidade,
          'destino', '/manutencoes/' || m.id
        ) ORDER BY m.data_envio, m.numero_pedido, m.id), '[]'::jsonb) FROM manutencoes_pendentes m),
        'depreciacao', (SELECT jsonb_build_object(
          'competencia', to_char(d.competencia, 'YYYY-MM'),
          'quantidadePatrimonios', d.quantidade,
          'destino', '/depreciacao?competencia=' || to_char(d.competencia, 'YYYY-MM')
        ) FROM depreciacao_pendente d)
      ),
      'setores', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'nome', s.nome, 'total', s.total,
        'destino', '/patrimonios?setorId=' || s.id
      ) ORDER BY s.total DESC, s.nome, s.id), '[]'::jsonb) FROM setores_painel s),
      'atividades', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'patrimonioId', p.id, 'numeroPatrimonio', p.numero_patrimonio,
        'tipo', r.tipo, 'titulo', r.titulo,
        'registradoEm', to_char(r.instante, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'destino', '/patrimonios/' || p.id || '?aba=historico'
      ) ORDER BY r.instante DESC, r.tipo, r.evento_id), '[]'::jsonb)
      FROM recentes r JOIN patrimonios p ON p.id = r.patrimonio_id)
    ) AS dados
  `;
}
