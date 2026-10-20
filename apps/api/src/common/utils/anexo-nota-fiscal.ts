import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import {
  EXTENSAO_ANEXO_NOTA_FISCAL,
  TIPO_MIME_ANEXO_NOTA_FISCAL,
} from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { open } from "node:fs/promises";

export interface ArquivoPdfTemporario {
  originalname: string;
  mimetype: string;
  path: string;
  size: number;
}

export async function validarAnexoNotaFiscal(
  arquivo: ArquivoPdfTemporario,
  campo: string,
): Promise<void> {
  if (
    arquivo.mimetype !== TIPO_MIME_ANEXO_NOTA_FISCAL ||
    !arquivo.originalname.toLowerCase().endsWith(EXTENSAO_ANEXO_NOTA_FISCAL)
  ) {
    throw new UnsupportedMediaTypeException({
      codigo: "ANEXO_NOTA_FISCAL_INVALIDO",
      mensagem: "O anexo da nota fiscal deve ser um arquivo PDF.",
      erros: [
        {
          campo,
          codigo: "TIPO_DE_ARQUIVO_INVALIDO",
          mensagem:
            "Envie um arquivo com extensão .pdf e MIME application/pdf.",
        },
      ],
    });
  }

  const handle = await open(arquivo.path, "r");
  try {
    const assinatura = Buffer.alloc(5);
    const { bytesRead } = await handle.read(assinatura, 0, 5, 0);
    if (bytesRead !== 5 || assinatura.toString("ascii") !== "%PDF-") {
      throw new BadRequestException({
        codigo: "CONTEUDO_PDF_INVALIDO",
        mensagem: "O conteúdo do anexo não corresponde a um PDF válido.",
        erros: [
          {
            campo,
            codigo: "ASSINATURA_DE_ARQUIVO_INVALIDA",
            mensagem: "O arquivo não possui uma assinatura PDF válida.",
          },
        ],
      });
    }
  } finally {
    await handle.close();
  }
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
