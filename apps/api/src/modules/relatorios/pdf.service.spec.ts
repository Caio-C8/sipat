import { randomUUID } from "node:crypto";
import PDFDocument from "pdfkit";
import { RelatoriosPdfService } from "./pdf.service";
import type { RelatoriosService } from "./relatorios.service";
import type { FichaService } from "./ficha.service";
import type { IdentidadeAutenticada } from "@repo/contracts";
const usuario: IdentidadeAutenticada = {
  id: randomUUID(),
  nome: "Emissor sintético",
  email: "teste@example.test",
  perfil: "ADMINISTRADOR",
  trocaSenhaObrigatoria: false,
};
const consulta = {
  id: randomUUID(),
  instante: new Date().toISOString(),
  filtros: {},
  criterioTemporal: "Datas civis",
  ordenacao: "UUID",
  avisos: [],
};
describe("admissão e limites de PDF", () => {
  afterEach(() => jest.restoreAllMocks());
  it("usa rótulos resolvidos no servidor para filtros de cadastro do PDF", async () => {
    const setorId = randomUUID();
    const textos: string[] = [];
    const original = PDFDocument.prototype.text;
    jest.spyOn(PDFDocument.prototype, "text").mockImplementation(function (
      this: PDFKit.PDFDocument,
      ...args: Parameters<typeof original>
    ) {
      if (typeof args[0] === "string") textos.push(args[0]);
      return original.apply(this, args);
    });
    const backend = {
      tabular: jest.fn(async () => ({
        dados: [],
        resumo: { quantidade: 0 },
        consulta: { ...consulta, filtros: { setorId } },
      })),
      rotulosFiltros: jest.fn(async () => ({ setorId: "Setor de Tecnologia" })),
    };
    const service = new RelatoriosPdfService(
      backend as unknown as RelatoriosService,
      {} as FichaService,
    );
    await service.emitir("patrimonios", { setorId }, usuario);
    expect(backend.rotulosFiltros).toHaveBeenCalledWith({ setorId });
    expect(textos.join(" ")).toContain("Setor: Setor de Tecnologia");
    expect(textos.join(" ")).not.toContain(setorId);
  });
  it("rejeita emissão concorrente do mesmo usuário e libera após falha", async () => {
    const rejeicoes: ((e: Error) => void)[] = [];
    const backend = {
      tabular: jest.fn(
        () =>
          new Promise((_, reject) => {
            rejeicoes.push(reject);
          }),
      ),
    };
    const service = new RelatoriosPdfService(
      backend as unknown as RelatoriosService,
      {} as FichaService,
    );
    const primeira = service.emitir("baixas", {}, usuario);
    await expect(service.emitir("baixas", {}, usuario)).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 2,
    });
    const segunda = service.emitir(
      "baixas",
      {},
      { ...usuario, id: randomUUID() },
    );
    await expect(
      service.emitir("baixas", {}, { ...usuario, id: randomUUID() }),
    ).rejects.toMatchObject({ status: 429 });
    rejeicoes[1]!(new Error("Falha sintética"));
    await expect(segunda).rejects.toThrow("Falha sintética");
    rejeicoes[0]!(new Error("Falha sintética"));
    await expect(primeira).rejects.toThrow("Falha sintética");
  });
  it("rejeita dataset excessivo antes de criar o documento", async () => {
    const backend = {
      tabular: jest.fn(async () => ({
        dados: [{ descricao: "x".repeat(8 * 1024 * 1024) }],
        resumo: { quantidade: 1 },
        consulta,
      })),
    };
    const service = new RelatoriosPdfService(
      backend as unknown as RelatoriosService,
      {} as FichaService,
    );
    await expect(
      service.emitir("patrimonios", {}, usuario),
    ).rejects.toMatchObject({
      status: 422,
      response: { codigo: "RELATORIO_LIMITE_EXCEDIDO" },
    });
    // A vaga deve estar livre novamente; uma nova chamada chega ao backend.
    await expect(
      service.emitir("patrimonios", {}, usuario),
    ).rejects.toMatchObject({ status: 422 });
    expect(backend.tabular).toHaveBeenCalledTimes(2);
  });
  it("cancelamento e prazo expirado falham antes de emitir sucesso", async () => {
    const backend = {
      tabular: jest.fn(async () => ({
        dados: [],
        resumo: { quantidade: 0 },
        consulta,
      })),
    };
    const service = new RelatoriosPdfService(
      backend as unknown as RelatoriosService,
      {} as FichaService,
    );
    await expect(
      service.emitir("baixas", {}, usuario, AbortSignal.abort()),
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      service.renderizar("baixas", [], {}, consulta, usuario, Date.now() - 1),
    ).rejects.toMatchObject({ status: 503 });
  });
});
