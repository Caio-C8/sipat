import type { ReactNode } from "react";
import Link from "next/link";
import { pagina, cartao, principal, Paginacao } from "./cadastro-ui";
import {
  SimpleQueryFilters,
  type SimpleQueryFilter,
} from "@/components/shared/simple-query-filters";
import { PageHeader } from "@/components/shared/page-header";
export type SecaoCadastro =
  | "processos"
  | "especies"
  | "naturezas"
  | "comissoes"
  | "responsaveis"
  | "fornecedores";
export const paginasCadastros = {
  processos: {
    titulo: "Cadastros",
    lista: "Processos de compra",
    novo: "Novo processo",
    href: "/cadastros",
    subtitulo: "Organize os processos de compra e os documentos fiscais.",
  },
  especies: {
    titulo: "Cadastrar espécie",
    lista: "Espécies cadastradas",
    novo: "Nova espécie",
    href: "/cadastros/especies",
    subtitulo: "Agrupe bens com características semelhantes.",
  },
  naturezas: {
    titulo: "Cadastrar natureza",
    lista: "Naturezas cadastradas",
    novo: "Nova natureza",
    href: "/cadastros/naturezas",
    subtitulo: "Defina a natureza usada na identificação dos bens.",
  },
  comissoes: {
    titulo: "Cadastrar comissão",
    lista: "Comissões cadastradas",
    novo: "Nova comissão",
    href: "/cadastros/comissoes",
    subtitulo: "Defina a vigência e os funcionários participantes.",
  },
  responsaveis: {
    titulo: "Cadastrar responsável",
    lista: "Responsáveis cadastrados",
    novo: "Novo responsável",
    href: "/cadastros/responsaveis",
    subtitulo: "Cadastre os funcionários responsáveis pelos bens.",
  },
  fornecedores: {
    titulo: "Cadastrar fornecedor",
    lista: "Fornecedores cadastrados",
    novo: "Novo fornecedor",
    href: "/cadastros/fornecedores",
    subtitulo: "Gerencie os fornecedores vinculados ao patrimônio.",
  },
} as const;
export function CadastrosTelas({
  secao,
  registros,
  meta,
  busca,
  situacao,
  id,
  salvo,
  somenteLeitura = false,
  children,
}: {
  secao: SecaoCadastro;
  registros: { id: string; titulo: string; detalhe: string }[];
  meta: { total: number; pagina: number; ultimaPagina: number };
  busca?: string;
  situacao?: "todos" | "ativos" | "inativos";
  id?: string;
  salvo?: boolean;
  somenteLeitura?: boolean;
  children: ReactNode;
}) {
  const config = paginasCadastros[secao];
  const filters: SimpleQueryFilter[] = [
    {
      type: "text",
      name: "busca",
      label: "Buscar cadastro",
      defaultValue: busca,
      placeholder: "Buscar por nome ou número…",
      maxLength:
        secao === "processos" ? 200 : secao === "comissoes" ? 150 : 100,
    },
    ...(secao === "fornecedores"
      ? [
          {
            type: "select" as const,
            name: "situacao",
            label: "Situação",
            defaultValue: situacao ?? "todos",
            options: [
              { value: "todos", label: "Todos" },
              { value: "ativos", label: "Ativos" },
              { value: "inativos", label: "Inativos" },
            ],
          },
        ]
      : []),
  ];
  const hrefPagina = (p: number) =>
    config.href +
    "?" +
    new URLSearchParams({
      ...(busca ? { busca } : {}),
      ...(situacao ? { situacao } : {}),
      pagina: String(p),
    }).toString();
  return (
    <main className={pagina}>
      <PageHeader
        title={somenteLeitura ? config.lista : config.titulo}
        description={
          <>
            <span>{config.subtitulo}</span>{" "}
            <span>
              {somenteLeitura
                ? "Consulta somente leitura"
                : "Campos obrigatórios estão identificados com asterisco."}
            </span>
          </>
        }
      />
      {salvo && (
        <p
          role="status"
          className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          Cadastro salvo com sucesso.
        </p>
      )}
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(250px,320px)_minmax(0,1fr)]">
        <aside className={cartao + " grid gap-4"}>
          <h2 className="font-bold">{config.lista}</h2>
          <p className="text-sm text-[#62748e]">
            {somenteLeitura
              ? "Selecione para consultar."
              : "Selecione para consultar ou editar."}
          </p>
          <SimpleQueryFilters action={config.href} filters={filters} />
          <ul className="grid gap-2">
            {registros.map((item) => (
              <li key={item.id}>
                <Link
                  className={
                    "block rounded-md border p-3 text-sm " +
                    (id === item.id
                      ? "border-[#bfd4ff] bg-[#eff5ff] text-[#2860eb]"
                      : "border-[#dfe7f1] hover:bg-[#f7f9fc]")
                  }
                  href={
                    config.href +
                    "?" +
                    new URLSearchParams({
                      id: item.id,
                      ...(busca ? { busca } : {}),
                      ...(situacao ? { situacao } : {}),
                      pagina: String(meta.pagina),
                    }).toString()
                  }
                  aria-current={id === item.id ? "true" : undefined}
                >
                  <strong className="break-words">{item.titulo}</strong>
                  <small className="mt-1 block break-words text-[#526580]">
                    {item.detalhe}
                  </small>
                </Link>
              </li>
            ))}
          </ul>
          {registros.length === 0 && (
            <p className="text-sm">Nenhum registro encontrado.</p>
          )}
          <Paginacao meta={meta} href={hrefPagina} />
          {!somenteLeitura && (
            <Link className={principal} href={config.href}>
              {config.novo}
            </Link>
          )}
        </aside>
        {children}
      </div>
    </main>
  );
}

export function DetalheCadastroSomenteLeitura({
  titulo,
  campos,
  children,
}: {
  titulo: string;
  campos: readonly { rotulo: string; valor: ReactNode }[];
  children?: ReactNode;
}) {
  return (
    <section className={cartao} aria-labelledby="detalhe-cadastro">
      <h2 id="detalhe-cadastro" className="font-bold">
        {titulo}
      </h2>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        {campos.map((campo) => (
          <div key={campo.rotulo}>
            <dt className="text-[#62748e]">{campo.rotulo}</dt>
            <dd className="mt-1 break-words font-medium">
              {campo.valor || "Não informado"}
            </dd>
          </div>
        ))}
      </dl>
      {children}
    </section>
  );
}
