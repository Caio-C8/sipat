import {
  CAMPO_ANEXOS_CRIAR_PROCESSO_COMPRA,
  CAMPO_DADOS_CRIAR_PROCESSO_COMPRA,
  CriarProcessoCompraMultipartSchema,
  LIMITE_ANEXOS_CRIAR_PROCESSO_COMPRA,
  LIMITE_CAMPOS_CRIAR_PROCESSO_COMPRA,
  LIMITE_PARTES_CRIAR_PROCESSO_COMPRA,
} from "@repo/contracts";

describe("contrato multipart de processos de compra", () => {
  it("aceita a fixture produzida pelo parser e preserva a associação por índice", () => {
    const parteArquivo = { caminhoTemporario: "opaco-para-o-contrato" };
    const multipart = {
      [CAMPO_DADOS_CRIAR_PROCESSO_COMPRA]: JSON.stringify({
        chaveIdempotencia: randomUUID(),
        numeroProcesso: "123/2026",
        notas: [
          {
            numeroNotaFiscal: "NF-001",
            anoNotaFiscal: 2026,
            dataEmissao: "2026-10-19",
            fornecedorId: "d4f7ccde-d880-4881-a547-a5c34bf263b2",
            anexoIndice: 0,
          },
        ],
      }),
      [CAMPO_ANEXOS_CRIAR_PROCESSO_COMPRA]: [parteArquivo],
    };

    const resultado = CriarProcessoCompraMultipartSchema.parse(multipart);

    expect(resultado.dados.notas[0]?.anexoIndice).toBe(0);
    expect(resultado.anexos[0]).toBe(parteArquivo);
    expect({
      fields: LIMITE_CAMPOS_CRIAR_PROCESSO_COMPRA,
      files: LIMITE_ANEXOS_CRIAR_PROCESSO_COMPRA,
      parts: LIMITE_PARTES_CRIAR_PROCESSO_COMPRA,
    }).toEqual({ fields: 1, files: 20, parts: 21 });
  });

  it("rejeita arquivo entregue pelo parser sem nota consumidora", () => {
    expect(() =>
      CriarProcessoCompraMultipartSchema.parse({
        dados: JSON.stringify({ notas: [] }),
        anexos: [{}],
      }),
    ).toThrow();
  });
});
import { randomUUID } from "node:crypto";
