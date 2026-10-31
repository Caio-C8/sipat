import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AtualizarOrcamentoManutencaoBodyData,
  CriarManutencaoBodyData,
  DadosDocumentoManutencao,
  DocumentoManutencao,
  IdentidadeAutenticada,
  ListarComissoesManutencaoQueryData,
  ListarFornecedoresManutencaoQueryData,
  ListarManutencoesQueryData,
  ManutencaoDetalhe,
  RegistrarRetornoManutencaoBodyData,
  RetornoManutencao,
} from "@repo/contracts";
import {
  CampoDadosDocumentoManutencaoSchema,
  LIMITE_DOCUMENTOS_ITEM_MANUTENCAO,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { ZodValidationException } from "nestjs-zod";
import {
  ARMAZENAMENTO_DOCUMENTOS,
  type ArmazenamentoDocumentosPorta,
} from "../../common/storage/armazenamento-documentos.port";
import { CoordenadorDocumentosService } from "../../common/storage/coordenador-documentos.service";
import { ErroArmazenamentoDocumentos } from "../../common/storage/erro-armazenamento-documentos";
import {
  type ArquivoPdfTemporario,
  validarArquivoPdf,
} from "../../common/utils/arquivo-pdf";
import {
  calcularHashIdempotencia,
  construirConflitoIdempotencia,
} from "../../common/utils/idempotencia";
import { ComissoesService } from "../comissoes/comissoes.service";
import { InventariosPolicyService } from "../inventarios/inventarios-policy.service";
import { PatrimoniosService } from "../patrimonios/patrimonios.service";
import { ManutencoesRepository } from "./manutencoes.repository";
import { ManutencaoResponseMapper } from "./mappers/manutencao-response.mapper";
import type { ManutencaoPayload } from "./types";

const dia = (valor: string) => new Date(`${valor}T00:00:00.000Z`);
const hojeSaoPaulo = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
@Injectable()
export class ManutencoesService {
  constructor(
    private readonly manutencoes: ManutencoesRepository,
    private readonly patrimonios: PatrimoniosService,
    private readonly comissoes: ComissoesService,
    private readonly inventarios: InventariosPolicyService,
    private readonly documentos: CoordenadorDocumentosService,
    @Inject(ARMAZENAMENTO_DOCUMENTOS)
    private readonly armazenamento: ArmazenamentoDocumentosPorta,
  ) {}

  async listar(query: ListarManutencoesQueryData) {
    const where: Prisma.ManutencaoWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.dataEnvioInicio || query.dataEnvioFim
        ? {
            dataEnvio: {
              ...(query.dataEnvioInicio
                ? { gte: dia(query.dataEnvioInicio) }
                : {}),
              ...(query.dataEnvioFim ? { lte: dia(query.dataEnvioFim) } : {}),
            },
          }
        : {}),
      ...(query.busca
        ? {
            OR: [
              ...(this.ehUuid(query.busca) ? [{ id: query.busca }] : []),
              {
                numeroRequisicao: {
                  contains: query.busca,
                  mode: "insensitive",
                },
              },
              {
                itens: {
                  some: {
                    patrimonio: {
                      OR: [
                        {
                          numeroPatrimonio: {
                            contains: query.busca,
                            mode: "insensitive",
                          },
                        },
                        {
                          descricao: {
                            contains: query.busca,
                            mode: "insensitive",
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [linhas, total] = await Promise.all([
      this.manutencoes.listar(
        where,
        (query.pagina - 1) * query.limite,
        query.limite,
      ),
      this.manutencoes.contar(where),
    ]);
    return {
      items: linhas.map((linha) =>
        ManutencaoResponseMapper.resumo({
          ...linha,
          totalItens: linha._count.itens,
          itensPendentes: linha.itens.length,
          temPdfPedido: linha._count.documentos > 0,
        }),
      ),
      total,
      pagina: query.pagina,
      limite: query.limite,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
    };
  }

  async consultar(id: string): Promise<ManutencaoPayload> {
    const pedido = await this.manutencoes.consultar(id);
    if (!pedido)
      throw this.naoEncontrado(
        "MANUTENCAO_NAO_ENCONTRADA",
        "Pedido de manutenção não encontrado.",
      );
    return pedido;
  }

  async listarFornecedores(query: ListarFornecedoresManutencaoQueryData) {
    const where: Prisma.FornecedorWhereInput = {
      ativo: true,
      ...(query.busca
        ? {
            OR: [
              { razaoSocial: { contains: query.busca, mode: "insensitive" } },
              { nomeFantasia: { contains: query.busca, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [linhas, total] = await Promise.all([
      this.manutencoes.listarFornecedores(
        where,
        (query.pagina - 1) * query.limite,
        query.limite,
      ),
      this.manutencoes.contarFornecedores(where),
    ]);
    return this.pagina(
      linhas.map((linha) => ({ id: linha.id, nome: linha.razaoSocial })),
      total,
      query,
    );
  }

  async listarComissoes(query: ListarComissoesManutencaoQueryData) {
    if (query.dataEnvio > hojeSaoPaulo())
      throw this.entradaInvalida(
        "DATA_ENVIO_FUTURA",
        "A data de envio não pode ser futura.",
      );
    const data = dia(query.dataEnvio);
    const where: Prisma.ComissaoWhereInput = {
      dataVigenciaInicio: { lte: data },
      dataVigenciaFim: { gte: data },
      ...(query.busca
        ? { nome: { contains: query.busca, mode: "insensitive" } }
        : {}),
    };
    const [linhas, total] = await Promise.all([
      this.manutencoes.listarComissoes(
        where,
        (query.pagina - 1) * query.limite,
        query.limite,
      ),
      this.manutencoes.contarComissoes(where),
    ]);
    return this.pagina(
      linhas.map((linha) => ({
        id: linha.id,
        nome: linha.nome,
        dataVigenciaInicio: linha.dataVigenciaInicio.toISOString().slice(0, 10),
        dataVigenciaFim: linha.dataVigenciaFim.toISOString().slice(0, 10),
      })),
      total,
      query,
    );
  }

  async criar(
    dados: CriarManutencaoBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<ManutencaoDetalhe> {
    if (dados.dataEnvio > hojeSaoPaulo())
      throw this.entradaInvalida(
        "DATA_ENVIO_FUTURA",
        "A data de envio não pode ser futura.",
      );
    const payloadHash = calcularHashIdempotencia({
      dataEnvio: dados.dataEnvio,
      comissaoId: dados.comissaoId,
      justificativa: dados.justificativa ?? null,
      itens: dados.itens,
    });
    return this.repetirTransacao(async () =>
      this.manutencoes.executarTransacao(async (repo, tx) => {
        await this.bloquearChave(repo, identidade.id, dados.chaveIdempotencia);
        const anterior = await repo.buscarIdempotencia(
          identidade.id,
          dados.chaveIdempotencia,
        );
        if (anterior)
          return this.recuperarResultado(anterior, payloadHash, "CRIACAO");

        const dataEnvio = dia(dados.dataEnvio);
        const comissao = await this.comissoes.bloquearParaMovimentacao(
          dados.comissaoId,
          tx,
        );
        this.comissoes.validarVigenciaBloqueada(comissao, dataEnvio);
        const ids = dados.itens.map((item) => item.patrimonioId).sort();
        const setores = await repo.buscarSetoresPatrimonios(ids);
        await this.inventarios.coordenarManutencao(
          ids,
          [...new Set(setores.map((setor) => setor.setorAtualId))].sort(),
          tx,
        );
        const bens = await this.patrimonios.bloquearParaMovimentacao(ids, tx);
        const abertos = new Set(
          (await repo.buscarItensAbertos(ids)).map((item) => item.patrimonioId),
        );
        const fornecedoresIds = [
          ...new Set(
            dados.itens.flatMap((item) =>
              item.fornecedorId ? [item.fornecedorId] : [],
            ),
          ),
        ];
        const fornecedores = await repo.buscarFornecedores(fornecedoresIds);
        for (const item of dados.itens) {
          const bem = bens.find((linha) => linha.id === item.patrimonioId);
          if (!bem)
            throw this.naoEncontrado(
              "PATRIMONIO_NAO_ENCONTRADO",
              "Patrimônio não encontrado.",
            );
          if (bem.status !== "ATIVO")
            throw this.conflito(
              "PATRIMONIO_NAO_ATIVO",
              "Somente patrimônio ativo pode ser enviado.",
            );
          if (abertos.has(item.patrimonioId))
            throw this.conflito(
              "PATRIMONIO_EM_OUTRA_MANUTENCAO",
              "O patrimônio já possui manutenção aberta.",
            );
          if (item.fornecedorId)
            this.exigirFornecedorAtivo(item.fornecedorId, fornecedores);
        }
        const pedido = await repo.criar({
          dataEnvio,
          comissaoId: dados.comissaoId,
          justificativa: dados.justificativa ?? null,
          createdById: identidade.id,
        });
        for (const item of dados.itens) {
          const criado = await repo.criarItem({
            manutencaoId: pedido.id,
            patrimonioId: item.patrimonioId,
            tipo: item.tipo,
            fornecedorId: item.fornecedorId ?? null,
            previsaoRetorno: item.previsaoRetorno
              ? dia(item.previsaoRetorno)
              : null,
            descricaoProblema: item.descricaoProblema ?? null,
            ...(item.orcamentoInicial
              ? {
                  dataOrcamento: dia(item.orcamentoInicial.dataOrcamento),
                  descricaoOrcamento: item.orcamentoInicial.descricaoOrcamento,
                  valorOrcamento: item.orcamentoInicial.valorOrcamento,
                  versaoOrcamento: 1,
                }
              : {}),
          });
          if (item.orcamentoInicial)
            await repo.criarRevisao({
              itemId: criado.id,
              versao: 1,
              dataOrcamento: dia(item.orcamentoInicial.dataOrcamento),
              descricaoOrcamento: item.orcamentoInicial.descricaoOrcamento,
              valorOrcamento: item.orcamentoInicial.valorOrcamento,
              fornecedorId: item.fornecedorId ?? null,
              createdById: identidade.id,
            });
          await repo.atualizarPatrimonio(item.patrimonioId, "EM_MANUTENCAO");
        }
        const detalhe = await repo.consultar(pedido.id);
        if (!detalhe) throw new Error("Pedido criado não encontrado.");
        const resultado = ManutencaoResponseMapper.detalhe(detalhe);
        await repo.salvarIdempotencia({
          usuarioId: identidade.id,
          chave: dados.chaveIdempotencia,
          tipo: "CRIACAO",
          hashPayload: payloadHash,
          manutencaoId: pedido.id,
        });
        return resultado;
      }),
    );
  }

  async atualizarOrcamento(
    pedidoId: string,
    itemId: string,
    dados: AtualizarOrcamentoManutencaoBodyData,
    identidade: IdentidadeAutenticada,
  ) {
    return this.repetirTransacao(async () =>
      this.manutencoes.executarTransacao(async (repo) => {
        if (!(await repo.bloquearItem(itemId, pedidoId)))
          throw this.naoEncontrado(
            "ITEM_MANUTENCAO_NAO_ENCONTRADO",
            "Item não encontrado neste pedido.",
          );
        const pedido = await repo.consultar(pedidoId);
        const item = pedido?.itens.find((linha) => linha.id === itemId);
        if (!pedido || !item)
          throw this.naoEncontrado(
            "ITEM_MANUTENCAO_NAO_ENCONTRADO",
            "Item não encontrado neste pedido.",
          );
        if (item.dataRetorno)
          throw this.conflito(
            "ITEM_JA_RECEBIDO",
            "O orçamento não pode ser alterado após o retorno.",
          );
        if (item.versaoOrcamento !== dados.versaoEsperada)
          throw this.conflito(
            "ORCAMENTO_VERSAO_DIVERGENTE",
            "O orçamento mudou. Atualize o item antes de salvar.",
          );
        const fornecedorId =
          dados.fornecedorId === undefined
            ? item.fornecedorId
            : dados.fornecedorId;
        if (fornecedorId && fornecedorId !== item.fornecedorId)
          this.exigirFornecedorAtivo(
            fornecedorId,
            await repo.buscarFornecedores([fornecedorId]),
          );
        const versao = item.versaoOrcamento + 1;
        await repo.criarRevisao({
          itemId,
          versao,
          dataOrcamento: dia(dados.dataOrcamento),
          descricaoOrcamento: dados.descricaoOrcamento,
          valorOrcamento: dados.valorOrcamento,
          fornecedorId,
          createdById: identidade.id,
        });
        await repo.atualizarItem(itemId, {
          versaoOrcamento: versao,
          fornecedorId,
          dataOrcamento: dia(dados.dataOrcamento),
          descricaoOrcamento: dados.descricaoOrcamento,
          valorOrcamento: dados.valorOrcamento,
          updatedAt: new Date(),
        });
        const atualizado = await repo.consultar(pedidoId);
        return atualizado!.itens.find((linha) => linha.id === itemId)!;
      }),
    );
  }

  async registrarRetorno(
    pedidoId: string,
    itemId: string,
    dados: RegistrarRetornoManutencaoBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<RetornoManutencao> {
    const payloadHash = calcularHashIdempotencia({
      pedidoId,
      itemId,
      dataRetorno: dados.dataRetorno,
      descricaoServicoRealizado: dados.descricaoServicoRealizado,
      valorRealizado: dados.valorRealizado,
      garantia: dados.garantia,
    });
    return this.repetirTransacao(async () =>
      this.manutencoes.executarTransacao(async (repo, tx) => {
        await this.bloquearChave(repo, identidade.id, dados.chaveIdempotencia);
        const anterior = await repo.buscarIdempotencia(
          identidade.id,
          dados.chaveIdempotencia,
        );
        if (anterior) {
          if (anterior.itemId !== itemId || anterior.manutencaoId !== pedidoId)
            throw this.conflitoIdempotencia("CHAVE_IDEMPOTENCIA_REUTILIZADA");
          return this.recuperarResultado(anterior, payloadHash, "RETORNO");
        }
        const pedidoAntes = await repo.consultar(pedidoId);
        const itemAntes = pedidoAntes?.itens.find(
          (linha) => linha.id === itemId,
        );
        if (!pedidoAntes || !itemAntes)
          throw this.naoEncontrado(
            "ITEM_MANUTENCAO_NAO_ENCONTRADO",
            "Item não encontrado neste pedido.",
          );
        if (
          dados.dataRetorno <
            pedidoAntes.dataEnvio.toISOString().slice(0, 10) ||
          dados.dataRetorno > hojeSaoPaulo()
        )
          throw this.entradaInvalida(
            "DATA_RETORNO_INVALIDA",
            "A data de retorno deve estar entre o envio e hoje.",
          );
        if (
          dados.garantia?.dataFim &&
          dados.garantia.dataFim < dados.dataRetorno
        )
          throw this.entradaInvalida(
            "GARANTIA_DATA_INVALIDA",
            "O fim da garantia não pode anteceder o retorno.",
          );
        const setores = await repo.buscarSetoresPatrimonios([
          itemAntes.patrimonioId,
        ]);
        await this.inventarios.coordenarManutencao(
          [itemAntes.patrimonioId],
          setores.map((setor) => setor.setorAtualId),
          tx,
        );
        const bens = await this.patrimonios.bloquearParaMovimentacao(
          [itemAntes.patrimonioId],
          tx,
        );
        await repo.bloquearItem(itemId, pedidoId);
        const pedido = await repo.consultar(pedidoId);
        const item = pedido?.itens.find((linha) => linha.id === itemId);
        if (!pedido || !item)
          throw this.naoEncontrado(
            "ITEM_MANUTENCAO_NAO_ENCONTRADO",
            "Item não encontrado neste pedido.",
          );
        if (item.dataRetorno)
          throw this.conflito("ITEM_JA_RECEBIDO", "Este item já foi recebido.");
        if (bens[0]?.status !== "EM_MANUTENCAO")
          throw this.conflito(
            "PATRIMONIO_NAO_EM_MANUTENCAO",
            "O patrimônio não está em manutenção.",
          );
        const agora = new Date();
        await repo.atualizarItem(itemId, {
          dataRetorno: dia(dados.dataRetorno),
          descricaoServicoRealizado: dados.descricaoServicoRealizado,
          valorRealizado: dados.valorRealizado,
          descricaoGarantia: dados.garantia?.descricao ?? null,
          dataFimGarantia: dados.garantia?.dataFim
            ? dia(dados.garantia.dataFim)
            : null,
          recebidoPorId: identidade.id,
          recebidoEm: agora,
          updatedAt: agora,
        });
        await repo.atualizarPatrimonio(item.patrimonioId, "ATIVO");
        if (
          pedido.itens.every(
            (linha) => linha.id === itemId || linha.dataRetorno,
          )
        )
          await repo.atualizarPedido(pedidoId, {
            status: "CONCLUIDA",
            dataRetorno: dia(dados.dataRetorno),
            updatedAt: agora,
          });
        const atualizado = await repo.consultar(pedidoId);
        if (!atualizado) throw new Error("Pedido atualizado não encontrado.");
        const atualizadoItem = atualizado.itens.find(
          (linha) => linha.id === itemId,
        );
        if (!atualizadoItem) throw new Error("Item atualizado não encontrado.");
        const resultado: RetornoManutencao = {
          item: ManutencaoResponseMapper.item(pedidoId, atualizadoItem),
          statusPedido: atualizado.status,
          dataRetornoPedido:
            atualizado.dataRetorno?.toISOString().slice(0, 10) ?? null,
        };
        await repo.salvarIdempotencia({
          usuarioId: identidade.id,
          chave: dados.chaveIdempotencia,
          tipo: "RETORNO",
          hashPayload: payloadHash,
          manutencaoId: pedidoId,
          itemId,
        });
        return resultado;
      }),
    );
  }

  async enviarDocumento(
    pedidoId: string,
    body: Record<string, unknown>,
    arquivo: ArquivoPdfTemporario | undefined,
    identidade: IdentidadeAutenticada,
  ) {
    const resultado = CampoDadosDocumentoManutencaoSchema.safeParse(body.dados);
    if (!resultado.success) throw new ZodValidationException(resultado.error);
    const dados = resultado.data;
    if (!arquivo)
      throw this.entradaInvalida(
        "DOCUMENTO_MANUTENCAO_INVALIDO",
        "Envie um PDF no campo documento.",
      );
    await validarArquivoPdf(arquivo, {
      campo: "documento",
      codigoTipoInvalido: "DOCUMENTO_MANUTENCAO_INVALIDO",
      mensagemTipoInvalido: "Envie um arquivo PDF.",
      mensagemConteudoInvalido:
        "O conteúdo do documento não corresponde a um PDF válido.",
    });
    const arquivoHash = createHash("sha256");
    for await (const bloco of createReadStream(arquivo.path))
      arquivoHash.update(bloco);
    const hashArquivo = arquivoHash.digest("hex");
    const payloadHash = calcularHashIdempotencia({
      pedidoId,
      dados,
      hashArquivo,
    });
    const anterior = await this.manutencoes.buscarIdempotencia(
      identidade.id,
      dados.chaveIdempotencia,
    );
    if (anterior)
      return this.recuperarDocumento(anterior, pedidoId, payloadHash);
    const chave = `uploads/manutencoes/${pedidoId}_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${randomUUID()}.pdf`;
    const conteudo = createReadStream(arquivo.path);
    let criado: DocumentoManutencao | null = null;
    try {
      await this.documentos.criar({ chave, conteudo }, async () => {
        criado = await this.repetirTransacao(async () =>
          this.manutencoes.executarTransacao(async (repo) => {
            await this.bloquearChave(
              repo,
              identidade.id,
              dados.chaveIdempotencia,
            );
            const existente = await repo.buscarIdempotencia(
              identidade.id,
              dados.chaveIdempotencia,
            );
            if (existente) throw new DocumentoRepetido(existente);
            const pedido = await repo.consultar(pedidoId);
            if (!pedido)
              throw this.naoEncontrado(
                "MANUTENCAO_NAO_ENCONTRADA",
                "Pedido de manutenção não encontrado.",
              );
            this.validarFaseDocumento(pedido, dados);
            if (
              dados.fase === "PEDIDO" &&
              (await repo.contarDocumentosPedido(pedidoId)) > 0
            )
              throw this.conflito(
                "LIMITE_DOCUMENTOS_MANUTENCAO",
                "O pedido já possui um PDF comum.",
              );
            if (
              dados.itemId &&
              (await repo.contarDocumentosItem(dados.itemId)) >=
                LIMITE_DOCUMENTOS_ITEM_MANUTENCAO
            )
              throw this.conflito(
                "LIMITE_DOCUMENTOS_MANUTENCAO",
                "O item já atingiu o limite de documentos.",
              );
            const doc = await repo.criarDocumento({
              manutencaoId: pedidoId,
              itemId: dados.itemId ?? null,
              fase: dados.fase,
              chave,
              nome: "Documento de manutenção.pdf",
              tamanhoBytes: arquivo.size,
              hashSha256: hashArquivo,
              createdById: identidade.id,
            });
            const resultado = ManutencaoResponseMapper.documento(pedidoId, doc);
            await repo.salvarIdempotencia({
              usuarioId: identidade.id,
              chave: dados.chaveIdempotencia,
              tipo: "DOCUMENTO",
              hashPayload: payloadHash,
              manutencaoId: pedidoId,
              itemId: dados.itemId ?? null,
              documentoId: doc.id,
            });
            return resultado;
          }),
        );
      });
    } catch (erro) {
      if (erro instanceof DocumentoRepetido)
        return this.recuperarDocumento(erro.registro, pedidoId, payloadHash);
      throw erro;
    } finally {
      conteudo.destroy();
    }
    if (!criado) throw new Error("Documento criado não encontrado.");
    return criado;
  }

  async abrirDocumento(pedidoId: string, documentoId: string) {
    const documento = await this.manutencoes.consultarDocumento(
      documentoId,
      pedidoId,
    );
    if (!documento)
      throw this.naoEncontrado(
        "DOCUMENTO_MANUTENCAO_NAO_ENCONTRADO",
        "Documento não encontrado neste pedido.",
      );
    try {
      return await this.armazenamento.abrir(documento.chave);
    } catch (erro) {
      if (erro instanceof ErroArmazenamentoDocumentos)
        throw this.naoEncontrado(
          "DOCUMENTO_MANUTENCAO_NAO_ENCONTRADO",
          "Documento não encontrado neste pedido.",
        );
      throw erro;
    }
  }

  private validarFaseDocumento(
    pedido: ManutencaoPayload,
    dados: DadosDocumentoManutencao,
  ) {
    if (dados.fase === "PEDIDO") return;
    const item = pedido.itens.find((linha) => linha.id === dados.itemId);
    if (!item)
      throw this.naoEncontrado(
        "ITEM_MANUTENCAO_NAO_ENCONTRADO",
        "Item não encontrado neste pedido.",
      );
    if (dados.fase === "ENVIO" && item.dataRetorno)
      throw this.conflito(
        "ITEM_JA_RECEBIDO",
        "Documentos de envio só podem ser anexados antes do retorno.",
      );
    if (dados.fase === "RECEBIMENTO" && !item.dataRetorno)
      throw this.conflito(
        "ITEM_JA_RECEBIDO",
        "Registre o retorno antes de anexar este documento.",
      );
  }

  private recuperarDocumento(
    registro: {
      tipo: string;
      hashPayload: string;
      manutencaoId: string;
      documentoId: string | null;
    },
    pedidoId: string,
    payloadHash: string,
  ): never {
    if (
      registro.tipo !== "DOCUMENTO" ||
      registro.hashPayload !== payloadHash ||
      registro.manutencaoId !== pedidoId ||
      !registro.documentoId
    )
      throw this.conflitoIdempotencia("CHAVE_IDEMPOTENCIA_REUTILIZADA");
    throw this.conflitoIdempotencia("OPERACAO_JA_PROCESSADA");
  }

  private recuperarResultado(
    registro: {
      tipo: string;
      hashPayload: string;
    },
    payloadHash: string,
    tipo: string,
  ): never {
    if (registro.tipo !== tipo || registro.hashPayload !== payloadHash)
      throw this.conflitoIdempotencia("CHAVE_IDEMPOTENCIA_REUTILIZADA");
    throw this.conflitoIdempotencia("OPERACAO_JA_PROCESSADA");
  }

  private async bloquearChave(
    repo: ManutencoesRepository,
    usuarioId: string,
    chave: string,
  ) {
    if (!(await repo.tentarBloquearChave(usuarioId, chave)))
      throw this.conflitoIdempotencia("OPERACAO_EM_PROCESSAMENTO");
  }
  private exigirFornecedorAtivo(
    id: string,
    fornecedores: { id: string; ativo: boolean }[],
  ) {
    const fornecedor = fornecedores.find((linha) => linha.id === id);
    if (!fornecedor)
      throw this.naoEncontrado(
        "FORNECEDOR_NAO_ENCONTRADO",
        "Fornecedor não encontrado.",
      );
    if (!fornecedor.ativo)
      throw this.conflito(
        "FORNECEDOR_INATIVO",
        "Fornecedor inativo não pode receber novo vínculo.",
      );
  }
  private pagina<T>(
    items: T[],
    total: number,
    query: { pagina: number; limite: number },
  ) {
    return {
      items,
      total,
      pagina: query.pagina,
      limite: query.limite,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
    };
  }
  private ehUuid(valor: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      valor,
    );
  }
  private conflito(codigo: string, mensagem: string) {
    return new ConflictException({ codigo, mensagem, erros: [] });
  }
  private conflitoIdempotencia(
    codigo:
      | "OPERACAO_JA_PROCESSADA"
      | "CHAVE_IDEMPOTENCIA_REUTILIZADA"
      | "OPERACAO_EM_PROCESSAMENTO",
  ) {
    return new ConflictException(construirConflitoIdempotencia(codigo));
  }
  private entradaInvalida(codigo: string, mensagem: string) {
    return new BadRequestException({ codigo, mensagem, erros: [] });
  }
  private naoEncontrado(codigo: string, mensagem: string) {
    return new NotFoundException({ codigo, mensagem, erros: [] });
  }
  private async repetirTransacao<T>(operacao: () => Promise<T>): Promise<T> {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        return await operacao();
      } catch (erro) {
        if (
          erro instanceof Prisma.PrismaClientKnownRequestError &&
          erro.code === "P2034" &&
          tentativa < 2
        )
          continue;
        if (
          erro instanceof Prisma.PrismaClientKnownRequestError &&
          erro.code === "P2002"
        )
          throw this.conflito(
            "CONFLITO_CONCORRENTE_MANUTENCAO",
            "O estado mudou durante a operação. Consulte novamente.",
          );
        throw erro;
      }
    }
    throw this.conflito(
      "CONFLITO_CONCORRENTE_MANUTENCAO",
      "O estado mudou durante a operação. Consulte novamente.",
    );
  }
}

class DocumentoRepetido extends Error {
  constructor(
    readonly registro: {
      tipo: string;
      hashPayload: string;
      manutencaoId: string;
      documentoId: string | null;
    },
  ) {
    super("Documento já registrado.");
  }
}
