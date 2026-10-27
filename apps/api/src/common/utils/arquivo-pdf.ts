import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { open } from "node:fs/promises";

export interface ArquivoPdfTemporario {
  originalname: string;
  mimetype: string;
  path: string;
  size: number;
}

interface OpcoesValidacaoPdf {
  campo: string;
  codigoTipoInvalido: string;
  mensagemTipoInvalido: string;
  mensagemConteudoInvalido: string;
}

export async function validarArquivoPdf(
  arquivo: ArquivoPdfTemporario,
  opcoes: OpcoesValidacaoPdf,
): Promise<void> {
  if (
    arquivo.mimetype !== "application/pdf" ||
    !arquivo.originalname.toLowerCase().endsWith(".pdf")
  ) {
    throw new UnsupportedMediaTypeException({
      codigo: opcoes.codigoTipoInvalido,
      mensagem: opcoes.mensagemTipoInvalido,
      erros: [
        {
          campo: opcoes.campo,
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
        mensagem: opcoes.mensagemConteudoInvalido,
        erros: [
          {
            campo: opcoes.campo,
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
