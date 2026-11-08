import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import type {
  ComissaoBloqueadaDepreciacao,
  DepreciacaoCalculada,
  DepreciacaoPersistida,
  LinhaDepreciacao,
  LinhaPendente,
  CompetenciaDepreciacaoBanco,
  ResumoPendenciasBanco,
} from "./types";

type ClienteDepreciacoes = DatabaseClient | Prisma.TransactionClient;

@Injectable()
export class DepreciacoesRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: ClienteDepreciacoes,
  ) {}

  executarTransacao<T>(
    operacao: (repository: DepreciacoesRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database)) {
      throw new Error("Uma transação não pode ser iniciada dentro de outra.");
    }
    return this.database.$transaction(
      (transaction) => operacao(new DepreciacoesRepository(transaction)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async bloquearComissao(
    comissaoId: string,
  ): Promise<ComissaoBloqueadaDepreciacao | null> {
    const linhas = await this.database.$queryRaw<
      ComissaoBloqueadaDepreciacao[]
    >`
      SELECT "id", "nome", "data_vigencia_inicio" AS "dataVigenciaInicio",
             "data_vigencia_fim" AS "dataVigenciaFim"
      FROM "comissoes"
      WHERE "id" = ${comissaoId}::uuid
      FOR SHARE
    `;
    return linhas[0] ?? null;
  }

  listarPendentes(
    competencia: Date,
    skip: number,
    take: number,
  ): Promise<LinhaPendente[]> {
    return this.database.$queryRaw<LinhaPendente[]>`
      WITH atuais AS (
        SELECT pd."patrimonio_id", COUNT(*)::bigint AS quantidade,
               MIN(pd."id"::text)::uuid AS "parametroId"
        FROM "parametros_depreciacao" pd
        WHERE pd."data_fim" IS NULL
        GROUP BY pd."patrimonio_id"
      ), estados AS (
        SELECT p."id" AS "patrimonioId", p."numero_patrimonio" AS "numeroPatrimonio",
               p."descricao", p."status", p."depreciavel", du."id" AS "disponibilidadeId",
               sc."id" AS "situacaoContabilId",
               sc."valor_bruto_atual" AS "valorBrutoAtual",
               sc."depreciacao_acumulada_atual" AS "depreciacaoAcumuladaAtual",
               pd."id" AS "parametroDepreciacaoId",
               a.quantidade AS "quantidadeParametrosVigentes",
               pd."vida_util_inicial_meses" AS "vidaUtilInicialMeses",
               pd."valor_residual" AS "valorResidual", pd."data_inicio" AS "dataInicio",
               h.quantidade AS "quantidadeRealizada",
               h.ultima AS "ultimaCompetenciaProcessada",
               (date_trunc('month', pd."data_inicio") + interval '1 month')::date AS "primeiraCompetencia",
               ((date_trunc('month', pd."data_inicio") + interval '1 month')::date
                 + h.quantidade * interval '1 month')::date AS "competenciaEsperada",
               EXISTS (SELECT 1 FROM "depreciacoes_patrimoniais" d
                 WHERE d."parametro_depreciacao_id" = pd."id"
                   AND d."data_competencia" = ${competencia}::date) AS "jaDepreciadoNaCompetencia"
        FROM "patrimonios" p
        JOIN "situacoes_contabeis_patrimoniais" sc ON sc."patrimonio_id" = p."id"
        JOIN atuais a ON a."patrimonio_id" = p."id" AND a.quantidade = 1
        JOIN "parametros_depreciacao" pd ON pd."id" = a."parametroId"
        JOIN "disponibilidades_uso_patrimonio" du ON du."patrimonio_id" = p."id"
        CROSS JOIN LATERAL (
          SELECT COUNT(*)::bigint AS quantidade, MAX(d."data_competencia") AS ultima
          FROM "depreciacoes_patrimoniais" d
          WHERE d."parametro_depreciacao_id" = pd."id"
        ) h
        WHERE p."status" IN ('ATIVO', 'EMPRESTADO', 'EM_MANUTENCAO')
          AND p."depreciavel" AND pd."data_inicio" IS NOT NULL
          AND sc."valor_bruto_atual" - sc."depreciacao_acumulada_atual" > pd."valor_residual"
      )
      SELECT estados.* FROM estados
      WHERE "competenciaEsperada" = ${competencia}::date
      ORDER BY "numeroPatrimonio", "patrimonioId"
      OFFSET ${skip} LIMIT ${take}
    `;
  }

  async obterResumoPendentes(
    competencia: Date,
  ): Promise<{ totalPendentes: number; totalNoValorResidual: number }> {
    const linhas = await this.database.$queryRaw<
      { totalPendentes: bigint; totalNoValorResidual: bigint }[]
    >`
      WITH estados AS (
        SELECT p.id, sc.valor_bruto_atual, sc.depreciacao_acumulada_atual,
               pd.valor_residual,
               ((date_trunc('month', pd.data_inicio) + interval '1 month')::date
                 + (SELECT COUNT(*) FROM depreciacoes_patrimoniais d
                    WHERE d.parametro_depreciacao_id = pd.id) * interval '1 month')::date esperada
        FROM patrimonios p
        JOIN situacoes_contabeis_patrimoniais sc ON sc.patrimonio_id = p.id
        JOIN parametros_depreciacao pd ON pd.patrimonio_id = p.id AND pd.data_fim IS NULL
        JOIN disponibilidades_uso_patrimonio du ON du.patrimonio_id = p.id
        WHERE p.depreciavel AND p.status IN ('ATIVO','EMPRESTADO','EM_MANUTENCAO')
          AND pd.data_inicio IS NOT NULL
      ) SELECT
        COUNT(*) FILTER (
          WHERE valor_bruto_atual - depreciacao_acumulada_atual > valor_residual
            AND esperada = ${competencia}::date
        )::bigint AS "totalPendentes",
        COUNT(*) FILTER (
          WHERE valor_bruto_atual - depreciacao_acumulada_atual = valor_residual
        )::bigint AS "totalNoValorResidual"
      FROM estados
    `;
    return {
      totalPendentes: Number(linhas[0]?.totalPendentes ?? 0n),
      totalNoValorResidual: Number(linhas[0]?.totalNoValorResidual ?? 0n),
    };
  }

  listarCompetencias(
    competenciaAtual: Date,
  ): Promise<CompetenciaDepreciacaoBanco[]> {
    return this.database.$queryRaw<CompetenciaDepreciacaoBanco[]>`
      WITH estados AS (
        SELECT ((date_trunc('month', pd.data_inicio) + interval '1 month')::date
                 + (SELECT COUNT(*) FROM depreciacoes_patrimoniais d
                    WHERE d.parametro_depreciacao_id = pd.id) * interval '1 month')::date esperada
        FROM patrimonios p
        JOIN situacoes_contabeis_patrimoniais sc ON sc.patrimonio_id = p.id
        JOIN parametros_depreciacao pd ON pd.patrimonio_id = p.id AND pd.data_fim IS NULL
        JOIN disponibilidades_uso_patrimonio du ON du.patrimonio_id = p.id
        WHERE p.depreciavel AND p.status IN ('ATIVO','EMPRESTADO','EM_MANUTENCAO')
          AND pd.data_inicio IS NOT NULL
          AND sc.valor_bruto_atual - sc.depreciacao_acumulada_atual > pd.valor_residual
      ), meses AS (
        SELECT generate_series(MIN(esperada), ${competenciaAtual}::date, interval '1 month')::date competencia
        FROM estados WHERE esperada <= ${competenciaAtual}::date
        LIMIT 1200
      )
      SELECT m.competencia,
             COUNT(*) FILTER (WHERE e.esperada = m.competencia)::bigint AS "quantidadePendente",
             COUNT(*) FILTER (WHERE e.esperada < m.competencia)::bigint AS "quantidadeBloqueadaPorAnterior"
      FROM meses m CROSS JOIN estados e
      WHERE e.esperada <= m.competencia
      GROUP BY m.competencia ORDER BY m.competencia
    `;
  }

  async resumoPendencias(
    competenciaAtual: Date,
  ): Promise<ResumoPendenciasBanco> {
    const [linha] = await this.database.$queryRaw<ResumoPendenciasBanco[]>`
      WITH estados AS (
        SELECT ((date_trunc('month', pd.data_inicio) + interval '1 month')::date
                 + (SELECT COUNT(*) FROM depreciacoes_patrimoniais d
                    WHERE d.parametro_depreciacao_id = pd.id) * interval '1 month')::date esperada
        FROM patrimonios p
        JOIN situacoes_contabeis_patrimoniais sc ON sc.patrimonio_id = p.id
        JOIN parametros_depreciacao pd ON pd.patrimonio_id = p.id AND pd.data_fim IS NULL
        JOIN disponibilidades_uso_patrimonio du ON du.patrimonio_id = p.id
        WHERE p.depreciavel AND p.status IN ('ATIVO','EMPRESTADO','EM_MANUTENCAO')
          AND pd.data_inicio IS NOT NULL
          AND sc.valor_bruto_atual - sc.depreciacao_acumulada_atual > pd.valor_residual
      ) SELECT
        COALESCE(SUM(((EXTRACT(YEAR FROM age(${competenciaAtual}::date, esperada)) * 12
          + EXTRACT(MONTH FROM age(${competenciaAtual}::date, esperada)))::int + 1)
          FILTER (WHERE esperada <= ${competenciaAtual}::date), 0)::bigint AS "totalPendencias",
        COUNT(*) FILTER (WHERE esperada <= ${competenciaAtual}::date)::bigint AS "totalPatrimonios",
        MIN(esperada) FILTER (WHERE esperada <= ${competenciaAtual}::date) AS "competenciaMaisAntiga"
      FROM estados
    `;
    return (
      linha ?? {
        totalPendencias: 0n,
        totalPatrimonios: 0n,
        competenciaMaisAntiga: null,
      }
    );
  }

  async bloquearAcervo(
    competencia: Date,
    patrimonioId?: string,
  ): Promise<LinhaDepreciacao[]> {
    const filtroId = patrimonioId ?? null;
    await this.database.$queryRaw`
      SELECT p."id" FROM "patrimonios" p
      WHERE (${filtroId}::uuid IS NULL OR p."id" = ${filtroId}::uuid)
      ORDER BY p."id" FOR UPDATE
    `;
    await this.database.$queryRaw`
      SELECT sc."id" FROM "situacoes_contabeis_patrimoniais" sc
      JOIN "patrimonios" p ON p."id" = sc."patrimonio_id"
      WHERE (${filtroId}::uuid IS NULL OR p."id" = ${filtroId}::uuid)
      ORDER BY sc."patrimonio_id" FOR UPDATE OF sc
    `;
    await this.database.$queryRaw`
      SELECT pd."id" FROM "parametros_depreciacao" pd
      JOIN "patrimonios" p ON p."id" = pd."patrimonio_id"
      WHERE pd."data_fim" IS NULL
        AND (${filtroId}::uuid IS NULL OR p."id" = ${filtroId}::uuid)
      ORDER BY pd."patrimonio_id", pd."id" FOR UPDATE OF pd
    `;
    return this.database.$queryRaw<LinhaDepreciacao[]>`
      WITH atuais AS (
        SELECT pd."patrimonio_id", COUNT(*)::bigint AS quantidade,
               MIN(pd."id"::text)::uuid AS "parametroId"
        FROM "parametros_depreciacao" pd
        WHERE pd."data_fim" IS NULL
        GROUP BY pd."patrimonio_id"
      )
      SELECT p."id" AS "patrimonioId", p."numero_patrimonio" AS "numeroPatrimonio",
             p."descricao", p."status", p."depreciavel",
             du."id" AS "disponibilidadeId", sc."id" AS "situacaoContabilId",
             sc."valor_bruto_atual" AS "valorBrutoAtual",
             sc."depreciacao_acumulada_atual" AS "depreciacaoAcumuladaAtual",
             pd."id" AS "parametroDepreciacaoId",
             COALESCE(a.quantidade, 0)::bigint AS "quantidadeParametrosVigentes",
             pd."vida_util_inicial_meses" AS "vidaUtilInicialMeses",
             pd."valor_residual" AS "valorResidual", pd."data_inicio" AS "dataInicio",
             h.quantidade AS "quantidadeRealizada",
             h.ultima AS "ultimaCompetenciaProcessada",
             CASE WHEN pd."data_inicio" IS NULL THEN NULL ELSE
               (date_trunc('month', pd."data_inicio") + interval '1 month')::date END AS "primeiraCompetencia",
             CASE WHEN pd."data_inicio" IS NULL THEN NULL ELSE
               ((date_trunc('month', pd."data_inicio") + interval '1 month')::date
                 + h.quantidade * interval '1 month')::date END AS "competenciaEsperada",
             EXISTS (
               SELECT 1 FROM "depreciacoes_patrimoniais" d
               WHERE d."patrimonio_id" = p."id"
                 AND d."parametro_depreciacao_id" = pd."id"
                 AND d."data_competencia" = ${competencia}::date
             ) AS "jaDepreciadoNaCompetencia"
      FROM "patrimonios" p
      LEFT JOIN "situacoes_contabeis_patrimoniais" sc ON sc."patrimonio_id" = p."id"
      LEFT JOIN atuais a ON a."patrimonio_id" = p."id"
      LEFT JOIN "parametros_depreciacao" pd ON pd."id" = a."parametroId"
      LEFT JOIN "disponibilidades_uso_patrimonio" du ON du."patrimonio_id" = p."id"
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::bigint AS quantidade, MAX(d."data_competencia") AS ultima
        FROM "depreciacoes_patrimoniais" d
        WHERE d."parametro_depreciacao_id" = pd."id"
      ) h ON true
      WHERE (${filtroId}::uuid IS NULL OR p."id" = ${filtroId}::uuid)
      ORDER BY p."id"
    `;
  }

  async persistirEmLote(dados: {
    calculos: DepreciacaoCalculada[];
    competencia: Date;
    instante: Date;
    comissaoId: string;
    usuarioId: string;
  }): Promise<DepreciacaoPersistida[]> {
    if (dados.calculos.length === 0) return [];
    const payload = JSON.stringify(
      dados.calculos.map((item) => ({
        patrimonioId: item.patrimonioId,
        situacaoContabilId: item.situacaoContabilId,
        parametroDepreciacaoId: item.parametroDepreciacaoId,
        valorContabilAnterior: item.valorContabilAnterior.toString(),
        valorDepreciado: item.valorDepreciado.toString(),
        valorContabilNovo: item.valorContabilNovo.toString(),
        depreciacaoAcumuladaNova: item.depreciacaoAcumuladaNova.toString(),
      })),
    );

    const atualizadas = await this.database.$executeRaw`
      WITH dados AS (
        SELECT * FROM jsonb_to_recordset(${payload}::jsonb) AS x(
          "patrimonioId" uuid, "situacaoContabilId" uuid,
          "parametroDepreciacaoId" uuid, "valorContabilAnterior" numeric,
          "valorDepreciado" numeric, "valorContabilNovo" numeric,
          "depreciacaoAcumuladaNova" numeric
        )
      )
      UPDATE "situacoes_contabeis_patrimoniais" sc
      SET "depreciacao_acumulada_atual" = dados."depreciacaoAcumuladaNova",
          "updated_at" = ${dados.instante}
      FROM dados WHERE sc."id" = dados."situacaoContabilId"
    `;
    if (atualizadas !== dados.calculos.length) {
      throw new Error("Nem todas as situações contábeis foram atualizadas.");
    }
    const inseridas = await this.database.$executeRaw`
      WITH dados AS (
        SELECT * FROM jsonb_to_recordset(${payload}::jsonb) AS x(
          "patrimonioId" uuid, "situacaoContabilId" uuid,
          "parametroDepreciacaoId" uuid, "valorContabilAnterior" numeric,
          "valorDepreciado" numeric, "valorContabilNovo" numeric,
          "depreciacaoAcumuladaNova" numeric
        )
      )
      INSERT INTO "depreciacoes_patrimoniais" (
        "id", "data_depreciacao", "data_competencia", "valor_contabil_anterior",
        "valor_depreciado", "valor_contabil_novo", "patrimonio_id",
        "parametro_depreciacao_id", "comissao_id", "created_at", "created_by_id"
      )
      SELECT gen_random_uuid(), ${dados.instante}, ${dados.competencia}::date,
             d."valorContabilAnterior", d."valorDepreciado", d."valorContabilNovo",
             d."patrimonioId", d."parametroDepreciacaoId", ${dados.comissaoId}::uuid,
             ${dados.instante}, ${dados.usuarioId}::uuid
      FROM dados d
    `;
    if (inseridas !== dados.calculos.length) {
      throw new Error("Nem todos os históricos de depreciação foram criados.");
    }
    return this.database.depreciacaoPatrimonio.findMany({
      where: {
        patrimonioId: { in: dados.calculos.map((item) => item.patrimonioId) },
        parametroDepreciacaoId: {
          in: dados.calculos.map((item) => item.parametroDepreciacaoId),
        },
        dataCompetencia: dados.competencia,
        dataDepreciacao: dados.instante,
      },
      select: {
        id: true,
        dataCompetencia: true,
        dataDepreciacao: true,
        valorContabilAnterior: true,
        valorDepreciado: true,
        valorContabilNovo: true,
        createdById: true,
        createdAt: true,
        patrimonio: {
          select: { id: true, numeroPatrimonio: true, descricao: true },
        },
        comissao: { select: { id: true, nome: true } },
      },
      orderBy: { patrimonioId: "asc" },
    });
  }
}
