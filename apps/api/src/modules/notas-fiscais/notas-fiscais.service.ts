import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AlterarNotaFiscalBodyData,
  CriarNotaFiscalDados,
  IdentidadeAutenticada,
  ListarNotasFiscaisQueryData,
} from "@repo/contracts";
import {
  CriarNotaFiscalMultipartSchema,
  SubstituirAnexoNotaFiscalMultipartSchema,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { createReadStream } from "node:fs";
import { ZodValidationException } from "nestjs-zod";
import {
  ARMAZENAMENTO_DOCUMENTOS,
  type ArmazenamentoDocumentosPorta,
} from "../../common/storage/armazenamento-documentos.port";
import { CoordenadorDocumentosService } from "../../common/storage/coordenador-documentos.service";
import { ErroArmazenamentoDocumentos } from "../../common/storage/erro-armazenamento-documentos";
import {
  criarChaveAnexoNotaFiscal,
  validarAnexoNotaFiscal,
} from "../../common/utils/anexo-nota-fiscal";
import { FornecedoresService } from "../fornecedores/fornecedores.service";
import { NotasFiscaisRepository } from "./notas-fiscais.repository";
import type {
  AnexoNotaFiscalAberto,
  ArquivoNotaFiscalMultipart,
  ListarNotasFiscaisResultado,
  NotaFiscalDetalhePayload,
} from "./types";

@Injectable()
export class NotasFiscaisService {
  constructor(
    private readonly notas: NotasFiscaisRepository,
    private readonly fornecedores: FornecedoresService,
    private readonly documentos: CoordenadorDocumentosService,
    @Inject(ARMAZENAMENTO_DOCUMENTOS)
    private readonly armazenamento: ArmazenamentoDocumentosPorta,
  ) {}

  async criar(
    body: Record<string, unknown>,
    arquivo: ArquivoNotaFiscalMultipart | undefined,
    identidade: IdentidadeAutenticada,
  ): Promise<NotaFiscalDetalhePayload> {
    const resultado = CriarNotaFiscalMultipartSchema.safeParse({
      ...body,
      anexo: arquivo,
    });
    if (!resultado.success) throw new ZodValidationException(resultado.error);

    const dados = resultado.data.dados;
    const anexo = resultado.data.anexo as
      ArquivoNotaFiscalMultipart | undefined;
    if (anexo) await validarAnexoNotaFiscal(anexo, "anexo");

    await this.validarRelacoesParaCriacao(dados);
    const persistir = (caminhoAnexoNotaFiscal?: string) =>
      this.notas.executarTransacao(async (transacao) => {
        if ((await transacao.processoExiste(dados.processoCompraId)) === null) {
          throw this.processoNaoEncontrado();
        }
        await this.garantirFornecedorAtivo(transacao, dados.fornecedorId);
        return transacao.criar(
          this.paraCriacao(dados, identidade.id, caminhoAnexoNotaFiscal),
        );
      });

    if (!anexo) return persistir();

    const anexoChave = criarChaveAnexoNotaFiscal(dados.numeroNotaFiscal);
    const conteudo = createReadStream(anexo.path);
    let criada: NotaFiscalDetalhePayload | undefined;
    try {
      await this.documentos.criar({ chave: anexoChave, conteudo }, async () => {
        criada = await persistir(anexoChave);
      });
    } finally {
      conteudo.destroy();
    }

    if (!criada)
      throw new Error("A nota fiscal criada não pôde ser recuperada.");
    return criada;
  }

  async listar(
    query: ListarNotasFiscaisQueryData,
  ): Promise<ListarNotasFiscaisResultado> {
    const where = this.paraFiltro(query);
    const skip = (query.pagina - 1) * query.limite;
    const [items, total] = await Promise.all([
      this.notas.listar({ where, skip, take: query.limite }),
      this.notas.contar(where),
    ]);

    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async consultar(notaFiscalId: string): Promise<NotaFiscalDetalhePayload> {
    const nota = await this.notas.buscarPorId(notaFiscalId);
    if (nota === null) throw this.notaNaoEncontrada();
    return nota;
  }

  async alterar(
    notaFiscalId: string,
    dados: AlterarNotaFiscalBodyData,
  ): Promise<NotaFiscalDetalhePayload> {
    if (dados.fornecedorId !== undefined) {
      await this.fornecedores.consultarAtivoParaVinculo(dados.fornecedorId);
    }

    try {
      return await this.notas.executarTransacao(async (transacao) => {
        if ((await transacao.buscarPorId(notaFiscalId)) === null) {
          throw this.notaNaoEncontrada();
        }
        if (dados.fornecedorId !== undefined) {
          await this.garantirFornecedorAtivo(transacao, dados.fornecedorId);
        }
        return transacao.alterar(notaFiscalId, {
          ...(dados.numeroNotaFiscal === undefined
            ? {}
            : { numeroNotaFiscal: dados.numeroNotaFiscal }),
          ...(dados.anoNotaFiscal === undefined
            ? {}
            : { anoNotaFiscal: dados.anoNotaFiscal }),
          ...(dados.dataEmissao === undefined
            ? {}
            : { dataEmissao: new Date(`${dados.dataEmissao}T00:00:00.000Z`) }),
          ...(dados.fornecedorId === undefined
            ? {}
            : { fornecedor: { connect: { id: dados.fornecedorId } } }),
          updatedAt: new Date(),
        });
      });
    } catch (erro: unknown) {
      if (this.ehErroPrisma(erro, "P2025")) throw this.notaNaoEncontrada();
      throw erro;
    }
  }

  async substituirAnexo(
    notaFiscalId: string,
    arquivo: ArquivoNotaFiscalMultipart | undefined,
  ): Promise<NotaFiscalDetalhePayload> {
    const resultado = SubstituirAnexoNotaFiscalMultipartSchema.safeParse({
      anexo: arquivo,
    });
    if (!resultado.success) throw new ZodValidationException(resultado.error);

    const anexo = resultado.data.anexo as ArquivoNotaFiscalMultipart;
    await validarAnexoNotaFiscal(anexo, "anexo");
    const nota = await this.consultar(notaFiscalId);
    const chaveAtual = nota.caminhoAnexoNotaFiscal;
    const novaChave = criarChaveAnexoNotaFiscal(nota.numeroNotaFiscal);
    const conteudo = createReadStream(anexo.path);

    try {
      const persistir = async () => {
        const alterou = await this.notas.alterarAnexoSeAtual(
          notaFiscalId,
          chaveAtual,
          novaChave,
        );
        if (!alterou) throw this.anexoAlteradoConcorrentemente();
      };

      if (chaveAtual === null) {
        await this.documentos.criar({ chave: novaChave, conteudo }, persistir);
      } else {
        await this.documentos.substituir(
          chaveAtual,
          { chave: novaChave, conteudo },
          persistir,
        );
      }
    } finally {
      conteudo.destroy();
    }

    return this.consultar(notaFiscalId);
  }

  async removerAnexo(notaFiscalId: string): Promise<NotaFiscalDetalhePayload> {
    const nota = await this.consultar(notaFiscalId);
    const chaveAtual = nota.caminhoAnexoNotaFiscal;
    if (chaveAtual === null) return nota;

    await this.documentos.remover(chaveAtual, async () => {
      const alterou = await this.notas.alterarAnexoSeAtual(
        notaFiscalId,
        chaveAtual,
        null,
      );
      if (!alterou) throw this.anexoAlteradoConcorrentemente();
    });
    return this.consultar(notaFiscalId);
  }

  async abrirAnexo(notaFiscalId: string): Promise<AnexoNotaFiscalAberto> {
    const nota = await this.consultar(notaFiscalId);
    if (nota.caminhoAnexoNotaFiscal === null) throw this.anexoNaoEncontrado();

    try {
      return await this.armazenamento.abrir(nota.caminhoAnexoNotaFiscal);
    } catch (erro: unknown) {
      if (erro instanceof ErroArmazenamentoDocumentos) {
        throw this.anexoNaoEncontrado();
      }
      throw erro;
    }
  }

  private async validarRelacoesParaCriacao(
    dados: CriarNotaFiscalDados,
  ): Promise<void> {
    const [processo] = await Promise.all([
      this.notas.processoExiste(dados.processoCompraId),
      this.fornecedores.consultarAtivoParaVinculo(dados.fornecedorId),
    ]);
    if (processo === null) throw this.processoNaoEncontrado();
  }

  private async garantirFornecedorAtivo(
    repository: NotasFiscaisRepository,
    fornecedorId: string,
  ): Promise<void> {
    if (await repository.bloquearFornecedorAtivo(fornecedorId)) return;
    throw new ConflictException({
      codigo: "FORNECEDOR_INDISPONIVEL_PARA_VINCULO",
      mensagem:
        "O fornecedor informado deixou de estar disponível para vínculo.",
      erros: [],
    });
  }

  private paraCriacao(
    dados: CriarNotaFiscalDados,
    createdById: string,
    caminhoAnexoNotaFiscal: string | undefined,
  ): Prisma.NotaFiscalCreateInput {
    return {
      numeroNotaFiscal: dados.numeroNotaFiscal,
      anoNotaFiscal: dados.anoNotaFiscal,
      dataEmissao: new Date(`${dados.dataEmissao}T00:00:00.000Z`),
      caminhoAnexoNotaFiscal,
      processoCompra: { connect: { id: dados.processoCompraId } },
      fornecedor: { connect: { id: dados.fornecedorId } },
      createdBy: { connect: { id: createdById } },
    };
  }

  private paraFiltro(
    query: ListarNotasFiscaisQueryData,
  ): Prisma.NotaFiscalWhereInput {
    return {
      ...(query.busca === undefined
        ? {}
        : {
            numeroNotaFiscal: {
              contains: query.busca,
              mode: "insensitive" as const,
            },
          }),
      ...(query.processoCompraId === undefined
        ? {}
        : { processoCompraId: query.processoCompraId }),
      ...(query.fornecedorId === undefined
        ? {}
        : { fornecedorId: query.fornecedorId }),
      ...(query.anoNotaFiscal === undefined
        ? {}
        : { anoNotaFiscal: query.anoNotaFiscal }),
    };
  }

  private ehErroPrisma(erro: unknown, codigo: string): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private notaNaoEncontrada(): NotFoundException {
    return new NotFoundException({
      codigo: "NOTA_FISCAL_NAO_ENCONTRADA",
      mensagem: "A nota fiscal informada não foi encontrada.",
      erros: [],
    });
  }

  private processoNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "PROCESSO_COMPRA_NAO_ENCONTRADO",
      mensagem: "O processo de compra informado não foi encontrado.",
      erros: [],
    });
  }

  private anexoNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "ANEXO_NOTA_FISCAL_NAO_ENCONTRADO",
      mensagem: "O anexo da nota fiscal não foi encontrado.",
      erros: [],
    });
  }

  private anexoAlteradoConcorrentemente(): ConflictException {
    return new ConflictException({
      codigo: "ANEXO_NOTA_FISCAL_ALTERADO",
      mensagem: "O anexo foi alterado por outra operação.",
      erros: [],
    });
  }
}
