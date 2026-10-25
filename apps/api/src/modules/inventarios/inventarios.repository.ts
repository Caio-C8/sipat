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
  type InventarioResumoPayload,
  type ItemInventarioPayload,
  type ProgressoInventarioPayload,
  type ProgressoSetorPayload,
  type SetorInventarioResumoPayload,
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
