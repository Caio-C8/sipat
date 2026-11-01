import { limiteRelatorio } from "./relatorio-limites";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@repo/database";
import {
  EventosFichaResponseSchema,
  FichaResponseSchema,
  TipoEventoRelatorioSchema,
} from "@repo/contracts";
import { RelatoriosRepository } from "./relatorios.repository";
import {
  camposPatrimonio,
  joinsPatrimonio,
  objeto,
} from "./types/fontes-tabulares";
import { fonteEventos } from "./types/fonte-eventos";
import { consultaRelatorio } from "./mappers/relatorio-response.mapper";

@Injectable()
export class FichaService {
  constructor(private readonly repo: RelatoriosRepository) {}
  async consultar(id: string) {
    return this.repo.leitura(async (repo) =>
      this.cadastro(repo, id, new Date()),
    );
  }
  private async cadastro(repo: RelatoriosRepository, id: string, agora: Date) {
    const campos = {
      ...camposPatrimonio,
      salaAtual: "s.sala",
      marca: "p.marca",
      modelo: "p.modelo",
      serie: "p.numero_serie",
      processoId: "pc.id::text",
      processo: "pc.numero_processo",
      parametro:
        "CASE WHEN pd.id IS NULL THEN NULL ELSE jsonb_build_object('id',pd.id,'metodo',pd.metodo,'vidaUtilMeses',pd.vida_util_inicial_meses,'residual',pd.valor_residual::text,'base',pd.valor_base_inicial::text,'inicio',pd.data_inicio::text) END",
    };
    const [row] = await repo.consultar(
      Prisma.sql`SELECT ${objeto(campos)} dados FROM patrimonios p ${Prisma.raw(joinsPatrimonio)} LEFT JOIN processos_compra pc ON pc.id=p.processo_compra_id LEFT JOIN parametros_depreciacao pd ON pd.patrimonio_id=p.id AND pd.data_fim IS NULL WHERE p.id=${id}::uuid`,
    );
    if (!row) throw new NotFoundException();
    const eventos = await this.eventosNoSnapshot(repo, id, {}, agora, 1, 1);
    return FichaResponseSchema.parse({
      status: 200,
      sucesso: true,
      mensagem: "Ficha consultada.",
      dados: {
        cadastro: row.dados,
        secoes: TipoEventoRelatorioSchema.options.map((tipo) => ({
          tipo,
          disponivel: true,
          quantidade:
            eventos.resumo.porTipo.find((t) => t.tipo === tipo)?.quantidade ??
            0,
        })),
        consulta: eventos.consulta,
      },
    });
  }
  async eventos(id: string, q: Record<string, unknown>, pdf = false) {
    const agora = new Date();
    return this.repo.leitura(async (repo) => {
      if (!(await repo.patrimonioExiste(id))) throw new NotFoundException();
      return this.eventosNoSnapshot(
        repo,
        id,
        q,
        agora,
        pdf ? 1 : Number(q.pagina ?? 1),
        pdf ? 1000 : Number(q.limite ?? 20),
        pdf,
      );
    });
  }
  async completaPdf(id: string, q: Record<string, unknown>) {
    const agora = new Date();
    return this.repo.leitura(async (repo) => ({
      cadastro: (await this.cadastro(repo, id, agora)).dados.cadastro,
      eventos: await this.eventosNoSnapshot(repo, id, q, agora, 1, 1000, true),
    }));
  }
  private async eventosNoSnapshot(
    repo: RelatoriosRepository,
    id: string,
    q: Record<string, unknown>,
    agora: Date,
    pagina: number,
    limite: number,
    pdf = false,
  ) {
    const fonte = fonteEventos(id, q, agora);
    const [row] = await repo.resumo(
      fonte,
      Prisma.sql`jsonb_build_object('quantidade',count(*)::int,'porTipo',coalesce((SELECT jsonb_agg(x ORDER BY x->>'tipo') FROM (SELECT jsonb_build_object('tipo',dados->>'tipo','quantidade',count(*)::int) x FROM fonte GROUP BY dados->>'tipo') g),'[]'::jsonb))`,
    );
    const resumo = row?.resumo as {
      quantidade: number;
      porTipo: { tipo: string; quantidade: number }[];
    };
    if (pdf && resumo.quantidade > 1000) throw limiteRelatorio();
    const linhas = await repo.linhas(fonte, (pagina - 1) * limite, limite);
    let excluidos = 0;
    if (q.inicio) {
      const semPeriodo = fonteEventos(id, { evento: q.evento }, agora);
      const [r] = await repo.consultar(
        Prisma.sql`WITH fonte AS (${semPeriodo.sql}) SELECT jsonb_build_object('quantidade',count(*)::int) dados FROM fonte WHERE ordem1 IS NULL`,
      );
      excluidos = Number((r?.dados as { quantidade: number }).quantidade);
    }
    const avisos = [
      "Cadastro atual separado dos fatos; informações históricas ausentes não são reconstruídas.",
      "Transferências de correção constam somente como correção; não são duplicadas como transferência.",
      "Registro de conferência/correção sem instante próprio de gravação permanece não informado.",
    ];
    if (excluidos)
      avisos.push(
        `${excluidos} eventos excluídos por ocorrência desconhecida; consulte sem período para incluí-los.`,
      );
    return EventosFichaResponseSchema.parse({
      status: 200,
      sucesso: true,
      mensagem: "Eventos consultados.",
      tipo: "ficha-bem",
      dados: linhas.map((x) => x.dados),
      resumo,
      meta: {
        total: resumo.quantidade,
        pagina,
        limite,
        ultimaPagina: Math.max(1, Math.ceil(resumo.quantidade / limite)),
      },
      consulta: consultaRelatorio(
        { ...q, patrimonioId: id },
        agora,
        fonte.criterio,
        fonte.ordenacao,
        avisos,
        excluidos,
      ),
    });
  }
}
