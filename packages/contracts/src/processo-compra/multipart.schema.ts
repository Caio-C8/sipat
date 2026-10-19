import * as z from "zod";
import { CriarProcessoCompraDadosSchema } from "./processo-compra.schema";

export const LIMITE_ANEXOS_CRIAR_PROCESSO_COMPRA = 20;
export const LIMITE_CAMPOS_CRIAR_PROCESSO_COMPRA = 1;
export const LIMITE_PARTES_CRIAR_PROCESSO_COMPRA = 21;
export const TIPO_CONTEUDO_CRIAR_PROCESSO_COMPRA = "multipart/form-data";
export const CAMPO_DADOS_CRIAR_PROCESSO_COMPRA = "dados";
export const CAMPO_ANEXOS_CRIAR_PROCESSO_COMPRA = "anexos";

export const CriarProcessoCompraCampoDadosSchema = z
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
  .pipe(CriarProcessoCompraDadosSchema);

export const CriarProcessoCompraMultipartSchema = z
  .strictObject({
    dados: CriarProcessoCompraCampoDadosSchema,
    anexos: z.array(z.unknown()).max(LIMITE_ANEXOS_CRIAR_PROCESSO_COMPRA),
  })
  .superRefine((multipart, contexto) => {
    const indicesUsados = new Set<number>();

    for (const [indiceNota, nota] of multipart.dados.notas.entries()) {
      const anexoIndice = nota.anexoIndice;
      if (anexoIndice === undefined) continue;

      if (anexoIndice >= multipart.anexos.length) {
        contexto.addIssue({
          code: "custom",
          path: ["dados", "notas", indiceNota, "anexoIndice"],
          message: "O índice deve identificar um arquivo existente em anexos.",
        });
      }

      if (indicesUsados.has(anexoIndice)) {
        contexto.addIssue({
          code: "custom",
          path: ["dados", "notas", indiceNota, "anexoIndice"],
          message: "Cada arquivo pode ser associado a somente uma nota.",
        });
      }

      indicesUsados.add(anexoIndice);
    }

    for (
      let indiceAnexo = 0;
      indiceAnexo < multipart.anexos.length;
      indiceAnexo += 1
    ) {
      if (!indicesUsados.has(indiceAnexo)) {
        contexto.addIssue({
          code: "custom",
          path: ["anexos", indiceAnexo],
          message: "Cada arquivo deve estar associado a uma nota.",
        });
      }
    }
  });

export type CriarProcessoCompraMultipartInput = z.input<
  typeof CriarProcessoCompraMultipartSchema
>;
export type CriarProcessoCompraMultipartData = z.output<
  typeof CriarProcessoCompraMultipartSchema
>;
