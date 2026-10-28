import { afterEach, describe, expect, it, vi } from "vitest";
import { createPatrimoniosOperations } from "./patrimonios-operations";

const ID = "11111111-1111-4111-8111-111111111111";
const SETOR_ID = "22222222-2222-4222-8222-222222222222";
const ESPECIE_ID = "33333333-3333-4333-8333-333333333333";
const NATUREZA_ID = "44444444-4444-4444-8444-444444444444";
const RESPONSAVEL_ID = "55555555-5555-4555-8555-555555555555";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function summary() {
  return {
    id: ID,
    numeroPatrimonio: "2656",
    tipoNumeroPatrimonial: "OFICIAL",
    descricao: "Notebook corporativo",
    marca: "Dell",
    modelo: "Latitude",
    numeroSerie: "ABC-123",
    status: "ATIVO",
    setorAtual: {
      id: SETOR_ID,
      nome: "Tecnologia da Informação",
      responsavel: { id: RESPONSAVEL_ID, nome: "Paulo Caixeta" },
    },
    especie: {
      id: ESPECIE_ID,
      nome: "Notebooks",
      natureza: { id: NATUREZA_ID, nome: "Bens móveis" },
    },
  };
}

function paginated(data: unknown[], page = 1, lastPage = 1) {
  return {
    status: 200,
    sucesso: true,
    mensagem: "Dados listados com sucesso.",
    dados: data,
    meta: {
      total: data.length,
      pagina: page,
      ultimaPagina: lastPage,
      limite: 20,
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("createPatrimoniosOperations", () => {
  it("lista com query validada, paginação, filtros e Bearer", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(paginated([summary()])));
    vi.stubGlobal("fetch", fetchMock);
    const operations = createPatrimoniosOperations("https://api.example.test");

    await expect(
      operations.listar(
        {
          pagina: "2",
          limite: "20",
          busca: "notebook",
          status: "ATIVO",
          setorId: SETOR_ID,
          especieId: ESPECIE_ID,
          naturezaId: NATUREZA_ID,
          tipoNumeroPatrimonial: "OFICIAL",
        },
        { accessToken: "token" },
      ),
    ).resolves.toMatchObject({ dados: [expect.objectContaining({ id: ID })] });

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example.test/api/patrimonios?pagina=2&limite=20&busca=notebook&status=ATIVO&setorId=${SETOR_ID}&especieId=${ESPECIE_ID}&naturezaId=${NATUREZA_ID}&tipoNumeroPatrimonial=OFICIAL`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      }),
    );
  });

  it("consulta detalhe validado e preserva 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            status: 404,
            sucesso: false,
            codigo: "PATRIMONIO_NAO_ENCONTRADO",
            mensagem: "Patrimônio não encontrado.",
            erros: [],
            requisicaoId: "req-1",
          },
          404,
        ),
      ),
    );
    const operations = createPatrimoniosOperations("https://api.example.test");

    await expect(
      operations.consultar(ID, { accessToken: "token" }),
    ).rejects.toMatchObject({ kind: "http", status: 404 });
  });

  it("rejeita UUID inválido antes da rede", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const operations = createPatrimoniosOperations("https://api.example.test");

    await expect(
      operations.consultar("invalido", { accessToken: "token" }),
    ).rejects.toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("valida integralmente a response da listagem", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ dados: [summary()] })),
    );
    const operations = createPatrimoniosOperations("https://api.example.test");

    await expect(
      operations.listar({}, { accessToken: "token" }),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("carrega páginas dos catálogos e deriva naturezas das espécies", async () => {
    const setor = {
      id: SETOR_ID,
      nome: "Tecnologia da Informação",
      sala: "Sala de TI",
      ramal: null,
      ativo: true,
      responsavel: {
        id: RESPONSAVEL_ID,
        nome: "Paulo Caixeta",
        matricula: "123",
        ativo: true,
      },
    };
    const especie = summary().especie;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ...paginated([setor]),
          meta: { ...paginated([setor]).meta, limite: 50 },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ...paginated([especie]),
          meta: { ...paginated([especie]).meta, limite: 50 },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const operations = createPatrimoniosOperations("https://api.example.test");

    await expect(
      operations.listarCatalogos({ accessToken: "token" }),
    ).resolves.toMatchObject({
      setores: [expect.objectContaining({ id: SETOR_ID })],
      especies: [expect.objectContaining({ id: ESPECIE_ID })],
      naturezas: [expect.objectContaining({ id: NATUREZA_ID })],
    });
  });
});
