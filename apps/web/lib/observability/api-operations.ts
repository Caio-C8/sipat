import { isApiError, type CategoriaApiError } from "@/lib/api/core/api-error";
import type {
  ApiClient,
  ApiRequestOptions,
  MetodoHttp,
} from "@/lib/api/core/types";
import { publicAppConfig } from "../config/public-app-config";

export type OrigemOperacaoApi = "navegador" | "servidor";

export type ResultadoOperacaoApi = "sucesso" | "erro" | "cancelada";

export type MetricaOperacaoApi = Readonly<{
  nome: string;
  origem: OrigemOperacaoApi;
  metodo: MetodoHttp;
  resultado: ResultadoOperacaoApi;
  duracaoMs: number;
  requisicoesSimultaneas: number;
  status: number | null;
  categoriaErro?: CategoriaApiError;
}>;

type RotaObservavel = Readonly<{
  pattern: RegExp;
  operacoes: Partial<Record<MetodoHttp, string>>;
}>;

type InstrumentarApiClientOptions = Readonly<{
  origem: OrigemOperacaoApi;
  observar?: (metrica: MetricaOperacaoApi) => void;
  agora?: () => number;
}>;

const ROTAS_OBSERVAVEIS: readonly RotaObservavel[] = [
  {
    pattern: /^\/movimentacoes$/,
    operacoes: { GET: "movimentacoes.listar", POST: "movimentacoes.criar" },
  },
  {
    pattern: /^\/movimentacoes\/opcoes\/setores$/,
    operacoes: { GET: "movimentacoes.opcoes_setores" },
  },
  {
    pattern: /^\/movimentacoes\/opcoes\/comissoes$/,
    operacoes: { GET: "movimentacoes.opcoes_comissoes" },
  },
  {
    pattern: /^\/movimentacoes\/[^/]+$/,
    operacoes: { GET: "movimentacoes.consultar" },
  },
  {
    pattern: /^\/patrimonios\/[^/]+$/,
    operacoes: { GET: "patrimonios.consultar" },
  },
  {
    pattern: /^\/health$/,
    operacoes: {
      GET: "sistema.health",
    },
  },
  {
    pattern: /^\/auth\/login$/,
    operacoes: {
      POST: "auth.login",
    },
  },
  {
    pattern: /^\/auth\/me$/,
    operacoes: {
      GET: "auth.identidade",
    },
  },
  {
    pattern: /^\/auth\/concluir-primeiro-acesso$/,
    operacoes: {
      POST: "auth.primeiro_acesso",
    },
  },
  {
    pattern: /^\/auth\/logout$/,
    operacoes: {
      POST: "auth.logout",
    },
  },
  {
    pattern: /^\/patrimonios$/,
    operacoes: {
      GET: "patrimonios.listar",
    },
  },
];

function identificarOperacao(method: MetodoHttp, path: string): string {
  for (const rota of ROTAS_OBSERVAVEIS) {
    if (!rota.pattern.test(path)) {
      continue;
    }

    return rota.operacoes[method] ?? "api.desconhecida";
  }

  return "api.desconhecida";
}

function reportarComSeguranca(
  observar: (metrica: MetricaOperacaoApi) => void,
  metrica: MetricaOperacaoApi,
): void {
  try {
    observar(metrica);
  } catch {
    // Uma falha no destino de observabilidade não pode alterar a operação.
  }
}

export function reportarMetricaOperacaoApi(metrica: MetricaOperacaoApi): void {
  if (publicAppConfig.environment === "production") {
    return;
  }

  console.info("[api-operation]", metrica);
}

export function instrumentarApiClient(
  apiClient: ApiClient,
  {
    origem,
    observar = reportarMetricaOperacaoApi,
    agora = () => performance.now(),
  }: InstrumentarApiClientOptions,
): ApiClient {
  let requisicoesEmAndamento = 0;

  return {
    async request<TResponse = void>(
      options: ApiRequestOptions<TResponse>,
    ): Promise<TResponse> {
      const metodo = options.method ?? "GET";
      const inicio = agora();

      let resultado: ResultadoOperacaoApi = "sucesso";
      let status: number | null = null;
      let categoriaErro: CategoriaApiError | undefined;

      requisicoesEmAndamento += 1;

      try {
        return await apiClient.request<TResponse>(options);
      } catch (error: unknown) {
        resultado = "erro";

        if (isApiError(error)) {
          status = error.status;
          categoriaErro = error.categoria;

          if (error.categoria === "cancelada") {
            resultado = "cancelada";
          }
        }

        throw error;
      } finally {
        const duracaoMs = Math.max(0, Number((agora() - inicio).toFixed(2)));

        const metrica: MetricaOperacaoApi = {
          nome: identificarOperacao(metodo, options.path),
          origem,
          metodo,
          resultado,
          duracaoMs,
          requisicoesSimultaneas: requisicoesEmAndamento,
          status,
          ...(categoriaErro ? { categoriaErro } : {}),
        };

        reportarComSeguranca(observar, metrica);

        requisicoesEmAndamento -= 1;
      }
    },
  };
}
