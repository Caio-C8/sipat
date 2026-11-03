import type * as z from "zod";
import {
  CriarProcessoCompraDadosSchema,
  CriarProcessoCompraMultipartSchema,
  CriarProcessoCompraResponseSchema,
  CriarNotaFiscalDadosSchema,
  CriarNotaFiscalResponseSchema,
  NotaFiscalParamsSchema,
  AlterarAnexoNotaFiscalResponseSchema,
  RemoverAnexoNotaFiscalResponseSchema,
  ComissaoParamsSchema,
  MembroComissaoParamsSchema,
  AdicionarMembroComissaoBodySchema,
  AdicionarMembroComissaoResponseSchema,
  AlterarMembroComissaoBodySchema,
  AlterarMembroComissaoResponseSchema,
  ListarFornecedoresQuerySchema,
  ListarFornecedoresResponseSchema,
  LIMITE_BYTES_ANEXO_NOTA_FISCAL,
  TIPO_MIME_ANEXO_NOTA_FISCAL,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";
import { csrf, type Leitura } from "./cadastro-operations";

export function validarAnexo(arquivo: File) {
  if (
    arquivo.size === 0 ||
    arquivo.size > LIMITE_BYTES_ANEXO_NOTA_FISCAL ||
    arquivo.type !== TIPO_MIME_ANEXO_NOTA_FISCAL ||
    !arquivo.name.toLowerCase().endsWith(".pdf")
  )
    throw new RangeError("Selecione um PDF de até 10 MiB.");
}
export function criarOperacoesComplementares(client: ApiClient) {
  return {
    fornecedores(
      query: z.input<typeof ListarFornecedoresQuerySchema>,
      options?: Leitura,
    ) {
      return client.request({
        path: "/fornecedores",
        query: ListarFornecedoresQuerySchema.parse(query),
        cache: "no-store",
        signal: options?.signal,
        headers: options?.cookie ? { Cookie: options.cookie } : undefined,
        responseSchema: ListarFornecedoresResponseSchema,
      });
    },
    criarProcesso(input: {
      dados: z.input<typeof CriarProcessoCompraDadosSchema>;
      anexos: File[];
    }) {
      input.anexos.forEach(validarAnexo);
      const parsed = CriarProcessoCompraMultipartSchema.parse({
        dados: JSON.stringify(input.dados),
        anexos: input.anexos,
      });
      const body = new FormData();
      body.append(
        "dados",
        JSON.stringify(CriarProcessoCompraDadosSchema.parse(parsed.dados)),
      );
      input.anexos.forEach((file) => body.append("anexos", file));
      return client.request({
        path: "/processos-compra",
        method: "POST",
        body,
        headers: csrf,
        responseSchema: CriarProcessoCompraResponseSchema,
      });
    },
    criarNota(input: {
      dados: z.input<typeof CriarNotaFiscalDadosSchema>;
      anexo?: File;
    }) {
      if (input.anexo) validarAnexo(input.anexo);
      const body = new FormData();
      body.append(
        "dados",
        JSON.stringify(CriarNotaFiscalDadosSchema.parse(input.dados)),
      );
      if (input.anexo) body.append("anexo", input.anexo);
      return client.request({
        path: "/notas-fiscais",
        method: "POST",
        body,
        headers: csrf,
        responseSchema: CriarNotaFiscalResponseSchema,
      });
    },
    substituirAnexo(input: { id: string; anexo: File }) {
      const { notaFiscalId } = NotaFiscalParamsSchema.parse({
        notaFiscalId: input.id,
      });
      validarAnexo(input.anexo);
      const body = new FormData();
      body.append("anexo", input.anexo);
      return client.request({
        path: `/notas-fiscais/${notaFiscalId}/anexo`,
        method: "PUT",
        body,
        headers: csrf,
        responseSchema: AlterarAnexoNotaFiscalResponseSchema,
      });
    },
    removerAnexo(id: string) {
      const { notaFiscalId } = NotaFiscalParamsSchema.parse({
        notaFiscalId: id,
      });
      return client.request({
        path: `/notas-fiscais/${notaFiscalId}/anexo`,
        method: "DELETE",
        headers: csrf,
        responseSchema: RemoverAnexoNotaFiscalResponseSchema,
      });
    },
    adicionarMembro(input: {
      id: string;
      body: z.input<typeof AdicionarMembroComissaoBodySchema>;
    }) {
      const { comissaoId } = ComissaoParamsSchema.parse({
        comissaoId: input.id,
      });
      return client.request({
        path: `/comissoes/${comissaoId}/membros`,
        method: "POST",
        body: AdicionarMembroComissaoBodySchema.parse(input.body),
        headers: csrf,
        responseSchema: AdicionarMembroComissaoResponseSchema,
      });
    },
    alterarMembro(input: {
      comissaoId: string;
      membroComissaoId: string;
      body: z.input<typeof AlterarMembroComissaoBodySchema>;
    }) {
      const params = MembroComissaoParamsSchema.parse({
        comissaoId: input.comissaoId,
        membroComissaoId: input.membroComissaoId,
      });
      return client.request({
        path: `/comissoes/${params.comissaoId}/membros/${params.membroComissaoId}`,
        method: "PATCH",
        body: AlterarMembroComissaoBodySchema.parse(input.body),
        headers: csrf,
        responseSchema: AlterarMembroComissaoResponseSchema,
      });
    },
    removerMembro(input: { comissaoId: string; membroComissaoId: string }) {
      const params = MembroComissaoParamsSchema.parse(input);
      return client.request({
        path: `/comissoes/${params.comissaoId}/membros/${params.membroComissaoId}`,
        method: "DELETE",
        headers: csrf,
      });
    },
  };
}
