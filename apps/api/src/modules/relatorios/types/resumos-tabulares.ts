import { Prisma } from "@repo/database";
import type { TipoTabular } from "@repo/contracts";

// Expressões fechadas sobre a projeção autorizada. Agregação executada no banco.
export function resumoTabular(tipo: TipoTabular): Prisma.Sql {
  const count = (f: string) => `count(*) FILTER (WHERE ${f})::int`;
  const n = (k: string) => `(dados->>'${k}')::numeric`;
  const soma = (k: string) => `coalesce(sum(${n(k)}),0)::numeric(38,7)::text`;
  const obj: Record<string, string> = { quantidade: "count(*)::int" };
  switch (tipo) {
    case "patrimonios": {
      obj.semNumeroOficial = count(
        "dados->>'tipoNumeroPatrimonial'='SEM_NUMERO_OFICIAL'",
      );
      obj.semContabilidade = count("dados->>'valorBrutoAtual' IS NULL");
      obj.incorporacao = soma("valorIncorporacao");
      for (const [k, v] of Object.entries({
        brutoAtual: "valorBrutoAtual",
        acumuladoAtual: "depreciacaoAcumuladaAtual",
        liquidoAtual: "valorLiquidoAtual",
      }))
        obj[k] =
          `CASE WHEN count(*) FILTER (WHERE dados->>'${v}' IS NULL)>0 THEN NULL ELSE ${soma(v)} END`;
      break;
    }
    case "movimentacoes":
    case "reavaliacoes":
    case "depreciacoes":
      obj.bensDistintos = "count(DISTINCT dados->>'patrimonioId')::int";
      if (tipo === "reavaliacoes")
        obj.semReferencia = count("dados->>'dataReferencia' IS NULL");
      if (tipo === "depreciacoes") {
        obj.quotas = soma("valorDepreciado");
        obj.porCompetencia =
          "coalesce((SELECT jsonb_agg(x ORDER BY x->>'competencia') FROM (SELECT jsonb_build_object('competencia',dados->>'competencia','quantidade',count(*)::int,'quotas',coalesce(sum((dados->>'valorDepreciado')::numeric),0)::numeric(38,7)::text) x FROM fonte GROUP BY dados->>'competencia') g),'[]'::jsonb)";
      }
      break;
    case "manutencoes":
      obj.pedidosDistintos = "count(DISTINCT dados->>'pedidoId')::int";
      obj.pendentes = count("dados->>'situacao'='PENDENTE'");
      obj.retornados = count("dados->>'situacao'='RETORNADO'");
      obj.semOrcamento = count("dados->>'valorOrcamento' IS NULL");
      obj.semRealizado = count("dados->>'valorRealizado' IS NULL");
      obj.orcamentoConhecido = soma("valorOrcamento");
      obj.realizadoConhecido = soma("valorRealizado");
      break;
    case "inventarios":
      for (const [k, v] of Object.entries({
        pendentes: "verificacao:PENDENTE",
        verificados: "verificacao:VERIFICADO",
        corretos: "situacao:CORRETO",
        divergentes: "situacao:DIVERGENCIA",
        naoLocalizados: "situacao:NAO_LOCALIZADO",
        correcoesOriginaisPendentes: "correcao:PENDENTE",
        correcoesOriginaisConcluidas: "correcao:CORRIGIDO",
        correcoesPosterioresPendentes: "correcaoPosterior:PENDENTE",
        correcoesPosterioresConcluidas: "correcaoPosterior:CORRIGIDO",
      })) {
        const [campo, valor] = v.split(":");
        obj[k] = count(`dados->>'${campo}'='${valor}'`);
      }
      break;
    case "emprestimos":
      obj.gruposDistintos = "count(DISTINCT dados->>'grupoId')::int";
      obj.pendentes = count("dados->>'situacao'='PENDENTE'");
      obj.devolvidos = count("dados->>'situacao'='DEVOLVIDO'");
      obj.atrasados = count("dados->>'emAtraso'='SIM'");
      obj.semPrevisao = count("dados->>'previsao' IS NULL");
      break;
    case "baixas":
      obj.porTipo =
        "coalesce((SELECT jsonb_agg(x ORDER BY x->>'tipo') FROM (SELECT jsonb_build_object('tipo',dados->>'tipo','quantidade',count(*)::int) x FROM fonte GROUP BY dados->>'tipo') g),'[]'::jsonb)";
      break;
  }
  return Prisma.sql`jsonb_build_object(${Prisma.join(Object.entries(obj).flatMap(([k, v]) => [Prisma.sql`${k}::text`, Prisma.raw(v)]))})`;
}
