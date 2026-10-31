import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { InventariosScreen } from "./inventarios-screen";
import { RegistrosConferencia } from "./resumo/registros-conferencia";
import { SetorInventarioScreen } from "./setor-inventario-screen";

const scenario = vi.hoisted(() => ({
  profile: "DIRETOR_PATRIMONIO" as "DIRETOR_PATRIMONIO" | "ADMINISTRADOR",
  status: "PENDENTE" as "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO",
}));

const useInventariosMock = vi.hoisted(() =>
  vi.fn(
    (
      _manager: unknown,
      _status: "PENDENTE" | "EM_ANDAMENTO" | "FINALIZADO",
      _search: string | undefined,
      _page: number,
      _enabled = true,
    ) => ({
      state: {
        status: "success" as const,
        data: {
          status: 200 as const,
          sucesso: true as const,
          mensagem: "Inventários listados.",
          dados: [],
          meta: {
            total: 0,
            pagina: 1,
            ultimaPagina: 1,
            limite: 10,
          },
        },
      },
      reload: vi.fn(),
    }),
  ),
);

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("expo-router", () => ({
  useFocusEffect: vi.fn(),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("../auth/session/session-context", () => ({
  useSession: () => ({
    manager: {},
    state: {
      status: "authenticated",
      identity: { perfil: scenario.profile },
    },
  }),
}));

vi.mock("./use-inventarios", () => ({
  inventarioErrorMessage: () => "Falha de teste.",
  useInventarios: useInventariosMock,
  useSetorInventarioDetail: () => {
    const started = scenario.status !== "PENDENTE";
    const completed = scenario.status === "CONCLUIDO";
    const setor = {
      id: "22222222-2222-4222-8222-222222222222",
      status: scenario.status,
      setor: {
        id: "33333333-3333-4333-8333-333333333333",
        nome: "Gabinete 01",
      },
      dataInicio: started ? "2026-10-29T12:00:00.000Z" : null,
      dataFim: completed ? "2026-10-29T13:00:00.000Z" : null,
      iniciadoPorId: started ? "44444444-4444-4444-8444-444444444444" : null,
      concluidoPorId: completed ? "44444444-4444-4444-8444-444444444444" : null,
      progresso: {
        totalItens: 4,
        itensPendentes: completed ? 0 : 2,
        itensVerificados: completed ? 4 : 2,
        corretos: completed ? 3 : 1,
        divergencias: completed ? 1 : 1,
        naoLocalizados: 0,
      },
    };
    return {
      state: {
        status: "success",
        data: {
          inventario: {
            nome: "Inventário 2026",
          },
          setor,
          setorEmAndamento: scenario.status === "EM_ANDAMENTO" ? setor : null,
          pendencias: {
            status: 200,
            sucesso: true,
            mensagem: "Itens listados.",
            dados: [],
            meta: { total: 0, pagina: 1, ultimaPagina: 1, limite: 10 },
          },
          registros: {
            status: 200,
            sucesso: true,
            mensagem: "Itens listados.",
            dados: completed
              ? [
                  {
                    id: "55555555-5555-4555-8555-555555555555",
                    patrimonio: {
                      id: "66666666-6666-4666-8666-666666666666",
                      numeroPatrimonio: "1",
                      descricao: "NOTEBOOK DE CONFERÊNCIA",
                    },
                    setorEsperado: setor.setor,
                    observacao: null,
                    statusVerificacao: "VERIFICADO",
                    situacao: "CORRETO",
                    setorEncontrado: null,
                    dataVerificacao: "2026-10-29T12:30:00.000Z",
                    verificadoPorId: "44444444-4444-4444-8444-444444444444",
                    statusPatrimonioNaVerificacao: "ATIVO",
                    ausenciaJustificada: null,
                    statusCorrecao: null,
                    tipoCorrecao: null,
                    dataCorrecao: null,
                    corrigidoPorId: null,
                    transferenciaCorrecaoId: null,
                    localizacaoPosterior: null,
                  },
                ]
              : [],
            meta: {
              total: completed ? 1 : 0,
              pagina: 1,
              ultimaPagina: 1,
              limite: 10,
            },
          },
          totaisRegistros: {
            previstos: completed ? 1 : 0,
            encontradosAqui: 0,
          },
        },
      },
      reload: vi.fn(),
      conclude: vi.fn(),
      concluding: false,
      start: vi.fn(),
      starting: false,
      mutationError: null,
    };
  },
}));

describe("seleção de inventários por perfil", () => {
  it("consulta inventários em andamento e finalizados ao Administrador", () => {
    scenario.profile = "ADMINISTRADOR";
    useInventariosMock.mockClear();

    const markup = renderToStaticMarkup(<InventariosScreen />);

    expect(markup).toContain("Consultar inventários");
    expect(markup).toContain("Consulta somente leitura");
    expect(markup).not.toContain(">Pendentes<");
    expect(markup).toContain(">Finalizados<");
    expect(useInventariosMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      "PENDENTE",
      undefined,
      1,
      false,
    );
    expect(useInventariosMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      "EM_ANDAMENTO",
      undefined,
      1,
    );
    expect(useInventariosMock).toHaveBeenNthCalledWith(
      3,
      expect.any(Object),
      "FINALIZADO",
      undefined,
      1,
    );
  });

  it("mantém pendentes e em andamento disponíveis ao Diretor", () => {
    scenario.profile = "DIRETOR_PATRIMONIO";
    useInventariosMock.mockClear();

    const markup = renderToStaticMarkup(<InventariosScreen />);

    expect(markup).toContain("Selecionar inventário");
    expect(markup).toContain(">Pendentes<");
    expect(markup).toContain(">Finalizados<");
    expect(markup).not.toContain("Consulta somente leitura");
    expect(useInventariosMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      "PENDENTE",
      undefined,
      1,
      true,
    );
  });
});

function render() {
  return renderToStaticMarkup(
    <SetorInventarioScreen
      inventarioId="11111111-1111-4111-8111-111111111111"
      setorInventarioId="22222222-2222-4222-8222-222222222222"
      validIds
    />,
  );
}

describe("apresentação do setor de inventário", () => {
  it("oferece iniciar apenas para Diretor em setor pendente", () => {
    scenario.profile = "DIRETOR_PATRIMONIO";
    scenario.status = "PENDENTE";
    const markup = render();

    expect(markup).toContain("Iniciar conferência");
    expect(markup).not.toContain("Retomar conferência");
  });

  it("oferece retomar sem apresentar novo início em setor em andamento", () => {
    scenario.profile = "DIRETOR_PATRIMONIO";
    scenario.status = "EM_ANDAMENTO";
    const markup = render();

    expect(markup).toContain("Retomar conferência");
    expect(markup).toContain("Concluir conferência do setor");
    expect(markup).not.toContain("Finalizar inventário");
    expect(markup).not.toContain("Confirmar início");
  });

  it("mantém setor concluído somente leitura", () => {
    scenario.profile = "DIRETOR_PATRIMONIO";
    scenario.status = "CONCLUIDO";
    const markup = render();

    expect(markup).toContain("Conferência concluída");
    expect(markup).toContain("Registros da conferência");
    expect(markup).toContain("Do setor (1)");
    expect(markup).toContain("Encontrados aqui (0)");
    expect(markup).toContain("NOTEBOOK DE CONFERÊNCIA");
    expect(markup).toContain("000001");
    expect(markup).toContain("Não localizados");
    expect(markup).not.toContain("Iniciar conferência");
    expect(markup).not.toContain("Retomar conferência");
  });

  it("não monta controles mutáveis para Administrador", () => {
    scenario.profile = "ADMINISTRADOR";
    scenario.status = "PENDENTE";
    const markup = render();

    expect(markup).toContain("Resumo somente leitura");
    expect(markup).not.toContain("Iniciar conferência");
    expect(markup).not.toContain("Retomar conferência");
  });

  it("permite ao Administrador consultar registros concluídos sem correção", () => {
    scenario.profile = "ADMINISTRADOR";
    scenario.status = "CONCLUIDO";
    const markup = render();

    expect(markup).toContain("Resumo somente leitura");
    expect(markup).toContain("NOTEBOOK DE CONFERÊNCIA");
    expect(markup).toContain("000001");
    expect(markup).not.toContain(">Corrigir<");
    expect(markup).not.toContain("Iniciar conferência");
  });
});

describe("separação dos registros do setor", () => {
  it("mostra no setor encontrado uma divergência da primeira conferência", () => {
    const markup = renderToStaticMarkup(
      <RegistrosConferencia
        contexto="ENCONTRADO_NO_SETOR"
        items={{
          status: 200,
          sucesso: true,
          mensagem: "Itens listados.",
          dados: [
            {
              id: "55555555-5555-4555-8555-555555555555",
              patrimonio: {
                id: "66666666-6666-4666-8666-666666666666",
                numeroPatrimonio: "25",
                descricao: "NOTEBOOK CORPORATIVO",
              },
              setorEsperado: {
                id: "77777777-7777-4777-8777-777777777777",
                nome: "Arquivo e Protocolo",
              },
              observacao: null,
              statusVerificacao: "VERIFICADO",
              situacao: "DIVERGENCIA",
              setorEncontrado: {
                id: "22222222-2222-4222-8222-222222222222",
                nome: "Apoio Legislativo",
              },
              dataVerificacao: "2026-10-30T22:48:00.000Z",
              verificadoPorId: "44444444-4444-4444-8444-444444444444",
              statusPatrimonioNaVerificacao: "ATIVO",
              ausenciaJustificada: null,
              statusCorrecao: "PENDENTE",
              tipoCorrecao: null,
              dataCorrecao: null,
              corrigidoPorId: null,
              transferenciaCorrecaoId: null,
              localizacaoPosterior: null,
            },
          ],
          meta: { total: 1, pagina: 1, ultimaPagina: 1, limite: 10 },
        }}
        onContexto={vi.fn()}
        onPage={vi.fn()}
        setorId="22222222-2222-4222-8222-222222222222"
        totais={{ previstos: 4, encontradosAqui: 1 }}
      />,
    );

    expect(markup).toContain("Encontrado aqui");
    expect(markup).toContain("Setor original: Arquivo e Protocolo");
    expect(markup).toContain("Encontrado em Apoio Legislativo");
    expect(markup).toContain("Correção pendente");
    expect(markup).not.toContain(">Divergência pendente<");
  });

  it("identifica o setor original de um bem encontrado e transferido", () => {
    const markup = renderToStaticMarkup(
      <RegistrosConferencia
        contexto="ENCONTRADO_NO_SETOR"
        items={{
          status: 200,
          sucesso: true,
          mensagem: "Itens listados.",
          dados: [
            {
              id: "55555555-5555-4555-8555-555555555555",
              patrimonio: {
                id: "66666666-6666-4666-8666-666666666666",
                numeroPatrimonio: "2",
                descricao: "ESTAÇÃO DE TRABALHO",
              },
              setorEsperado: {
                id: "77777777-7777-4777-8777-777777777777",
                nome: "Almoxarifado",
              },
              observacao: null,
              statusVerificacao: "VERIFICADO",
              situacao: "NAO_LOCALIZADO",
              setorEncontrado: null,
              dataVerificacao: "2026-10-30T18:00:00.000Z",
              verificadoPorId: "44444444-4444-4444-8444-444444444444",
              statusPatrimonioNaVerificacao: "ATIVO",
              ausenciaJustificada: null,
              statusCorrecao: null,
              tipoCorrecao: null,
              dataCorrecao: null,
              corrigidoPorId: null,
              transferenciaCorrecaoId: null,
              localizacaoPosterior: {
                id: "88888888-8888-4888-8888-888888888888",
                setorEncontrado: {
                  id: "22222222-2222-4222-8222-222222222222",
                  nome: "Compras e Licitações",
                },
                dataLocalizacao: "2026-10-30T18:10:00.000Z",
                localizadoPorId: "44444444-4444-4444-8444-444444444444",
                observacao: null,
                statusCorrecao: "CORRIGIDO",
                tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
                dataCorrecao: "2026-10-30T18:15:00.000Z",
                corrigidoPorId: "44444444-4444-4444-8444-444444444444",
                transferenciaCorrecaoId: "99999999-9999-4999-8999-999999999999",
              },
            },
          ],
          meta: { total: 1, pagina: 1, ultimaPagina: 1, limite: 10 },
        }}
        onContexto={vi.fn()}
        onPage={vi.fn()}
        setorId="22222222-2222-4222-8222-222222222222"
        totais={{ previstos: 5, encontradosAqui: 1 }}
      />,
    );

    expect(markup).toContain("Encontrado aqui");
    expect(markup).toContain("Setor original: Almoxarifado");
    expect(markup).toContain("Cadastro transferido para Compras e Licitações");
    expect(markup).not.toContain(">Não localizado<");
  });
});
