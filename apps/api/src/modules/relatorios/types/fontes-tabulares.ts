import { Prisma } from "@repo/database";
import type { TipoTabular } from "@repo/contracts";
import {
  diaSaoPaulo,
  inicioDiaSaoPaulo,
  proximoDiaCivil,
} from "../../../common/utils/datas-institucionais";
import type { FonteRelatorio } from "./relatorios.types";

// Todos os identificadores SQL abaixo são constantes internas, nunca valores da query.
const sql = Prisma.sql;
const raw = Prisma.raw;
export function objeto(campos: Record<string, string>): Prisma.Sql {
  return sql`jsonb_build_object(${Prisma.join(Object.entries(campos).flatMap(([nome, expressao]) => [sql`${nome}::text`, raw(expressao)]))})`;
}
const bem = {
  patrimonioId: "p.id",
  numeroPatrimonio: "p.numero_patrimonio",
  descricao: "p.descricao",
};
const autor = { comissao: "c.nome", autor: "u.nome" };
const joinsAutor =
  "JOIN comissoes c ON c.id=r.comissao_id JOIN usuarios u ON u.id=r.created_by_id";
export const camposPatrimonio = {
  id: "p.id",
  ...bem,
  tipoNumeroPatrimonial: "p.tipo_numero_patrimonial::text",
  especie: "e.nome",
  natureza: "n.nome",
  setorAtual: "s.nome",
  salaAtual: "s.sala",
  responsavelAtual: "a.nome",
  status: "p.status::text",
  dataTombamento: "p.data_tombamento::text",
  valorIncorporacao: "p.valor_incorporacao::text",
  valorBrutoAtual: "sc.valor_bruto_atual::text",
  depreciacaoAcumuladaAtual: "sc.depreciacao_acumulada_atual::text",
  valorLiquidoAtual:
    "(sc.valor_bruto_atual-sc.depreciacao_acumulada_atual)::numeric(30,7)::text",
};
export const joinsPatrimonio =
  "JOIN especies e ON e.id=p.especie_id JOIN naturezas n ON n.id=e.natureza_id JOIN setores s ON s.id=p.setor_atual_id JOIN responsaveis a ON a.id=s.responsavel_id LEFT JOIN situacoes_contabeis_patrimoniais sc ON sc.patrimonio_id=p.id";
export const camposMovimentacao = {
  id: "r.id",
  ...bem,
  dataTransferencia:
    'to_char(r.data_transferencia, \'YYYY-MM-DD"T"HH24:MI:SS.US"Z"\')',
  setorOrigem: "so.nome",
  setorDestino: "sd.nome",
  origem:
    "CASE WHEN i.id IS NOT NULL OR l.id IS NOT NULL THEN 'CORRECAO_INVENTARIO' ELSE 'COMUM' END",
  ...autor,
  registroEm: 'to_char(r.created_at, \'YYYY-MM-DD"T"HH24:MI:SS.US"Z"\')',
  observacao: "r.observacao",
  inventarioId: "coalesce(i.inventario_id,l.inventario_id)::text",
};
export const joinsMovimentacao = `${joinsAutor} JOIN setores so ON so.id=r.setor_antigo_id JOIN setores sd ON sd.id=r.setor_atual_id LEFT JOIN itens_inventario i ON i.transferencia_correcao_id=r.id LEFT JOIN localizacoes_posteriores_inventario l ON l.transferencia_correcao_id=r.id`;
export const camposManutencao = {
  id: "r.id",
  ...bem,
  pedidoId: "m.id",
  requisicao: "m.numero_requisicao",
  tipo: "r.tipo::text",
  fornecedor: "f.razao_social",
  dataEnvio: "m.data_envio::text",
  previsaoRetorno: "r.previsao_retorno::text",
  dataRetorno: "r.data_retorno::text",
  situacao:
    "CASE WHEN r.data_retorno IS NULL THEN 'PENDENTE' ELSE 'RETORNADO' END",
  versaoOrcamento: "r.versao_orcamento::text",
  valorOrcamento: "r.valor_orcamento::text",
  valorRealizado: "r.valor_realizado::text",
  servico: "r.descricao_servico_realizado",
  garantia: "r.descricao_garantia",
  vencimentoGarantia: "r.data_fim_garantia::text",
  comissao: "c.nome",
};
export const joinsManutencao =
  "JOIN manutencoes m ON m.id=r.manutencao_id JOIN comissoes c ON c.id=m.comissao_id LEFT JOIN fornecedores f ON f.id=r.fornecedor_id";
export const camposDepreciacao = {
  id: "r.id",
  ...bem,
  competencia: "to_char(r.data_competencia,'YYYY-MM')",
  parametroId: "r.parametro_depreciacao_id",
  processamento:
    'to_char(r.data_depreciacao, \'YYYY-MM-DD"T"HH24:MI:SS.US"Z"\')',
  valorContabilAnterior: "r.valor_contabil_anterior::text",
  valorDepreciado: "r.valor_depreciado::text",
  valorContabilNovo: "r.valor_contabil_novo::text",
  ...autor,
};
export const camposReavaliacao = {
  id: "r.id",
  patrimonioId: "p.id",
  numeroPatrimonioAtual: "p.numero_patrimonio",
  descricaoAtual: "p.descricao",
  dataReavaliacao:
    'to_char(r.data_reavaliacao, \'YYYY-MM-DD"T"HH24:MI:SS.US"Z"\')',
  dataReferencia: "r.data_referencia::text",
  numeroSnapshot: "r.numero_patrimonio_snapshot",
  descricaoSnapshot: "r.descricao_patrimonio_snapshot",
  valorLiquidoAnterior: "r.valor_liquido_anterior::text",
  valorBrutoAnterior: "r.valor_bruto_anterior::text",
  depreciacaoAcumuladaAnterior: "r.depreciacao_acumulada_anterior::text",
  valorReavaliado: "r.valor_reavaliado::text",
  valorResidualAnterior: "r.valor_residual_anterior::text",
  valorResidualNovo: "r.valor_residual_novo::text",
  vidaUtilAnteriorMeses: "r.vida_util_restante_anterior_meses::text",
  vidaUtilNovaMeses: "r.vida_util_nova_meses::text",
  comissaoSnapshot: "r.nome_comissao_snapshot",
  autorSnapshot: "r.nome_autor_snapshot",
  comissaoAtual: "c.nome",
  autorAtual: "u.nome",
  laudo: "r.laudo_tecnico",
  observacao: "r.observacao",
  parametroAnteriorId: "r.parametro_anterior_id::text",
  parametroAnteriorSituacao:
    "CASE WHEN r.parametro_anterior_id IS NOT NULL THEN 'REGISTRADO' WHEN r.valor_base_novo IS NOT NULL AND r.numero_patrimonio_snapshot IS NOT NULL THEN 'PRIMEIRO_PARAMETRO' ELSE 'NAO_INFORMADO_LEGADO' END",
};
export const atrasoEmprestimo = (hoje: string) =>
  sql`d.id IS NULL AND r.data_prevista_devolucao::date < ${hoje}::date`;
export function camposEmprestimo(hoje: string) {
  return {
    id: "r.id",
    ...bem,
    grupoId: "r.grupo_emprestimo_id",
    modoAgrupamento: "r.modo_agrupamento::text",
    destinatario: "r.destinatario",
    finalidade: "r.finalidade",
    dataSaida: "r.data_emprestimo::date::text",
    previsao: "r.data_prevista_devolucao::date::text",
    setorVinculo: "s.nome",
    devolucaoId: "d.id::text",
    dataDevolucao: "d.data_devolucao::date::text",
    situacao: "CASE WHEN d.id IS NULL THEN 'PENDENTE' ELSE 'DEVOLVIDO' END",
    emAtraso: `CASE WHEN d.id IS NULL AND r.data_prevista_devolucao::date < DATE '${hoje}' THEN 'SIM' ELSE 'NAO' END`,
    comissaoSaida: "c.nome",
    autorSaida: "u.nome",
    comissaoDevolucao: "cd.nome",
    autorDevolucao: "ud.nome",
    observacao: "r.observacao",
  };
}
export const joinsEmprestimo = `${joinsAutor} LEFT JOIN setores s ON s.id=r.setor_vinculo_id LEFT JOIN devolucoes_patrimoniais d ON d.emprestimo_id=r.id LEFT JOIN comissoes cd ON cd.id=d.comissao_id LEFT JOIN usuarios ud ON ud.id=d.created_by_id`;
export const camposBaixa = {
  id: "r.id",
  ...bem,
  dataBaixa: "r.data_baixa::text",
  tipo: "r.tipo::text",
  motivo: "r.motivo",
  observacao: "r.observacao",
  ...autor,
  registroEm: 'to_char(r.created_at, \'YYYY-MM-DD"T"HH24:MI:SS.US"Z"\')',
};
export const camposInventario = {
  id: "r.id",
  ...bem,
  inventarioId: "r.inventario_id",
  inventario: "i.nome",
  statusInventario: "i.status::text",
  setorEsperado: "se.nome",
  verificacao: "r.status_verificacao::text",
  situacao: "r.situacao::text",
  setorEncontrado: "sf.nome",
  dataVerificacao: "r.data_verificacao::text",
  autorVerificacao: "uv.nome",
  statusNaVerificacao: "r.status_patrimonio_na_verificacao::text",
  ausenciaJustificada:
    "CASE WHEN r.emprestimo_patrimonio_id IS NOT NULL THEN 'EMPRESTIMO' WHEN r.item_manutencao_id IS NOT NULL THEN 'MANUTENCAO' ELSE NULL END",
  emprestimoId: "r.emprestimo_patrimonio_id::text",
  manutencaoItemId: "r.item_manutencao_id::text",
  correcao: "r.status_correcao::text",
  tipoCorrecao: "r.tipo_correcao::text",
  dataCorrecao: "r.data_correcao::text",
  autorCorrecao: "uc.nome",
  transferenciaCorrecaoId: "r.transferencia_correcao_id::text",
  localizacaoId: "l.id::text",
  dataLocalizacao: "l.data_localizacao::text",
  setorLocalizacao: "sl.nome",
  autorLocalizacao: "ul.nome",
  correcaoPosterior: "l.status_correcao::text",
  tipoCorrecaoPosterior: "l.tipo_correcao::text",
  dataCorrecaoPosterior: "l.data_correcao::text",
  autorCorrecaoPosterior: "ulp.nome",
  transferenciaPosteriorId: "l.transferencia_correcao_id::text",
  observacao: "r.observacao",
};
export const joinsInventario =
  "JOIN inventarios i ON i.id=r.inventario_id JOIN setores se ON se.id=r.setor_esperado_id LEFT JOIN setores sf ON sf.id=r.setor_encontrado_id LEFT JOIN usuarios uv ON uv.id=r.verificado_por_id LEFT JOIN usuarios uc ON uc.id=r.corrigido_por_id LEFT JOIN localizacoes_posteriores_inventario l ON l.item_inventario_id=r.id LEFT JOIN setores_inventario si ON si.id=l.setor_inventario_encontrado_id LEFT JOIN setores sl ON sl.id=si.setor_id LEFT JOIN usuarios ul ON ul.id=l.localizado_por_id LEFT JOIN usuarios ulp ON ulp.id=l.corrigido_por_id";
export { joinsAutor };

export function construirFonte(
  tipo: TipoTabular,
  q: Record<string, unknown>,
  agora: Date,
): FonteRelatorio {
  const cond: Prisma.Sql[] = [sql`true`];
  const igual = (campo: string, valor: unknown) => {
    if (valor !== undefined)
      cond.push(
        /(\.id|_id)$/.test(campo)
          ? sql`${raw(campo)} = ${String(valor)}::uuid`
          : sql`${raw(campo)}::text = ${String(valor)}`,
      );
  };
  igual("p.id", q.patrimonioId);
  const periodo = (campo: string, civil = true) => {
    if (!q.inicio || !q.fim) return;
    if (civil)
      cond.push(
        sql`${raw(campo)}::date >= ${String(q.inicio)}::date AND ${raw(campo)}::date <= ${String(q.fim)}::date`,
      );
    else
      cond.push(
        sql`${raw(campo)} >= ${inicioDiaSaoPaulo(String(q.inicio))} AND ${raw(campo)} < ${inicioDiaSaoPaulo(proximoDiaCivil(String(q.fim)))}`,
      );
  };
  let campos: Record<string, string>,
    from: string,
    ordem1: string,
    ordem2 = "NULL::timestamp";
  let criterio =
    "Data civil inclusiva; nomes relacionados são cadastrais atuais.";
  switch (tipo) {
    case "patrimonios":
      campos = {
        ...camposPatrimonio,
        salaAtual: "s.sala",
      };
      from = `patrimonios p ${joinsPatrimonio}`;
      ordem1 =
        q.ordenacao === "TOMBAMENTO"
          ? "p.data_tombamento::text"
          : "p.numero_patrimonio";
      igual("s.id", q.setorId);
      igual("a.id", q.responsavelId);
      igual("e.id", q.especieId);
      igual("n.id", q.naturezaId);
      igual("p.status", q.status);
      igual("p.tipo_numero_patrimonial", q.tipoNumero);
      periodo("p.data_tombamento");
      if (q.busca) {
        const busca = String(q.busca)
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toUpperCase()
          .trim();
        const numero = /^(SP-)?0*(\d+)$/i.exec(busca);
        const canonico = numero
          ? `${numero[1]?.toUpperCase() ?? ""}${BigInt(numero[2]!).toString()}`
          : busca;
        cond.push(
          sql`(position(${busca} in coalesce(p.texto_busca,'')) > 0 OR p.numero_patrimonio=${canonico})`,
        );
      }
      criterio =
        "Cadastro e valores atuais; período sobre tombamento civil, sem reconstrução de posição passada.";
      break;
    case "movimentacoes":
      campos = camposMovimentacao;
      from = `transferencias_patrimoniais r JOIN patrimonios p ON p.id=r.patrimonio_id ${joinsMovimentacao}`;
      ordem1 = "r.data_transferencia::text";
      periodo("r.data_transferencia", false);
      igual("r.comissao_id", q.comissaoId);
      igual("r.setor_antigo_id", q.setorOrigemId);
      igual("r.setor_atual_id", q.setorDestinoId);
      igual(campos.origem!, q.origem);
      criterio =
        "Ocorrência da transferência; dias inclusivos em America/Sao_Paulo; nomes cadastrais atuais.";
      break;
    case "manutencoes":
      campos = camposManutencao;
      from = `itens_manutencao r JOIN patrimonios p ON p.id=r.patrimonio_id ${joinsManutencao}`;
      ordem1 =
        q.base === "ENVIO" ? "m.data_envio::text" : "r.data_retorno::text";
      ordem2 = "m.id";
      periodo(q.base === "ENVIO" ? "m.data_envio" : "r.data_retorno");
      igual("r.manutencao_id", q.pedidoId);
      igual("r.fornecedor_id", q.fornecedorId);
      igual("r.tipo", q.tipo);
      igual(campos.situacao!, q.situacao);
      break;
    case "depreciacoes":
      campos = camposDepreciacao;
      from = `depreciacoes_patrimoniais r JOIN patrimonios p ON p.id=r.patrimonio_id ${joinsAutor}`;
      ordem1 = "r.data_competencia::text";
      ordem2 = "r.data_depreciacao";
      if (q.competenciaInicio)
        cond.push(
          sql`r.data_competencia >= ${String(q.competenciaInicio) + "-01"}::date AND r.data_competencia < (${String(q.competenciaFim) + "-01"}::date + interval '1 month')`,
        );
      igual("r.comissao_id", q.comissaoId);
      criterio =
        "Competências civis de lançamentos efetivamente processados; somam-se somente quotas.";
      break;
    case "reavaliacoes":
      campos = camposReavaliacao;
      from = `reavaliacoes_patrimoniais r JOIN patrimonios p ON p.id=r.patrimonio_id ${joinsAutor}`;
      ordem1 =
        q.base === "REGISTRO"
          ? "r.data_reavaliacao::text"
          : "r.data_referencia::text";
      ordem2 = "r.data_reavaliacao";
      periodo(
        q.base === "REGISTRO" ? "r.data_reavaliacao" : "r.data_referencia",
        q.base !== "REGISTRO",
      );
      igual("r.comissao_id", q.comissaoId);
      criterio =
        q.base === "REGISTRO"
          ? "Instante da reavaliação em America/Sao_Paulo; snapshots preservados e cadastro atual separado."
          : "Referência civil; registros sem referência excluídos e identificados; snapshots não são reconstruídos.";
      break;
    case "inventarios":
      campos = camposInventario;
      from = `itens_inventario r JOIN patrimonios p ON p.id=r.patrimonio_id ${joinsInventario}`;
      ordem1 = "se.nome";
      ordem2 = "p.numero_patrimonio";
      igual("r.inventario_id", q.inventarioId);
      igual("r.setor_esperado_id", q.setorEsperadoId);
      igual("r.setor_encontrado_id", q.setorEncontradoId);
      igual("r.status_verificacao", q.verificacao);
      igual("r.situacao", q.situacao);
      igual("r.status_correcao", q.correcao);
      igual("l.status_correcao", q.correcaoPosterior);
      criterio =
        "Inventário selecionado; situação original preservada; localização posterior em campos próprios.";
      break;
    case "emprestimos":
      campos = camposEmprestimo(diaSaoPaulo(agora));
      from = `emprestimos_patrimoniais r JOIN patrimonios p ON p.id=r.patrimonio_id ${joinsEmprestimo}`;
      ordem1 =
        q.base === "SAIDA"
          ? "r.data_emprestimo::date::text"
          : q.base === "PREVISAO"
            ? "r.data_prevista_devolucao::date::text"
            : "d.data_devolucao::date::text";
      periodo(
        q.base === "SAIDA"
          ? "r.data_emprestimo"
          : q.base === "PREVISAO"
            ? "r.data_prevista_devolucao"
            : "d.data_devolucao",
      );
      igual("r.grupo_emprestimo_id", q.grupoId);
      igual(campos.situacao!, q.situacao);
      if (q.destinatario)
        cond.push(
          sql`position(lower(${String(q.destinatario)}) in lower(coalesce(r.destinatario,''))) > 0`,
        );
      if (q.emAtraso !== undefined)
        cond.push(
          sql`coalesce((${atrasoEmprestimo(diaSaoPaulo(agora))}),false) = ${q.emAtraso === "true"}`,
        );
      criterio =
        "Saída/previsão/devolução civis; atraso no dia da consulta em America/Sao_Paulo.";
      break;
    case "baixas":
      campos = camposBaixa;
      from = `baixas_patrimoniais r JOIN patrimonios p ON p.id=r.patrimonio_id ${joinsAutor}`;
      ordem1 = "r.data_baixa::text";
      ordem2 = "r.created_at";
      periodo("r.data_baixa");
      igual("r.tipo", q.tipo);
      igual("r.comissao_id", q.comissaoId);
      criterio =
        "Data civil da baixa; sem valor contábil histórico da baixa. Estorno não permitido pelas regras atuais.";
      break;
  }
  const asc = tipo === "patrimonios" || tipo === "inventarios";
  return {
    sql: sql`SELECT ${objeto(campos)} AS dados, ${raw(ordem1)} AS ordem1, ${raw(ordem2)} AS ordem2, ${raw(tipo === "patrimonios" ? "p.id" : "r.id")} AS id FROM ${raw(from)} WHERE ${Prisma.join(cond, " AND ")}`,
    ordem: raw(
      `ordem1 ${asc ? "ASC" : "DESC"} NULLS LAST, ordem2 ${asc ? "ASC" : "DESC"} NULLS LAST, id ${asc ? "ASC" : "DESC"}`,
    ),
    criterio,
    ordenacao: `${tipo === "patrimonios" ? String(q.ordenacao) : (q.base ?? "padrão")}; desempate por UUID ${asc ? "crescente" : "decrescente"}`,
  };
}
