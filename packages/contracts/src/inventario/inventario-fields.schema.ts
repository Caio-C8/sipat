import * as z from "zod";
import { StatusPatrimonioSchema } from "../patrimonio";

export const STATUS_INVENTARIO = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "FINALIZADO",
] as const;
export const STATUS_SETOR_INVENTARIO = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDO",
] as const;
export const SITUACOES_ITEM_INVENTARIO = [
  "CORRETO",
  "DIVERGENCIA",
  "NAO_LOCALIZADO",
] as const;
export const STATUS_VERIFICACAO_ITEM_INVENTARIO = [
  "PENDENTE",
  "VERIFICADO",
] as const;
export const STATUS_CORRECAO_ITEM_INVENTARIO = [
  "PENDENTE",
  "CORRIGIDO",
] as const;
export const TIPOS_CORRECAO_ITEM_INVENTARIO = [
  "RETORNO_AO_SETOR_CADASTRADO",
  "TRANSFERENCIA_CADASTRAL",
] as const;
export const STATUS_PATRIMONIO_NA_VERIFICACAO = [
  "ATIVO",
  "EMPRESTADO",
  "EM_MANUTENCAO",
] as const;

export const CODIGOS_ERRO_INVENTARIO = [
  "INVENTARIO_FINALIZADO",
  "SETOR_INVENTARIO_FORA_DE_ANDAMENTO",
  "OUTRO_SETOR_INVENTARIO_EM_ANDAMENTO",
  "ITEM_INVENTARIO_JA_VERIFICADO",
  "MOVIMENTACAO_FISICA_SEM_HISTORICO",
  "CORRECAO_ITEM_INVENTARIO_INCOMPATIVEL",
  "CONFLITO_CONCORRENTE_INVENTARIO",
] as const;

export const StatusInventarioSchema = z.enum(STATUS_INVENTARIO);
export const StatusSetorInventarioSchema = z.enum(STATUS_SETOR_INVENTARIO);
export const SituacaoItemInventarioSchema = z.enum(SITUACOES_ITEM_INVENTARIO);
export const StatusVerificacaoItemInventarioSchema = z.enum(
  STATUS_VERIFICACAO_ITEM_INVENTARIO,
);
export const StatusCorrecaoItemInventarioSchema = z.enum(
  STATUS_CORRECAO_ITEM_INVENTARIO,
);
export const TipoCorrecaoItemInventarioSchema = z.enum(
  TIPOS_CORRECAO_ITEM_INVENTARIO,
);
export const CodigoErroInventarioSchema = z.enum(CODIGOS_ERRO_INVENTARIO);

export const DateTimeUtcInventarioSchema = z.iso.datetime({ precision: 3 });

export const NomeInventarioSchema = z
  .string()
  .trim()
  .min(1, { error: "O nome do inventário é obrigatório." })
  .max(150, {
    error: "O nome do inventário deve possuir no máximo 150 caracteres.",
  });

export const TextoLongoInventarioSchema = z
  .string()
  .trim()
  .min(1, { error: "O texto informado não pode ser vazio." })
  .max(2_000, {
    error: "O texto informado deve possuir no máximo 2.000 caracteres.",
  });

export const AusenciaJustificadaInventarioSchema = z.discriminatedUnion(
  "tipo",
  [
    z.strictObject({
      tipo: z.literal("EMPRESTIMO"),
      emprestimoPatrimonioId: z.uuid(),
    }),
    z.strictObject({
      tipo: z.literal("MANUTENCAO"),
      itemManutencaoId: z.uuid(),
    }),
  ],
);

export const StatusPatrimonioNaVerificacaoSchema =
  StatusPatrimonioSchema.extract(STATUS_PATRIMONIO_NA_VERIFICACAO);

export type StatusInventario = z.output<typeof StatusInventarioSchema>;
export type StatusSetorInventario = z.output<
  typeof StatusSetorInventarioSchema
>;
export type SituacaoItemInventario = z.output<
  typeof SituacaoItemInventarioSchema
>;
export type StatusVerificacaoItemInventario = z.output<
  typeof StatusVerificacaoItemInventarioSchema
>;
export type StatusCorrecaoItemInventario = z.output<
  typeof StatusCorrecaoItemInventarioSchema
>;
export type TipoCorrecaoItemInventario = z.output<
  typeof TipoCorrecaoItemInventarioSchema
>;
export type CodigoErroInventario = z.output<typeof CodigoErroInventarioSchema>;
export type AusenciaJustificadaInventario = z.output<
  typeof AusenciaJustificadaInventarioSchema
>;
export type StatusPatrimonioNaVerificacao = z.output<
  typeof StatusPatrimonioNaVerificacaoSchema
>;
