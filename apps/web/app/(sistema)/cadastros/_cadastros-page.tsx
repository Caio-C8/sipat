import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import * as z from "zod";
import {
  CadastrosTelas,
  DetalheCadastroSomenteLeitura,
  type SecaoCadastro,
} from "@/features/cadastros/components/cadastros-telas";
import {
  FormularioNatureza,
  FormularioEspecie,
  FormularioResponsavel,
} from "@/features/cadastros/components/formularios-basicos";
import { FormularioFornecedor } from "@/features/cadastros/components/formulario-fornecedor";
import { FormularioComissao } from "@/features/cadastros/components/formulario-comissao";
import { FormularioProcesso } from "@/features/cadastros/components/formulario-processo";
import {
  ErroCadastro,
  mensagemErro,
  pagina,
} from "@/features/cadastros/components/cadastro-ui";
import { serverCadastros } from "@/features/cadastros/api/server";
import type { Leitura } from "@/features/cadastros/api/cadastro-operations";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
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
  situacao: z.enum(["todos", "ativos", "inativos"]).optional(),
});
type Lista<T> = {
  dados: T[];
  meta: { total: number; pagina: number; ultimaPagina: number };
};
const formatarCnpj = (cnpj: string | null) =>
  cnpj
    ? `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`
    : null;
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
  detalhe?: (dado: D) => ReactNode;
  mostrarFornecedores: boolean;
  somenteLeitura: boolean;
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
      situacao={params.situacao}
      id={params.id}
      salvo={params.salvo === "1"}
      mostrarFornecedores={config.mostrarFornecedores}
      somenteLeitura={config.somenteLeitura}
    >
      <div key={registro ? JSON.stringify(registro) : "novo"}>
        {config.somenteLeitura ? (
          registro && config.detalhe ? (
            config.detalhe(registro)
          ) : (
            <DetalheCadastroSomenteLeitura
              titulo="Consultar cadastro"
              campos={[
                {
                  rotulo: "Orientação",
                  valor:
                    "Selecione um registro da lista para consultar seus dados.",
                },
              ]}
            />
          )
        ) : (
          config.formulario(registro)
        )}
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
  const identidade = await exigirIdentidadeAtual();
  const parsed = ParamsSchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <main className={pagina}>
        <h1 className="text-xl font-bold">Consulta inválida</h1>
        <p role="alert">Revise os filtros ou o identificador do cadastro.</p>
      </main>
    );
  const cookie = (await headers()).get("cookie") ?? "";
  const base = {
    secao,
    params: parsed.data,
    cookie,
    mostrarFornecedores: true,
    somenteLeitura:
      secao !== "processos" && identidade.perfil === "DIRETOR_PATRIMONIO",
  };
  try {
    switch (secao) {
      case "naturezas":
        return await carregar({
          ...base,
          ...serverCadastros.naturezas,
          resumo: (x) => ({ titulo: x.nome, detalhe: "Natureza patrimonial" }),
          formulario: (registro) => <FormularioNatureza registro={registro} />,
          detalhe: (registro) => (
            <DetalheCadastroSomenteLeitura
              titulo={`Natureza · ${registro.nome}`}
              campos={[
                { rotulo: "Nome", valor: registro.nome },
                {
                  rotulo: "Descrição",
                  valor: registro.descricao ?? "Não informada",
                },
              ]}
            />
          ),
        });
      case "especies":
        return await carregar({
          ...base,
          ...serverCadastros.especies,
          resumo: (x) => ({ titulo: x.nome, detalhe: x.natureza.nome }),
          formulario: (registro) => <FormularioEspecie registro={registro} />,
          detalhe: (registro) => (
            <DetalheCadastroSomenteLeitura
              titulo={`Espécie · ${registro.nome}`}
              campos={[
                { rotulo: "Nome", valor: registro.nome },
                { rotulo: "Natureza", valor: registro.natureza.nome },
                {
                  rotulo: "Descrição",
                  valor: registro.descricao ?? "Não informada",
                },
              ]}
            />
          ),
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
          detalhe: (registro) => (
            <DetalheCadastroSomenteLeitura
              titulo={`Responsável · ${registro.nome}`}
              campos={[
                { rotulo: "Nome", valor: registro.nome },
                { rotulo: "Matrícula", valor: registro.matricula },
                {
                  rotulo: "Situação",
                  valor: registro.ativo ? "Ativo" : "Inativo",
                },
              ]}
            />
          ),
        });
      case "fornecedores":
        return await carregar({
          ...base,
          listar: (query, options) =>
            serverCadastros.fornecedores.listar(
              {
                ...query,
                ativo:
                  parsed.data.situacao === "ativos"
                    ? "true"
                    : parsed.data.situacao === "inativos"
                      ? "false"
                      : undefined,
              },
              options,
            ),
          consultar: serverCadastros.fornecedores.consultar,
          resumo: (x) => ({
            titulo: x.razaoSocial,
            detalhe:
              [x.nomeFantasia, formatarCnpj(x.cnpj)]
                .filter(Boolean)
                .join(" · ") +
              (x.nomeFantasia || x.cnpj ? " · " : "") +
              (x.ativo ? "Ativo" : "Inativo"),
          }),
          formulario: (registro) => (
            <FormularioFornecedor registro={registro} />
          ),
          detalhe: (registro) => (
            <DetalheCadastroSomenteLeitura
              titulo={`Fornecedor · ${registro.razaoSocial}`}
              campos={[
                { rotulo: "Razão social", valor: registro.razaoSocial },
                {
                  rotulo: "Nome fantasia",
                  valor: registro.nomeFantasia ?? "Não informado",
                },
                {
                  rotulo: "Representante",
                  valor: registro.nomeRepresentante ?? "Não informado",
                },
                {
                  rotulo: "CNPJ",
                  valor: formatarCnpj(registro.cnpj) ?? "Não informado",
                },
                {
                  rotulo: "E-mail",
                  valor: registro.email ?? "Não informado",
                },
                {
                  rotulo: "Telefone",
                  valor: registro.telefone ?? "Não informado",
                },
                {
                  rotulo: "Endereço",
                  valor: registro.endereco ?? "Não informado",
                },
                {
                  rotulo: "Situação",
                  valor: registro.ativo ? "Ativo" : "Inativo",
                },
              ]}
            />
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
          detalhe: (registro) => (
            <DetalheCadastroSomenteLeitura
              titulo={`Comissão · ${registro.nome}`}
              campos={[
                { rotulo: "Nome", valor: registro.nome },
                {
                  rotulo: "Ato de designação",
                  valor: registro.numeroAto ?? "Não informado",
                },
                {
                  rotulo: "Início da vigência",
                  valor: registro.dataVigenciaInicio
                    .split("-")
                    .reverse()
                    .join("/"),
                },
                {
                  rotulo: "Fim da vigência",
                  valor: registro.dataVigenciaFim
                    .split("-")
                    .reverse()
                    .join("/"),
                },
                {
                  rotulo: "Descrição",
                  valor: registro.descricao ?? "Não informada",
                },
                {
                  rotulo: "Integrantes",
                  valor:
                    registro.membros.length > 0
                      ? registro.membros
                          .map(
                            (membro) =>
                              `${membro.responsavel.nome} (${membro.papel === "PRESIDENTE" ? "Presidente" : "Membro"})`,
                          )
                          .join(", ")
                      : "Nenhum integrante cadastrado",
                },
              ]}
            />
          ),
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
