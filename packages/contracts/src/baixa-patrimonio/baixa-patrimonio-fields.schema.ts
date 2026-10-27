import * as z from "zod";

export const TIPOS_BAIXA_PATRIMONIO = [
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
] as const;

export const CODIGOS_ERRO_BAIXA_PATRIMONIO = [
  "BAIXA_JA_EXISTENTE",
  "PATRIMONIO_NAO_ATIVO",
  "PATRIMONIO_EM_INVENTARIO_ABERTO",
  "COMISSAO_INVALIDA",
  "DATA_BAIXA_FUTURA",
] as const;

export const LIMITE_CARACTERES_TEXTO_BAIXA_PATRIMONIO = 2_000;

export const TipoBaixaPatrimonioSchema = z.enum(TIPOS_BAIXA_PATRIMONIO);
export const CodigoErroBaixaPatrimonioSchema = z.enum(
  CODIGOS_ERRO_BAIXA_PATRIMONIO,
);

export const MotivoBaixaPatrimonioSchema = z
  .string()
  .trim()
  .min(1, { error: "O motivo da baixa é obrigatório." })
  .max(LIMITE_CARACTERES_TEXTO_BAIXA_PATRIMONIO, {
    error: `O motivo da baixa deve possuir no máximo ${LIMITE_CARACTERES_TEXTO_BAIXA_PATRIMONIO} caracteres.`,
  });

export const ObservacaoBaixaPatrimonioSchema = z
  .string()
  .trim()
  .min(1, { error: "A observação da baixa não pode ser vazia." })
  .max(LIMITE_CARACTERES_TEXTO_BAIXA_PATRIMONIO, {
    error: `A observação da baixa deve possuir no máximo ${LIMITE_CARACTERES_TEXTO_BAIXA_PATRIMONIO} caracteres.`,
  });

export type TipoBaixaPatrimonio = z.output<typeof TipoBaixaPatrimonioSchema>;
export type CodigoErroBaixaPatrimonio = z.output<
  typeof CodigoErroBaixaPatrimonioSchema
>;
