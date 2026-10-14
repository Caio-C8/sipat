import * as z from "zod";
import {
  CABECALHO_REQUISICAO_ID,
  type RequisicaoComId,
  requisicaoIdMiddleware,
} from "../requisicao-id.middleware";

describe("requisicaoIdMiddleware", () => {
  it("gera um UUID e o adiciona à request e à response", () => {
    const request: RequisicaoComId = {};
    const response = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    requisicaoIdMiddleware(request, response, next);

    expect(z.uuid().safeParse(request.requisicaoId).success).toBe(true);

    expect(response.setHeader).toHaveBeenCalledWith(
      CABECALHO_REQUISICAO_ID,
      request.requisicaoId,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("substitui qualquer identificador previamente presente", () => {
    const identificadorAnterior = "00000000-0000-4000-8000-000000000000";

    const request: RequisicaoComId = {
      requisicaoId: identificadorAnterior,
    };

    const response = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    requisicaoIdMiddleware(request, response, next);

    expect(request.requisicaoId).not.toBe(identificadorAnterior);
    expect(z.uuid().safeParse(request.requisicaoId).success).toBe(true);

    expect(response.setHeader).toHaveBeenCalledWith(
      CABECALHO_REQUISICAO_ID,
      request.requisicaoId,
    );
  });
});
