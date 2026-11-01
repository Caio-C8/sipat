import { Prisma } from "@repo/database";
import {
  diaSaoPaulo,
  inicioDiaSaoPaulo,
  proximoDiaCivil,
} from "../../../common/utils/datas-institucionais";
import {
  camposBaixa,
  camposDepreciacao,
  camposEmprestimo,
  camposInventario,
  camposManutencao,
  camposMovimentacao,
  camposReavaliacao,
  joinsAutor,
  joinsEmprestimo,
  joinsInventario,
  joinsManutencao,
  joinsMovimentacao,
  objeto,
} from "./fontes-tabulares";
import type { FonteRelatorio } from "./relatorios.types";

export function fonteEventos(
  patrimonioId: string,
  q: Record<string, unknown>,
  agora: Date,
): FonteRelatorio {
  const partes: Prisma.Sql[] = [];
  function evento(
    tipo: string,
    tabela: string,
    joins: string,
    campos: Record<string, string>,
    ocorrencia: string,
    precisao: "DIA" | "INSTANTE",
    autor = "u.nome",
    comissao = "c.nome",
    registro = "r.created_at",
    cond = "true",
    fonte = "r.id",
  ) {
    const instante =
      precisao === "DIA"
        ? `${ocorrencia}::timestamp AT TIME ZONE 'America/Sao_Paulo'`
        : `${ocorrencia} AT TIME ZONE 'UTC'`;
    const dataTexto =
      precisao === "DIA"
        ? `${ocorrencia}::date::text`
        : `to_char(${ocorrencia}, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
    const base = objeto({
      id: fonte,
      patrimonioId: "p.id",
      fonteId: fonte,
      ocorrencia: dataTexto,
      precisao: `CASE WHEN ${ocorrencia} IS NULL THEN 'DESCONHECIDA' ELSE '${precisao}' END`,
      registroEm: `${registro}::text`,
      autor,
      comissao,
    });
    partes.push(
      Prisma.sql`SELECT ${base} || jsonb_build_object('tipo',${tipo}::text,'atributos',${objeto(campos)}) dados, ${Prisma.raw(instante)} AS ordem1, ${fonte === "d.id" ? Prisma.raw("d.id") : Prisma.raw(fonte)} AS id FROM ${Prisma.raw(tabela)} JOIN patrimonios p ON p.id=r.patrimonio_id ${Prisma.raw(joins)} WHERE r.patrimonio_id=${patrimonioId}::uuid AND ${Prisma.raw(cond)}`,
    );
  }
  evento(
    "SUBSTITUICAO_NUMERO",
    "substituicoes_numero_patrimonial r",
    "JOIN usuarios u ON u.id=r.created_by_id",
    { numeroAnterior: "r.numero_anterior", numeroNovo: "r.numero_novo" },
    "r.created_at",
    "INSTANTE",
    "u.nome",
    "NULL",
  );
  // Transferências vinculadas a correção aparecem exclusivamente no evento de correção.
  evento(
    "TRANSFERENCIA",
    "transferencias_patrimoniais r",
    joinsMovimentacao,
    camposMovimentacao,
    "r.data_transferencia",
    "INSTANTE",
    "u.nome",
    "c.nome",
    "r.created_at",
    "i.id IS NULL AND l.id IS NULL",
  );
  evento(
    "DEPRECIACAO",
    "depreciacoes_patrimoniais r",
    joinsAutor,
    camposDepreciacao,
    "r.data_depreciacao",
    "INSTANTE",
  );
  evento(
    "REAVALIACAO",
    "reavaliacoes_patrimoniais r",
    joinsAutor,
    camposReavaliacao,
    "r.data_reavaliacao",
    "INSTANTE",
    "coalesce(r.nome_autor_snapshot,u.nome)",
    "coalesce(r.nome_comissao_snapshot,c.nome)",
  );
  evento(
    "EMPRESTIMO",
    "emprestimos_patrimoniais r",
    joinsEmprestimo,
    camposEmprestimo(diaSaoPaulo(agora)),
    "r.data_emprestimo",
    "DIA",
  );
  evento(
    "DEVOLUCAO",
    "emprestimos_patrimoniais r",
    joinsEmprestimo,
    camposEmprestimo(diaSaoPaulo(agora)),
    "d.data_devolucao",
    "DIA",
    "ud.nome",
    "cd.nome",
    "d.created_at",
    "d.id IS NOT NULL",
    "d.id",
  );
  evento(
    "BAIXA",
    "baixas_patrimoniais r",
    joinsAutor,
    camposBaixa,
    "r.data_baixa",
    "DIA",
  );
  evento(
    "ENVIO_MANUTENCAO",
    "itens_manutencao r",
    `${joinsManutencao} JOIN usuarios u ON u.id=m.created_by_id`,
    camposManutencao,
    "m.data_envio",
    "DIA",
    "u.nome",
    "c.nome",
    "r.created_at",
  );
  evento(
    "RETORNO_MANUTENCAO",
    "itens_manutencao r",
    `${joinsManutencao} LEFT JOIN usuarios u ON u.id=r.recebido_por_id`,
    camposManutencao,
    "r.data_retorno",
    "DIA",
    "u.nome",
    "c.nome",
    "r.recebido_em",
    "r.data_retorno IS NOT NULL",
  );
  // A raiz deste ramo é o item; a revisão mantém UUID e snapshot próprios.
  evento(
    "REVISAO_ORCAMENTO",
    "itens_manutencao r",
    "JOIN manutencoes m ON m.id=r.manutencao_id JOIN comissoes c ON c.id=m.comissao_id JOIN revisoes_orcamento_manutencao v ON v.item_id=r.id JOIN usuarios u ON u.id=v.created_by_id LEFT JOIN fornecedores f ON f.id=v.fornecedor_id",
    {
      itemId: "r.id",
      versao: "v.versao",
      descricao: "v.descricao_orcamento",
      valor: "v.valor_orcamento::text",
      fornecedor: "f.razao_social",
    },
    "v.data_orcamento",
    "DIA",
    "u.nome",
    "c.nome",
    "v.created_at",
    "true",
    "v.id",
  );
  evento(
    "CONFERENCIA_INVENTARIO",
    "itens_inventario r",
    joinsInventario,
    camposInventario,
    "r.data_verificacao",
    "INSTANTE",
    "uv.nome",
    "NULL",
    "NULL",
    "r.status_verificacao='VERIFICADO'",
  );
  evento(
    "CORRECAO_INVENTARIO",
    "itens_inventario r",
    joinsInventario,
    camposInventario,
    "r.data_correcao",
    "INSTANTE",
    "uc.nome",
    "NULL",
    "NULL",
    "r.status_correcao='CORRIGIDO'",
  );
  evento(
    "LOCALIZACAO_POSTERIOR",
    "itens_inventario r",
    joinsInventario,
    camposInventario,
    "l.data_localizacao",
    "INSTANTE",
    "ul.nome",
    "NULL",
    "l.created_at",
    "l.id IS NOT NULL",
    "l.id",
  );
  evento(
    "CORRECAO_LOCALIZACAO",
    "itens_inventario r",
    joinsInventario,
    camposInventario,
    "l.data_correcao",
    "INSTANTE",
    "ulp.nome",
    "NULL",
    "NULL",
    "l.status_correcao='CORRIGIDO'",
    "l.id",
  );
  const cond: Prisma.Sql[] = [Prisma.sql`true`];
  if (q.evento) cond.push(Prisma.sql`dados->>'tipo'=${String(q.evento)}`);
  if (q.inicio && q.fim)
    cond.push(
      Prisma.sql`ordem1 >= ${inicioDiaSaoPaulo(String(q.inicio))} AND ordem1 < ${inicioDiaSaoPaulo(proximoDiaCivil(String(q.fim)))}`,
    );
  return {
    sql: Prisma.sql`SELECT * FROM (${Prisma.join(partes, " UNION ALL ")}) eventos WHERE ${Prisma.join(cond, " AND ")}`,
    ordem: Prisma.raw("ordem1 ASC NULLS LAST, dados->>'tipo' ASC, id ASC"),
    criterio:
      "Ocorrência conhecida em ordem crescente; eventos de precisão DIA não afirmam ordem intradiária. Datas desconhecidas no fim. Nomes cadastrais atuais sem snapshot. Valores de manutenção fora da revisão são vigentes na consulta.",
    ordenacao:
      "Ocorrência crescente, tipo e UUID; sem ordem real presumida entre fatos conhecidos apenas pelo dia.",
  };
}
