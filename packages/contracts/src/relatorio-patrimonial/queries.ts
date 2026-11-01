import * as z from "zod";
import { PaginacaoQuerySchema } from "../common/paginacao-query.schema";

export const TipoRelatorioSchema = z.enum([
  "patrimonios",
  "ficha-bem",
  "movimentacoes",
  "manutencoes",
  "depreciacoes",
  "reavaliacoes",
  "inventarios",
  "emprestimos",
  "baixas",
]);
export type TipoRelatorio = z.output<typeof TipoRelatorioSchema>;
const id = z.uuid();
const dia = z.iso.date();
const mes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const busca = z.string().trim().min(1).max(200);
export const TipoEventoRelatorioSchema = z.enum([
  "SUBSTITUICAO_NUMERO",
  "TRANSFERENCIA",
  "REAVALIACAO",
  "DEPRECIACAO",
  "EMPRESTIMO",
  "DEVOLUCAO",
  "BAIXA",
  "ENVIO_MANUTENCAO",
  "REVISAO_ORCAMENTO",
  "RETORNO_MANUTENCAO",
  "CONFERENCIA_INVENTARIO",
  "CORRECAO_INVENTARIO",
  "LOCALIZACAO_POSTERIOR",
  "CORRECAO_LOCALIZACAO",
]);
const periodo = { inicio: dia, fim: dia };
const comum = { patrimonioId: id.optional() };
const comissao = { comissaoId: id.optional() };
export const filtrosRelatorios = {
  patrimonios: z.strictObject({
    ...comum,
    busca: busca.optional(),
    setorId: id.optional(),
    responsavelId: id.optional(),
    especieId: id.optional(),
    naturezaId: id.optional(),
    status: z
      .enum(["ATIVO", "BAIXADO", "EMPRESTADO", "EM_MANUTENCAO"])
      .optional(),
    tipoNumero: z.enum(["OFICIAL", "SEM_NUMERO_OFICIAL"]).optional(),
    inicio: dia.optional(),
    fim: dia.optional(),
    ordenacao: z.enum(["NUMERO", "TOMBAMENTO"]).default("NUMERO"),
  }),
  movimentacoes: z.strictObject({
    ...comum,
    ...comissao,
    ...periodo,
    setorOrigemId: id.optional(),
    setorDestinoId: id.optional(),
    origem: z.enum(["COMUM", "CORRECAO_INVENTARIO"]).optional(),
  }),
  manutencoes: z.strictObject({
    ...comum,
    ...periodo,
    base: z.enum(["ENVIO", "RETORNO"]),
    pedidoId: id.optional(),
    fornecedorId: id.optional(),
    tipo: z.enum(["PREVENTIVA", "CORRETIVA"]).optional(),
    situacao: z.enum(["PENDENTE", "RETORNADO"]).optional(),
  }),
  depreciacoes: z.strictObject({
    ...comum,
    ...comissao,
    competenciaInicio: mes,
    competenciaFim: mes,
  }),
  reavaliacoes: z.strictObject({
    ...comum,
    ...comissao,
    ...periodo,
    base: z.enum(["REGISTRO", "REFERENCIA"]),
  }),
  inventarios: z.strictObject({
    ...comum,
    inventarioId: id,
    setorEsperadoId: id.optional(),
    setorEncontradoId: id.optional(),
    verificacao: z.enum(["VERIFICADO", "PENDENTE"]).optional(),
    situacao: z.enum(["CORRETO", "DIVERGENCIA", "NAO_LOCALIZADO"]).optional(),
    correcao: z.enum(["CORRIGIDO", "PENDENTE"]).optional(),
    correcaoPosterior: z.enum(["CORRIGIDO", "PENDENTE"]).optional(),
  }),
  emprestimos: z.strictObject({
    ...comum,
    ...periodo,
    base: z.enum(["SAIDA", "PREVISAO", "DEVOLUCAO"]),
    grupoId: id.optional(),
    destinatario: busca.optional(),
    situacao: z.enum(["PENDENTE", "DEVOLVIDO"]).optional(),
    emAtraso: z.enum(["true", "false"]).optional(),
  }),
  baixas: z.strictObject({
    ...comum,
    ...comissao,
    ...periodo,
    tipo: z
      .enum([
        "ALIENACAO",
        "INUTILIZACAO",
        "SINISTRO",
        "FURTO",
        "EXTRAVIO",
        "TRANSFERENCIA",
        "RECLASSIFICACAO",
        "ABANDONO",
        "ERRO_REGISTRO",
        "OUTRO",
      ])
      .optional(),
  }),
  "ficha-bem": z.strictObject({
    inicio: dia.optional(),
    fim: dia.optional(),
    evento: TipoEventoRelatorioSchema.optional(),
  }),
} as const;
export type FiltrosRelatorios = {
  [K in TipoRelatorio]: z.output<(typeof filtrosRelatorios)[K]>;
};
export type TipoTabular = Exclude<TipoRelatorio, "ficha-bem">;

function refinar(
  tipo: TipoRelatorio,
  q: Record<string, unknown>,
  ctx: z.RefinementCtx,
) {
  const inicio = q.inicio as string | undefined;
  const fim = q.fim as string | undefined;
  const erro = (path: string, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });
  if (!!inicio !== !!fim) erro("fim", "Informe início e fim juntos.");
  if (inicio && fim) {
    const dias = (Date.parse(fim) - Date.parse(inicio)) / 86400000 + 1;
    if (dias < 1) erro("fim", "O fim deve ser igual ou posterior ao início.");
    if (tipo !== "ficha-bem" && tipo !== "patrimonios" && dias > 366)
      erro("fim", "Use no máximo 366 dias.");
  }
  if (tipo === "depreciacoes") {
    const indice = (v: unknown) => {
      const [a, m] = String(v).split("-").map(Number);
      return a! * 12 + m!;
    };
    const meses = indice(q.competenciaFim) - indice(q.competenciaInicio) + 1;
    if (meses < 1 || meses > 12)
      erro(
        "competenciaFim",
        "Use um intervalo ordenado de até 12 competências.",
      );
  }
  if (
    typeof q.pagina === "number" &&
    typeof q.limite === "number" &&
    (q.pagina - 1) * q.limite > 50000
  )
    erro(
      "pagina",
      "Refine os filtros: deslocamento máximo de 50.000 registros.",
    );
}
const queriesRelatorios = {
  patrimonios: filtrosRelatorios["patrimonios"]
    .extend(PaginacaoQuerySchema.shape)
    .superRefine((q, ctx) => refinar("patrimonios", q, ctx)),
  movimentacoes: filtrosRelatorios["movimentacoes"]
    .extend(PaginacaoQuerySchema.shape)
    .superRefine((q, ctx) => refinar("movimentacoes", q, ctx)),
  manutencoes: filtrosRelatorios["manutencoes"]
    .extend(PaginacaoQuerySchema.shape)
    .superRefine((q, ctx) => refinar("manutencoes", q, ctx)),
  depreciacoes: filtrosRelatorios["depreciacoes"]
    .extend(PaginacaoQuerySchema.shape)
    .superRefine((q, ctx) => refinar("depreciacoes", q, ctx)),
  reavaliacoes: filtrosRelatorios["reavaliacoes"]
    .extend(PaginacaoQuerySchema.shape)
    .superRefine((q, ctx) => refinar("reavaliacoes", q, ctx)),
  inventarios: filtrosRelatorios["inventarios"]
    .extend(PaginacaoQuerySchema.shape)
    .superRefine((q, ctx) => refinar("inventarios", q, ctx)),
  emprestimos: filtrosRelatorios["emprestimos"]
    .extend(PaginacaoQuerySchema.shape)
    .superRefine((q, ctx) => refinar("emprestimos", q, ctx)),
  baixas: filtrosRelatorios["baixas"]
    .extend(PaginacaoQuerySchema.shape)
    .superRefine((q, ctx) => refinar("baixas", q, ctx)),
  "ficha-bem": filtrosRelatorios["ficha-bem"]
    .extend(PaginacaoQuerySchema.shape)
    .superRefine((q, ctx) => refinar("ficha-bem", q, ctx)),
};
const queriesPdfRelatorios = {
  patrimonios: filtrosRelatorios["patrimonios"].superRefine((q, ctx) =>
    refinar("patrimonios", q, ctx),
  ),
  movimentacoes: filtrosRelatorios["movimentacoes"].superRefine((q, ctx) =>
    refinar("movimentacoes", q, ctx),
  ),
  manutencoes: filtrosRelatorios["manutencoes"].superRefine((q, ctx) =>
    refinar("manutencoes", q, ctx),
  ),
  depreciacoes: filtrosRelatorios["depreciacoes"].superRefine((q, ctx) =>
    refinar("depreciacoes", q, ctx),
  ),
  reavaliacoes: filtrosRelatorios["reavaliacoes"].superRefine((q, ctx) =>
    refinar("reavaliacoes", q, ctx),
  ),
  inventarios: filtrosRelatorios["inventarios"].superRefine((q, ctx) =>
    refinar("inventarios", q, ctx),
  ),
  emprestimos: filtrosRelatorios["emprestimos"].superRefine((q, ctx) =>
    refinar("emprestimos", q, ctx),
  ),
  baixas: filtrosRelatorios["baixas"].superRefine((q, ctx) =>
    refinar("baixas", q, ctx),
  ),
  "ficha-bem": filtrosRelatorios["ficha-bem"].superRefine((q, ctx) =>
    refinar("ficha-bem", q, ctx),
  ),
};
export function queryRelatorio<K extends TipoRelatorio>(tipo: K) {
  return queriesRelatorios[tipo];
}
export function queryPdfRelatorio<K extends TipoRelatorio>(tipo: K) {
  return queriesPdfRelatorios[tipo];
}
export const CatalogoOpcaoRelatorioSchema = z.enum([
  "patrimonios",
  "setores",
  "responsaveis",
  "naturezas",
  "especies",
  "comissoes",
  "fornecedores",
  "inventarios",
]);
export type CatalogoOpcaoRelatorio = z.output<
  typeof CatalogoOpcaoRelatorioSchema
>;
export const opcoesPorRelatorio: Record<
  TipoRelatorio,
  readonly CatalogoOpcaoRelatorio[]
> = {
  patrimonios: [
    "patrimonios",
    "setores",
    "responsaveis",
    "naturezas",
    "especies",
  ],
  "ficha-bem": ["patrimonios"],
  movimentacoes: ["patrimonios", "setores", "comissoes"],
  manutencoes: ["patrimonios", "fornecedores"],
  depreciacoes: ["patrimonios", "comissoes"],
  reavaliacoes: ["patrimonios", "comissoes"],
  inventarios: ["patrimonios", "setores", "inventarios"],
  emprestimos: ["patrimonios"],
  baixas: ["patrimonios", "comissoes"],
};
export const OpcoesRelatorioQuerySchema = z
  .strictObject({
    tipo: TipoRelatorioSchema,
    busca: busca.optional(),
    ...PaginacaoQuerySchema.shape,
  })
  .superRefine((q, ctx) => refinar(q.tipo, q, ctx));
export const RelatorioParamsSchema = z.strictObject({
  tipo: TipoRelatorioSchema.exclude(["ficha-bem"]),
});
export const FichaRelatorioParamsSchema = z.strictObject({ patrimonioId: id });
export const OpcaoRelatorioParamsSchema = z.strictObject({
  catalogo: CatalogoOpcaoRelatorioSchema,
});
