import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import type { RelatorioTabularResponse } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { FiltrosBaixas } from "./filtros-baixas";
import {
  formatarDataBaixa,
  formatarInstanteBaixa,
  rotulosTipoBaixa,
} from "../apresentacao";

type RespostaBaixas = Extract<RelatorioTabularResponse, { tipo: "baixas" }>;

export function BaixasLista({
  resposta,
  valores,
  diretor,
}: {
  resposta: RespostaBaixas;
  valores: Record<string, string>;
  diretor: boolean;
}) {
  const temFiltros = [
    "inicio",
    "fim",
    "tipo",
    "patrimonioId",
    "comissaoId",
  ].some((campo) => Boolean(valores[campo]));
  const hrefPagina = (pagina: number) =>
    `/baixas?${new URLSearchParams({ ...valores, pagina: String(pagina) }).toString()}`;
  return (
    <main className="mx-auto grid w-full max-w-[1900px] gap-5 p-4 text-[#19355d] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Baixa</h1>
          <p className="mt-1 text-sm text-[#526580]">
            Consulte registros patrimoniais baixados e seus dados de auditoria.
          </p>
        </div>
        {diretor ? (
          <Button asChild>
            <Link href="/baixas/nova">
              <Plus aria-hidden="true" /> Registrar baixa
            </Link>
          </Button>
        ) : null}
      </header>
      <FiltrosBaixas valores={valores} />
      <section
        className="min-w-0 rounded-lg border border-[#dfe7f1] bg-white"
        aria-labelledby="titulo-baixas"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe7f1] p-4 sm:p-5">
          <div>
            <h2 id="titulo-baixas" className="font-bold">
              Baixas registradas
            </h2>
            <p className="mt-1 text-sm text-[#526580]">
              {resposta.meta.total}{" "}
              {resposta.meta.total === 1
                ? "registro encontrado"
                : "registros encontrados"}
            </p>
          </div>
          <p className="text-sm">
            Página {resposta.meta.pagina} de {resposta.meta.ultimaPagina}
          </p>
        </div>
        {resposta.dados.length === 0 ? (
          <div className="p-8 text-center">
            <p role="status" className="font-semibold">
              {temFiltros
                ? "Nenhuma baixa corresponde aos filtros."
                : "Nenhuma baixa foi registrada."}
            </p>
            <p className="mt-1 text-sm text-[#526580]">
              {temFiltros
                ? "Revise os filtros informados e tente novamente."
                : "Os registros aparecerão aqui após a primeira baixa."}
            </p>
          </div>
        ) : (
          <div
            className="min-w-0 overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="Baixas registradas"
          >
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f5f8fc] text-xs uppercase tracking-wide text-[#526580]">
                <tr>
                  <th className="p-4" scope="col">
                    Patrimônio
                  </th>
                  <th className="p-4" scope="col">
                    Data e tipo
                  </th>
                  <th className="p-4" scope="col">
                    Comissão
                  </th>
                  <th className="p-4" scope="col">
                    Motivo
                  </th>
                  <th className="p-4" scope="col">
                    Registro
                  </th>
                  <th className="p-4 text-right" scope="col">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {resposta.dados.map((baixa) => (
                  <tr
                    key={baixa.id}
                    className="border-t border-[#e5ebf3] align-top hover:bg-[#f8fbff]"
                  >
                    <td className="p-4">
                      <strong className="block">
                        {baixa.numeroPatrimonio}
                      </strong>
                      <span className="mt-1 block max-w-64 break-words text-[#526580]">
                        {baixa.descricao}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="block">
                        {formatarDataBaixa(baixa.dataBaixa)}
                      </span>
                      <span className="mt-1 block text-[#526580]">
                        {rotulosTipoBaixa[baixa.tipo] ?? baixa.tipo}
                      </span>
                    </td>
                    <td className="p-4">{baixa.comissao}</td>
                    <td className="max-w-80 break-words p-4">{baixa.motivo}</td>
                    <td className="p-4">
                      <span className="block">{baixa.autor}</span>
                      <span className="mt-1 block text-[#526580]">
                        {formatarInstanteBaixa(baixa.registroEm)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/baixas/${baixa.patrimonioId}?retorno=${encodeURIComponent(`/baixas?${new URLSearchParams(valores).toString()}`)}`}
                        >
                          <Eye aria-hidden="true" /> Ver detalhe
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <nav
          aria-label="Paginação das baixas"
          className="flex flex-wrap justify-between gap-3 border-t border-[#dfe7f1] p-4"
        >
          {resposta.meta.pagina > 1 ? (
            <Button asChild variant="outline">
              <Link href={hrefPagina(resposta.meta.pagina - 1)}>
                Página anterior
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {resposta.meta.pagina < resposta.meta.ultimaPagina ? (
            <Button asChild variant="outline">
              <Link href={hrefPagina(resposta.meta.pagina + 1)}>
                Próxima página
              </Link>
            </Button>
          ) : null}
        </nav>
      </section>
    </main>
  );
}
