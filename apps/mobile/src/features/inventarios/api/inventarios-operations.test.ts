import { afterEach, describe, expect, it, vi } from "vitest";
import { createInventariosOperations } from "./inventarios-operations";

const INVENTARIO_ID = "11111111-1111-4111-8111-111111111111";
const SETOR_ID = "22222222-2222-4222-8222-222222222222";
const ITEM_ID = "66666666-6666-4666-8666-666666666666";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function meta(total = 1, pagina = 1, ultimaPagina = 1, limite = 10) {
  return { total, pagina, ultimaPagina, limite };
}

function inventario(status: "PENDENTE" | "EM_ANDAMENTO" = "PENDENTE") {
  const started = status === "EM_ANDAMENTO";
  return {
    id: INVENTARIO_ID,
    nome: "Inventário 2026",
    status,
    dataInicio: started ? "2026-10-01" : null,
    dataFim: null,
    iniciadoPorId: started ? "33333333-3333-4333-8333-333333333333" : null,
    finalizadoPorId: null,
    comissao: {
      id: "44444444-4444-4444-8444-444444444444",
      nome: "Comissão anual",
    },
    progresso: {
      totalSetores: 1,
      setoresPendentes: started ? 0 : 1,
      setoresEmAndamento: started ? 1 : 0,
      setoresConcluidos: 0,
      totalItens: 2,
      itensPendentes: 2,
      itensVerificados: 0,
      corretos: 0,
      divergencias: 0,
      naoLocalizados: 0,
      correcoesPendentes: 0,
      correcoesCorrigidas: 0,
    },
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: null,
  };
}

function setor(status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" = "PENDENTE") {
  const started = status === "EM_ANDAMENTO";
  const completed = status === "CONCLUIDO";
  return {
    id: SETOR_ID,
    status,
    setor: {
      id: "55555555-5555-4555-8555-555555555555",
      nome: "Gabinete 01",
    },
    dataInicio: started || completed ? "2026-10-29T12:00:00.000Z" : null,
    dataFim: completed ? "2026-10-29T13:00:00.000Z" : null,
    iniciadoPorId:
      started || completed ? "33333333-3333-4333-8333-333333333333" : null,
    concluidoPorId: completed ? "33333333-3333-4333-8333-333333333333" : null,
    progresso: {
      totalItens: 2,
      itensPendentes: completed ? 0 : 2,
      itensVerificados: completed ? 2 : 0,
      corretos: completed ? 1 : 0,
      divergencias: 0,
      naoLocalizados: completed ? 1 : 0,
    },
  };
}

function divergentItem(corrected = false) {
  return {
    id: ITEM_ID,
    patrimonio: {
      id: "77777777-7777-4777-8777-777777777777",
      numeroPatrimonio: "1001",
      descricao: "Notebook corporativo",
    },
    setorEsperado: {
      id: "55555555-5555-4555-8555-555555555555",
      nome: "Tecnologia da Informação",
    },
    observacao: null,
    statusVerificacao: "VERIFICADO",
    situacao: "DIVERGENCIA",
    setorEncontrado: {
      id: "88888888-8888-4888-8888-888888888888",
      nome: "Gabinete 01",
    },
    dataVerificacao: "2026-10-29T12:00:00.000Z",
    verificadoPorId: "33333333-3333-4333-8333-333333333333",
    statusPatrimonioNaVerificacao: "ATIVO",
    ausenciaJustificada: null,
    statusCorrecao: corrected ? "CORRIGIDO" : "PENDENTE",
    tipoCorrecao: corrected ? "TRANSFERENCIA_CADASTRAL" : null,
    dataCorrecao: corrected ? "2026-10-29T13:00:00.000Z" : null,
    corrigidoPorId: corrected ? "33333333-3333-4333-8333-333333333333" : null,
    transferenciaCorrecaoId: corrected
      ? "99999999-9999-4999-8999-999999999999"
      : null,
  };
}

function paginated(data: unknown[], pagination = meta()) {
  return {
    status: 200,
    sucesso: true,
    mensagem: "Dados listados.",
    dados: data,
    meta: pagination,
  };
}

function success(data: unknown) {
  return {
    status: 200,
    sucesso: true,
    mensagem: "Operação concluída.",
    dados: data,
  };
}

function publicError(status: number, code: string) {
  return {
    status,
    sucesso: false,
    codigo: code,
    mensagem: "Falha pública.",
    erros: [],
    requisicaoId: "req-1",
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("createInventariosOperations", () => {
  it("lista inventários com status isolado, busca, paginação e Bearer", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(paginated([inventario()], meta(11, 2, 2, 10))),
      );
    vi.stubGlobal("fetch", fetchMock);
    const operations = createInventariosOperations("https://api.example.test");

    await expect(
      operations.listar(
        {
          pagina: "2",
          limite: "10",
          busca: "2026",
          status: "PENDENTE",
        },
        { accessToken: "token" },
      ),
    ).resolves.toMatchObject({ meta: { pagina: 2, ultimaPagina: 2 } });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/inventarios?pagina=2&limite=10&busca=2026&status=PENDENTE",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      }),
    );
  });

  it("lista setores com busca, status e paginação explícitos", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(paginated([setor()], meta(1, 1, 1, 20))));
    vi.stubGlobal("fetch", fetchMock);
    const operations = createInventariosOperations("https://api.example.test");

    await operations.listarSetores(
      INVENTARIO_ID,
      { pagina: "1", limite: "20", busca: "gabinete", status: "PENDENTE" },
      { accessToken: "token" },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example.test/api/inventarios/${INVENTARIO_ID}/setores?pagina=1&limite=20&busca=gabinete&status=PENDENTE`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("procura o setor sequencialmente e para na página encontrada", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(paginated([], meta(51, 1, 2, 50))))
      .mockResolvedValueOnce(
        jsonResponse(paginated([setor()], meta(51, 2, 2, 50))),
      );
    vi.stubGlobal("fetch", fetchMock);
    const operations = createInventariosOperations("https://api.example.test");

    await expect(
      operations.consultarSetor(INVENTARIO_ID, SETOR_ID, {
        accessToken: "token",
      }),
    ).resolves.toMatchObject({ id: SETOR_ID });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("inicia o setor com um único POST e body vazio", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(success(setor("EM_ANDAMENTO"))));
    vi.stubGlobal("fetch", fetchMock);
    const operations = createInventariosOperations("https://api.example.test");

    await expect(
      operations.iniciarSetor(INVENTARIO_ID, SETOR_ID, {
        accessToken: "token",
      }),
    ).resolves.toMatchObject({ status: "EM_ANDAMENTO" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example.test/api/inventarios/${INVENTARIO_ID}/setores/${SETOR_ID}/iniciar`,
      expect.objectContaining({ method: "POST", body: "{}" }),
    );
  });

  it("verifica o número canônico com um único POST e valida o resultado", async () => {
    const item = {
      id: "66666666-6666-4666-8666-666666666666",
      patrimonio: {
        id: "77777777-7777-4777-8777-777777777777",
        numeroPatrimonio: "1001",
        descricao: "Mesa de trabalho",
      },
      setorEsperado: {
        id: "55555555-5555-4555-8555-555555555555",
        nome: "Gabinete 01",
      },
      observacao: null,
      statusVerificacao: "VERIFICADO",
      situacao: "CORRETO",
      setorEncontrado: null,
      dataVerificacao: "2026-10-29T12:00:00.000Z",
      verificadoPorId: "33333333-3333-4333-8333-333333333333",
      statusPatrimonioNaVerificacao: "ATIVO",
      ausenciaJustificada: null,
      statusCorrecao: null,
      tipoCorrecao: null,
      dataCorrecao: null,
      corrigidoPorId: null,
      transferenciaCorrecaoId: null,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(success({ tipo: "CONFERENCIA_REGISTRADA", item })),
      );
    vi.stubGlobal("fetch", fetchMock);
    const operations = createInventariosOperations("https://api.example.test");

    await expect(
      operations.verificarItem(INVENTARIO_ID, SETOR_ID, "1001", {
        accessToken: "token",
      }),
    ).resolves.toMatchObject({ tipo: "CONFERENCIA_REGISTRADA" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example.test/api/inventarios/${INVENTARIO_ID}/setores/${SETOR_ID}/verificacoes`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ numeroPatrimonial: "1001" }),
      }),
    );
  });

  it("rejeita número patrimonial inválido antes da mutation", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const operations = createInventariosOperations("https://api.example.test");

    await expect(
      operations.verificarItem(INVENTARIO_ID, SETOR_ID, "001", {
        accessToken: "token",
      }),
    ).rejects.toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lista divergências pendentes do setor com paginação e filtros explícitos", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(paginated([divergentItem()], meta(11, 2, 2, 10))),
      );
    vi.stubGlobal("fetch", fetchMock);
    const operations = createInventariosOperations("https://api.example.test");

    await operations.listarItens(
      INVENTARIO_ID,
      {
        pagina: "2",
        limite: "10",
        setorInventarioId: SETOR_ID,
        situacao: "DIVERGENCIA",
        statusCorrecao: "PENDENTE",
      },
      { accessToken: "token" },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example.test/api/inventarios/${INVENTARIO_ID}/itens?pagina=2&limite=10&setorInventarioId=${SETOR_ID}&situacao=DIVERGENCIA&statusCorrecao=PENDENTE`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("corrige por transferência com um único POST e valida o vínculo retornado", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(success(divergentItem(true))));
    vi.stubGlobal("fetch", fetchMock);
    const operations = createInventariosOperations("https://api.example.test");

    await expect(
      operations.corrigirItem(
        INVENTARIO_ID,
        ITEM_ID,
        {
          tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
          observacao: "Bem em uso no gabinete.",
        },
        { accessToken: "token" },
      ),
    ).resolves.toMatchObject({
      tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
      transferenciaCorrecaoId: "99999999-9999-4999-8999-999999999999",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example.test/api/inventarios/${INVENTARIO_ID}/itens/${ITEM_ID}/correcoes`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
          observacao: "Bem em uso no gabinete.",
        }),
      }),
    );
  });

  it("conclui o setor com um único POST vazio e valida o estado consolidado", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(success(setor("CONCLUIDO"))));
    vi.stubGlobal("fetch", fetchMock);
    const operations = createInventariosOperations("https://api.example.test");

    await expect(
      operations.concluirSetor(INVENTARIO_ID, SETOR_ID, {
        accessToken: "token",
      }),
    ).resolves.toMatchObject({
      status: "CONCLUIDO",
      progresso: { naoLocalizados: 1 },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example.test/api/inventarios/${INVENTARIO_ID}/setores/${SETOR_ID}/concluir`,
      expect.objectContaining({ method: "POST", body: "{}" }),
    );
  });

  it("rejeita UUIDs inválidos antes da rede", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const operations = createInventariosOperations("https://api.example.test");

    await expect(
      operations.iniciarSetor("invalido", SETOR_ID, { accessToken: "token" }),
    ).rejects.toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, "NAO_AUTENTICADO"],
    [403, "ACESSO_NEGADO"],
    [404, "SETOR_INVENTARIO_NAO_ENCONTRADO"],
    [409, "OUTRO_SETOR_INVENTARIO_EM_ANDAMENTO"],
  ])("preserva HTTP %s e o código público", async (status, code) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse(publicError(status, code), status)),
    );
    const operations = createInventariosOperations("https://api.example.test");

    await expect(
      operations.iniciarSetor(INVENTARIO_ID, SETOR_ID, {
        accessToken: "token",
      }),
    ).rejects.toMatchObject({ kind: "http", status, code });
  });

  it("rejeita response fora do contrato integral", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ dados: [inventario()] })),
    );
    const operations = createInventariosOperations("https://api.example.test");

    await expect(
      operations.listar({ status: "PENDENTE" }, { accessToken: "token" }),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });
});
