import { limiteRelatorio } from "./relatorio-limites";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@repo/database";
import {
  CatalogoRelatoriosResponseSchema,
  LimitesRelatorios,
  OpcoesRelatorioResponseSchema,
  opcoesPorRelatorio,
  titulosRelatorios,
  type TipoTabular,
  type TipoRelatorio,
  type CatalogoOpcaoRelatorio,
} from "@repo/contracts";
import { RelatoriosRepository } from "./relatorios.repository";
import { construirFonte } from "./types/fontes-tabulares";
import { resumoTabular } from "./types/resumos-tabulares";
import {
  consultaRelatorio,
  respostaTabular,
} from "./mappers/relatorio-response.mapper";

@Injectable()
export class RelatoriosService {
  constructor(private readonly repo: RelatoriosRepository) {}
  catalogo() {
    return CatalogoRelatoriosResponseSchema.parse({
      status: 200,
      sucesso: true,
      mensagem: "Catálogo de relatórios.",
      dados: {
        tipos: Object.entries(titulosRelatorios).map(([tipo, titulo]) => ({
          tipo,
          titulo,
          disponivel: true,
          motivo:
            tipo === "baixas"
              ? "Estorno não permitido pelas regras atuais"
              : null,
          previa: true,
          pdf: true,
        })),
        limites: LimitesRelatorios,
      },
    });
  }
  async tabular(tipo: TipoTabular, q: Record<string, unknown>, pdf = false) {
    const agora = new Date();
    const fonte = construirFonte(tipo, q, agora);
    const pagina = pdf ? 1 : Number(q.pagina ?? 1),
      limite = pdf ? 1000 : Number(q.limite ?? 20);
    return this.repo.leitura(async (repo) => {
      if (
        tipo === "inventarios" &&
        !(await repo.inventario(String(q.inventarioId)))
      )
        throw new NotFoundException();
      const [agregado] = await repo.resumo(fonte, resumoTabular(tipo));
      const resumo = agregado?.resumo as Record<string, unknown>;
      const total = Number(resumo.quantidade);
      if (pdf && total > 1000) throw limiteRelatorio();
      const dados = await repo.linhas(fonte, (pagina - 1) * limite, limite);
      const avisos = [
        "Identificação, nomes relacionados e cadastro contábil são atuais, salvo snapshots explicitamente identificados.",
      ];
      if (Number(resumo.semContabilidade) > 0)
        avisos.push(
          `${resumo.semContabilidade} bens sem situação contábil; totais atuais indisponíveis.`,
        );
      if (
        tipo === "manutencoes" &&
        (Number(resumo.semOrcamento) > 0 || Number(resumo.semRealizado) > 0)
      )
        avisos.push(
          "Somas de orçamento e realizado abrangem somente valores conhecidos; ausências não são zero.",
        );
      if (tipo === "inventarios") {
        if (total === 0)
          avisos.push(
            "Nenhum item corresponde aos filtros; um inventário sem itens materializados não comprova ausência de inconsistências.",
          );
        if (Number(resumo.pendentes) > 0)
          avisos.push(
            "Conferência incompleta: itens pendentes não comprovam ausência de inconsistências.",
          );
      }
      let excluidos = 0;
      if (tipo === "reavaliacoes" && q.base === "REFERENCIA") {
        const semPeriodo = construirFonte(
          tipo,
          { ...q, inicio: undefined, fim: undefined },
          agora,
        );
        const [r] = await repo.consultar(
          Prisma.sql`WITH fonte AS (${semPeriodo.sql}) SELECT jsonb_build_object('quantidade',count(*)::int) dados FROM fonte WHERE dados->>'dataReferencia' IS NULL`,
        );
        excluidos = Number((r?.dados as { quantidade: number }).quantidade);
        if (excluidos)
          avisos.push(
            `${excluidos} registros sem data de referência excluídos; consulte pela base registro.`,
          );
      }
      return respostaTabular(
        tipo,
        dados.map((x) => x.dados),
        resumo,
        pagina,
        limite,
        total,
        consultaRelatorio(
          q,
          agora,
          fonte.criterio,
          fonte.ordenacao,
          avisos,
          excluidos,
        ),
      );
    });
  }
  async opcoes(
    catalogo: CatalogoOpcaoRelatorio,
    q: { tipo: TipoRelatorio; busca?: string; pagina: number; limite: number },
  ) {
    if (!opcoesPorRelatorio[q.tipo].includes(catalogo))
      throw new BadRequestException();
    const fontes = {
      patrimonios: {
        t: "patrimonios",
        r: "numero_patrimonio || ' — ' || left(descricao,120)",
      },
      setores: {
        t: "setores",
        r: "nome || CASE WHEN ativo THEN '' ELSE ' (inativo)' END",
      },
      responsaveis: {
        t: "responsaveis",
        r: "nome || CASE WHEN ativo THEN '' ELSE ' (inativo)' END",
      },
      naturezas: { t: "naturezas", r: "nome" },
      especies: { t: "especies", r: "nome" },
      comissoes: { t: "comissoes", r: "nome" },
      fornecedores: {
        t: "fornecedores",
        r: "razao_social || CASE WHEN ativo THEN '' ELSE ' (inativo)' END",
      },
      inventarios: { t: "inventarios", r: "nome || ' — ' || status::text" },
    };
    const f = fontes[catalogo];
    const base = Prisma.sql`SELECT id, ${Prisma.raw(f.r)} rotulo FROM ${Prisma.raw(f.t)}`;
    return this.repo.leitura(async (repo) => {
      const fonte = Prisma.sql`SELECT * FROM (${base}) o WHERE position(lower(${q.busca ?? ""}) in lower(rotulo)) > 0`;
      const [r] = await repo.consultar(
        Prisma.sql`WITH fonte AS (${fonte}) SELECT jsonb_build_object('total',count(*)::int) dados FROM fonte`,
      );
      const total = Number((r?.dados as { total: number }).total);
      const linhas = await repo.consultar(
        Prisma.sql`WITH fonte AS (${fonte}) SELECT jsonb_build_object('id',id,'rotulo',rotulo) dados FROM fonte ORDER BY rotulo,id LIMIT ${q.limite} OFFSET ${(q.pagina - 1) * q.limite}`,
      );
      return OpcoesRelatorioResponseSchema.parse({
        status: 200,
        sucesso: true,
        mensagem: "Opções para relatório.",
        dados: linhas.map((x) => x.dados),
        meta: {
          total,
          pagina: q.pagina,
          limite: q.limite,
          ultimaPagina: Math.max(1, Math.ceil(total / q.limite)),
        },
      });
    });
  }
}
