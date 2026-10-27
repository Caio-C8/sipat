import * as z from "zod";
import { BaixarPatrimonioDadosSchema } from "./baixa-patrimonio-requests.schema";

export const LIMITE_BYTES_DOCUMENTO_BAIXA_PATRIMONIO = 10 * 1024 * 1024;
export const LIMITE_ARQUIVOS_BAIXAR_PATRIMONIO = 1;
export const LIMITE_CAMPOS_BAIXAR_PATRIMONIO = 1;
export const LIMITE_PARTES_BAIXAR_PATRIMONIO = 2;
export const TIPO_CONTEUDO_BAIXAR_PATRIMONIO = "multipart/form-data";
export const TIPO_MIME_DOCUMENTO_BAIXA_PATRIMONIO = "application/pdf";
export const EXTENSAO_DOCUMENTO_BAIXA_PATRIMONIO = ".pdf";
export const CAMPO_DADOS_BAIXAR_PATRIMONIO = "dados";
export const CAMPO_DOCUMENTO_BAIXAR_PATRIMONIO = "documento";

export const BaixarPatrimonioCampoDadosSchema = z
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
  .pipe(BaixarPatrimonioDadosSchema);

export const BaixarPatrimonioMultipartSchema = z.strictObject({
  dados: BaixarPatrimonioCampoDadosSchema,
  documento: z.unknown().optional(),
});

export type BaixarPatrimonioMultipartInput = z.input<
  typeof BaixarPatrimonioMultipartSchema
>;
export type BaixarPatrimonioMultipartData = z.output<
  typeof BaixarPatrimonioMultipartSchema
>;
