import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  BaixarPatrimonioDados,
  IdentidadeAutenticada,
} from "@repo/contracts";
import { BaixarPatrimonioMultipartSchema } from "@repo/contracts";
import { Prisma } from "@repo/database";
import { createReadStream } from "node:fs";
import { ZodValidationException } from "nestjs-zod";
import {
  ARMAZENAMENTO_DOCUMENTOS,
  type ArmazenamentoDocumentosPorta,
} from "../../common/storage/armazenamento-documentos.port";
import { CoordenadorDocumentosService } from "../../common/storage/coordenador-documentos.service";
import { ErroArmazenamentoDocumentos } from "../../common/storage/erro-armazenamento-documentos";
import { ComissoesService } from "../comissoes/comissoes.service";
import { InventariosPolicyService } from "../inventarios/inventarios-policy.service";
import { BaixasRepository } from "./baixas.repository";
import {
  criarChaveDocumentoBaixa,
  validarDocumentoBaixa,
} from "./documento-baixa";
import type {
  ArquivoBaixaMultipart,
  BaixaDetalhePayload,
  DocumentoBaixaAberto,
} from "./types";
import { Inject } from "@nestjs/common";

@Injectable()
export class BaixasService {
  constructor(
    private readonly baixas: BaixasRepository,
    private readonly comissoes: ComissoesService,
    private readonly inventariosPolicy: InventariosPolicyService,
    private readonly documentos: CoordenadorDocumentosService,
    @Inject(ARMAZENAMENTO_DOCUMENTOS)
    private readonly armazenamento: ArmazenamentoDocumentosPorta,
  ) {}

  async criar(
    patrimonioId: string,
    body: Record<string, unknown>,
    arquivo: ArquivoBaixaMultipart | undefined,
    identidade: IdentidadeAutenticada,
  ): Promise<BaixaDetalhePayload> {
    const resultado = BaixarPatrimonioMultipartSchema.safeParse({
      ...body,
      documento: arquivo,
    });
    if (!resultado.success) throw new ZodValidationException(resultado.error);

    const dados = resultado.data.dados;
    const documento = resultado.data.documento as
      ArquivoBaixaMultipart | undefined;
    if (documento) await validarDocumentoBaixa(documento);

    this.exigirDataNaoFutura(dados.dataBaixa);
    await this.validarComissaoPublicamente(dados);
    await this.inventariosPolicy.exigirPatrimonioPodeSerBaixado(patrimonioId);

    const persistir = (caminhoAnexoDocumento?: string) =>
      this.persistir(patrimonioId, dados, identidade.id, caminhoAnexoDocumento);

    if (!documento) return persistir();

    const chave = criarChaveDocumentoBaixa(patrimonioId);
    const conteudo = createReadStream(documento.path);
    let criada: BaixaDetalhePayload | undefined;
    try {
      await this.documentos.criar({ chave, conteudo }, async () => {
        criada = await persistir(chave);
      });
    } finally {
      conteudo.destroy();
    }

    if (!criada) throw new Error("A baixa criada não pôde ser recuperada.");
    return criada;
  }

  async consultar(patrimonioId: string): Promise<BaixaDetalhePayload> {
    const baixa = await this.baixas.buscarPorPatrimonio(patrimonioId);
    if (baixa === null) throw this.baixaNaoEncontrada();
    return baixa;
  }

  async abrirDocumento(patrimonioId: string): Promise<DocumentoBaixaAberto> {
    const baixa = await this.consultar(patrimonioId);
    if (baixa.caminhoAnexoDocumento === null) {
      throw this.documentoNaoEncontrado();
    }

    try {
      return await this.armazenamento.abrir(baixa.caminhoAnexoDocumento);
    } catch (erro) {
      if (erro instanceof ErroArmazenamentoDocumentos) {
        throw this.documentoNaoEncontrado();
      }
      throw erro;
    }
  }

  private async persistir(
    patrimonioId: string,
    dados: BaixarPatrimonioDados,
    createdById: string,
    caminhoAnexoDocumento?: string,
  ): Promise<BaixaDetalhePayload> {
    const dataBaixa = this.paraDataCivil(dados.dataBaixa);
    try {
      return await this.baixas.executarTransacao(async (transacao) => {
        const patrimonio = await transacao.bloquearPatrimonio(patrimonioId);
        if (patrimonio === null) throw this.patrimonioNaoEncontrado();

        if ((await transacao.buscarPorPatrimonio(patrimonioId)) !== null) {
          throw this.baixaJaExistente();
        }
        if (patrimonio.status !== "ATIVO") {
          throw new ConflictException({
            codigo: "PATRIMONIO_NAO_ATIVO",
            mensagem: "Somente um patrimônio ativo pode ser baixado.",
            erros: [],
          });
        }

        const comissao = await transacao.bloquearComissao(dados.comissaoId);
        if (
          comissao === null ||
          dataBaixa < comissao.dataVigenciaInicio ||
          dataBaixa > comissao.dataVigenciaFim
        ) {
          throw this.comissaoInvalida();
        }

        const baixa = await transacao.criar({
          patrimonioId,
          comissaoId: dados.comissaoId,
          createdById,
          dataBaixa,
          tipo: dados.tipo,
          motivo: dados.motivo,
          observacao: dados.observacao,
          caminhoAnexoDocumento,
        });
        await transacao.marcarPatrimonioBaixado(patrimonioId);
        return baixa;
      });
    } catch (erro) {
      if (
        erro instanceof ConflictException ||
        erro instanceof NotFoundException
      ) {
        throw erro;
      }
      if (this.ehErroPrisma(erro, "P2002")) throw this.baixaJaExistente();
      if (this.ehConflitoInventarioAberto(erro)) {
        throw this.patrimonioEmInventarioAberto();
      }
      throw erro;
    }
  }

  private async validarComissaoPublicamente(
    dados: BaixarPatrimonioDados,
  ): Promise<void> {
    try {
      await this.comissoes.consultarVigente(dados.comissaoId, dados.dataBaixa);
    } catch (erro) {
      if (
        erro instanceof ConflictException ||
        erro instanceof NotFoundException
      ) {
        throw this.comissaoInvalida();
      }
      throw erro;
    }
  }

  private exigirDataNaoFutura(dataBaixa: string): void {
    const agora = new Date();
    const hoje = [
      agora.getFullYear(),
      String(agora.getMonth() + 1).padStart(2, "0"),
      String(agora.getDate()).padStart(2, "0"),
    ].join("-");
    if (dataBaixa > hoje) {
      throw new ConflictException({
        codigo: "DATA_BAIXA_FUTURA",
        mensagem: "A data da baixa não pode ser futura.",
        erros: [],
      });
    }
  }

  private paraDataCivil(data: string): Date {
    return new Date(`${data}T00:00:00.000Z`);
  }

  private ehConflitoInventarioAberto(erro: unknown): boolean {
    if (!(erro instanceof Prisma.PrismaClientKnownRequestError)) return false;
    const detalhes = [erro.message, JSON.stringify(erro.meta ?? {})].join(" ");
    return (
      detalhes.includes("patrimonio_inventario_aberto_check") ||
      detalhes.includes("patrimonio participante de inventario aberto")
    );
  }

  private ehErroPrisma(
    erro: unknown,
    codigo: string,
  ): erro is Prisma.PrismaClientKnownRequestError {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private baixaJaExistente(): ConflictException {
    return new ConflictException({
      codigo: "BAIXA_JA_EXISTENTE",
      mensagem: "O patrimônio já possui uma baixa registrada.",
      erros: [],
    });
  }

  private patrimonioEmInventarioAberto(): ConflictException {
    return new ConflictException({
      codigo: "PATRIMONIO_EM_INVENTARIO_ABERTO",
      mensagem:
        "O patrimônio não pode ser baixado enquanto participar de um inventário não finalizado.",
      erros: [],
    });
  }

  private comissaoInvalida(): ConflictException {
    return new ConflictException({
      codigo: "COMISSAO_INVALIDA",
      mensagem: "A comissão deve existir e estar vigente na data da baixa.",
      erros: [],
    });
  }

  private patrimonioNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "PATRIMONIO_NAO_ENCONTRADO",
      mensagem: "O patrimônio informado não foi encontrado.",
      erros: [],
    });
  }

  private baixaNaoEncontrada(): NotFoundException {
    return new NotFoundException({
      codigo: "BAIXA_NAO_ENCONTRADA",
      mensagem: "A baixa do patrimônio não foi encontrada.",
      erros: [],
    });
  }

  private documentoNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "DOCUMENTO_BAIXA_NAO_ENCONTRADO",
      mensagem: "O documento da baixa não foi encontrado.",
      erros: [],
    });
  }
}
