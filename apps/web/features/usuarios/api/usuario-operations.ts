import {
  CABECALHO_CSRF,
  VALOR_CABECALHO_CSRF,
  AlterarSituacaoUsuarioSchema,
  AlterarSituacaoUsuarioResponseSchema,
  AlterarUsuarioSchema,
  AlterarUsuarioResponseSchema,
  ConsultarUsuarioResponseSchema,
  CriarUsuarioSchema,
  CriarUsuarioResponseSchema,
  ListarUsuariosQuerySchema,
  ListarUsuariosResponseSchema,
  UsuarioParamsSchema,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

type Leitura = { cookie?: string; signal?: AbortSignal };
const leitura = (options?: Leitura) => ({
  cache: "no-store" as const,
  signal: options?.signal,
  headers: options?.cookie ? { Cookie: options.cookie } : undefined,
});
const csrf = { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF };

export function criarOperacoesUsuarios(client: ApiClient) {
  return {
    listar(query: unknown, options?: Leitura) {
      return client.request({
        path: "/usuarios",
        query: ListarUsuariosQuerySchema.parse(query),
        responseSchema: ListarUsuariosResponseSchema,
        ...leitura(options),
      });
    },
    consultar(id: string, options?: Leitura) {
      const params = UsuarioParamsSchema.parse({ usuarioId: id });
      return client.request({
        path: `/usuarios/${params.usuarioId}`,
        responseSchema: ConsultarUsuarioResponseSchema,
        ...leitura(options),
      });
    },
    criar(body: unknown) {
      return client.request({
        path: "/usuarios",
        method: "POST",
        body: CriarUsuarioSchema.parse(body),
        headers: csrf,
        responseSchema: CriarUsuarioResponseSchema,
      });
    },
    alterar(id: string, body: unknown) {
      const params = UsuarioParamsSchema.parse({ usuarioId: id });
      return client.request({
        path: `/usuarios/${params.usuarioId}`,
        method: "PATCH",
        body: AlterarUsuarioSchema.parse(body),
        headers: csrf,
        responseSchema: AlterarUsuarioResponseSchema,
      });
    },
    alterarSituacao(id: string, ativo: boolean) {
      const params = UsuarioParamsSchema.parse({ usuarioId: id });
      return client.request({
        path: `/usuarios/${params.usuarioId}/situacao`,
        method: "PATCH",
        body: AlterarSituacaoUsuarioSchema.parse({ ativo }),
        headers: csrf,
        responseSchema: AlterarSituacaoUsuarioResponseSchema,
      });
    },
  };
}
