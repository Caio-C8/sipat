import { describe, expect, it } from "vitest";
import {
  catalogoNavegacao,
  catalogoTelasSistema,
  encontrarNavegacaoPorCaminho,
  encontrarTelaPorCaminho,
  listarNavegacaoPorPerfil,
} from "../system-navigation";

const principal = [
  "Início",
  "Patrimônios",
  "Cadastrar patrimônio",
  "Reavaliações",
  "Depreciações",
  "Movimentações",
  "Empréstimos",
  "Baixas",
  "Inventários",
  "Manutenções",
  "Relatórios",
];

const administracao = [
  "Processos de compra",
  "Fornecedores",
  "Setores",
  "Responsáveis",
  "Comissões",
  "Naturezas",
  "Espécies",
  "Usuários",
];

describe("catálogo de navegação do sistema", () => {
  it("mantém a ordem aprovada em cada grupo", () => {
    expect(
      catalogoNavegacao
        .filter((item) => item.grupo === "principal")
        .map((item) => item.label),
    ).toEqual(principal);
    expect(
      catalogoNavegacao
        .filter((item) => item.grupo === "administracao")
        .map((item) => item.label),
    ).toEqual(administracao);
  });

  it("aplica a matriz dos dois perfis sem itens removidos do shell", () => {
    const administrador = listarNavegacaoPorPerfil("ADMINISTRADOR").map(
      (item) => item.label,
    );
    const diretor = listarNavegacaoPorPerfil("DIRETOR_PATRIMONIO").map(
      (item) => item.label,
    );

    expect(administrador).toEqual([
      ...principal.filter((item) => item !== "Cadastrar patrimônio"),
      ...administracao,
    ]);
    expect(diretor).toEqual([
      ...principal,
      ...administracao.filter((item) => item !== "Usuários"),
    ]);
    for (const itens of [administrador, diretor]) {
      expect(itens).not.toContain("Configurações");
      expect(itens).not.toContain("Histórico patrimonial");
    }
  });

  it("resolve detalhes e subrotas no item pai sem colisões", () => {
    expect(encontrarNavegacaoPorCaminho("/patrimonios/novo")?.id).toBe(
      "cadastrar-patrimonio",
    );
    expect(
      encontrarNavegacaoPorCaminho("/patrimonios/95e540bb-38c3-4a3f")?.id,
    ).toBe("patrimonios");
    expect(encontrarNavegacaoPorCaminho("/emprestimos/nova")?.id).toBe(
      "emprestimos",
    );
    expect(encontrarNavegacaoPorCaminho("/manutencoes/pedido-01")?.id).toBe(
      "manutencoes",
    );
    expect(encontrarNavegacaoPorCaminho("/cadastros/setores/novo")?.id).toBe(
      "setores",
    );
    expect(
      encontrarNavegacaoPorCaminho("/movimentacoes-inexistente"),
    ).toBeUndefined();
  });

  it("produz breadcrumbs navegáveis sem identificadores técnicos", () => {
    expect(
      encontrarTelaPorCaminho("/patrimonios/95e540bb-38c3-4a3f")?.breadcrumb,
    ).toEqual([
      { label: "Patrimônios", href: "/patrimonios" },
      { label: "Detalhes" },
    ]);
    expect(
      encontrarTelaPorCaminho("/configuracoes/alterar-senha")?.breadcrumb,
    ).toEqual([
      { label: "Minha conta", href: "/configuracoes" },
      { label: "Alterar senha" },
    ]);
    expect(
      JSON.stringify(
        encontrarTelaPorCaminho("/usuarios/95e540bb-38c3-4a3f/editar")
          ?.breadcrumb,
      ),
    ).not.toContain("95e540bb");
  });

  it("mantém metadados de rota, perfis e tela no catálogo central", () => {
    expect(catalogoTelasSistema).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Minha conta",
          padrao: "/configuracoes",
        }),
        expect.objectContaining({
          label: "Detalhes do inventário",
          padrao: "/inventarios/:inventarioId",
        }),
      ]),
    );
    expect(encontrarTelaPorCaminho("/rota-inexistente")).toBeUndefined();
  });
});
