import PDFDocument from "pdfkit";
import { RelatoriosPdfService } from "./pdf.service";
import type { RelatoriosService } from "./relatorios.service";
import type { FichaService } from "./ficha.service";
import { textoRelatorio } from "./pdf-format";

const consulta = {
  id: "consulta-teste",
  instante: "2026-11-01T14:00:00Z",
  filtros: {},
  criterioTemporal: "Competências processadas",
  ordenacao: "Competência",
  avisos: [],
};
const usuario = { nome: "Emissor de teste", perfil: "ADMINISTRADOR" as const };
const linha = (n: number) => ({
  id: `registro-${n}`,
  patrimonioId: `uuid-bem-${n}`,
  numeroPatrimonio: String(n),
  descricao: `Computador número ${n} - descrição com acentuação`,
  competencia: "2026-10",
  parametroId: `parametro-${n}`,
  processamento: "2026-11-01T01:00:00Z",
  valorContabilAnterior: "1200.0000000",
  valorDepreciado: `${n}.1234567`,
  valorContabilNovo: "1100.0000000",
  comissao: "Comissão de patrimônio",
  autor: "Autor de teste",
});
describe("legibilidade e vínculo entre bem e valores no PDF", () => {
  afterEach(() => jest.restoreAllMocks());
  function observar() {
    const paginas = new Map<
      object,
      { texto: string; x: number; y: number; fimX: number }[]
    >();
    const original = PDFDocument.prototype.text;
    jest.spyOn(PDFDocument.prototype, "text").mockImplementation(function (
      this: PDFKit.PDFDocument,
      ...args: Parameters<typeof original>
    ) {
      const [texto, x, y] = args;
      if (!paginas.has(this.page)) paginas.set(this.page, []);
      if (
        typeof texto === "string" &&
        typeof x === "number" &&
        typeof y === "number"
      )
        paginas
          .get(this.page)!
          .push({ texto, x, y, fimX: x + this.widthOfString(texto) });
      return original.apply(this, args);
    });
    return paginas;
  }
  const service = () =>
    new RelatoriosPdfService({} as RelatoriosService, {} as FichaService);
  it("mantém número, descrição, competência e valores de cada lançamento na mesma linha tabular", async () => {
    const paginas = observar();
    const dados = Array.from({ length: 30 }, (_, i) => linha(i + 1));
    const pdf = await service().renderizar(
      "depreciacoes",
      dados,
      { quantidade: 30, bensDistintos: 30, quotas: "465.0000000" },
      consulta,
      usuario,
      Date.now() + 20000,
    );
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(paginas.size).toBeLessThanOrEqual(15);
    for (let n = 1; n <= 30; n++) {
      const pagina = [...paginas.values()].find((p) =>
        p.some((t) => t.texto.includes(`Computador número ${n} -`)),
      )!;
      expect(pagina).toBeDefined();
      const texto = pagina.map((t) => t.texto).join(" ");
      expect(pagina.some((t) => t.texto === String(n))).toBe(true);
      expect(texto).toContain(`Computador número ${n} - descrição`);
      expect(texto).toContain(`${n},1234567`);
      expect(texto).toContain("10/2026");
      expect(texto).toContain("Quota (R$)");
    }
    expect(
      [...paginas.values()]
        .map((p) => p.map((t) => t.texto).join(" "))
        .join(" "),
    ).toContain("registro-30");
    for (const pagina of paginas.values())
      for (const t of pagina) {
        expect(t.x).toBeGreaterThanOrEqual(36);
        expect(t.fimX).toBeLessThanOrEqual(806);
        expect(t.y).toBeLessThan(570);
      }
  });
  it("repete o bem nas continuações e preserva texto longo, inclusive palavra sem espaços", async () => {
    const paginas = observar();
    const descricao =
      "Início Árvore " +
      "ação longa ".repeat(800) +
      "X".repeat(2000) +
      " MARCADOR-FINAL";
    await service().renderizar(
      "depreciacoes",
      [{ ...linha(77), descricao }],
      {},
      consulta,
      usuario,
      Date.now() + 20000,
    );
    expect(paginas.size).toBeGreaterThan(2);
    const textos = [...paginas.values()].map((p) =>
      p.map((t) => t.texto).join(" "),
    );
    expect(textos.join(" ")).toContain("MARCADOR-FINAL");
    expect(textos.join("").match(/X/g)?.length).toBe(2000);
    const primeiraPaginaDoBem = textos.findIndex((t) =>
      t.includes("Registros selecionados"),
    );
    for (const texto of textos.slice(primeiraPaginaDoBem + 1)) {
      if (texto.includes("Informações complementares")) continue;
      expect(texto).toContain("continuação");
      expect(texto).toContain(
        "SIPAT · Câmara Municipal de Patos de Minas · Depreciações",
      );
      if (texto.includes("X")) expect(texto).toContain("Quota (R$)");
    }
  });
  it("apresenta detalhes em tópicos e agrupa UUIDs iguais sem perder seus rótulos", async () => {
    const paginas = observar();
    await service().renderizar(
      "patrimonios",
      [
        {
          id: "mesmo-uuid",
          patrimonioId: "mesmo-uuid",
          numeroPatrimonio: "SP-123",
          descricao: "Bem de teste",
          setorAtual: "Setor de teste",
          valorLiquidoAtual: null,
          especie: "Equipamento",
          natureza: "Material permanente",
          valorIncorporacao: "1000.1234567",
        },
      ],
      { quantidade: 1 },
      consulta,
      usuario,
      Date.now() + 20000,
    );
    const textos = [...paginas.values()].flat().map((t) => t.texto);
    expect(textos.filter((t) => t === "•")).toHaveLength(3);
    expect(textos.join(" ")).toContain("Valores contábeis e financeiros");
    expect(textos.join(" ")).toContain("1.000,1234567");
    expect(textos.join(" ").match(/mesmo-uuid/g)).toHaveLength(1);
  });
  it("produz vazio legível e não transforma datas civis em instantes", async () => {
    const paginas = observar();
    await service().renderizar(
      "depreciacoes",
      [],
      { quantidade: 0 },
      consulta,
      usuario,
      Date.now() + 20000,
    );
    expect(paginas.size).toBe(1);
    expect([...paginas.values()][0]!.map((t) => t.texto).join(" ")).toContain(
      "Nenhum registro encontrado",
    );
    expect(textoRelatorio("2026-11-01")).toBe("01/11/2026");
    expect(textoRelatorio("2026-11-01T01:00:00Z")).toBe("31/10/2026, 22:00:00");
    expect(textoRelatorio("999999999999.1234567")).toBe(
      "999.999.999.999,1234567",
    );
  });
});
