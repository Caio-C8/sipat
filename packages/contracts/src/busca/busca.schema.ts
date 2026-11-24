import * as z from "zod";
import { criarRespostaSucessoSchema } from "../common";

export const DominiosBuscaGlobal = [
  "PATRIMONIOS",
  "REAVALIACOES",
  "DEPRECIACOES",
  "MOVIMENTACOES",
  "EMPRESTIMOS",
  "BAIXAS",
  "INVENTARIOS",
  "MANUTENCOES",
  "PROCESSOS_COMPRA",
  "FORNECEDORES",
  "SETORES",
  "RESPONSAVEIS",
  "COMISSOES",
  "NATUREZAS",
  "ESPECIES",
] as const;

export const DominioBuscaGlobalSchema = z.enum(DominiosBuscaGlobal);

export const BuscaGlobalQuerySchema = z.strictObject({
  termo: z.string().trim().min(2).max(100),
  limite: z.coerce.number().int().min(1).max(5).default(5),
});

export const ItemBuscaGlobalSchema = z.strictObject({
  id: z.uuid(),
  identificador: z.string().min(1).max(100),
  titulo: z.string().min(1).max(300),
  complemento: z.string().min(1).max(300).nullable(),
  destino: z.string().startsWith("/"),
});

export const GrupoBuscaGlobalSchema = z.strictObject({
  dominio: DominioBuscaGlobalSchema,
  rotulo: z.string().min(1).max(50),
  total: z.int().nonnegative(),
  truncado: z.boolean(),
  verTodosDestino: z.string().startsWith("/").nullable(),
  itens: z.array(ItemBuscaGlobalSchema).max(5),
});

export const BuscaGlobalSchema = z.strictObject({
  termo: z.string().min(2).max(100),
  grupos: z.array(GrupoBuscaGlobalSchema).length(DominiosBuscaGlobal.length),
});

export const BuscaGlobalResponseSchema =
  criarRespostaSucessoSchema(BuscaGlobalSchema);

export type DominioBuscaGlobal = z.output<typeof DominioBuscaGlobalSchema>;
export type BuscaGlobalQueryInput = z.input<typeof BuscaGlobalQuerySchema>;
export type BuscaGlobalQuery = z.output<typeof BuscaGlobalQuerySchema>;
export type ItemBuscaGlobal = z.output<typeof ItemBuscaGlobalSchema>;
export type GrupoBuscaGlobal = z.output<typeof GrupoBuscaGlobalSchema>;
export type BuscaGlobal = z.output<typeof BuscaGlobalSchema>;
export type BuscaGlobalResponse = z.output<typeof BuscaGlobalResponseSchema>;
