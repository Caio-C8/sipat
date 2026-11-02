import { RelatoriosPdfService } from "./pdf.service";
import type { RequisicaoAutenticada } from "../auth/auth.types";
interface RespostaCancelavel {
  once(evento: "close", callback: () => void): unknown;
}
import { FichaService } from "./ficha.service";
import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import { RelatoriosService } from "./relatorios.service";
import * as Dto from "./dtos";
@Controller("relatorios")
@PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
export class RelatoriosController {
  constructor(
    private readonly service: RelatoriosService,
    private readonly ficha: FichaService,
    private readonly pdf: RelatoriosPdfService,
  ) {}
  @Get() @Header("Cache-Control", "private, no-store") catalogo() {
    return this.service.catalogo();
  }
  @Get("opcoes/:catalogo") @Header("Cache-Control", "private, no-store") opcoes(
    @Param() p: Dto.OpcoesParamsDto,
    @Query() q: Dto.OpcoesQueryDto,
  ) {
    return this.service.opcoes(p.catalogo, { ...q });
  }
  @Get("patrimonios") @Header("Cache-Control", "private, no-store") patrimonios(
    @Query() q: Dto.PatrimoniosQueryDto,
  ) {
    return this.service.tabular("patrimonios", { ...q });
  }
  @Get("movimentacoes")
  @Header("Cache-Control", "private, no-store")
  movimentacoes(@Query() q: Dto.MovimentacoesQueryDto) {
    return this.service.tabular("movimentacoes", { ...q });
  }
  @Get("manutencoes") @Header("Cache-Control", "private, no-store") manutencoes(
    @Query() q: Dto.ManutencoesQueryDto,
  ) {
    return this.service.tabular("manutencoes", { ...q });
  }
  @Get("depreciacoes")
  @Header("Cache-Control", "private, no-store")
  depreciacoes(@Query() q: Dto.DepreciacoesQueryDto) {
    return this.service.tabular("depreciacoes", { ...q });
  }
  @Get("reavaliacoes")
  @Header("Cache-Control", "private, no-store")
  reavaliacoes(@Query() q: Dto.ReavaliacoesQueryDto) {
    return this.service.tabular("reavaliacoes", { ...q });
  }
  @Get("inventarios") @Header("Cache-Control", "private, no-store") inventarios(
    @Query() q: Dto.InventariosQueryDto,
  ) {
    return this.service.tabular("inventarios", { ...q });
  }
  @Get("emprestimos") @Header("Cache-Control", "private, no-store") emprestimos(
    @Query() q: Dto.EmprestimosQueryDto,
  ) {
    return this.service.tabular("emprestimos", { ...q });
  }
  @Get("baixas") @Header("Cache-Control", "private, no-store") baixas(
    @Query() q: Dto.BaixasQueryDto,
  ) {
    return this.service.tabular("baixas", { ...q });
  }
  @Get("ficha-bem/:patrimonioId")
  @Header("Cache-Control", "private, no-store")
  cadastro(@Param() p: Dto.FichaParamsDto) {
    return this.ficha.consultar(p.patrimonioId);
  }
  @Get("ficha-bem/:patrimonioId/eventos")
  @Header("Cache-Control", "private, no-store")
  eventos(@Param() p: Dto.FichaParamsDto, @Query() q: Dto.EventosQueryDto) {
    return this.ficha.eventos(p.patrimonioId, { ...q });
  }
  @Get("patrimonios/pdf")
  @Header("Cache-Control", "private, no-store")
  patrimoniosPdf(
    @Query() q: Dto.PatrimoniosPdfQueryDto,
    @Req() req: RequisicaoAutenticada,
    @Res({ passthrough: true }) res: RespostaCancelavel,
  ) {
    const cancel = new AbortController();
    res.once("close", () => cancel.abort());
    return this.pdf.emitir(
      "patrimonios",
      { ...q },
      req.identidadeAutenticada!,
      cancel.signal,
    );
  }
  @Get("movimentacoes/pdf")
  @Header("Cache-Control", "private, no-store")
  movimentacoesPdf(
    @Query() q: Dto.MovimentacoesPdfQueryDto,
    @Req() req: RequisicaoAutenticada,
    @Res({ passthrough: true }) res: RespostaCancelavel,
  ) {
    const cancel = new AbortController();
    res.once("close", () => cancel.abort());
    return this.pdf.emitir(
      "movimentacoes",
      { ...q },
      req.identidadeAutenticada!,
      cancel.signal,
    );
  }
  @Get("manutencoes/pdf")
  @Header("Cache-Control", "private, no-store")
  manutencoesPdf(
    @Query() q: Dto.ManutencoesPdfQueryDto,
    @Req() req: RequisicaoAutenticada,
    @Res({ passthrough: true }) res: RespostaCancelavel,
  ) {
    const cancel = new AbortController();
    res.once("close", () => cancel.abort());
    return this.pdf.emitir(
      "manutencoes",
      { ...q },
      req.identidadeAutenticada!,
      cancel.signal,
    );
  }
  @Get("depreciacoes/pdf")
  @Header("Cache-Control", "private, no-store")
  depreciacoesPdf(
    @Query() q: Dto.DepreciacoesPdfQueryDto,
    @Req() req: RequisicaoAutenticada,
    @Res({ passthrough: true }) res: RespostaCancelavel,
  ) {
    const cancel = new AbortController();
    res.once("close", () => cancel.abort());
    return this.pdf.emitir(
      "depreciacoes",
      { ...q },
      req.identidadeAutenticada!,
      cancel.signal,
    );
  }
  @Get("reavaliacoes/pdf")
  @Header("Cache-Control", "private, no-store")
  reavaliacoesPdf(
    @Query() q: Dto.ReavaliacoesPdfQueryDto,
    @Req() req: RequisicaoAutenticada,
    @Res({ passthrough: true }) res: RespostaCancelavel,
  ) {
    const cancel = new AbortController();
    res.once("close", () => cancel.abort());
    return this.pdf.emitir(
      "reavaliacoes",
      { ...q },
      req.identidadeAutenticada!,
      cancel.signal,
    );
  }
  @Get("inventarios/pdf")
  @Header("Cache-Control", "private, no-store")
  inventariosPdf(
    @Query() q: Dto.InventariosPdfQueryDto,
    @Req() req: RequisicaoAutenticada,
    @Res({ passthrough: true }) res: RespostaCancelavel,
  ) {
    const cancel = new AbortController();
    res.once("close", () => cancel.abort());
    return this.pdf.emitir(
      "inventarios",
      { ...q },
      req.identidadeAutenticada!,
      cancel.signal,
    );
  }
  @Get("emprestimos/pdf")
  @Header("Cache-Control", "private, no-store")
  emprestimosPdf(
    @Query() q: Dto.EmprestimosPdfQueryDto,
    @Req() req: RequisicaoAutenticada,
    @Res({ passthrough: true }) res: RespostaCancelavel,
  ) {
    const cancel = new AbortController();
    res.once("close", () => cancel.abort());
    return this.pdf.emitir(
      "emprestimos",
      { ...q },
      req.identidadeAutenticada!,
      cancel.signal,
    );
  }
  @Get("baixas/pdf") @Header("Cache-Control", "private, no-store") baixasPdf(
    @Query() q: Dto.BaixasPdfQueryDto,
    @Req() req: RequisicaoAutenticada,
    @Res({ passthrough: true }) res: RespostaCancelavel,
  ) {
    const cancel = new AbortController();
    res.once("close", () => cancel.abort());
    return this.pdf.emitir(
      "baixas",
      { ...q },
      req.identidadeAutenticada!,
      cancel.signal,
    );
  }
  @Get("ficha-bem/:patrimonioId/pdf")
  @Header("Cache-Control", "private, no-store")
  fichaPdf(
    @Param() p: Dto.FichaParamsDto,
    @Query() q: Dto.FichaPdfQueryDto,
    @Req() req: RequisicaoAutenticada,
    @Res({ passthrough: true }) res: RespostaCancelavel,
  ) {
    const cancel = new AbortController();
    res.once("close", () => cancel.abort());
    return this.pdf.emitir(
      "ficha-bem",
      { ...q },
      req.identidadeAutenticada!,
      cancel.signal,
      p.patrimonioId,
    );
  }
}
