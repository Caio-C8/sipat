import { afterEach, describe, expect, it, vi } from "vitest";
import { createCreatePatrimonioOperations } from "./create-patrimonio-operations";
import {
  mapCreatePatrimonioForm,
  type CreatePatrimonioForm,
} from "./create-patrimonio-form";

const SECTOR = "11111111-1111-4111-8111-111111111111";
const SPECIES = "22222222-2222-4222-8222-222222222222";
const RESPONSIBLE = "33333333-3333-4333-8333-333333333333";
const ITEM = "44444444-4444-4444-8444-444444444444";
const NATURE = "55555555-5555-4555-8555-555555555555";

function response(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}
function success(data: unknown, status = 200) {
  return {
    status,
    sucesso: true,
    mensagem: "Operação concluída.",
    dados: data,
  };
}
function paginated(data: unknown[]) {
  return {
    ...success(data),
    meta: { total: data.length, pagina: 1, ultimaPagina: 1, limite: 20 },
  };
}

const form: CreatePatrimonioForm = {
  description: "Notebook",
  brand: "Dell",
  model: "Latitude",
  serialNumber: "ABC",
  withoutOfficialNumber: false,
  speciesId: SPECIES,
  sectorId: SECTOR,
  incorporationType: "AQUISICAO",
  purchaseProcessId: "",
  registryDate: "2026-09-27",
  incorporationValue: "6000",
  usefulLifeMonths: "60",
  residualMode: "value",
  residualValue: "600",
  residualPercentage: "",
  depreciationStartDate: "2026-10-01",
};

function created() {
  return {
    id: ITEM,
    numeroPatrimonio: "3105",
    tipoNumeroPatrimonial: "OFICIAL",
    descricao: "NOTEBOOK",
    marca: "DELL",
    modelo: "LATITUDE",
    numeroSerie: "ABC",
    status: "ATIVO",
    setorAtual: {
      id: SECTOR,
      nome: "TI",
      responsavel: { id: RESPONSIBLE, nome: "Paulo" },
    },
    especie: {
      id: SPECIES,
      nome: "Notebooks",
      natureza: { id: NATURE, nome: "Bens móveis" },
    },
    dataTombamento: "2026-09-27",
    tipoIncorporacao: "AQUISICAO",
    valorIncorporacao: "6000",
    processoCompra: null,
    situacaoContabil: {
      valorBrutoAtual: "6000",
      depreciacaoAcumuladaAtual: "0",
    },
    parametroDepreciacaoAtual: {
      metodo: "LINEAR",
      vidaUtilInicialMeses: 60,
      percentualResidual: null,
      valorResidual: "600",
      valorBaseInicial: "6000",
      dataInicio: "2026-10-01",
      dataFim: null,
    },
    createdAt: "2026-10-28T12:00:00.000Z",
    updatedAt: null,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("operações do cadastro patrimonial", () => {
  it("consulta uma página explícita de setores ativos", async () => {
    const sector = {
      id: SECTOR,
      nome: "TI",
      sala: "Sala 1",
      ramal: null,
      ativo: true,
      responsavel: {
        id: RESPONSIBLE,
        nome: "Paulo",
        matricula: "1",
        ativo: true,
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(response(paginated([sector])));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      createCreatePatrimonioOperations("https://api.test").listSectors(
        { page: 1, search: "tec" },
        { accessToken: "token" },
      ),
    ).resolves.toMatchObject({ dados: [sector] });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test/api/setores?pagina=1&limite=20&busca=tec&ativo=true",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("faz um único POST e valida a response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(success(created(), 201), 201));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      createCreatePatrimonioOperations("https://api.test").create(
        mapCreatePatrimonioForm(form),
        { accessToken: "token" },
      ),
    ).resolves.toMatchObject({ id: ITEM });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test/api/patrimonios",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("preserva 403 e rejeita response inválida", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          response(
            {
              status: 403,
              sucesso: false,
              codigo: "ACESSO_NEGADO",
              mensagem: "Acesso negado.",
              erros: [],
              requisicaoId: "req-1",
            },
            403,
          ),
        )
        .mockResolvedValueOnce(response(success({ id: ITEM }, 201), 201)),
    );
    const operations = createCreatePatrimonioOperations("https://api.test");
    await expect(
      operations.create(mapCreatePatrimonioForm(form), {
        accessToken: "token",
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      operations.create(mapCreatePatrimonioForm(form), {
        accessToken: "token",
      }),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });
});
