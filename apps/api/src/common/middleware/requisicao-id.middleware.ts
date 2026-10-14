import { randomUUID } from "node:crypto";
import { type ServerResponse } from "node:http";

export const CABECALHO_REQUISICAO_ID = "X-Request-Id";

export type RequisicaoComId = {
  requisicaoId?: string;
};

type RespostaComCabecalho = Pick<ServerResponse, "setHeader">;

type ProximaFuncao = (erro?: unknown) => void;

export function requisicaoIdMiddleware(
  request: RequisicaoComId,
  response: RespostaComCabecalho,
  next: ProximaFuncao,
): void {
  const requisicaoId = randomUUID();

  request.requisicaoId = requisicaoId;
  response.setHeader(CABECALHO_REQUISICAO_ID, requisicaoId);

  next();
}
