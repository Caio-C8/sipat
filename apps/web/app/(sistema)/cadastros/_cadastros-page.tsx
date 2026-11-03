import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import * as z from "zod";
import {
  CadastrosTelas,
  type SecaoCadastro,
} from "@/features/cadastros/components/cadastros-telas";
import {
  FormularioNatureza,
  FormularioEspecie,
  FormularioResponsavel,
} from "@/features/cadastros/components/formularios-basicos";
import { FormularioComissao } from "@/features/cadastros/components/formulario-comissao";
import { FormularioProcesso } from "@/features/cadastros/components/formulario-processo";
import {
  ErroCadastro,
  mensagemErro,
  pagina,
} from "@/features/cadastros/components/cadastro-ui";
import { serverCadastros } from "@/features/cadastros/api/server";
import type { Leitura } from "@/features/cadastros/api/cadastro-operations";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
export type SearchCadastros = Promise<
  Record<string, string | string[] | undefined>
>;
const ParamsSchema = z.object({
  id: z.uuid().optional(),
  busca: z.string().trim().max(200).optional(),
  pagina: z
    .string()
    .regex(/^[1-9]\d*$/)
    .optional(),
  salvo: z.literal("1").optional(),
});
type Lista<T> = {
  dados: T[];
  meta: { total: number; pagina: number; ultimaPagina: number };
};
async function carregar<
  T extends { id: string },
  D extends { id: string },
>(config: {
  secao: SecaoCadastro;
  params: z.output<typeof ParamsSchema>;
  cookie: string;
  listar: (
    query: { busca?: string; pagina?: string; limite?: string },
    opcoes?: Leitura,
  ) => Promise<Lista<T>>;
  consultar: (id: string, opcoes?: Leitura) => Promise<{ dados: D }>;
  resumo: (item: T) => { titulo: string; detalhe: string };
  formulario: (dado?: D) => ReactNode;
}) {
  const { params, secao, cookie } = config;
  const lista = await config.listar(
    { busca: params.busca || undefined, pagina: params.pagina, limite: "20" },
    { cookie },
  );
  let registro: D | undefined;
  if (params.id) {
    try {
      registro = (await config.consultar(params.id, { cookie })).dados;
    } catch (e) {
      if (isApiError(e) && e.status === 404) notFound();
      throw e;
    }
  }
  return (
    <CadastrosTelas
      secao={secao}
      registros={lista.dados.map((x) => ({ id: x.id, ...config.resumo(x) }))}
      meta={lista.meta}
      busca={params.busca}
      id={params.id}
      salvo={params.salvo === "1"}
    >
      <div key={registro ? JSON.stringify(registro) : "novo"}>
        {config.formulario(registro)}
      </div>
    </CadastrosTelas>
  );
}
export async function CadastrosPage({
  secao,
  searchParams,
}: {
  secao: SecaoCadastro;
  searchParams: SearchCadastros;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  if (secao !== "processos" && identidade.perfil !== "ADMINISTRADOR")
    return (
      <main className={pagina}>
        <h1 className="text-2xl font-bold">Acesso não permitido</h1>
        <p role="alert">
          Somente o Administrador pode gerenciar este cadastro.
        </p>
        <Link href="/dashboard" className="underline">
          Voltar à visão geral
        </Link>
      </main>
    );
  const parsed = ParamsSchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <main className={pagina}>
        <h1 className="text-xl font-bold">Consulta inválida</h1>
        <p role="alert">Revise os filtros ou o identificador do cadastro.</p>
      </main>
    );
  const cookie = (await headers()).get("cookie") ?? "";
  const base = { secao, params: parsed.data, cookie };
  try {
    switch (secao) {
      case "naturezas":
        return await carregar({
          ...base,
          ...serverCadastros.naturezas,
          resumo: (x) => ({ titulo: x.nome, detalhe: "Natureza patrimonial" }),
          formulario: (registro) => <FormularioNatureza registro={registro} />,
        });
      case "especies":
        return await carregar({
          ...base,
          ...serverCadastros.especies,
          resumo: (x) => ({ titulo: x.nome, detalhe: x.natureza.nome }),
          formulario: (registro) => <FormularioEspecie registro={registro} />,
        });
      case "responsaveis":
        return await carregar({
          ...base,
          ...serverCadastros.responsaveis,
          resumo: (x) => ({
            titulo: x.nome,
            detalhe: x.matricula + " · " + (x.ativo ? "Ativo" : "Inativo"),
          }),
          formulario: (registro) => (
            <FormularioResponsavel registro={registro} />
          ),
        });
      case "comissoes":
        return await carregar({
          ...base,
          ...serverCadastros.comissoes,
          resumo: (x) => ({
            titulo: x.nome,
            detalhe:
              "Vigência: " +
              x.dataVigenciaInicio.split("-").reverse().join("/") +
              " a " +
              x.dataVigenciaFim.split("-").reverse().join("/"),
          }),
          formulario: (registro) => <FormularioComissao registro={registro} />,
        });
      case "processos":
        return await carregar({
          ...base,
          ...serverCadastros.processos,
          resumo: (x) => ({
            titulo: x.numeroProcesso
              ? x.numeroProcesso + (x.anoProcesso ? "/" + x.anoProcesso : "")
              : "Processo sem número",
            detalhe: x.quantidadeNotas + " notas fiscais",
          }),
          formulario: (registro) => (
            <FormularioProcesso
              registro={registro}
              admin={identidade.perfil === "ADMINISTRADOR"}
            />
          ),
        });
    }
  } catch (e) {
    if (!isApiError(e) && !(e instanceof z.ZodError)) throw e;
    return (
      <main className={pagina}>
        <h1 className="text-xl font-bold">Cadastros</h1>
        <ErroCadastro mensagem={mensagemErro(e)} />
        <Link
          href={secao === "processos" ? "/cadastros" : "/cadastros/" + secao}
          className="underline"
        >
          Tentar novamente
        </Link>
      </main>
    );
  }
}
