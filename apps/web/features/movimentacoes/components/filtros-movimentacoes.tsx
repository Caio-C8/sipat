"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSetoresMovimentacao, useComissoesMovimentacao } from "../api/hooks";
import { campoMovimentacao } from "../presentation";
import { Button } from "@/components/ui/button";
import { ErroMovimentacao } from "./erro-movimentacao";
export function FiltrosMovimentacoes({
  valores,
}: {
  valores: Record<string, string>;
}) {
  const [filtros, setFiltros] = useState(valores);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const setores = useSetoresMovimentacao(),
    comissoes = useComissoesMovimentacao();
  const [buscaSetor, setBuscaSetor] = useState(""),
    [buscaComissao, setBuscaComissao] = useState("");
  const carregarSetores = setores.carregar,
    carregarComissoes = comissoes.carregar;
  useEffect(() => {
    void carregarSetores({ contexto: "FILTRO" });
    void carregarComissoes({ contexto: "FILTRO" });
  }, [carregarSetores, carregarComissoes]);
  const listaSetores = setores.dados?.dados ?? [],
    listaComissoes = comissoes.dados?.dados ?? [];
  return (
    <form
      action="/movimentacoes"
      className="grid gap-4"
      aria-label="Filtrar movimentações"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm">
          Pesquisar movimentações
          <input
            className={campoMovimentacao}
            type="search"
            name="busca"
            maxLength={200}
            defaultValue={valores.busca}
            placeholder="Número patrimonial ou descrição"
          />
        </label>
        <input
          type="hidden"
          name="patrimonioId"
          value={valores.patrimonioId ?? ""}
        />
        {[
          ["setorOrigemId", "Setor de origem"],
          ["setorDestinoId", "Setor de destino"],
        ].map(([nome, label]) => (
          <label key={nome} className="grid gap-2 text-sm">
            {label}
            <select
              className={campoMovimentacao}
              name={nome}
              value={filtros[nome!] ?? ""}
              onChange={(e) => {
                setFiltros((atuais) => ({
                  ...atuais,
                  [nome!]: e.target.value,
                }));
                setNomes((atuais) => ({
                  ...atuais,
                  [e.target.value]: e.target.selectedOptions[0]?.text ?? "",
                }));
              }}
              key={`${nome}:${valores[nome!]}`}
            >
              <option value="">Todos os setores</option>
              {filtros[nome!] &&
              !listaSetores.some((s) => s.id === filtros[nome!]) ? (
                <option value={filtros[nome!]}>
                  {nomes[filtros[nome!]!] ?? "Setor selecionado"}
                </option>
              ) : null}
              {listaSetores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                  {s.ativo ? "" : " (inativo)"}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="grid gap-2 text-sm">
          De
          <input
            className={campoMovimentacao}
            type="date"
            name="dataInicio"
            defaultValue={valores.dataInicio}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Até
          <input
            className={campoMovimentacao}
            type="date"
            name="dataFim"
            defaultValue={valores.dataFim}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Comissão
          <select
            className={campoMovimentacao}
            name="comissaoId"
            value={filtros.comissaoId ?? ""}
            onChange={(e) => {
              setFiltros((atuais) => ({
                ...atuais,
                comissaoId: e.target.value,
              }));
              setNomes((atuais) => ({
                ...atuais,
                [e.target.value]: e.target.selectedOptions[0]?.text ?? "",
              }));
            }}
            key={valores.comissaoId}
          >
            <option value="">Todas as comissões</option>
            {filtros.comissaoId &&
            !listaComissoes.some((c) => c.id === filtros.comissaoId) ? (
              <option value={filtros.comissaoId}>
                {nomes[filtros.comissaoId!] ?? "Comissão selecionada"}
              </option>
            ) : null}
            {listaComissoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.dataVigenciaInicio} a {c.dataVigenciaFim})
              </option>
            ))}
          </select>
        </label>
      </div>
      <details className="rounded-md bg-[#f7f9fc] p-3 text-sm">
        <summary className="cursor-pointer font-semibold">
          Localizar outros setores e comissões, incluindo histórico
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label>
              Buscar setores
              <input
                className={campoMovimentacao}
                value={buscaSetor}
                onChange={(e) => setBuscaSetor(e.target.value)}
                maxLength={200}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              disabled={setores.loading}
              onClick={() =>
                void carregarSetores({
                  contexto: "FILTRO",
                  busca: buscaSetor.trim() || undefined,
                })
              }
            >
              Buscar setores
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  setores.loading ||
                  !setores.dados ||
                  setores.dados.meta.pagina <= 1
                }
                onClick={() =>
                  void carregarSetores({
                    contexto: "FILTRO",
                    busca: buscaSetor.trim() || undefined,
                    pagina: String(setores.dados!.meta.pagina - 1),
                  })
                }
              >
                Setores anteriores
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  setores.loading ||
                  !setores.dados ||
                  setores.dados.meta.pagina >= setores.dados.meta.ultimaPagina
                }
                onClick={() =>
                  void carregarSetores({
                    contexto: "FILTRO",
                    busca: buscaSetor.trim() || undefined,
                    pagina: String(setores.dados!.meta.pagina + 1),
                  })
                }
              >
                Mais setores
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <label>
              Buscar comissões
              <input
                className={campoMovimentacao}
                value={buscaComissao}
                onChange={(e) => setBuscaComissao(e.target.value)}
                maxLength={200}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              disabled={comissoes.loading}
              onClick={() =>
                void carregarComissoes({
                  contexto: "FILTRO",
                  busca: buscaComissao.trim() || undefined,
                })
              }
            >
              Buscar comissões
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  comissoes.loading ||
                  !comissoes.dados ||
                  comissoes.dados.meta.pagina <= 1
                }
                onClick={() =>
                  void carregarComissoes({
                    contexto: "FILTRO",
                    busca: buscaComissao.trim() || undefined,
                    pagina: String(comissoes.dados!.meta.pagina - 1),
                  })
                }
              >
                Comissões anteriores
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  comissoes.loading ||
                  !comissoes.dados ||
                  comissoes.dados.meta.pagina >=
                    comissoes.dados.meta.ultimaPagina
                }
                onClick={() =>
                  void carregarComissoes({
                    contexto: "FILTRO",
                    busca: buscaComissao.trim() || undefined,
                    pagina: String(comissoes.dados!.meta.pagina + 1),
                  })
                }
              >
                Mais comissões
              </Button>
            </div>
          </div>
        </div>
      </details>
      {setores.loading || comissoes.loading ? (
        <p role="status" className="text-sm">
          Carregando opções de filtro…
        </p>
      ) : null}
      {setores.erro ? <ErroMovimentacao erro={setores.erro} /> : null}
      {comissoes.erro ? <ErroMovimentacao erro={comissoes.erro} /> : null}
      <div className="flex gap-3">
        <Button type="submit">Aplicar filtros</Button>
        <Button asChild variant="outline">
          <Link prefetch={false} href="/movimentacoes">
            Limpar filtros
          </Link>
        </Button>
      </div>
    </form>
  );
}
