import { Inject, Injectable, Logger } from "@nestjs/common";
import { Readable } from "node:stream";
import {
  ARMAZENAMENTO_DOCUMENTOS,
  type ArmazenamentoDocumentosPorta,
} from "./armazenamento-documentos.port";

export interface NovoDocumento {
  chave: string;
  conteudo: Readable;
}

@Injectable()
export class CoordenadorDocumentosService {
  private readonly logger = new Logger(CoordenadorDocumentosService.name);

  constructor(
    @Inject(ARMAZENAMENTO_DOCUMENTOS)
    private readonly armazenamento: ArmazenamentoDocumentosPorta,
  ) {}

  async criar(
    documento: NovoDocumento,
    persistirReferencia: () => Promise<void>,
  ): Promise<void> {
    await this.criarMuitos([documento], persistirReferencia);
  }

  async criarMuitos(
    documentos: readonly NovoDocumento[],
    persistirReferencias: () => Promise<void>,
  ): Promise<void> {
    const gravados: string[] = [];
    try {
      for (const documento of documentos) {
        await this.armazenamento.gravar(documento.chave, documento.conteudo);
        gravados.push(documento.chave);
      }
      await persistirReferencias();
    } catch (error) {
      await this.compensar(gravados);
      throw error;
    }
  }

  async substituir(
    chaveAtual: string,
    novoDocumento: NovoDocumento,
    persistirNovaReferencia: () => Promise<void>,
  ): Promise<void> {
    await this.armazenamento.gravar(
      novoDocumento.chave,
      novoDocumento.conteudo,
    );
    try {
      await persistirNovaReferencia();
    } catch (error) {
      await this.compensar([novoDocumento.chave]);
      throw error;
    }

    await this.armazenamento.remover(chaveAtual).catch(() => {
      this.logger.error(
        "Falha ao remover documento substituído; a reconciliação deverá tratá-lo.",
      );
    });
  }

  async remover(
    chave: string,
    limparReferencia: () => Promise<void>,
  ): Promise<void> {
    await limparReferencia();
    await this.armazenamento.remover(chave).catch(() => {
      this.logger.error(
        "Falha ao remover documento sem referência; a reconciliação deverá tratá-lo.",
      );
    });
  }

  private async compensar(chaves: readonly string[]): Promise<void> {
    const resultados = await Promise.allSettled(
      chaves.map((chave) => this.armazenamento.remover(chave)),
    );
    if (resultados.some((resultado) => resultado.status === "rejected")) {
      this.logger.error(
        "Falha na compensação de documentos; a reconciliação deverá tratá-los.",
      );
    }
  }
}
