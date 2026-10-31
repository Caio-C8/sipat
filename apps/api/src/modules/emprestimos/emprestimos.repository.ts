import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import type { ListarEmprestimosQueryData } from "@repo/contracts";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  emprestimoInclude,
  type EmprestimoResumoRow,
} from "./types/emprestimo.types";

type Cliente = DatabaseClient | Prisma.TransactionClient;

@Injectable()
export class EmprestimosRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly database: Cliente) {}

  executarTransacao<T>(
    operacao: (
      repository: EmprestimosRepository,
      tx: Prisma.TransactionClient,
    ) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database))
      throw new Error("Transação já iniciada.");
    return this.database.$transaction(
      (tx) => operacao(new EmprestimosRepository(tx), tx),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 20_000,
      },
    );
  }

  async tentarBloquearChave(
    usuarioId: string,
    chave: string,
  ): Promise<boolean> {
    const [linha] = await this.database.$queryRaw<{ obtido: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(hashtextextended(${`emprestimo:${usuarioId}:${chave}`}, 0)) AS obtido
    `;
    return linha?.obtido === true;
  }
  buscarIdempotencia(usuarioId: string, chave: string) {
    return this.database.idempotenciaEmprestimo.findUnique({
      where: { usuarioId_chave: { usuarioId, chave } },
    });
  }
  salvarIdempotencia(data: Prisma.IdempotenciaEmprestimoUncheckedCreateInput) {
    return this.database.idempotenciaEmprestimo.create({ data });
  }

  async buscarGrupo(id: string) {
    const individual = await this.database.emprestimoPatrimonio.findUnique({
      where: { id },
      select: { grupoEmprestimoId: true },
    });
    return this.database.emprestimoPatrimonio.findMany({
      where: { grupoEmprestimoId: individual?.grupoEmprestimoId ?? id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: emprestimoInclude,
    });
  }
  criar(data: Prisma.EmprestimoPatrimonioUncheckedCreateInput) {
    return this.database.emprestimoPatrimonio.create({
      data,
      include: emprestimoInclude,
    });
  }
  criarDevolucao(data: Prisma.DevolucaoPatrimonioUncheckedCreateInput) {
    return this.database.devolucaoPatrimonio.create({
      data,
      select: { id: true },
    });
  }
  buscarSetoresPatrimonios(ids: string[]) {
    return this.database.patrimonio.findMany({
      where: { id: { in: ids } },
      select: { id: true, setorAtualId: true },
    });
  }

  async listar(query: ListarEmprestimosQueryData, hoje: string) {
    const cte = Prisma.sql`
      WITH grupos AS (
        SELECT e.grupo_emprestimo_id AS id,
               (ARRAY_AGG(e.modo_agrupamento ORDER BY e.created_at DESC, e.id DESC))[1] AS "modoAgrupamento",
               (ARRAY_AGG(e.destinatario ORDER BY e.created_at DESC, e.id DESC))[1] AS destinatario,
               (ARRAY_AGG(e.data_emprestimo ORDER BY e.created_at DESC, e.id DESC))[1] AS "dataEmprestimo",
               (ARRAY_AGG(e.data_prevista_devolucao ORDER BY e.created_at DESC, e.id DESC))[1] AS "dataPrevistaDevolucao",
               COUNT(*) AS total, COUNT(*) FILTER (WHERE d.id IS NULL) AS pendentes,
               BOOL_OR(d.id IS NULL AND e.data_prevista_devolucao::date < ${hoje}::date) AS "emAtraso",
               MAX(e.created_at) AS "createdAt"
        FROM emprestimos_patrimoniais e
        LEFT JOIN devolucoes_patrimoniais d ON d.emprestimo_id = e.id
        GROUP BY e.grupo_emprestimo_id
      )
    `;
    const condicoes: Prisma.Sql[] = [];
    if (query.busca) {
      const busca = `%${query.busca}%`;
      condicoes.push(Prisma.sql`(
        g.id::text ILIKE ${busca} OR g.destinatario ILIKE ${busca} OR EXISTS (
          SELECT 1 FROM emprestimos_patrimoniais e2
          JOIN patrimonios p ON p.id = e2.patrimonio_id
          WHERE e2.grupo_emprestimo_id = g.id AND (p.numero_patrimonio ILIKE ${busca} OR p.descricao ILIKE ${busca})
        )
      )`);
    }
    if (query.situacao === "EM_ANDAMENTO")
      condicoes.push(Prisma.sql`g.pendentes > 0`);
    if (query.situacao === "CONCLUIDO")
      condicoes.push(Prisma.sql`g.pendentes = 0`);
    if (query.somenteAtrasados) condicoes.push(Prisma.sql`g."emAtraso" = TRUE`);
    if (query.dataInicio)
      condicoes.push(
        Prisma.sql`g."dataEmprestimo"::date >= ${query.dataInicio}::date`,
      );
    if (query.dataFim)
      condicoes.push(
        Prisma.sql`g."dataEmprestimo"::date <= ${query.dataFim}::date`,
      );
    const where = condicoes.length
      ? Prisma.sql`WHERE ${Prisma.join(condicoes, " AND ")}`
      : Prisma.empty;
    const [items, contagem] = await Promise.all([
      this.database.$queryRaw<EmprestimoResumoRow[]>(
        Prisma.sql`${cte} SELECT * FROM grupos g ${where} ORDER BY g."createdAt" DESC, g.id DESC OFFSET ${(query.pagina - 1) * query.limite} LIMIT ${query.limite}`,
      ),
      this.database.$queryRaw<{ total: bigint }[]>(
        Prisma.sql`${cte} SELECT COUNT(*) AS total FROM grupos g ${where}`,
      ),
    ]);
    return { items, total: Number(contagem[0]?.total ?? 0n) };
  }

  async listarPatrimonios(
    busca: string | undefined,
    skip: number,
    take: number,
  ) {
    const where: Prisma.PatrimonioWhereInput = {
      status: "ATIVO",
      setorAtual: { setoresInventario: { none: { status: "EM_ANDAMENTO" } } },
      ...(busca
        ? {
            OR: [
              { numeroPatrimonio: { contains: busca, mode: "insensitive" } },
              { descricao: { contains: busca, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.database.patrimonio.findMany({
        where,
        skip,
        take,
        orderBy: [{ numeroPatrimonio: "asc" }, { id: "asc" }],
        select: {
          id: true,
          numeroPatrimonio: true,
          descricao: true,
          status: true,
          setorAtual: { select: { id: true, nome: true } },
        },
      }),
      this.database.patrimonio.count({ where }),
    ]);
    return { items, total };
  }

  async existeEventoNaOuAposData(
    patrimonioId: string,
    data: string,
  ): Promise<boolean> {
    const [linha] = await this.database.$queryRaw<{ existe: boolean }[]>`
      SELECT (
        EXISTS (SELECT 1 FROM transferencias_patrimoniais WHERE patrimonio_id = ${patrimonioId}::uuid AND data_transferencia::date >= ${data}::date)
        OR EXISTS (SELECT 1 FROM baixas_patrimoniais WHERE patrimonio_id = ${patrimonioId}::uuid AND data_baixa >= ${data}::date)
        OR EXISTS (SELECT 1 FROM itens_manutencao im JOIN manutencoes m ON m.id = im.manutencao_id WHERE im.patrimonio_id = ${patrimonioId}::uuid AND (m.data_envio >= ${data}::date OR im.data_retorno >= ${data}::date))
        OR EXISTS (SELECT 1 FROM emprestimos_patrimoniais e WHERE e.patrimonio_id = ${patrimonioId}::uuid AND e.data_emprestimo::date >= ${data}::date)
        OR EXISTS (SELECT 1 FROM devolucoes_patrimoniais d JOIN emprestimos_patrimoniais e ON e.id = d.emprestimo_id WHERE e.patrimonio_id = ${patrimonioId}::uuid AND d.data_devolucao::date >= ${data}::date)
        OR EXISTS (SELECT 1 FROM itens_inventario i WHERE i.patrimonio_id = ${patrimonioId}::uuid AND (i.data_verificacao::date >= ${data}::date OR i.data_correcao::date >= ${data}::date))
      ) AS existe
    `;
    return linha?.existe ?? false;
  }

  async existeConferenciaVinculadaNaOuAposData(
    emprestimoId: string,
    data: string,
  ): Promise<boolean> {
    const [linha] = await this.database.$queryRaw<{ existe: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM itens_inventario WHERE emprestimo_patrimonio_id = ${emprestimoId}::uuid AND data_verificacao::date >= ${data}::date) AS existe
    `;
    return linha?.existe ?? false;
  }
}
