import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import type {
  AlterarProcessoCompraBodyData,
  CriarProcessoCompraDados,
  IdentidadeAutenticada,
  ListarProcessosCompraQueryData,
} from "@repo/contracts";
import {
  CriarProcessoCompraMultipartSchema,
  EXTENSAO_ANEXO_NOTA_FISCAL,
  TIPO_MIME_ANEXO_NOTA_FISCAL,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { open } from "node:fs/promises";
import { ZodValidationException } from "nestjs-zod";
import { CoordenadorDocumentosService } from "../../common/storage/coordenador-documentos.service";
import { FornecedoresService } from "../fornecedores/fornecedores.service";
import { ProcessosCompraRepository } from "./processos-compra.repository";
import type {
  ArquivoMultipart,
  ListarProcessosCompraResultado,
  ProcessoCompraDetalhePayload,
} from "./types";

@Injectable()
export class ProcessosCompraService {
  constructor(
    private readonly processos: ProcessosCompraRepository,
    private readonly fornecedores: FornecedoresService,
    private readonly documentos: CoordenadorDocumentosService,
  ) {}

  async criar(
    body: Record<string, unknown>,
    anexos: readonly ArquivoMultipart[],
    identidade: IdentidadeAutenticada,
  ): Promise<ProcessoCompraDetalhePayload> {
    const resultado = CriarProcessoCompraMultipartSchema.safeParse({
      ...body,
      anexos,
    });
    if (!resultado.success) throw new ZodValidationException(resultado.error);

    const dados = resultado.data.dados;
    const arquivos = resultado.data.anexos as ArquivoMultipart[];
    await this.validarArquivos(arquivos);

    const fornecedorIds = [
      ...new Set(dados.notas.map((nota) => nota.fornecedorId)),
    ];
    await Promise.all(
      fornecedorIds.map((fornecedorId) =>
        this.fornecedores.consultarAtivoParaVinculo(fornecedorId),
      ),
    );

    const chaves = new Map<number, string>();
    for (const [indiceNota, nota] of dados.notas.entries()) {
      if (nota.anexoIndice !== undefined) {
        chaves.set(indiceNota, this.criarChaveDocumento(nota.numeroNotaFiscal));
      }
    }

    const documentos = dados.notas.flatMap((nota, indiceNota) => {
      if (nota.anexoIndice === undefined) return [];
      const arquivo = arquivos[nota.anexoIndice];
      const chave = chaves.get(indiceNota);
      if (!arquivo || !chave) {
        throw new Error("Associação de anexo validada ficou inconsistente.");
      }
      return [{ chave, conteudo: createReadStream(arquivo.path) }];
    });

    let criado: ProcessoCompraDetalhePayload | undefined;
    try {
      await this.documentos.criarMuitos(documentos, async () => {
        criado = await this.processos.executarTransacao(async (transacao) => {
          const ativos =
            await transacao.bloquearFornecedoresAtivos(fornecedorIds);
          if (fornecedorIds.some((id) => !ativos.has(id))) {
            throw new ConflictException({
              codigo: "FORNECEDOR_INDISPONIVEL_PARA_VINCULO",
              mensagem:
                "Um fornecedor informado deixou de estar disponível para vínculo.",
              erros: [],
            });
          }

          return transacao.criar(
            this.paraCriacao(dados, identidade.id, chaves),
          );
        });
      });
    } finally {
      for (const documento of documentos) documento.conteudo.destroy();
    }

    if (!criado) throw new Error("O processo criado não pôde ser recuperado.");
    return criado;
  }

  async listar(
    query: ListarProcessosCompraQueryData,
  ): Promise<ListarProcessosCompraResultado> {
    const where = this.paraFiltro(query);
    const skip = (query.pagina - 1) * query.limite;
    const [items, total] = await Promise.all([
      this.processos.listar({ where, skip, take: query.limite }),
      this.processos.contar(where),
    ]);

    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async consultar(
    processoCompraId: string,
  ): Promise<ProcessoCompraDetalhePayload> {
    const processo = await this.processos.buscarPorId(processoCompraId);
    if (processo === null) throw this.processoNaoEncontrado();
    return processo;
  }

  async alterar(
    processoCompraId: string,
    dados: AlterarProcessoCompraBodyData,
  ): Promise<ProcessoCompraDetalhePayload> {
    if ((await this.processos.buscarPorId(processoCompraId)) === null) {
      throw this.processoNaoEncontrado();
    }

    try {
      return await this.processos.alterar(processoCompraId, {
        ...dados,
        updatedAt: new Date(),
      });
    } catch (erro: unknown) {
      if (this.ehErroPrisma(erro, "P2025")) throw this.processoNaoEncontrado();
      throw erro;
    }
  }

  private paraCriacao(
    dados: CriarProcessoCompraDados,
    createdById: string,
    chaves: ReadonlyMap<number, string>,
  ): Prisma.ProcessoCompraCreateInput {
    return {
      numeroProcesso: dados.numeroProcesso,
      anoProcesso: dados.anoProcesso,
      numeroEmpenho: dados.numeroEmpenho,
      anoEmpenho: dados.anoEmpenho,
      valorTotal: dados.valorTotal,
      observacao: dados.observacao,
      createdBy: { connect: { id: createdById } },
      notasFiscais: {
        create: dados.notas.map((nota, indice) => ({
          numeroNotaFiscal: nota.numeroNotaFiscal,
          anoNotaFiscal: nota.anoNotaFiscal,
          dataEmissao: new Date(`${nota.dataEmissao}T00:00:00.000Z`),
          caminhoAnexoNotaFiscal: chaves.get(indice),
          fornecedor: { connect: { id: nota.fornecedorId } },
          createdBy: { connect: { id: createdById } },
        })),
      },
    };
  }

  private paraFiltro(
    query: ListarProcessosCompraQueryData,
  ): Prisma.ProcessoCompraWhereInput {
    return {
      ...(query.busca === undefined
        ? {}
        : {
            OR: [
              {
                numeroProcesso: { contains: query.busca, mode: "insensitive" },
              },
              { numeroEmpenho: { contains: query.busca, mode: "insensitive" } },
            ],
          }),
      ...(query.anoProcesso === undefined
        ? {}
        : { anoProcesso: query.anoProcesso }),
      ...(query.anoEmpenho === undefined
        ? {}
        : { anoEmpenho: query.anoEmpenho }),
      ...(query.fornecedorId === undefined
        ? {}
        : { notasFiscais: { some: { fornecedorId: query.fornecedorId } } }),
    };
  }

  private async validarArquivos(
    arquivos: readonly ArquivoMultipart[],
  ): Promise<void> {
    for (const [indice, arquivo] of arquivos.entries()) {
      if (
        arquivo.mimetype !== TIPO_MIME_ANEXO_NOTA_FISCAL ||
        !arquivo.originalname.toLowerCase().endsWith(EXTENSAO_ANEXO_NOTA_FISCAL)
      ) {
        throw new UnsupportedMediaTypeException({
          codigo: "ANEXO_NOTA_FISCAL_INVALIDO",
          mensagem: "O anexo da nota fiscal deve ser um arquivo PDF.",
          erros: [
            {
              campo: `anexos.${indice}`,
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
                campo: `anexos.${indice}`,
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
  }

  private criarChaveDocumento(numeroNotaFiscal: string): string {
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

  private ehErroPrisma(erro: unknown, codigo: string): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private processoNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "PROCESSO_COMPRA_NAO_ENCONTRADO",
      mensagem: "O processo de compra informado não foi encontrado.",
      erros: [],
    });
  }
}
