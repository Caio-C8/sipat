import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  CAMPO_ANEXOS_CRIAR_PROCESSO_COMPRA,
  type AlterarProcessoCompraResponse,
  type ConsultarProcessoCompraResponse,
  type CriarProcessoCompraResponse,
  LIMITE_ANEXOS_CRIAR_PROCESSO_COMPRA,
  LIMITE_BYTES_ANEXO_NOTA_FISCAL,
  LIMITE_CAMPOS_CRIAR_PROCESSO_COMPRA,
  LIMITE_PARTES_CRIAR_PROCESSO_COMPRA,
  type ListarProcessosCompraResponse,
} from "@repo/contracts";
import { rm } from "node:fs/promises";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  AlterarProcessoCompraBodyDto,
  AlterarProcessoCompraResponseDto,
  ConsultarProcessoCompraResponseDto,
  CriarProcessoCompraResponseDto,
  ListarProcessosCompraQueryDto,
  ListarProcessosCompraResponseDto,
  ProcessoCompraParamsDto,
} from "./dtos";
import { ProcessoCompraResponseMapper } from "./mappers";
import { ProcessosCompraService } from "./processos-compra.service";
import type { ArquivoMultipart } from "./types";

@Controller("processos-compra")
export class ProcessosCompraController {
  private readonly logger = new Logger(ProcessosCompraController.name);

  constructor(private readonly processosService: ProcessosCompraService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarProcessosCompraResponseDto)
  async listar(
    @Query() query: ListarProcessosCompraQueryDto,
  ): Promise<ListarProcessosCompraResponse> {
    const resultado = await this.processosService.listar(query);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Processos de compra listados com sucesso.",
      dados: resultado.items.map(ProcessoCompraResponseMapper.paraResumo),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
    };
  }

  @Get(":processoCompraId")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ConsultarProcessoCompraResponseDto)
  async consultar(
    @Param() params: ProcessoCompraParamsDto,
  ): Promise<ConsultarProcessoCompraResponse> {
    const processo = await this.processosService.consultar(
      params.processoCompraId,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Processo de compra encontrado com sucesso.",
      dados: ProcessoCompraResponseMapper.paraDetalhe(processo),
    };
  }

  @Post()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @UseInterceptors(
    FilesInterceptor(
      CAMPO_ANEXOS_CRIAR_PROCESSO_COMPRA,
      LIMITE_ANEXOS_CRIAR_PROCESSO_COMPRA,
      {
        limits: {
          fields: LIMITE_CAMPOS_CRIAR_PROCESSO_COMPRA,
          files: LIMITE_ANEXOS_CRIAR_PROCESSO_COMPRA,
          parts: LIMITE_PARTES_CRIAR_PROCESSO_COMPRA,
          fileSize: LIMITE_BYTES_ANEXO_NOTA_FISCAL,
        },
      },
    ),
  )
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarProcessoCompraResponseDto)
  async criar(
    @Body() body: Record<string, unknown>,
    @UploadedFiles() anexos: ArquivoMultipart[] | undefined,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarProcessoCompraResponse> {
    const arquivos = anexos ?? [];
    try {
      const processo = await this.processosService.criar(
        body,
        arquivos,
        request.identidadeAutenticada!,
      );
      return {
        status: HttpStatus.CREATED,
        sucesso: true,
        mensagem: "Processo de compra criado com sucesso.",
        dados: ProcessoCompraResponseMapper.paraDetalhe(processo),
      };
    } finally {
      const resultados = await Promise.allSettled(
        arquivos.map((arquivo) => rm(arquivo.path, { force: true })),
      );
      if (resultados.some((resultado) => resultado.status === "rejected")) {
        this.logger.error(
          "Falha ao remover arquivo temporário multipart; a reconciliação deverá tratá-lo.",
        );
      }
    }
  }

  @Patch(":processoCompraId")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(AlterarProcessoCompraResponseDto)
  async alterar(
    @Param() params: ProcessoCompraParamsDto,
    @Body() body: AlterarProcessoCompraBodyDto,
  ): Promise<AlterarProcessoCompraResponse> {
    const processo = await this.processosService.alterar(
      params.processoCompraId,
      body,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Processo de compra alterado com sucesso.",
      dados: ProcessoCompraResponseMapper.paraDetalhe(processo),
    };
  }
}
