import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  constants,
  createReadStream,
  createWriteStream,
  type Dirent,
} from "node:fs";
import {
  access,
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import type { EnvironmentVariables } from "../../environment";
import {
  type ArmazenamentoDocumentosPorta,
  type DocumentoAberto,
  type OpcoesReconciliacaoDocumentos,
  type ResultadoReconciliacaoDocumentos,
} from "./armazenamento-documentos.port";
import { ErroArmazenamentoDocumentos } from "./erro-armazenamento-documentos";

const PREFIXO_LOGICO = "uploads";
const DIRETORIOS_PERMITIDOS = new Set(["notas-fiscais", "baixas"]);
const DIRETORIO_TEMPORARIO = ".staging";

function ehErroComCodigo(error: unknown, codigo: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === codigo
  );
}

@Injectable()
export class SistemaArquivosLocalAdapter
  implements ArmazenamentoDocumentosPorta, OnModuleInit
{
  private readonly logger = new Logger(SistemaArquivosLocalAdapter.name);
  private readonly raizConfigurada: string;
  private raizReal?: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.raizConfigurada = config.getOrThrow("UPLOADS_ROOT_PATH", {
      infer: true,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      const estado = await lstat(this.raizConfigurada);
      if (!estado.isDirectory() || estado.isSymbolicLink()) {
        throw new Error("a raiz não é um diretório físico");
      }

      await access(this.raizConfigurada, constants.R_OK | constants.W_OK);
      this.raizReal = await realpath(this.raizConfigurada);

      await mkdir(path.join(this.raizReal, DIRETORIO_TEMPORARIO), {
        recursive: true,
      });
      for (const diretorio of DIRETORIOS_PERMITIDOS) {
        await mkdir(path.join(this.raizReal, diretorio), { recursive: true });
      }

      await this.validarDiretoriosControlados();
      await this.testarEscrita();
    } catch (error) {
      throw new ErroArmazenamentoDocumentos(
        "UPLOADS_ROOT_PATH deve existir, ser um diretório físico e permitir leitura e escrita.",
        { cause: error },
      );
    }
  }

  async gravar(chave: string, conteudo: Readable): Promise<void> {
    const destino = await this.resolverDestinoNovo(chave);
    const temporario = await this.criarCaminhoTemporario();

    try {
      await pipeline(
        conteudo,
        createWriteStream(temporario, { flags: "wx", mode: 0o600 }),
      );
      await this.garantirDestinoAusente(destino);
      await rename(temporario, destino);
    } catch (error) {
      await rm(temporario, { force: true }).catch(() => {
        this.logger.error(
          "Falha ao remover arquivo temporário; a reconciliação deverá tratá-lo.",
        );
      });
      throw new ErroArmazenamentoDocumentos(
        "Não foi possível gravar o documento.",
        { cause: error },
      );
    }
  }

  async abrir(chave: string): Promise<DocumentoAberto> {
    const arquivo = await this.resolverArquivoExistente(chave);
    const estado = await lstat(arquivo).catch((error: unknown) => {
      throw new ErroArmazenamentoDocumentos(
        "Não foi possível abrir o documento.",
        { cause: error },
      );
    });
    return {
      conteudo: createReadStream(arquivo),
      tamanho: estado.size,
    };
  }

  async substituir(
    chaveAtual: string,
    novaChave: string,
    conteudo: Readable,
  ): Promise<void> {
    if (chaveAtual === novaChave) {
      throw new ErroArmazenamentoDocumentos(
        "A substituição exige uma nova chave lógica.",
      );
    }

    await this.resolverArquivoExistente(chaveAtual);
    await this.gravar(novaChave, conteudo);

    try {
      await this.remover(chaveAtual);
    } catch (error) {
      await this.remover(novaChave).catch(() => undefined);
      throw error;
    }
  }

  async remover(chave: string): Promise<void> {
    const arquivo = await this.resolverCaminho(chave);
    await this.rejeitarSymlinkSeExistir(arquivo);
    await rm(arquivo, { force: true });
  }

  async reconciliar(
    opcoes: OpcoesReconciliacaoDocumentos,
  ): Promise<ResultadoReconciliacaoDocumentos> {
    await this.validarDiretoriosControlados();

    let temporariosRemovidos = 0;
    let orfaosRemovidos = 0;
    const temporarios = await this.listarDiretorio(DIRETORIO_TEMPORARIO);

    for (const entrada of temporarios) {
      if (!entrada.isFile()) continue;
      const arquivo = path.join(
        this.obterRaiz(),
        DIRETORIO_TEMPORARIO,
        entrada.name,
      );
      const estado = await lstat(arquivo);
      if (estado.mtime < opcoes.temporariosModificadosAntesDe) {
        await rm(arquivo, { force: true });
        temporariosRemovidos += 1;
      }
    }

    for (const diretorio of DIRETORIOS_PERMITIDOS) {
      const entradas = await this.listarDiretorio(diretorio);
      for (const entrada of entradas) {
        if (!entrada.isFile()) continue;
        const chave = `${PREFIXO_LOGICO}/${diretorio}/${entrada.name}`;
        if (opcoes.chavesReferenciadas.has(chave)) continue;

        const arquivo = path.join(this.obterRaiz(), diretorio, entrada.name);
        const estado = await lstat(arquivo);
        if (estado.mtime < opcoes.orfaosModificadosAntesDe) {
          await rm(arquivo, { force: true });
          orfaosRemovidos += 1;
        }
      }
    }

    return { temporariosRemovidos, orfaosRemovidos };
  }

  private obterRaiz(): string {
    if (!this.raizReal) {
      throw new ErroArmazenamentoDocumentos(
        "O armazenamento ainda não foi inicializado.",
      );
    }
    return this.raizReal;
  }

  private async resolverCaminho(chave: string): Promise<string> {
    const partes = chave.split("/");
    if (
      chave.includes("\\") ||
      chave.includes("\0") ||
      path.posix.isAbsolute(chave) ||
      path.win32.isAbsolute(chave) ||
      partes.length !== 3 ||
      partes[0] !== PREFIXO_LOGICO ||
      !partes[1] ||
      !DIRETORIOS_PERMITIDOS.has(partes[1]) ||
      !partes[2] ||
      partes.some((parte) => parte === "." || parte === "..")
    ) {
      throw new ErroArmazenamentoDocumentos("Chave lógica inválida.");
    }

    await this.validarDiretorioControlado(partes[1]);
    const raiz = this.obterRaiz();
    const resolvido = path.resolve(raiz, partes[1], partes[2]);
    const relativo = path.relative(raiz, resolvido);
    if (relativo.startsWith("..") || path.isAbsolute(relativo)) {
      throw new ErroArmazenamentoDocumentos("Chave lógica inválida.");
    }
    return resolvido;
  }

  private async resolverDestinoNovo(chave: string): Promise<string> {
    const destino = await this.resolverCaminho(chave);
    await this.rejeitarSymlinkSeExistir(destino);
    return destino;
  }

  private async resolverArquivoExistente(chave: string): Promise<string> {
    const arquivo = await this.resolverCaminho(chave);
    const estado = await lstat(arquivo).catch((error: unknown) => {
      if (ehErroComCodigo(error, "ENOENT")) {
        throw new ErroArmazenamentoDocumentos("Documento não encontrado.");
      }
      throw error;
    });
    if (!estado.isFile() || estado.isSymbolicLink()) {
      throw new ErroArmazenamentoDocumentos("Documento inválido.");
    }

    const real = await realpath(arquivo);
    this.garantirContidoNaRaiz(real);
    return real;
  }

  private async validarDiretoriosControlados(): Promise<void> {
    await this.validarDiretorioControlado(DIRETORIO_TEMPORARIO);
    for (const diretorio of DIRETORIOS_PERMITIDOS) {
      await this.validarDiretorioControlado(diretorio);
    }
  }

  private async validarDiretorioControlado(diretorio: string): Promise<void> {
    const esperado = path.join(this.obterRaiz(), diretorio);
    const estado = await lstat(esperado);
    if (!estado.isDirectory() || estado.isSymbolicLink()) {
      throw new ErroArmazenamentoDocumentos(
        "Diretório de armazenamento inválido.",
      );
    }
    const real = await realpath(esperado);
    this.garantirContidoNaRaiz(real);
  }

  private garantirContidoNaRaiz(caminho: string): void {
    const relativo = path.relative(this.obterRaiz(), caminho);
    if (relativo.startsWith("..") || path.isAbsolute(relativo)) {
      throw new ErroArmazenamentoDocumentos(
        "O caminho resolve fora da raiz de armazenamento.",
      );
    }
  }

  private async rejeitarSymlinkSeExistir(arquivo: string): Promise<void> {
    try {
      const estado = await lstat(arquivo);
      if (estado.isSymbolicLink()) {
        throw new ErroArmazenamentoDocumentos(
          "Links simbólicos não são permitidos no armazenamento.",
        );
      }
    } catch (error) {
      if (!ehErroComCodigo(error, "ENOENT")) throw error;
    }
  }

  private async garantirDestinoAusente(destino: string): Promise<void> {
    try {
      await lstat(destino);
      throw new ErroArmazenamentoDocumentos(
        "A chave lógica já possui um documento.",
      );
    } catch (error) {
      if (!ehErroComCodigo(error, "ENOENT")) throw error;
    }
  }

  private async criarCaminhoTemporario(): Promise<string> {
    await this.validarDiretorioControlado(DIRETORIO_TEMPORARIO);
    return path.join(
      this.obterRaiz(),
      DIRETORIO_TEMPORARIO,
      `${randomUUID()}.tmp`,
    );
  }

  private async testarEscrita(): Promise<void> {
    const arquivo = path.join(
      this.obterRaiz(),
      DIRETORIO_TEMPORARIO,
      `${randomUUID()}.probe`,
    );
    const handle = await open(arquivo, "wx", 0o600);
    await handle.close();
    await rm(arquivo, { force: true });
  }

  private async listarDiretorio(diretorio: string): Promise<Dirent[]> {
    return readdir(path.join(this.obterRaiz(), diretorio), {
      withFileTypes: true,
    });
  }
}
