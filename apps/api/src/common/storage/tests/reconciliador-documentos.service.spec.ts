import type { DatabaseClient } from "@repo/database";
import type { ArmazenamentoDocumentosPorta } from "../armazenamento-documentos.port";
import { ReconciliadorDocumentosService } from "../reconciliador-documentos.service";

describe("ReconciliadorDocumentosService", () => {
  it("preserva em uma única allowlist as referências de notas, baixas e manutenções", async () => {
    const database = {
      notaFiscal: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { caminhoAnexoNotaFiscal: "uploads/notas-fiscais/nota.pdf" },
          ]),
      },
      baixaPatrimonio: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { caminhoAnexoDocumento: "uploads/baixas/baixa.pdf" },
          ]),
      },
      manutencao: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { caminhoAnexoObservacao: "uploads/manutencoes/pedido.pdf" },
          ]),
      },
      itemManutencao: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { caminhoAnexoObservacao: "uploads/manutencoes/item.pdf" },
          ]),
      },
    } as unknown as DatabaseClient;
    const armazenamento = {
      reconciliar: jest.fn().mockResolvedValue({
        temporariosRemovidos: 0,
        orfaosRemovidos: 0,
      }),
    } as unknown as jest.Mocked<ArmazenamentoDocumentosPorta>;
    const service = new ReconciliadorDocumentosService(database, armazenamento);

    await service.onApplicationBootstrap();

    expect(armazenamento.reconciliar).toHaveBeenCalledWith(
      expect.objectContaining({
        chavesReferenciadas: new Set([
          "uploads/notas-fiscais/nota.pdf",
          "uploads/baixas/baixa.pdf",
          "uploads/manutencoes/pedido.pdf",
          "uploads/manutencoes/item.pdf",
        ]),
        temporariosModificadosAntesDe: expect.any(Date),
        orfaosModificadosAntesDe: expect.any(Date),
      }),
    );
  });
});
