import { DependenciaConsultaIndisponivelException } from "../../common/http/dependencia-consulta-indisponivel.exception";
import { UnprocessableEntityException } from "@nestjs/common";
export function limiteRelatorio(): UnprocessableEntityException {
  return new UnprocessableEntityException({
    codigo: "RELATORIO_LIMITE_EXCEDIDO",
    mensagem:
      "O relatório excede os limites de emissão. Reduza os filtros e tente novamente.",
    erros: [],
  });
}
export function conferirPrazo(prazo: number, signal?: AbortSignal) {
  if (signal?.aborted || Date.now() > prazo)
    throw new DependenciaConsultaIndisponivelException();
}
