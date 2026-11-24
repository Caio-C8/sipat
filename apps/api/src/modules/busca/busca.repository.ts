import { Inject, Injectable } from "@nestjs/common";
import type { DominioBuscaGlobal } from "@repo/contracts";
import type { DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";

export type LinhaBuscaGlobal = {
  dominio: DominioBuscaGlobal;
  id: string;
  identificador: string;
  titulo: string;
  complemento: string | null;
  destino: string;
  total: bigint;
  posicao: bigint;
};

@Injectable()
export class BuscaRepository {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: DatabaseClient,
  ) {}

  buscar(termo: string, limite: number): Promise<readonly LinhaBuscaGlobal[]> {
    const termoEscapado = termo.replace(/[\\%_]/g, "\\$&");
    const padrao = `%${termoEscapado}%`;
    return this.database.$queryRaw<readonly LinhaBuscaGlobal[]>`
      WITH correspondencias AS (
        SELECT 'PATRIMONIOS'::text AS dominio, p.id, p.numero_patrimonio AS identificador,
          p.descricao AS titulo, concat_ws(' · ', e.nome, s.nome) AS complemento,
          '/patrimonios/' || p.id AS destino, p.created_at AS ordenacao
        FROM patrimonios p JOIN especies e ON e.id = p.especie_id JOIN setores s ON s.id = p.setor_atual_id
        WHERE p.numero_patrimonio ILIKE ${padrao} OR p.descricao ILIKE ${padrao}
          OR coalesce(p.marca, '') ILIKE ${padrao} OR coalesce(p.modelo, '') ILIKE ${padrao}

        UNION ALL
        SELECT 'REAVALIACOES', r.id,
          coalesce(r.numero_patrimonio_snapshot, p.numero_patrimonio),
          'Reavaliação do patrimônio ' || coalesce(r.numero_patrimonio_snapshot, p.numero_patrimonio),
          coalesce(r.descricao_patrimonio_snapshot, p.descricao), '/reavaliacoes/' || r.id, r.data_reavaliacao
        FROM reavaliacoes_patrimoniais r JOIN patrimonios p ON p.id = r.patrimonio_id
        WHERE p.numero_patrimonio ILIKE ${padrao} OR p.descricao ILIKE ${padrao}
          OR coalesce(r.numero_patrimonio_snapshot, '') ILIKE ${padrao}
          OR coalesce(r.descricao_patrimonio_snapshot, '') ILIKE ${padrao}

        UNION ALL
        SELECT 'DEPRECIACOES', d.id, p.numero_patrimonio,
          'Depreciação do patrimônio ' || p.numero_patrimonio,
          'Competência ' || to_char(d.data_competencia, 'MM/YYYY'), '/patrimonios/' || p.id, d.data_depreciacao
        FROM depreciacoes_patrimoniais d JOIN patrimonios p ON p.id = d.patrimonio_id
        WHERE p.numero_patrimonio ILIKE ${padrao} OR p.descricao ILIKE ${padrao}

        UNION ALL
        SELECT 'MOVIMENTACOES', t.id, p.numero_patrimonio,
          'Movimentação do patrimônio ' || p.numero_patrimonio,
          sa.nome || ' → ' || sn.nome, '/movimentacoes/' || t.id, t.data_transferencia
        FROM transferencias_patrimoniais t JOIN patrimonios p ON p.id = t.patrimonio_id
          JOIN setores sa ON sa.id = t.setor_antigo_id JOIN setores sn ON sn.id = t.setor_atual_id
        WHERE p.numero_patrimonio ILIKE ${padrao} OR p.descricao ILIKE ${padrao}
          OR sa.nome ILIKE ${padrao} OR sn.nome ILIKE ${padrao}
          OR coalesce(t.observacao, '') ILIKE ${padrao}

        UNION ALL
        SELECT 'EMPRESTIMOS', e.grupo_emprestimo_id, min(p.numero_patrimonio),
          'Empréstimo de ' || count(*)::text || CASE WHEN count(*) = 1 THEN ' patrimônio' ELSE ' patrimônios' END,
          coalesce(min(e.destinatario), min(s.nome), 'Sem destinatário informado'),
          '/emprestimos/' || e.grupo_emprestimo_id, max(e.data_emprestimo)
        FROM emprestimos_patrimoniais e JOIN patrimonios p ON p.id = e.patrimonio_id
          LEFT JOIN setores s ON s.id = e.setor_vinculo_id
        GROUP BY e.grupo_emprestimo_id
        HAVING bool_or(p.numero_patrimonio ILIKE ${padrao} OR p.descricao ILIKE ${padrao}
          OR coalesce(e.destinatario, '') ILIKE ${padrao} OR coalesce(s.nome, '') ILIKE ${padrao})

        UNION ALL
        SELECT 'BAIXAS', b.id, p.numero_patrimonio, 'Baixa do patrimônio ' || p.numero_patrimonio,
          p.descricao, '/baixas/' || p.id, b.data_baixa::timestamp
        FROM baixas_patrimoniais b JOIN patrimonios p ON p.id = b.patrimonio_id
        WHERE p.numero_patrimonio ILIKE ${padrao} OR p.descricao ILIKE ${padrao}
          OR b.motivo ILIKE ${padrao}

        UNION ALL
        SELECT 'INVENTARIOS', i.id, i.nome, i.nome, coalesce(i.descricao, c.nome),
          '/inventarios/' || i.id, i.created_at
        FROM inventarios i JOIN comissoes c ON c.id = i.comissao_id
        WHERE i.nome ILIKE ${padrao} OR coalesce(i.descricao, '') ILIKE ${padrao} OR c.nome ILIKE ${padrao}

        UNION ALL
        SELECT 'MANUTENCOES', m.id, 'Pedido #' || m.numero_pedido::text,
          'Pedido #' || m.numero_pedido::text,
          coalesce(min(p.descricao), min(m.numero_requisicao), 'Manutenção patrimonial'),
          '/manutencoes/' || m.id, m.data_envio::timestamp
        FROM manutencoes m LEFT JOIN itens_manutencao im ON im.manutencao_id = m.id
          LEFT JOIN patrimonios p ON p.id = im.patrimonio_id
        GROUP BY m.id
        HAVING m.numero_pedido::text ILIKE ${padrao} OR coalesce(m.numero_requisicao, '') ILIKE ${padrao}
          OR bool_or(coalesce(p.numero_patrimonio, '') ILIKE ${padrao} OR coalesce(p.descricao, '') ILIKE ${padrao})

        UNION ALL
        SELECT 'PROCESSOS_COMPRA', pc.id,
          coalesce('Processo ' || pc.numero_processo || CASE WHEN pc.ano_processo IS NULL THEN '' ELSE '/' || pc.ano_processo::text END, 'Empenho ' || pc.numero_empenho, 'Processo sem número'),
          coalesce('Processo ' || pc.numero_processo || CASE WHEN pc.ano_processo IS NULL THEN '' ELSE '/' || pc.ano_processo::text END, 'Processo de compra'),
          CASE WHEN pc.numero_empenho IS NULL THEN NULL ELSE 'Empenho ' || pc.numero_empenho || coalesce('/' || pc.ano_empenho::text, '') END,
          '/processos-compra/' || pc.id, pc.created_at
        FROM processos_compra pc
        WHERE coalesce(pc.numero_processo, '') ILIKE ${padrao} OR coalesce(pc.numero_empenho, '') ILIKE ${padrao}

        UNION ALL
        SELECT 'FORNECEDORES', f.id, coalesce(f.cnpj, f.razao_social), f.razao_social,
          f.nome_fantasia, '/fornecedores/' || f.id, f.created_at
        FROM fornecedores f WHERE f.razao_social ILIKE ${padrao} OR coalesce(f.nome_fantasia, '') ILIKE ${padrao}
          OR coalesce(f.cnpj, '') ILIKE ${padrao}

        UNION ALL
        SELECT 'SETORES', s.id, s.nome, s.nome, r.nome, '/setores/' || s.id, s.created_at
        FROM setores s JOIN responsaveis r ON r.id = s.responsavel_id
        WHERE s.nome ILIKE ${padrao} OR coalesce(s.sala, '') ILIKE ${padrao} OR r.nome ILIKE ${padrao}

        UNION ALL
        SELECT 'RESPONSAVEIS', r.id, r.matricula, r.nome, 'Matrícula ' || r.matricula,
          '/responsaveis/' || r.id, r.created_at
        FROM responsaveis r WHERE r.nome ILIKE ${padrao} OR r.matricula ILIKE ${padrao}

        UNION ALL
        SELECT 'COMISSOES', c.id, coalesce(c.numero_ato, c.nome), c.nome,
          CASE WHEN c.numero_ato IS NULL THEN NULL ELSE 'Ato ' || c.numero_ato END,
          '/comissoes/' || c.id, c.created_at
        FROM comissoes c WHERE c.nome ILIKE ${padrao} OR coalesce(c.numero_ato, '') ILIKE ${padrao}

        UNION ALL
        SELECT 'NATUREZAS', n.id, n.nome, n.nome, n.descricao, '/naturezas/' || n.id, n.created_at
        FROM naturezas n WHERE n.nome ILIKE ${padrao}

        UNION ALL
        SELECT 'ESPECIES', e.id, e.nome, e.nome, n.nome, '/especies/' || e.id, e.created_at
        FROM especies e JOIN naturezas n ON n.id = e.natureza_id
        WHERE e.nome ILIKE ${padrao} OR n.nome ILIKE ${padrao}
      ), ranqueadas AS (
        SELECT correspondencias.*,
          count(*) OVER (PARTITION BY dominio) AS total,
          row_number() OVER (PARTITION BY dominio ORDER BY ordenacao DESC, id DESC) AS posicao
        FROM correspondencias
      )
      SELECT dominio, id, left(identificador, 100) AS identificador, left(titulo, 300) AS titulo,
        nullif(left(complemento, 300), '') AS complemento, destino, total, posicao
      FROM ranqueadas WHERE posicao <= ${limite}
      ORDER BY dominio, posicao
    `;
  }
}
