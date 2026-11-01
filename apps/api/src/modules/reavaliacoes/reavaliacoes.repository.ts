import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import { construirNamespaceLockIdempotencia } from "../../common/utils/idempotencia";
import { reavaliacaoArgs, type EstadoReavaliacao } from "./types";

type Cliente = DatabaseClient | Prisma.TransactionClient;

@Injectable()
export class ReavaliacoesRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly database: Cliente) {}

  executarTransacao<T>(
    operacao: (repository: ReavaliacoesRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database))
      throw new Error("Transação já iniciada.");
    return this.database.$transaction(
      (tx) => operacao(new ReavaliacoesRepository(tx)),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      },
    );
  }

  async tentarBloquearChave(
    usuarioId: string,
    chave: string,
  ): Promise<boolean> {
    const namespace = construirNamespaceLockIdempotencia(
      "reavaliacao",
      usuarioId,
      chave,
    );
    const [linha] = await this.database.$queryRaw<{ obtido: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(hashtextextended(${namespace}, 0)) AS obtido
    `;
    return linha?.obtido === true;
  }

  buscarIdempotencia(usuarioId: string, chave: string) {
    return this.database.idempotenciaReavaliacao.findUnique({
      where: { usuarioId_chave: { usuarioId, chave } },
    });
  }

  salvarIdempotencia(data: Prisma.IdempotenciaReavaliacaoUncheckedCreateInput) {
    return this.database.idempotenciaReavaliacao.create({ data });
  }

  async bloquearComissao(id: string) {
    const [linha] = await this.database.$queryRaw<
      {
        id: string;
        nome: string;
        dataVigenciaInicio: Date;
        dataVigenciaFim: Date;
      }[]
    >`
      SELECT id, nome, data_vigencia_inicio AS "dataVigenciaInicio",
             data_vigencia_fim AS "dataVigenciaFim"
      FROM comissoes WHERE id = ${id}::uuid FOR SHARE
    `;
    return linha ?? null;
  }

  buscarComissao(id: string) {
    return this.database.comissao.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        dataVigenciaInicio: true,
        dataVigenciaFim: true,
      },
    });
  }

  async bloquearEstados(ids: string[]): Promise<void> {
    await this.database.$queryRaw`
      SELECT id FROM patrimonios
      WHERE id = ANY(ARRAY[${Prisma.join(ids)}]::uuid[])
      ORDER BY id FOR UPDATE
    `;
    await this.database.$queryRaw`
      SELECT sc.id FROM situacoes_contabeis_patrimoniais sc
      WHERE sc.patrimonio_id = ANY(ARRAY[${Prisma.join(ids)}]::uuid[])
      ORDER BY sc.patrimonio_id FOR UPDATE
    `;
    await this.database.$queryRaw`
      SELECT pd.id FROM parametros_depreciacao pd
      WHERE pd.patrimonio_id = ANY(ARRAY[${Prisma.join(ids)}]::uuid[])
        AND pd.data_fim IS NULL
      ORDER BY pd.patrimonio_id, pd.id FOR UPDATE
    `;
  }

  consultarEstados(
    ids: string[],
    competencia: Date,
  ): Promise<EstadoReavaliacao[]> {
    return this.database.$queryRaw<EstadoReavaliacao[]>`
      WITH atuais AS (
        SELECT pd.patrimonio_id,
               COUNT(*) FILTER (WHERE pd.data_fim IS NULL)::bigint AS quantidade,
               COUNT(*)::bigint AS "quantidadeTotal",
               (MIN(pd.id::text) FILTER (WHERE pd.data_fim IS NULL))::uuid AS "parametroId"
        FROM parametros_depreciacao pd
        WHERE pd.patrimonio_id = ANY(ARRAY[${Prisma.join(ids)}]::uuid[])
        GROUP BY pd.patrimonio_id
      )
      SELECT p.id AS "patrimonioId", p.numero_patrimonio AS "numeroPatrimonio",
             p.descricao, p.status, sc.id AS "situacaoContabilId",
             sc.valor_bruto_atual AS "valorBrutoAtual",
             sc.depreciacao_acumulada_atual AS "depreciacaoAcumuladaAtual",
             pd.id AS "parametroDepreciacaoId",
             COALESCE(a.quantidade, 0)::bigint AS "quantidadeParametrosVigentes",
             COALESCE(a."quantidadeTotal", 0)::bigint AS "quantidadeParametrosTotal",
             pd.metodo::text AS metodo,
             pd.vida_util_inicial_meses AS "vidaUtilInicialMeses",
             pd.percentual_residual AS "percentualResidual",
             pd.valor_residual AS "valorResidual",
             pd.valor_base_inicial AS "valorBaseInicial",
             pd.data_inicio AS "dataInicio",
             (SELECT COUNT(*) FROM depreciacoes_patrimoniais d
               WHERE d.parametro_depreciacao_id = pd.id)::bigint AS "quantidadeRealizada",
             EXISTS (
               SELECT 1 FROM depreciacoes_patrimoniais d
               WHERE d.patrimonio_id = p.id
                 AND d.parametro_depreciacao_id = pd.id
                 AND d.data_competencia = ${competencia}::date
             ) AS "jaDepreciadoNaCompetencia"
      FROM patrimonios p
      LEFT JOIN situacoes_contabeis_patrimoniais sc ON sc.patrimonio_id = p.id
      LEFT JOIN atuais a ON a.patrimonio_id = p.id
      LEFT JOIN parametros_depreciacao pd ON pd.id = a."parametroId"
      WHERE p.id = ANY(ARRAY[${Prisma.join(ids)}]::uuid[])
      ORDER BY p.id
    `;
  }

  criar(data: Prisma.ReavaliacaoPatrimonioUncheckedCreateInput) {
    return this.database.reavaliacaoPatrimonio.create({ data });
  }

  encerrarParametro(id: string, dataFim: Date) {
    return this.database.parametroDepreciacao.updateMany({
      where: { id, dataFim: null },
      data: { dataFim },
    });
  }

  criarParametro(data: Prisma.ParametroDepreciacaoUncheckedCreateInput) {
    return this.database.parametroDepreciacao.create({ data });
  }

  atualizarSituacao(
    id: string,
    valorBrutoAtual: Prisma.Decimal,
    instante: Date,
  ) {
    return this.database.situacaoContabilPatrimonio.update({
      where: { id },
      data: {
        valorBrutoAtual,
        depreciacaoAcumuladaAtual: new Prisma.Decimal(0),
        updatedAt: instante,
      },
    });
  }

  consultar(id: string) {
    return this.database.reavaliacaoPatrimonio.findUnique({
      where: { id },
      ...reavaliacaoArgs,
    });
  }

  listar(
    where: Prisma.ReavaliacaoPatrimonioWhereInput,
    skip: number,
    take: number,
  ) {
    return this.database.reavaliacaoPatrimonio.findMany({
      where,
      skip,
      take,
      orderBy: [
        { dataReferencia: "desc" },
        { dataReavaliacao: "desc" },
        { id: "desc" },
      ],
      ...reavaliacaoArgs,
    });
  }

  contar(where: Prisma.ReavaliacaoPatrimonioWhereInput) {
    return this.database.reavaliacaoPatrimonio.count({ where });
  }
}
