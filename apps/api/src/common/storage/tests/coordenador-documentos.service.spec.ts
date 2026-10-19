import { Readable } from "node:stream";
import type { ArmazenamentoDocumentosPorta } from "../armazenamento-documentos.port";
import { CoordenadorDocumentosService } from "../coordenador-documentos.service";

function armazenamentoMock(): jest.Mocked<ArmazenamentoDocumentosPorta> {
  return {
    gravar: jest.fn().mockResolvedValue(undefined),
    abrir: jest.fn(),
    substituir: jest.fn(),
    remover: jest.fn().mockResolvedValue(undefined),
    reconciliar: jest.fn(),
  };
}

describe("CoordenadorDocumentosService", () => {
  it("compensa todos os arquivos preparados quando o banco falha", async () => {
    const armazenamento = armazenamentoMock();
    const service = new CoordenadorDocumentosService(armazenamento);
    const erroBanco = new Error("falha do banco");

    await expect(
      service.criarMuitos(
        [
          {
            chave: "uploads/notas-fiscais/a.pdf",
            conteudo: Readable.from("a"),
          },
          {
            chave: "uploads/notas-fiscais/b.pdf",
            conteudo: Readable.from("b"),
          },
        ],
        () => Promise.reject(erroBanco),
      ),
    ).rejects.toBe(erroBanco);
    expect(armazenamento.remover).toHaveBeenCalledTimes(2);
  });

  it("mantém o arquivo válido e remove somente o novo se a substituição falha no banco", async () => {
    const armazenamento = armazenamentoMock();
    const service = new CoordenadorDocumentosService(armazenamento);
    const antiga = "uploads/notas-fiscais/antiga.pdf";
    const nova = "uploads/notas-fiscais/nova.pdf";

    await expect(
      service.substituir(
        antiga,
        { chave: nova, conteudo: Readable.from("nova") },
        () => Promise.reject(new Error("falha do banco")),
      ),
    ).rejects.toThrow("falha do banco");
    expect(armazenamento.remover).toHaveBeenCalledWith(nova);
    expect(armazenamento.remover).not.toHaveBeenCalledWith(antiga);
  });

  it("remove o arquivo antigo somente depois de persistir a nova referência", async () => {
    const armazenamento = armazenamentoMock();
    const service = new CoordenadorDocumentosService(armazenamento);
    const ordem: string[] = [];
    armazenamento.gravar.mockImplementation(async () => {
      ordem.push("gravar");
    });
    armazenamento.remover.mockImplementation(async () => {
      ordem.push("remover-antigo");
    });

    await service.substituir(
      "uploads/notas-fiscais/antiga.pdf",
      {
        chave: "uploads/notas-fiscais/nova.pdf",
        conteudo: Readable.from("nova"),
      },
      async () => {
        ordem.push("persistir");
      },
    );

    expect(ordem).toEqual(["gravar", "persistir", "remover-antigo"]);
  });

  it("não remove o arquivo se a limpeza da referência falha", async () => {
    const armazenamento = armazenamentoMock();
    const service = new CoordenadorDocumentosService(armazenamento);

    await expect(
      service.remover("uploads/notas-fiscais/arquivo.pdf", () =>
        Promise.reject(new Error("falha do banco")),
      ),
    ).rejects.toThrow("falha do banco");
    expect(armazenamento.remover).not.toHaveBeenCalled();
  });
});
