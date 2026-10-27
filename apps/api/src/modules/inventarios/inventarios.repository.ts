import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@repo/database";
import { Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  inventarioDetalheArgs,
  inventarioResumoArgs,
  itemInventarioArgs,
  setorInventarioResumoArgs,
  type InventarioDetalhePayload,
  type InventarioOperacional,
  type InventarioResumoPayload,
  type ItemInventarioOperacional,
  type ItemInventarioPayload,
  type ProgressoInventarioPayload,
  type ProgressoSetorPayload,
  type SetorInventarioOperacional,
  type SetorInventarioResumoPayload,
  type TransferenciaPosterior,
} from "./types";

type ClienteInventarios = DatabaseClient | Prisma.TransactionClient;
type Pagina<TWhere> = { where: TWhere; skip: number; take: number };
type ComissaoBloqueada = {
  id: string;
  dataVigenciaInicio: Date;
  dataVigenciaFim: Date;
};
type SetorSnapshot = { id: string };
type PatrimonioSnapshot = { id: string; setorAtualId: string };
type SetorCriado = { id: string; setorId: string };
type LinhaProgressoInventario = { inventarioId: string } & Record<
  keyof ProgressoInventarioPayload,
  bigint
>;
type LinhaProgressoSetor = { setorInventarioId: string } & Record<
  keyof ProgressoSetorPayload,
  bigint
>;

@Injectable()
export class InventariosRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: ClienteInventarios,
  ) {}

  executarTransacao<T>(
    operacao: (repository: InventariosRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database)) {
      throw new Error("Uma transação não pode ser iniciada dentro de outra.");
    }
    return this.database.$transaction(
      (transaction) => operacao(new InventariosRepository(transaction)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async bloquearComissao(
    comissaoId: string,
  ): Promise<ComissaoBloqueada | null> {
    const registros = await this.database.$queryRaw<ComissaoBloqueada[]>`
      SELECT "id", "data_vigencia_inicio" AS "dataVigenciaInicio",
             "data_vigencia_fim" AS "dataVigenciaFim"
      FROM "comissoes"
      WHERE "id" = ${comissaoId}::uuid
      FOR SHARE
    `;
    return registros[0] ?? null;
  }

  bloquearSetoresAtivos(): Promise<SetorSnapshot[]> {
    return this.database.$queryRaw<SetorSnapshot[]>`
      SELECT "id" FROM "setores" WHERE "ativo" = true ORDER BY "id" FOR SHARE
    `;
  }

  bloquearPatrimoniosAtivos(): Promise<PatrimonioSnapshot[]> {
    return this.database.$queryRaw<PatrimonioSnapshot[]>`
      SELECT "id", "setor_atual_id" AS "setorAtualId"
      FROM "patrimonios"
      WHERE "status" = 'ATIVO'
      ORDER BY "id"
      FOR SHARE
    `;
  }

  criarInventario(
    data: Prisma.InventarioUncheckedCreateInput,
  ): Promise<InventarioDetalhePayload> {
    return this.database.inventario.create({ data, ...inventarioDetalheArgs });
  }

  criarSetores(
    inventarioId: string,
    setores: readonly SetorSnapshot[],
  ): Promise<SetorCriado[]> {
    return this.database.setorInventario.createManyAndReturn({
      data: setores.map(({ id }) => ({ inventarioId, setorId: id })),
      select: { id: true, setorId: true },
    });
  }

  async criarItens(
    inventarioId: string,
    patrimonios: readonly PatrimonioSnapshot[],
    setores: ReadonlyMap<string, string>,
  ): Promise<void> {
    if (patrimonios.length === 0) return;
    await this.database.itemInventario.createMany({
      data: patrimonios.map((patrimonio) => ({
        inventarioId,
        patrimonioId: patrimonio.id,
        setorEsperadoId: patrimonio.setorAtualId,
        setorInventarioId: setores.get(patrimonio.setorAtualId)!,
      })),
    });
  }

  listarInventarios({
    where,
    skip,
    take,
  }: Pagina<Prisma.InventarioWhereInput>): Promise<InventarioResumoPayload[]> {
    return this.database.inventario.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...inventarioResumoArgs,
    });
  }

  contarInventarios(where: Prisma.InventarioWhereInput): Promise<number> {
    return this.database.inventario.count({ where });
  }

  buscarInventario(
    inventarioId: string,
  ): Promise<InventarioDetalhePayload | null> {
    return this.database.inventario.findUnique({
      where: { id: inventarioId },
      ...inventarioDetalheArgs,
    });
  }

  async bloquearInventario(
    inventarioId: string,
  ): Promise<InventarioOperacional | null> {
    const registros = await this.database.$queryRaw<InventarioOperacional[]>`
      SELECT "id", "status", "comissao_id" AS "comissaoId"
      FROM "inventarios"
      WHERE "id" = ${inventarioId}::uuid
      FOR UPDATE
    `;
    return registros[0] ?? null;
  }

  async bloquearSetorInventario(
    inventarioId: string,
    setorInventarioId: string,
  ): Promise<SetorInventarioOperacional | null> {
    const registros = await this.database.$queryRaw<
      SetorInventarioOperacional[]
    >`
      SELECT "id", "inventario_id" AS "inventarioId",
             "setor_id" AS "setorId", "status"
      FROM "setores_inventario"
      WHERE "id" = ${setorInventarioId}::uuid
        AND "inventario_id" = ${inventarioId}::uuid
      FOR UPDATE
    `;
    return registros[0] ?? null;
  }

  async bloquearItemPorNumero(
    inventarioId: string,
    numeroPatrimonial: string,
  ): Promise<ItemInventarioOperacional | null> {
    const registros = await this.database.$queryRaw<
      ItemInventarioOperacional[]
    >`
      SELECT i."id", i."inventario_id" AS "inventarioId",
             i."patrimonio_id" AS "patrimonioId",
             i."setor_esperado_id" AS "setorEsperadoId",
             i."setor_encontrado_id" AS "setorEncontradoId",
             i."status_verificacao" AS "statusVerificacao",
             i."situacao", i."status_correcao" AS "statusCorrecao",
             i."data_verificacao" AS "dataVerificacao",
             p."status" AS "patrimonioStatus",
             p."setor_atual_id" AS "patrimonioSetorAtualId"
      FROM "itens_inventario" i
      JOIN "patrimonios" p ON p."id" = i."patrimonio_id"
      WHERE i."inventario_id" = ${inventarioId}::uuid
        AND p."numero_patrimonio" = ${numeroPatrimonial}
      FOR UPDATE OF i, p
    `;
    return registros[0] ?? null;
  }

  async bloquearItem(
    inventarioId: string,
    itemInventarioId: string,
  ): Promise<ItemInventarioOperacional | null> {
    const registros = await this.database.$queryRaw<
      ItemInventarioOperacional[]
    >`
      SELECT i."id", i."inventario_id" AS "inventarioId",
             i."patrimonio_id" AS "patrimonioId",
             i."setor_esperado_id" AS "setorEsperadoId",
             i."setor_encontrado_id" AS "setorEncontradoId",
             i."status_verificacao" AS "statusVerificacao",
             i."situacao", i."status_correcao" AS "statusCorrecao",
             i."data_verificacao" AS "dataVerificacao",
             p."status" AS "patrimonioStatus",
             p."setor_atual_id" AS "patrimonioSetorAtualId"
      FROM "itens_inventario" i
      JOIN "patrimonios" p ON p."id" = i."patrimonio_id"
      WHERE i."id" = ${itemInventarioId}::uuid
        AND i."inventario_id" = ${inventarioId}::uuid
      FOR UPDATE OF i, p
    `;
    return registros[0] ?? null;
  }

  buscarItem(itemInventarioId: string): Promise<ItemInventarioPayload | null> {
    return this.database.itemInventario.findUnique({
      where: { id: itemInventarioId },
      ...itemInventarioArgs,
    });
  }

  buscarSetorInventario(
    setorInventarioId: string,
  ): Promise<SetorInventarioResumoPayload | null> {
    return this.database.setorInventario.findUnique({
      where: { id: setorInventarioId },
      ...setorInventarioResumoArgs,
    });
  }

  iniciarInventario(
    inventarioId: string,
    dataInicio: Date,
    usuarioId: string,
  ): Promise<unknown> {
    return this.database.inventario.update({
      where: { id: inventarioId },
      data: {
        status: "EM_ANDAMENTO",
        dataInicio,
        iniciadoPorId: usuarioId,
        updatedAt: new Date(),
      },
    });
  }

  iniciarSetor(
    setorInventarioId: string,
    instante: Date,
    usuarioId: string,
  ): Promise<unknown> {
    return this.database.setorInventario.update({
      where: { id: setorInventarioId },
      data: {
        status: "EM_ANDAMENTO",
        dataInicio: instante,
        iniciadoPorId: usuarioId,
        updatedAt: instante,
      },
    });
  }

  verificarItem(
    itemInventarioId: string,
    dados: {
      situacao: "CORRETO" | "DIVERGENCIA";
      setorEncontradoId: string | null;
      statusPatrimonio: "ATIVO" | "EMPRESTADO" | "EM_MANUTENCAO";
      instante: Date;
      usuarioId: string;
    },
  ): Promise<unknown> {
    return this.database.itemInventario.update({
      where: { id: itemInventarioId },
      data: {
        statusVerificacao: "VERIFICADO",
        situacao: dados.situacao,
        setorEncontradoId: dados.setorEncontradoId,
        statusCorrecao: dados.situacao === "DIVERGENCIA" ? "PENDENTE" : null,
        statusPatrimonioNaVerificacao: dados.statusPatrimonio,
        dataVerificacao: dados.instante,
        verificadoPorId: dados.usuarioId,
        updatedAt: dados.instante,
      },
    });
  }

  async buscarTransferenciaPosterior(
    patrimonioId: string,
    setorDestinoId: string,
    dataVerificacao: Date,
  ): Promise<TransferenciaPosterior | null> {
    return this.database.transferenciaPatrimonio.findFirst({
      where: {
        patrimonioId,
        setorAtualId: setorDestinoId,
        dataTransferencia: { gt: dataVerificacao },
      },
      orderBy: [{ dataTransferencia: "asc" }, { id: "asc" }],
      select: { id: true },
    });
  }

  buscarSetorPorId(
    setorId: string,
  ): Promise<{ id: string; nome: string } | null> {
    return this.database.setor.findUnique({
      where: { id: setorId },
      select: { id: true, nome: true },
    });
  }

  corrigirRetorno(
    itemInventarioId: string,
    instante: Date,
    usuarioId: string,
    observacao?: string,
  ): Promise<unknown> {
    return this.database.itemInventario.update({
      where: { id: itemInventarioId },
      data: {
        statusCorrecao: "CORRIGIDO",
        tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO",
        dataCorrecao: instante,
        corrigidoPorId: usuarioId,
        observacao,
        updatedAt: instante,
      },
    });
  }

  async corrigirComTransferencia(dados: {
    itemInventarioId: string;
    patrimonioId: string;
    setorAntigoId: string;
    setorAtualId: string;
    comissaoId: string;
    usuarioId: string;
    instante: Date;
    observacao?: string;
  }): Promise<void> {
    const transferencia = await this.database.transferenciaPatrimonio.create({
      data: {
        dataTransferencia: dados.instante,
        observacao: dados.observacao,
        setorAntigoId: dados.setorAntigoId,
        setorAtualId: dados.setorAtualId,
        patrimonioId: dados.patrimonioId,
        comissaoId: dados.comissaoId,
        createdById: dados.usuarioId,
      },
      select: { id: true },
    });
    await this.database.patrimonio.update({
      where: { id: dados.patrimonioId },
      data: { setorAtualId: dados.setorAtualId, updatedAt: dados.instante },
    });
    await this.database.itemInventario.update({
      where: { id: dados.itemInventarioId },
      data: {
        statusCorrecao: "CORRIGIDO",
        tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
        dataCorrecao: dados.instante,
        corrigidoPorId: dados.usuarioId,
        transferenciaCorrecaoId: transferencia.id,
        observacao: dados.observacao,
        updatedAt: dados.instante,
      },
    });
  }

  async concluirItensPendentes(
    setorInventarioId: string,
    instante: Date,
    usuarioId: string,
  ): Promise<number> {
    return this.database.$executeRaw`
      UPDATE "itens_inventario" i
      SET "status_verificacao" = 'VERIFICADO',
          "situacao" = 'NAO_LOCALIZADO',
          "data_verificacao" = ${instante},
          "verificado_por_id" = ${usuarioId}::uuid,
          "status_patrimonio_na_verificacao" = p."status",
          "emprestimo_patrimonio_id" = CASE WHEN p."status" = 'EMPRESTADO' THEN (
            SELECT e."id" FROM "emprestimos_patrimoniais" e
            LEFT JOIN "devolucoes_patrimoniais" d ON d."emprestimo_id" = e."id"
            WHERE e."patrimonio_id" = p."id" AND d."id" IS NULL
              AND e."data_emprestimo" <= ${instante}
            ORDER BY e."data_emprestimo" DESC, e."id" DESC LIMIT 1
          ) END,
          "item_manutencao_id" = CASE WHEN p."status" = 'EM_MANUTENCAO' THEN (
            SELECT im."id" FROM "itens_manutencao" im
            JOIN "manutencoes" m ON m."id" = im."manutencao_id"
            WHERE im."patrimonio_id" = p."id" AND im."data_retorno" IS NULL
              AND m."status" = 'EM_ANDAMENTO'
            ORDER BY m."created_at" DESC, im."id" DESC LIMIT 1
          ) END,
          "updated_at" = ${instante}
      FROM "patrimonios" p
      WHERE i."patrimonio_id" = p."id"
        AND i."setor_inventario_id" = ${setorInventarioId}::uuid
        AND i."status_verificacao" = 'PENDENTE'
    `;
  }

  async contarAusenciasSemJustificativaVigente(
    setorInventarioId: string,
    instante: Date,
  ): Promise<number> {
    const linhas = await this.database.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*) AS "total"
      FROM "itens_inventario" i
      JOIN "patrimonios" p ON p."id" = i."patrimonio_id"
      WHERE i."setor_inventario_id" = ${setorInventarioId}::uuid
        AND i."status_verificacao" = 'PENDENTE'
        AND (
          p."status" NOT IN ('ATIVO', 'EMPRESTADO', 'EM_MANUTENCAO')
          OR (p."status" = 'EMPRESTADO' AND NOT EXISTS (
            SELECT 1 FROM "emprestimos_patrimoniais" e
            LEFT JOIN "devolucoes_patrimoniais" d ON d."emprestimo_id" = e."id"
            WHERE e."patrimonio_id" = p."id" AND d."id" IS NULL
              AND e."data_emprestimo" <= ${instante}
          ))
          OR (p."status" = 'EM_MANUTENCAO' AND NOT EXISTS (
            SELECT 1 FROM "itens_manutencao" im
            JOIN "manutencoes" m ON m."id" = im."manutencao_id"
            WHERE im."patrimonio_id" = p."id" AND im."data_retorno" IS NULL
              AND m."status" = 'EM_ANDAMENTO'
          ))
        )
    `;
    return Number(linhas[0]?.total ?? 0n);
  }

  concluirSetor(
    setorInventarioId: string,
    instante: Date,
    usuarioId: string,
  ): Promise<unknown> {
    return this.database.setorInventario.update({
      where: { id: setorInventarioId },
      data: {
        status: "CONCLUIDO",
        dataFim: instante,
        concluidoPorId: usuarioId,
        updatedAt: instante,
      },
    });
  }

  contarSetoresNaoConcluidos(inventarioId: string): Promise<number> {
    return this.database.setorInventario.count({
      where: { inventarioId, status: { not: "CONCLUIDO" } },
    });
  }

  contarCorrecoesPendentes(inventarioId: string): Promise<number> {
    return this.database.itemInventario.count({
      where: { inventarioId, statusCorrecao: "PENDENTE" },
    });
  }

  finalizarInventario(
    inventarioId: string,
    dataFim: Date,
    usuarioId: string,
  ): Promise<InventarioDetalhePayload> {
    return this.database.inventario.update({
      where: { id: inventarioId },
      data: {
        status: "FINALIZADO",
        dataFim,
        finalizadoPorId: usuarioId,
        updatedAt: new Date(),
      },
      ...inventarioDetalheArgs,
    });
  }

  existeSetorEmInventarioAberto(setorId: string): Promise<number> {
    return this.database.setorInventario.count({
      where: { setorId, inventario: { status: { not: "FINALIZADO" } } },
    });
  }

  existePatrimonioEmInventarioAberto(patrimonioId: string): Promise<number> {
    return this.database.itemInventario.count({
      where: {
        patrimonioId,
        inventario: { status: { not: "FINALIZADO" } },
      },
    });
  }

  listarSetores(
    inventarioId: string,
    { where, skip, take }: Pagina<Prisma.SetorInventarioWhereInput>,
  ): Promise<SetorInventarioResumoPayload[]> {
    return this.database.setorInventario.findMany({
      where: { ...where, inventarioId },
      skip,
      take,
      orderBy: [{ setor: { nome: "asc" } }, { id: "asc" }],
      ...setorInventarioResumoArgs,
    });
  }

  contarSetores(
    inventarioId: string,
    where: Prisma.SetorInventarioWhereInput,
  ): Promise<number> {
    return this.database.setorInventario.count({
      where: { ...where, inventarioId },
    });
  }

  listarItens(
    inventarioId: string,
    { where, skip, take }: Pagina<Prisma.ItemInventarioWhereInput>,
  ): Promise<ItemInventarioPayload[]> {
    return this.database.itemInventario.findMany({
      where: { ...where, inventarioId },
      skip,
      take,
      orderBy: [{ patrimonio: { numeroPatrimonio: "asc" } }, { id: "asc" }],
      ...itemInventarioArgs,
    });
  }

  contarItens(
    inventarioId: string,
    where: Prisma.ItemInventarioWhereInput,
  ): Promise<number> {
    return this.database.itemInventario.count({
      where: { ...where, inventarioId },
    });
  }

  async obterProgressosInventarios(
    inventarioIds: readonly string[],
  ): Promise<Map<string, ProgressoInventarioPayload>> {
    if (inventarioIds.length === 0) return new Map();
    const linhas = await this.database.$queryRaw<LinhaProgressoInventario[]>(
      Prisma.sql`
        SELECT i."id" AS "inventarioId",
          setores."totalSetores", setores."setoresPendentes",
          setores."setoresEmAndamento", setores."setoresConcluidos",
          itens."totalItens", itens."itensPendentes", itens."itensVerificados",
          itens."corretos", itens."divergencias", itens."naoLocalizados",
          itens."correcoesPendentes", itens."correcoesCorrigidas"
        FROM "inventarios" i
        CROSS JOIN LATERAL (
          SELECT COUNT(*) AS "totalSetores",
            COUNT(*) FILTER (WHERE "status" = 'PENDENTE') AS "setoresPendentes",
            COUNT(*) FILTER (WHERE "status" = 'EM_ANDAMENTO') AS "setoresEmAndamento",
            COUNT(*) FILTER (WHERE "status" = 'CONCLUIDO') AS "setoresConcluidos"
          FROM "setores_inventario" WHERE "inventario_id" = i."id"
        ) setores
        CROSS JOIN LATERAL (
          SELECT COUNT(*) AS "totalItens",
            COUNT(*) FILTER (WHERE "status_verificacao" = 'PENDENTE') AS "itensPendentes",
            COUNT(*) FILTER (WHERE "status_verificacao" = 'VERIFICADO') AS "itensVerificados",
            COUNT(*) FILTER (WHERE "situacao" = 'CORRETO') AS "corretos",
            COUNT(*) FILTER (WHERE "situacao" = 'DIVERGENCIA') AS "divergencias",
            COUNT(*) FILTER (WHERE "situacao" = 'NAO_LOCALIZADO') AS "naoLocalizados",
            COUNT(*) FILTER (WHERE "status_correcao" = 'PENDENTE') AS "correcoesPendentes",
            COUNT(*) FILTER (WHERE "status_correcao" = 'CORRIGIDO') AS "correcoesCorrigidas"
          FROM "itens_inventario" WHERE "inventario_id" = i."id"
        ) itens
        WHERE i."id" = ANY(ARRAY[${Prisma.join(inventarioIds)}]::uuid[])
      `,
    );
    return new Map(
      linhas.map(({ inventarioId, ...progresso }) => [
        inventarioId,
        this.converterContagens(progresso),
      ]),
    );
  }

  async obterProgressosSetores(
    setorInventarioIds: readonly string[],
  ): Promise<Map<string, ProgressoSetorPayload>> {
    if (setorInventarioIds.length === 0) return new Map();
    const linhas = await this.database.$queryRaw<LinhaProgressoSetor[]>(
      Prisma.sql`
        SELECT s."id" AS "setorInventarioId", COUNT(i.*) AS "totalItens",
          COUNT(i.*) FILTER (WHERE i."status_verificacao" = 'PENDENTE') AS "itensPendentes",
          COUNT(i.*) FILTER (WHERE i."status_verificacao" = 'VERIFICADO') AS "itensVerificados",
          COUNT(i.*) FILTER (WHERE i."situacao" = 'CORRETO') AS "corretos",
          COUNT(i.*) FILTER (WHERE i."situacao" = 'DIVERGENCIA') AS "divergencias",
          COUNT(i.*) FILTER (WHERE i."situacao" = 'NAO_LOCALIZADO') AS "naoLocalizados"
        FROM "setores_inventario" s
        LEFT JOIN "itens_inventario" i ON i."setor_inventario_id" = s."id"
        WHERE s."id" = ANY(ARRAY[${Prisma.join(setorInventarioIds)}]::uuid[])
        GROUP BY s."id"
      `,
    );
    return new Map(
      linhas.map(({ setorInventarioId, ...progresso }) => [
        setorInventarioId,
        this.converterContagens(progresso),
      ]),
    );
  }

  private converterContagens<T extends Record<string, bigint>>(
    contagens: T,
  ): { [K in keyof T]: number } {
    return Object.fromEntries(
      Object.entries(contagens).map(([chave, valor]) => [chave, Number(valor)]),
    ) as { [K in keyof T]: number };
  }
}
