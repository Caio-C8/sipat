import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  CAMPO_DOCUMENTO_BAIXAR_PATRIMONIO,
  type BaixarPatrimonioResponse,
  type ConsultarBaixaPatrimonioResponse,
  LIMITE_ARQUIVOS_BAIXAR_PATRIMONIO,
  LIMITE_BYTES_DOCUMENTO_BAIXA_PATRIMONIO,
  LIMITE_CAMPOS_BAIXAR_PATRIMONIO,
  LIMITE_PARTES_BAIXAR_PATRIMONIO,
  TIPO_MIME_DOCUMENTO_BAIXA_PATRIMONIO,
} from "@repo/contracts";
import { rm } from "node:fs/promises";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import { BaixasService } from "./baixas.service";
import {
  BaixaPatrimonioParamsDto,
  BaixarPatrimonioResponseDto,
  ConsultarBaixaPatrimonioResponseDto,
} from "./dtos";
import { BaixaResponseMapper } from "./mappers";
import type { ArquivoBaixaMultipart } from "./types";

@Controller("patrimonios/:patrimonioId/baixa")
export class BaixasController {
  private readonly logger = new Logger(BaixasController.name);

  constructor(private readonly baixas: BaixasService) {}

  @Post()
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @UseInterceptors(
    FileInterceptor(CAMPO_DOCUMENTO_BAIXAR_PATRIMONIO, {
      limits: {
        fields: LIMITE_CAMPOS_BAIXAR_PATRIMONIO,
        files: LIMITE_ARQUIVOS_BAIXAR_PATRIMONIO,
        parts: LIMITE_PARTES_BAIXAR_PATRIMONIO,
        fileSize: LIMITE_BYTES_DOCUMENTO_BAIXA_PATRIMONIO,
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(BaixarPatrimonioResponseDto)
  async criar(
    @Param() params: BaixaPatrimonioParamsDto,
    @Body() body: Record<string, unknown>,
    @UploadedFile() arquivo: ArquivoBaixaMultipart | undefined,
    @Req() request: RequisicaoAutenticada,
  ): Promise<BaixarPatrimonioResponse> {
    try {
      const baixa = await this.baixas.criar(
        params.patrimonioId,
        body,
        arquivo,
        request.identidadeAutenticada!,
      );
      return {
        status: HttpStatus.CREATED,
        sucesso: true,
        mensagem: "Baixa patrimonial registrada com sucesso.",
        dados: BaixaResponseMapper.paraDetalhe(baixa),
      };
    } finally {
      await this.removerTemporario(arquivo);
    }
  }

  @Get()
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ConsultarBaixaPatrimonioResponseDto)
  async consultar(
    @Param() params: BaixaPatrimonioParamsDto,
  ): Promise<ConsultarBaixaPatrimonioResponse> {
    const baixa = await this.baixas.consultar(params.patrimonioId);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Baixa patrimonial encontrada com sucesso.",
      dados: BaixaResponseMapper.paraDetalhe(baixa),
    };
  }

  @Get("anexo")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @Header("Cache-Control", "private, no-store")
  async abrirDocumento(
    @Param() params: BaixaPatrimonioParamsDto,
  ): Promise<StreamableFile> {
    const documento = await this.baixas.abrirDocumento(params.patrimonioId);
    return new StreamableFile(documento.conteudo, {
      type: TIPO_MIME_DOCUMENTO_BAIXA_PATRIMONIO,
      disposition: `attachment; filename="baixa-${params.patrimonioId}.pdf"`,
      length: documento.tamanho,
    });
  }

  private async removerTemporario(
    arquivo: ArquivoBaixaMultipart | undefined,
  ): Promise<void> {
    if (!arquivo) return;
    await rm(arquivo.path, { force: true }).catch(() => {
      this.logger.error(
        "Falha ao remover arquivo temporário multipart; a reconciliação deverá tratá-lo.",
      );
    });
  }
}
