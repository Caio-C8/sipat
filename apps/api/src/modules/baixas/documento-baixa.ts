import { randomUUID } from "node:crypto";
import {
  type ArquivoPdfTemporario,
  validarArquivoPdf,
} from "../../common/utils/arquivo-pdf";

export async function validarDocumentoBaixa(
  arquivo: ArquivoPdfTemporario,
): Promise<void> {
  await validarArquivoPdf(arquivo, {
    campo: "documento",
    codigoTipoInvalido: "DOCUMENTO_BAIXA_INVALIDO",
    mensagemTipoInvalido: "O documento da baixa deve ser um arquivo PDF.",
    mensagemConteudoInvalido:
      "O conteúdo do documento da baixa não corresponde a um PDF válido.",
  });
}

export function criarChaveDocumentoBaixa(patrimonioId: string): string {
  const dataUtc = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `uploads/baixas/${patrimonioId}_${dataUtc}_${randomUUID()}.pdf`;
}
