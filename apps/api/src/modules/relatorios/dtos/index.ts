import { createZodDto } from "nestjs-zod";
import {
  queryRelatorio,
  queryPdfRelatorio,
  OpcoesRelatorioQuerySchema,
  OpcaoRelatorioParamsSchema,
  FichaRelatorioParamsSchema,
} from "@repo/contracts";
export class OpcoesQueryDto extends createZodDto(OpcoesRelatorioQuerySchema) {}
export class OpcoesParamsDto extends createZodDto(OpcaoRelatorioParamsSchema) {}
export class FichaParamsDto extends createZodDto(FichaRelatorioParamsSchema) {}
export class EventosQueryDto extends createZodDto(
  queryRelatorio("ficha-bem"),
) {}
export class FichaPdfQueryDto extends createZodDto(
  queryPdfRelatorio("ficha-bem"),
) {}
export class PatrimoniosQueryDto extends createZodDto(
  queryRelatorio("patrimonios"),
) {}
export class PatrimoniosPdfQueryDto extends createZodDto(
  queryPdfRelatorio("patrimonios"),
) {}
export class MovimentacoesQueryDto extends createZodDto(
  queryRelatorio("movimentacoes"),
) {}
export class MovimentacoesPdfQueryDto extends createZodDto(
  queryPdfRelatorio("movimentacoes"),
) {}
export class ManutencoesQueryDto extends createZodDto(
  queryRelatorio("manutencoes"),
) {}
export class ManutencoesPdfQueryDto extends createZodDto(
  queryPdfRelatorio("manutencoes"),
) {}
export class DepreciacoesQueryDto extends createZodDto(
  queryRelatorio("depreciacoes"),
) {}
export class DepreciacoesPdfQueryDto extends createZodDto(
  queryPdfRelatorio("depreciacoes"),
) {}
export class ReavaliacoesQueryDto extends createZodDto(
  queryRelatorio("reavaliacoes"),
) {}
export class ReavaliacoesPdfQueryDto extends createZodDto(
  queryPdfRelatorio("reavaliacoes"),
) {}
export class InventariosQueryDto extends createZodDto(
  queryRelatorio("inventarios"),
) {}
export class InventariosPdfQueryDto extends createZodDto(
  queryPdfRelatorio("inventarios"),
) {}
export class EmprestimosQueryDto extends createZodDto(
  queryRelatorio("emprestimos"),
) {}
export class EmprestimosPdfQueryDto extends createZodDto(
  queryPdfRelatorio("emprestimos"),
) {}
export class BaixasQueryDto extends createZodDto(queryRelatorio("baixas")) {}
export class BaixasPdfQueryDto extends createZodDto(
  queryPdfRelatorio("baixas"),
) {}
