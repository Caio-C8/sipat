import * as z from "zod";
import { CriarNotaFiscalDadosSchema } from "./nota-fiscal.schema";

export const LIMITE_BYTES_ANEXO_NOTA_FISCAL = 10 * 1024 * 1024;
export const LIMITE_PARTES_CRIAR_NOTA_FISCAL = 2;
export const TIPO_CONTEUDO_CRIAR_NOTA_FISCAL = "multipart/form-data";
export const TIPO_MIME_ANEXO_NOTA_FISCAL = "application/pdf";
export const EXTENSAO_ANEXO_NOTA_FISCAL = ".pdf";
export const CAMPO_DADOS_CRIAR_NOTA_FISCAL = "dados";
export const CAMPO_ANEXO_NOTA_FISCAL = "anexo";

const criarCampoJsonSchema = <TSchema extends z.ZodType>(schema: TSchema) =>
  z
    .string({ error: "O campo dados deve ser uma string JSON." })
    .transform((valor, contexto) => {
      try {
        return JSON.parse(valor) as unknown;
      } catch {
        contexto.addIssue({
          code: "custom",
          message: "O campo dados deve conter JSON válido.",
        });
        return z.NEVER;
      }
    })
    .pipe(schema);

export const CriarNotaFiscalCampoDadosSchema = criarCampoJsonSchema(
  CriarNotaFiscalDadosSchema,
);

export const CriarNotaFiscalMultipartSchema = z.strictObject({
  dados: CriarNotaFiscalCampoDadosSchema,
  anexo: z.unknown().optional(),
});

export const SubstituirAnexoNotaFiscalMultipartSchema = z.strictObject({
  anexo: z.unknown(),
});

export type CriarNotaFiscalMultipartInput = z.input<
  typeof CriarNotaFiscalMultipartSchema
>;
export type CriarNotaFiscalMultipartData = z.output<
  typeof CriarNotaFiscalMultipartSchema
>;
