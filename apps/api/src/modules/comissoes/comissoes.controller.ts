import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type {
  AdicionarMembroComissaoResponse,
  AlterarComissaoResponse,
  AlterarMembroComissaoResponse,
  ConsultarComissaoResponse,
  CriarComissaoResponse,
  ListarComissoesResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import { ComissoesService } from "./comissoes.service";
import {
  AdicionarMembroComissaoBodyDto,
  AdicionarMembroComissaoResponseDto,
  AlterarComissaoBodyDto,
  AlterarComissaoResponseDto,
  AlterarMembroComissaoBodyDto,
  AlterarMembroComissaoResponseDto,
  ComissaoParamsDto,
  ConsultarComissaoResponseDto,
  CriarComissaoBodyDto,
  CriarComissaoResponseDto,
  ListarComissoesQueryDto,
  ListarComissoesResponseDto,
  MembroComissaoParamsDto,
} from "./dtos";
import { ComissaoResponseMapper } from "./mappers";

@Controller("comissoes")
export class ComissoesController {
  constructor(private readonly comissoesService: ComissoesService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(ListarComissoesResponseDto)
  async listar(
    @Query() query: ListarComissoesQueryDto,
  ): Promise<ListarComissoesResponse> {
    const resultado = await this.comissoesService.listar(query);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Comissões listadas com sucesso.",
      dados: resultado.items.map((comissao) =>
        ComissaoResponseMapper.paraResumo(comissao),
      ),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
    };
  }

  @Get(":comissaoId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(ConsultarComissaoResponseDto)
  async consultar(
    @Param() params: ComissaoParamsDto,
  ): Promise<ConsultarComissaoResponse> {
    const comissao = await this.comissoesService.consultar(params.comissaoId);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Comissão encontrada com sucesso.",
      dados: ComissaoResponseMapper.paraDetalhe(comissao),
    };
  }

  @Post()
  @PerfisPermitidos("ADMINISTRADOR")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarComissaoResponseDto)
  async criar(
    @Body() body: CriarComissaoBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarComissaoResponse> {
    const comissao = await this.comissoesService.criar(
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Comissão criada com sucesso.",
      dados: ComissaoResponseMapper.paraDetalhe(comissao),
    };
  }

  @Patch(":comissaoId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarComissaoResponseDto)
  async alterar(
    @Param() params: ComissaoParamsDto,
    @Body() body: AlterarComissaoBodyDto,
  ): Promise<AlterarComissaoResponse> {
    const comissao = await this.comissoesService.alterar(
      params.comissaoId,
      body,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Comissão alterada com sucesso.",
      dados: ComissaoResponseMapper.paraDetalhe(comissao),
    };
  }

  @Post(":comissaoId/membros")
  @PerfisPermitidos("ADMINISTRADOR")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(AdicionarMembroComissaoResponseDto)
  async adicionarMembro(
    @Param() params: ComissaoParamsDto,
    @Body() body: AdicionarMembroComissaoBodyDto,
  ): Promise<AdicionarMembroComissaoResponse> {
    const membro = await this.comissoesService.adicionarMembro(
      params.comissaoId,
      body,
    );
    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Integrante adicionado com sucesso.",
      dados: ComissaoResponseMapper.paraMembro(membro),
    };
  }

  @Patch(":comissaoId/membros/:membroComissaoId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarMembroComissaoResponseDto)
  async alterarMembro(
    @Param() params: MembroComissaoParamsDto,
    @Body() body: AlterarMembroComissaoBodyDto,
  ): Promise<AlterarMembroComissaoResponse> {
    const membro = await this.comissoesService.alterarMembro(
      params.comissaoId,
      params.membroComissaoId,
      body,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Papel do integrante alterado com sucesso.",
      dados: ComissaoResponseMapper.paraMembro(membro),
    };
  }

  @Delete(":comissaoId/membros/:membroComissaoId")
  @PerfisPermitidos("ADMINISTRADOR")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerMembro(@Param() params: MembroComissaoParamsDto): Promise<void> {
    await this.comissoesService.removerMembro(
      params.comissaoId,
      params.membroComissaoId,
    );
  }
}
