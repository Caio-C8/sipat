import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  CAMPO_ANEXO_NOTA_FISCAL,
  type AlterarAnexoNotaFiscalResponse,
  type AlterarNotaFiscalResponse,
  type ConsultarNotaFiscalResponse,
  type CriarNotaFiscalResponse,
  LIMITE_BYTES_ANEXO_NOTA_FISCAL,
  LIMITE_PARTES_CRIAR_NOTA_FISCAL,
  type ListarNotasFiscaisResponse,
  type RemoverAnexoNotaFiscalResponse,
  TIPO_MIME_ANEXO_NOTA_FISCAL,
} from "@repo/contracts";
import { rm } from "node:fs/promises";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  AlterarAnexoNotaFiscalResponseDto,
  AlterarNotaFiscalBodyDto,
  AlterarNotaFiscalResponseDto,
  ConsultarNotaFiscalResponseDto,
  CriarNotaFiscalResponseDto,
  ListarNotasFiscaisQueryDto,
  ListarNotasFiscaisResponseDto,
  NotaFiscalParamsDto,
  RemoverAnexoNotaFiscalResponseDto,
} from "./dtos";
import { NotaFiscalResponseMapper } from "./mappers";
import { NotasFiscaisService } from "./notas-fiscais.service";
import type { ArquivoNotaFiscalMultipart } from "./types";

@Controller("notas-fiscais")
export class NotasFiscaisController {
  private readonly logger = new Logger(NotasFiscaisController.name);

  constructor(private readonly notasService: NotasFiscaisService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarNotasFiscaisResponseDto)
  async listar(
    @Query() query: ListarNotasFiscaisQueryDto,
  ): Promise<ListarNotasFiscaisResponse> {
    const resultado = await this.notasService.listar(query);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Notas fiscais listadas com sucesso.",
      dados: resultado.items.map(NotaFiscalResponseMapper.paraResumo),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
    };
  }

  @Get(":notaFiscalId")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ConsultarNotaFiscalResponseDto)
  async consultar(
    @Param() params: NotaFiscalParamsDto,
  ): Promise<ConsultarNotaFiscalResponse> {
    const nota = await this.notasService.consultar(params.notaFiscalId);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Nota fiscal encontrada com sucesso.",
      dados: NotaFiscalResponseMapper.paraDetalhe(nota),
    };
  }

  @Post()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @UseInterceptors(
    FileInterceptor(CAMPO_ANEXO_NOTA_FISCAL, {
      limits: {
        fields: 1,
        files: 1,
        parts: LIMITE_PARTES_CRIAR_NOTA_FISCAL,
        fileSize: LIMITE_BYTES_ANEXO_NOTA_FISCAL,
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarNotaFiscalResponseDto)
  async criar(
    @Body() body: Record<string, unknown>,
    @UploadedFile() arquivo: ArquivoNotaFiscalMultipart | undefined,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarNotaFiscalResponse> {
    try {
      const nota = await this.notasService.criar(
        body,
        arquivo,
        request.identidadeAutenticada!,
      );
      return {
        status: HttpStatus.CREATED,
        sucesso: true,
        mensagem: "Nota fiscal criada com sucesso.",
        dados: NotaFiscalResponseMapper.paraDetalhe(nota),
      };
    } finally {
      await this.removerTemporario(arquivo);
    }
  }

  @Patch(":notaFiscalId")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(AlterarNotaFiscalResponseDto)
  async alterar(
    @Param() params: NotaFiscalParamsDto,
    @Body() body: AlterarNotaFiscalBodyDto,
  ): Promise<AlterarNotaFiscalResponse> {
    const nota = await this.notasService.alterar(params.notaFiscalId, body);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Nota fiscal alterada com sucesso.",
      dados: NotaFiscalResponseMapper.paraDetalhe(nota),
    };
  }

  @Put(":notaFiscalId/anexo")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @UseInterceptors(
    FileInterceptor(CAMPO_ANEXO_NOTA_FISCAL, {
      limits: {
        fields: 0,
        files: 1,
        parts: 1,
        fileSize: LIMITE_BYTES_ANEXO_NOTA_FISCAL,
      },
    }),
  )
  @ZodSerializerDto(AlterarAnexoNotaFiscalResponseDto)
  async substituirAnexo(
    @Param() params: NotaFiscalParamsDto,
    @UploadedFile() arquivo: ArquivoNotaFiscalMultipart | undefined,
  ): Promise<AlterarAnexoNotaFiscalResponse> {
    try {
      const nota = await this.notasService.substituirAnexo(
        params.notaFiscalId,
        arquivo,
      );
      return {
        status: HttpStatus.OK,
        sucesso: true,
        mensagem: "Anexo da nota fiscal alterado com sucesso.",
        dados: NotaFiscalResponseMapper.paraDetalhe(nota),
      };
    } finally {
      await this.removerTemporario(arquivo);
    }
  }

  @Delete(":notaFiscalId/anexo")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(RemoverAnexoNotaFiscalResponseDto)
  async removerAnexo(
    @Param() params: NotaFiscalParamsDto,
  ): Promise<RemoverAnexoNotaFiscalResponse> {
    const nota = await this.notasService.removerAnexo(params.notaFiscalId);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Anexo da nota fiscal removido com sucesso.",
      dados: NotaFiscalResponseMapper.paraDetalhe(nota),
    };
  }

  @Get(":notaFiscalId/anexo")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @Header("Cache-Control", "private, no-store")
  async abrirAnexo(
    @Param() params: NotaFiscalParamsDto,
  ): Promise<StreamableFile> {
    const anexo = await this.notasService.abrirAnexo(params.notaFiscalId);
    return new StreamableFile(anexo.conteudo, {
      type: TIPO_MIME_ANEXO_NOTA_FISCAL,
      disposition: `attachment; filename="nota-fiscal-${params.notaFiscalId}.pdf"`,
      length: anexo.tamanho,
    });
  }

  private async removerTemporario(
    arquivo: ArquivoNotaFiscalMultipart | undefined,
  ): Promise<void> {
    if (!arquivo) return;
    await rm(arquivo.path, { force: true }).catch(() => {
      this.logger.error(
        "Falha ao remover arquivo temporário multipart; a reconciliação deverá tratá-lo.",
      );
    });
  }
}
