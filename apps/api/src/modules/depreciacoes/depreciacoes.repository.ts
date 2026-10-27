import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import type {
  ComissaoBloqueadaDepreciacao,
  DepreciacaoCalculada,
  DepreciacaoPersistida,
  LinhaDepreciacao,
  LinhaPendente,
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
      ), candidatos AS (
        SELECT p."id" AS "patrimonioId", p."numero_patrimonio" AS "numeroPatrimonio",
               p."descricao", p."status", sc."id" AS "situacaoContabilId",
               sc."valor_bruto_atual" AS "valorBrutoAtual",
               sc."depreciacao_acumulada_atual" AS "depreciacaoAcumuladaAtual",
               pd."id" AS "parametroDepreciacaoId",
               a.quantidade AS "quantidadeParametrosVigentes",
               pd."vida_util_inicial_meses" AS "vidaUtilInicialMeses",
               pd."valor_residual" AS "valorResidual", pd."data_inicio" AS "dataInicio",
               (SELECT COUNT(*) FROM "depreciacoes_patrimoniais" d
                 WHERE d."parametro_depreciacao_id" = pd."id")::bigint AS "quantidadeRealizada",
               false AS "jaDepreciadoNaCompetencia"
        FROM "patrimonios" p
        JOIN "situacoes_contabeis_patrimoniais" sc ON sc."patrimonio_id" = p."id"
        JOIN atuais a ON a."patrimonio_id" = p."id" AND a.quantidade = 1
        JOIN "parametros_depreciacao" pd ON pd."id" = a."parametroId"
        WHERE p."status" IN ('ATIVO', 'EMPRESTADO', 'EM_MANUTENCAO')
          AND pd."data_inicio" < ${competencia}::date
          AND sc."valor_bruto_atual" - sc."depreciacao_acumulada_atual" > pd."valor_residual"
          AND NOT EXISTS (
            SELECT 1 FROM "depreciacoes_patrimoniais" d
            WHERE d."patrimonio_id" = p."id"
              AND d."parametro_depreciacao_id" = pd."id"
              AND d."data_competencia" = ${competencia}::date
          )
      )
      SELECT candidatos.*
      FROM candidatos
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
      SELECT
        COUNT(*) FILTER (
          WHERE sc."valor_bruto_atual" - sc."depreciacao_acumulada_atual" > pd."valor_residual"
            AND NOT EXISTS (
              SELECT 1 FROM "depreciacoes_patrimoniais" d
              WHERE d."patrimonio_id" = p."id"
                AND d."parametro_depreciacao_id" = pd."id"
                AND d."data_competencia" = ${competencia}::date
            )
        )::bigint AS "totalPendentes",
        COUNT(*) FILTER (
          WHERE sc."valor_bruto_atual" - sc."depreciacao_acumulada_atual" = pd."valor_residual"
        )::bigint AS "totalNoValorResidual"
      FROM "patrimonios" p
      JOIN "situacoes_contabeis_patrimoniais" sc ON sc."patrimonio_id" = p."id"
      JOIN "parametros_depreciacao" pd
        ON pd."patrimonio_id" = p."id" AND pd."data_fim" IS NULL
      WHERE p."status" IN ('ATIVO', 'EMPRESTADO', 'EM_MANUTENCAO')
        AND pd."data_inicio" < ${competencia}::date
    `;
    return {
      totalPendentes: Number(linhas[0]?.totalPendentes ?? 0n),
      totalNoValorResidual: Number(linhas[0]?.totalNoValorResidual ?? 0n),
    };
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
             p."descricao", p."status", sc."id" AS "situacaoContabilId",
             sc."valor_bruto_atual" AS "valorBrutoAtual",
             sc."depreciacao_acumulada_atual" AS "depreciacaoAcumuladaAtual",
             pd."id" AS "parametroDepreciacaoId",
             COALESCE(a.quantidade, 0)::bigint AS "quantidadeParametrosVigentes",
             pd."vida_util_inicial_meses" AS "vidaUtilInicialMeses",
             pd."valor_residual" AS "valorResidual", pd."data_inicio" AS "dataInicio",
             (SELECT COUNT(*) FROM "depreciacoes_patrimoniais" d
               WHERE d."parametro_depreciacao_id" = pd."id")::bigint AS "quantidadeRealizada",
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
