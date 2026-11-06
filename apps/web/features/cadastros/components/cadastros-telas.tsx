import type { ReactNode } from "react";
import Link from "next/link";
import { AbasCadastros, type SecaoAbas } from "./abas-cadastros";
import {
  pagina,
  cartao,
  campo,
  botao,
  principal,
  Paginacao,
} from "./cadastro-ui";
export type SecaoCadastro = Exclude<SecaoAbas, "setores">;
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
} as const;
export function CadastrosTelas({
  secao,
  registros,
  meta,
  busca,
  id,
  salvo,
  children,
}: {
  secao: SecaoCadastro;
  registros: { id: string; titulo: string; detalhe: string }[];
  meta: { total: number; pagina: number; ultimaPagina: number };
  busca?: string;
  id?: string;
  salvo?: boolean;
  children: ReactNode;
}) {
  const config = paginasCadastros[secao];
  const hrefPagina = (p: number) =>
    config.href +
    "?" +
    new URLSearchParams({
      ...(busca ? { busca } : {}),
      pagina: String(p),
    }).toString();
  return (
    <main className={pagina}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold min-[1500px]:text-[27px]">
            {config.titulo}
          </h1>
          <p className="mt-1 text-sm text-[#62748e]">{config.subtitulo}</p>
        </div>
        <span className="text-xs text-[#62748e]">* Campos obrigatórios</span>
      </header>
      <AbasCadastros secao={secao} />
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
            Selecione para consultar ou editar.
          </p>
          <form action={config.href} className="grid gap-2">
            <label className="text-sm">
              Buscar cadastro
              <input
                className={campo}
                name="busca"
                defaultValue={busca}
                placeholder="Buscar por nome ou número…"
                maxLength={
                  secao === "processos"
                    ? 200
                    : secao === "comissoes"
                      ? 150
                      : 100
                }
              />
            </label>
            <button type="submit" className={botao}>
              Consultar
            </button>
          </form>
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
          <Link className={principal} href={config.href}>
            {config.novo}
          </Link>
        </aside>
        {children}
      </div>
      <footer className="py-2 text-xs text-[#62748e]">
        SIPAT · Organização dos dados patrimoniais
      </footer>
    </main>
  );
}
