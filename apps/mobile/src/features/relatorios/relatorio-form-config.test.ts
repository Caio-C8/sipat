import { TipoRelatorioSchema, opcoesPorRelatorio } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import {
  configUsesOnlyApprovedCatalogs,
  configuredCatalogs,
  formatRelatorioFieldInput,
  relatorioFormConfig,
  validateRelatorioDraft,
} from "./relatorio-form-config";

const id = "00000000-0000-4000-8000-000000000001";
const valid = {
  patrimonios: {},
  "ficha-bem": { patrimonioId: id },
  movimentacoes: { inicio: "01/01/2026", fim: "31/12/2026" },
  manutencoes: {
    inicio: "01/01/2026",
    fim: "31/12/2026",
    base: "ENVIO",
  },
  depreciacoes: {
    competenciaInicio: "2026-01",
    competenciaFim: "2026-12",
  },
  "pendencias-depreciacao": {},
  reavaliacoes: {
    inicio: "01/01/2026",
    fim: "31/12/2026",
    base: "REGISTRO",
  },
  inventarios: { inventarioId: id },
  emprestimos: {
    inicio: "01/01/2026",
    fim: "31/12/2026",
    base: "SAIDA",
  },
  baixas: {},
} as const;

describe("relatorioFormConfig", () => {
  it("cobre os dez tipos com os catálogos públicos aprovados", () => {
    expect(Object.keys(relatorioFormConfig).sort()).toEqual(
      [...TipoRelatorioSchema.options].sort(),
    );
    for (const tipo of TipoRelatorioSchema.options) {
      expect(configUsesOnlyApprovedCatalogs(tipo)).toBe(true);
      expect(
        configuredCatalogs(tipo).every((item) =>
          opcoesPorRelatorio[tipo].includes(item),
        ),
      ).toBe(true);
    }
  });

  it.each(TipoRelatorioSchema.options)(
    "produz query compartilhada válida para %s",
    (tipo) => {
      expect(validateRelatorioDraft(tipo, valid[tipo]).success).toBe(true);
    },
  );

  it("bloqueia obrigatórios, pares de datas e limites de período", () => {
    expect(validateRelatorioDraft("ficha-bem", {}).success).toBe(false);
    expect(validateRelatorioDraft("inventarios", {}).success).toBe(false);
    expect(
      validateRelatorioDraft("movimentacoes", {
        inicio: "01/01/2025",
        fim: "02/01/2026",
      }),
    ).toMatchObject({
      success: false,
      errors: { fim: "Use no máximo 366 dias." },
    });
    expect(
      validateRelatorioDraft("ficha-bem", {
        patrimonioId: id,
        inicio: "01/01/2026",
      }),
    ).toMatchObject({
      success: false,
      errors: { fim: "Informe início e fim juntos." },
    });
  });

  it("aplica enums e o limite de doze competências", () => {
    expect(
      validateRelatorioDraft("manutencoes", {
        inicio: "01/01/2026",
        fim: "02/01/2026",
        base: "INVALIDA",
      }).success,
    ).toBe(false);
    expect(
      validateRelatorioDraft("depreciacoes", {
        competenciaInicio: "2025-12",
        competenciaFim: "2026-12",
      }),
    ).toMatchObject({
      success: false,
      errors: {
        competenciaFim: "Use um intervalo ordenado de até 12 competências.",
      },
    });
  });

  it("mascara datas civis e converte para ISO apenas no boundary", () => {
    const dateField = relatorioFormConfig.movimentacoes.fields.find(
      (field) => field.name === "inicio",
    )!;
    expect(formatRelatorioFieldInput(dateField, "31122026")).toBe("31/12/2026");

    const result = validateRelatorioDraft("movimentacoes", {
      inicio: "01/01/2026",
      fim: "31/12/2026",
    });
    expect(result).toMatchObject({
      success: true,
      query: { inicio: "2026-01-01", fim: "2026-12-31" },
    });
  });

  it("substitui mensagens técnicas por instruções claras junto ao campo", () => {
    expect(validateRelatorioDraft("movimentacoes", {})).toMatchObject({
      success: false,
      errors: {
        inicio: "Informe data inicial no formato DD/MM/AAAA.",
        fim: "Informe data final no formato DD/MM/AAAA.",
      },
    });
    expect(
      validateRelatorioDraft("movimentacoes", {
        inicio: "31/02/2026",
        fim: "qualquer valor",
      }),
    ).toMatchObject({
      success: false,
      errors: {
        inicio: "Informe data inicial no formato DD/MM/AAAA.",
        fim: "Informe data final no formato DD/MM/AAAA.",
      },
    });
  });
});
