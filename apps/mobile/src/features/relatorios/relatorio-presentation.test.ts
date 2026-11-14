import { describe, expect, it } from "vitest";
import {
  appliedFilterEntries,
  formatRelatorioValue,
  relatorioCadastroEntries,
  relatorioEventEntries,
  relatorioEventMetadata,
  relatorioRecordSubtitle,
  relatorioRecordTitle,
} from "./relatorio-presentation";

describe("relatorio-presentation", () => {
  it("formata decimais sem convertê-los para Number ou perder sete casas", () => {
    expect(formatRelatorioValue("5215.5000000")).toBe("5.215,5000000");
    expect(formatRelatorioValue("-1234567.0000001")).toBe("-1.234.567,0000001");
  });

  it("usa rótulos selecionados nos filtros confirmados pela API", () => {
    expect(
      appliedFilterEntries(
        "patrimonios",
        {
          setorId: "00000000-0000-4000-8000-000000000001",
          ordenacao: "NUMERO",
        },
        {
          setorId: "00000000-0000-4000-8000-000000000001",
          ordenacao: "NUMERO",
        },
        { setorId: "Tecnologia da Informação" },
      ),
    ).toEqual([
      {
        key: "setorId",
        label: "Setor",
        value: "Tecnologia da Informação",
      },
      {
        key: "ordenacao",
        label: "Ordenação",
        value: "Número patrimonial",
      },
    ]);
  });

  it("não usa o UUID como fallback visual de filtro de catálogo", () => {
    expect(
      appliedFilterEntries(
        "patrimonios",
        { setorId: "00000000-0000-4000-8000-000000000001" },
        { setorId: "00000000-0000-4000-8000-000000000001" },
        {},
      ),
    ).toEqual([{ key: "setorId", label: "Setor", value: "Opção selecionada" }]);
  });

  it("deriva identificação e descrição sem inventar conteúdo", () => {
    const record = {
      id: "id",
      numeroPatrimonio: "00002656",
      descricao: "Notebook corporativo",
    };
    expect(relatorioRecordTitle(record)).toBe("00002656");
    expect(relatorioRecordSubtitle(record)).toBe("Notebook corporativo");
  });

  it("humaniza enumerações, competências e datas no fuso da aplicação", () => {
    expect(formatRelatorioValue("CONFERENCIA_INVENTARIO")).toBe(
      "Conferência de inventário",
    );
    expect(formatRelatorioValue("2026-11")).toBe("11/2026");
    expect(formatRelatorioValue("2026-11-13")).toBe("13/11/2026");
    expect(formatRelatorioValue("2026-11-13T03:27:04.241Z")).toBe(
      "13/11/2026, 00:27:04",
    );
  });

  it("omite referências internas do cadastro e de objetos aninhados", () => {
    const entries = relatorioCadastroEntries({
      id: "registro-interno",
      patrimonioId: "bem-interno",
      numeroPatrimonio: "14",
      processoId: "processo-interno",
      processo: "DEMO-2026-004",
      parametro: {
        id: "parametro-interno",
        metodo: "LINEAR",
        vidaUtilMeses: 60,
      },
    });
    expect(entries.map((entry) => entry.key)).toEqual([
      "numeroPatrimonio",
      "processo",
      "parametro",
    ]);
    expect(entries.at(-1)?.value).toBe("Método: Linear\nVida útil (meses): 60");
    expect(JSON.stringify(entries)).not.toContain("interno");
  });

  it("apresenta o evento em metadados e detalhes úteis sem UUIDs", () => {
    const event = {
      id: "evento-interno",
      patrimonioId: "bem-interno",
      fonteId: "fonte-interna",
      tipo: "CONFERENCIA_INVENTARIO",
      ocorrencia: "2026-11-13T03:27:04.241Z",
      registroEm: null,
      autor: "Diretor de Patrimônio",
      comissao: null,
      atributos: {
        id: "atributo-interno",
        patrimonioId: "bem-interno",
        inventarioId: "inventario-interno",
        inventario: "Inventário Geral 2026",
        numeroPatrimonio: "14",
        descricao: "Aparelho de ar-condicionado",
        verificacao: "VERIFICADO",
        situacao: "CORRETO",
      },
    };
    const metadata = relatorioEventMetadata(event);
    const details = relatorioEventEntries(event);
    expect(metadata.map((entry) => entry.key)).toEqual([
      "ocorrencia",
      "registroEm",
      "autor",
      "comissao",
    ]);
    expect(details.map((entry) => entry.key)).toEqual([
      "numeroPatrimonio",
      "descricao",
      "verificacao",
      "situacao",
      "inventario",
    ]);
    expect(JSON.stringify({ metadata, details })).not.toContain("interno");
    expect(details.find((entry) => entry.key === "verificacao")?.value).toBe(
      "Verificado",
    );
  });
});
