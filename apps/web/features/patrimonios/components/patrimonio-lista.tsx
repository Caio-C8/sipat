import Link from "next/link";
import { Info, Search } from "lucide-react";
import type { ListarPatrimoniosResponse } from "@repo/contracts";

const pagina =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-4 px-4 py-4 text-[#17253d] sm:px-7 sm:py-6";
const cartao =
  "min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-4 py-4 sm:px-5";
const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2863ec]";
const botao =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#203b61] px-4 text-sm font-semibold text-white hover:bg-[#31537f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2863ec]";
const rotulosStatus: Record<string, string> = {
  ATIVO: "Ativo",
  BAIXADO: "Baixado",
  EMPRESTADO: "Emprestado",
  EM_MANUTENCAO: "Em manutenção",
};

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function PatrimonioLista({
  resposta,
  valores,
  podeCadastrar,
}: {
  resposta: ListarPatrimoniosResponse;
  valores: Record<string, string>;
  podeCadastrar: boolean;
}) {
  const hrefPagina = (numero: number) =>
    `/patrimonios?${new URLSearchParams({ ...valores, pagina: String(numero) }).toString()}`;
  return (
    <main className={pagina}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111d34]">
            Consultar patrimônio
          </h1>
          <p className="mt-1 text-sm text-[#7188a5]">
            Encontre um bem e acompanhe seus dados e ocorrências em um só lugar.
          </p>
        </div>
        {podeCadastrar ? (
          <Link className={botao} href="/patrimonios/novo">
            + Novo patrimônio
          </Link>
        ) : null}
      </header>
      <section className={cartao} aria-labelledby="pesquisa-title">
        <h2 id="pesquisa-title" className="flex items-center gap-2 font-bold">
          <Search className="size-4 text-[#2863ec]" /> Pesquisar patrimônio
        </h2>
        <form className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_180px_auto] md:items-end">
          <label className="text-xs">
            Placa, código ou descrição
            <input
              className={campo}
              name="busca"
              maxLength={200}
              defaultValue={valores.busca}
              placeholder="Número ou descrição"
            />
          </label>
          <label className="text-xs">
            Situação
            <select
              className={campo}
              name="status"
              defaultValue={valores.status ?? ""}
            >
              <option value="">Todas as situações</option>
              <option value="ATIVO">Ativo</option>
              <option value="EMPRESTADO">Emprestado</option>
              <option value="EM_MANUTENCAO">Em manutenção</option>
              <option value="BAIXADO">Baixado</option>
            </select>
          </label>
          <label className="text-xs">
            Numeração
            <select
              className={campo}
              name="tipoNumeroPatrimonial"
              defaultValue={valores.tipoNumeroPatrimonial ?? ""}
            >
              <option value="">Todos os tipos</option>
              <option value="OFICIAL">Número oficial</option>
              <option value="SEM_NUMERO_OFICIAL">Sem número oficial</option>
            </select>
          </label>
          <button className={botao} type="submit">
            <Search className="size-4" /> Pesquisar
          </button>
        </form>
      </section>
      <section className={cartao} aria-labelledby="resultados-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="resultados-title" className="font-bold">
            Resultados da pesquisa
          </h2>
          <span className="text-sm text-[#7188a5]">
            {resposta.meta.total}{" "}
            {resposta.meta.total === 1
              ? "patrimônio encontrado"
              : "patrimônios encontrados"}
          </span>
        </div>
        {resposta.dados.length === 0 ? (
          <p
            role="status"
            className="rounded-md bg-[#f7f9fc] p-8 text-center text-sm text-[#7188a5]"
          >
            Nenhum bem corresponde aos filtros informados.
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Patrimônios encontrados"
            tabIndex={0}
          >
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#f7f9fc] text-xs uppercase text-[#7188a5]">
                <tr>
                  <th className="p-3">Patrimônio</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Setor / responsável</th>
                  <th className="p-3">Situação</th>
                  <th className="p-3">Valor atual</th>
                  <th className="p-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {resposta.dados.map((item) => {
                  const liquido =
                    Number(item.situacaoContabil.valorBrutoAtual) -
                    Number(item.situacaoContabil.depreciacaoAcumuladaAtual);
                  return (
                    <tr key={item.id} className="border-b border-[#e4ebf4]">
                      <td className="p-3 font-semibold">
                        {item.numeroPatrimonio}
                        <small className="mt-1 block font-normal text-[#7188a5]">
                          {item.tipoNumeroPatrimonial === "OFICIAL"
                            ? "Numeração oficial"
                            : "Sem número oficial"}
                        </small>
                      </td>
                      <td className="p-3">
                        <strong>{item.descricao}</strong>
                        <small className="mt-1 block text-[#7188a5]">
                          {item.especie.nome} · {item.especie.natureza.nome}
                        </small>
                      </td>
                      <td className="p-3">
                        {item.setorAtual.nome}
                        <small className="mt-1 block text-[#7188a5]">
                          {item.setorAtual.responsavel.nome}
                        </small>
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-[#e9fbf3] px-3 py-1 text-xs font-semibold text-[#08795c]">
                          {rotulosStatus[item.status]}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{moeda(liquido)}</td>
                      <td className="p-3">
                        <Link
                          className="font-semibold text-[#2863ec] underline"
                          href={`/patrimonios/${item.id}`}
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <nav
          aria-label="Paginação dos patrimônios"
          className="mt-5 flex gap-5 text-sm"
        >
          {resposta.meta.pagina > 1 ? (
            <Link
              className="underline"
              href={hrefPagina(resposta.meta.pagina - 1)}
            >
              Página anterior
            </Link>
          ) : null}
          {resposta.meta.pagina < resposta.meta.ultimaPagina ? (
            <Link
              className="underline"
              href={hrefPagina(resposta.meta.pagina + 1)}
            >
              Próxima página
            </Link>
          ) : null}
        </nav>
        <div className="mt-6 flex gap-2 rounded-md bg-[#eef5ff] p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-[#2863ec]" />
          <p>
            <strong>Do resultado à ficha completa.</strong> Consulte valores,
            classificação, localização e histórico sem perder os filtros desta
            página.
          </p>
        </div>
      </section>
    </main>
  );
}
