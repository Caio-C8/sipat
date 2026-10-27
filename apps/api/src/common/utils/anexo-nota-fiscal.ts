import { randomUUID } from "node:crypto";
import { type ArquivoPdfTemporario, validarArquivoPdf } from "./arquivo-pdf";

export type { ArquivoPdfTemporario } from "./arquivo-pdf";

export async function validarAnexoNotaFiscal(
  arquivo: ArquivoPdfTemporario,
  campo: string,
): Promise<void> {
  await validarArquivoPdf(arquivo, {
    campo,
    codigoTipoInvalido: "ANEXO_NOTA_FISCAL_INVALIDO",
    mensagemTipoInvalido: "O anexo da nota fiscal deve ser um arquivo PDF.",
    mensagemConteudoInvalido:
      "O conteúdo do anexo não corresponde a um PDF válido.",
  });
}

export function criarChaveAnexoNotaFiscal(numeroNotaFiscal: string): string {
  const numero =
    numeroNotaFiscal
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^A-Za-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "nota";
  const dataUtc = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `uploads/notas-fiscais/${numero}_${dataUtc}_${randomUUID()}.pdf`;
}
