import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { rm } from "node:fs/promises";
import { ZodSerializerDto } from "nestjs-zod";
import type {
  AtualizarOrcamentoManutencaoResponse,
  ConsultarManutencaoResponse,
  CriarManutencaoResponse,
  EnviarDocumentoManutencaoResponse,
  ListarComissoesManutencaoResponse,
  ListarFornecedoresManutencaoResponse,
  ListarManutencoesResponse,
  RegistrarRetornoManutencaoResponse,
} from "@repo/contracts";
import { LIMITE_BYTES_DOCUMENTO_MANUTENCAO } from "@repo/contracts";
import type { ArquivoPdfTemporario } from "../../common/utils/arquivo-pdf";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  AtualizarOrcamentoManutencaoBodyDto,
  AtualizarOrcamentoManutencaoResponseDto,
  ConsultarManutencaoResponseDto,
  CriarManutencaoBodyDto,
  CriarManutencaoResponseDto,
  DocumentoManutencaoParamsDto,
  EnviarDocumentoManutencaoResponseDto,
  ItemManutencaoParamsDto,
  ListarComissoesManutencaoQueryDto,
  ListarComissoesManutencaoResponseDto,
  ListarFornecedoresManutencaoQueryDto,
  ListarFornecedoresManutencaoResponseDto,
  ListarManutencoesQueryDto,
  ListarManutencoesResponseDto,
  ManutencaoParamsDto,
  RegistrarRetornoManutencaoBodyDto,
  RegistrarRetornoManutencaoResponseDto,
} from "./dtos";
import { ManutencaoResponseMapper } from "./mappers/manutencao-response.mapper";
import { ManutencoesService } from "./manutencoes.service";

@Controller("manutencoes")
export class ManutencoesController {
  private readonly logger = new Logger(ManutencoesController.name);
  constructor(private readonly manutencoes: ManutencoesService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarManutencoesResponseDto)
  async listar(
    @Query() query: ListarManutencoesQueryDto,
  ): Promise<ListarManutencoesResponse> {
    const { items, ...meta } = await this.manutencoes.listar(query);
    return {
      status: 200,
      sucesso: true,
      mensagem: "Pedidos de manutenção listados.",
      dados: items,
      meta,
    };
  }

  @Get("opcoes/fornecedores")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarFornecedoresManutencaoResponseDto)
  async fornecedores(
    @Query() query: ListarFornecedoresManutencaoQueryDto,
  ): Promise<ListarFornecedoresManutencaoResponse> {
    const { items, ...meta } = await this.manutencoes.listarFornecedores(query);
    return {
      status: 200,
      sucesso: true,
      mensagem: "Fornecedores ativos listados.",
      dados: items,
      meta,
    };
  }

  @Get("opcoes/comissoes")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarComissoesManutencaoResponseDto)
  async comissoes(
    @Query() query: ListarComissoesManutencaoQueryDto,
  ): Promise<ListarComissoesManutencaoResponse> {
    const { items, ...meta } = await this.manutencoes.listarComissoes(query);
    return {
      status: 200,
      sucesso: true,
      mensagem: "Comissões válidas listadas.",
      dados: items,
      meta,
    };
  }

  @Get(":manutencaoId")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ConsultarManutencaoResponseDto)
  async consultar(
    @Param() params: ManutencaoParamsDto,
  ): Promise<ConsultarManutencaoResponse> {
    return {
      status: 200,
      sucesso: true,
      mensagem: "Pedido de manutenção encontrado.",
      dados: ManutencaoResponseMapper.detalhe(
        await this.manutencoes.consultar(params.manutencaoId),
      ),
    };
  }

  @Post()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarManutencaoResponseDto)
  async criar(
    @Body() body: CriarManutencaoBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarManutencaoResponse> {
    return {
      status: 201,
      sucesso: true,
      mensagem: "Pedido de manutenção criado.",
      dados: await this.manutencoes.criar(body, request.identidadeAutenticada!),
    };
  }

  @Patch(":manutencaoId/itens/:itemId/orcamento")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(AtualizarOrcamentoManutencaoResponseDto)
  async atualizarOrcamento(
    @Param() params: ItemManutencaoParamsDto,
    @Body() body: AtualizarOrcamentoManutencaoBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<AtualizarOrcamentoManutencaoResponse> {
    return {
      status: 200,
      sucesso: true,
      mensagem: "Orçamento registrado.",
      dados: ManutencaoResponseMapper.item(
        params.manutencaoId,
        await this.manutencoes.atualizarOrcamento(
          params.manutencaoId,
          params.itemId,
          body,
          request.identidadeAutenticada!,
        ),
      ),
    };
  }

  @Post(":manutencaoId/itens/:itemId/retorno")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(RegistrarRetornoManutencaoResponseDto)
  async registrarRetorno(
    @Param() params: ItemManutencaoParamsDto,
    @Body() body: RegistrarRetornoManutencaoBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<RegistrarRetornoManutencaoResponse> {
    const dados = await this.manutencoes.registrarRetorno(
      params.manutencaoId,
      params.itemId,
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: 200,
      sucesso: true,
      mensagem: "Retorno registrado.",
      dados,
    };
  }

  @Post(":manutencaoId/documentos")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @UseInterceptors(
    FileInterceptor("documento", {
      limits: {
        fields: 1,
        files: 1,
        parts: 2,
        fileSize: LIMITE_BYTES_DOCUMENTO_MANUTENCAO,
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(EnviarDocumentoManutencaoResponseDto)
  async enviarDocumento(
    @Param() params: ManutencaoParamsDto,
    @Body() body: Record<string, unknown>,
    @UploadedFile() arquivo: ArquivoPdfTemporario | undefined,
    @Req() request: RequisicaoAutenticada,
  ): Promise<EnviarDocumentoManutencaoResponse> {
    try {
      const doc = await this.manutencoes.enviarDocumento(
        params.manutencaoId,
        body,
        arquivo,
        request.identidadeAutenticada!,
      );
      return {
        status: 201,
        sucesso: true,
        mensagem: "Documento anexado.",
        dados: doc,
      };
    } finally {
      if (arquivo)
        await rm(arquivo.path, { force: true }).catch(() =>
          this.logger.error(
            "Falha ao remover arquivo temporário de manutenção.",
          ),
        );
    }
  }

  @Get(":manutencaoId/documentos/:documentoId")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @Header("Cache-Control", "private, no-store")
  async abrirDocumento(
    @Param() params: DocumentoManutencaoParamsDto,
  ): Promise<StreamableFile> {
    const doc = await this.manutencoes.abrirDocumento(
      params.manutencaoId,
      params.documentoId,
    );
    return new StreamableFile(doc.conteudo, {
      type: "application/pdf",
      disposition: `attachment; filename="manutencao-${params.documentoId}.pdf"`,
      length: doc.tamanho,
    });
  }
}
