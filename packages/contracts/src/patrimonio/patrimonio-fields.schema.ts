import * as z from "zod";

export const TIPOS_NUMERO_PATRIMONIAL = [
  "OFICIAL",
  "SEM_NUMERO_OFICIAL",
] as const;
export const STATUS_PATRIMONIO = [
  "ATIVO",
  "BAIXADO",
  "EMPRESTADO",
  "EM_MANUTENCAO",
] as const;
export const TIPOS_INCORPORACAO = [
  "AQUISICAO",
  "DOACAO",
  "TRANSFERENCIA",
  "CESSAO",
  "COMODATO",
  "PERMUTA",
  "PRODUCAO_INTERNA",
  "OUTROS",
] as const;

export const TipoNumeroPatrimonialSchema = z.enum(TIPOS_NUMERO_PATRIMONIAL);
export const StatusPatrimonioSchema = z.enum(STATUS_PATRIMONIO);
export const TipoIncorporacaoSchema = z.enum(TIPOS_INCORPORACAO);

export const DataCivilSchema = z.iso.date({
  error: "A data deve estar no formato ISO YYYY-MM-DD.",
});

export const Decimal19_7Schema = z
  .string({ error: "O valor deve ser informado como uma string decimal." })
  .regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,7})?$/, {
    error:
      "O valor deve possuir até 12 dígitos inteiros e até 7 casas decimais, sem expoente ou zeros à esquerda.",
  });

export const Decimal19_7PositivoSchema = Decimal19_7Schema.refine(
  (valor) => !/^0(?:\.0+)?$/.test(valor),
  { error: "O valor deve ser maior que zero." },
);

export const NumeroPatrimonialOficialSchema = z
  .string()
  .regex(/^[1-9]\d*$/, {
    error:
      "O número patrimonial oficial deve ser um inteiro positivo canônico, sem zeros à esquerda.",
  })
  .max(50);

export const NumeroPatrimonialSchema = z
  .string()
  .regex(/^(?:[1-9]\d*|SP-[1-9]\d*)$/, {
    error:
      "O número patrimonial deve usar a representação canônica oficial ou SP-.",
  })
  .max(50);

export type TipoNumeroPatrimonial = z.output<
  typeof TipoNumeroPatrimonialSchema
>;
export type StatusPatrimonio = z.output<typeof StatusPatrimonioSchema>;
export type TipoIncorporacao = z.output<typeof TipoIncorporacaoSchema>;
export type DataCivil = z.output<typeof DataCivilSchema>;
export type Decimal19_7 = z.output<typeof Decimal19_7Schema>;
