import type { Readable } from "node:stream";

export interface OpcoesReconciliacaoDocumentos {
  chavesReferenciadas: ReadonlySet<string>;
  temporariosModificadosAntesDe: Date;
  orfaosModificadosAntesDe: Date;
}

export interface ResultadoReconciliacaoDocumentos {
  temporariosRemovidos: number;
  orfaosRemovidos: number;
}

export interface DocumentoAberto {
  conteudo: Readable;
  tamanho: number;
}

export interface ArmazenamentoDocumentosPorta {
  gravar(chave: string, conteudo: Readable): Promise<void>;
  abrir(chave: string): Promise<DocumentoAberto>;
  substituir(
    chaveAtual: string,
    novaChave: string,
    conteudo: Readable,
  ): Promise<void>;
  remover(chave: string): Promise<void>;
  reconciliar(
    opcoes: OpcoesReconciliacaoDocumentos,
  ): Promise<ResultadoReconciliacaoDocumentos>;
}

export const ARMAZENAMENTO_DOCUMENTOS = Symbol("ARMAZENAMENTO_DOCUMENTOS");
