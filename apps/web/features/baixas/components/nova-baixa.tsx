"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import type {
  ListarPatrimoniosResponse,
  PatrimonioResumo,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { BaixaFormulario } from "./baixa-formulario";

export function NovaBaixa({
  resposta,
  valores,
}: {
  resposta: ListarPatrimoniosResponse;
  valores: Record<string, string>;
}) {
  const router = useRouter();
  const [selecionado, setSelecionado] = useState<PatrimonioResumo | null>(null);
  const [etapa, setEtapa] = useState<"selecao" | "dados">("selecao");
  const hrefPagina = (pagina: number) =>
    `/baixas/nova?${new URLSearchParams({ ...valores, pagina: String(pagina) }).toString()}`;
  return (
    <main className="mx-auto grid w-full max-w-[1900px] gap-5 p-4 text-[#19355d] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#2863ec]">
            Nova baixa · {etapa === "selecao" ? "Etapa 1 de 2" : "Etapa 2 de 2"}
          </p>
          <h1 className="mt-1 text-2xl font-bold">Registrar baixa</h1>
          <p className="mt-1 text-sm text-[#526580]">
            Selecione um único patrimônio ativo e confira todos os dados antes
            da confirmação.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/baixas">
            <ArrowLeft aria-hidden="true" /> Voltar à consulta
          </Link>
        </Button>
      </header>
      {etapa === "selecao" ? (
        <>
          <form
            action="/baixas/nova"
            className="grid gap-4 rounded-lg border border-[#dfe7f1] bg-white p-4 sm:grid-cols-[1fr_auto] sm:p-5"
          >
            <label className="text-sm font-medium">
              Buscar patrimônio ativo
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] px-3 py-2"
                name="busca"
                defaultValue={valores.busca}
                maxLength={200}
                placeholder="Número, descrição, marca ou modelo"
              />
            </label>
            <Button type="submit" className="self-end">
              <Search aria-hidden="true" /> Buscar
            </Button>
          </form>
          <section
            className="rounded-lg border border-[#dfe7f1] bg-white"
            aria-labelledby="selecionar-patrimonio"
          >
            <div className="border-b border-[#dfe7f1] p-4 sm:p-5">
              <h2 id="selecionar-patrimonio" className="font-bold">
                Selecionar patrimônio para baixa
              </h2>
              <p className="mt-1 text-sm text-[#526580]">
                {resposta.meta.total} patrimônios ativos encontrados. A seleção
                é limitada a um.
              </p>
            </div>
            {resposta.dados.length === 0 ? (
              <p role="status" className="p-8 text-center">
                Nenhum patrimônio ativo corresponde à busca.
              </p>
            ) : (
              <div
                className="min-w-0 overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label="Patrimônios ativos disponíveis"
              >
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#f5f8fc] text-xs uppercase tracking-wide text-[#526580]">
                    <tr>
                      <th className="p-4" scope="col">
                        Selecionar
                      </th>
                      <th className="p-4" scope="col">
                        Número
                      </th>
                      <th className="p-4" scope="col">
                        Descrição
                      </th>
                      <th className="p-4" scope="col">
                        Setor
                      </th>
                      <th className="p-4" scope="col">
                        Espécie
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resposta.dados.map((patrimonio) => (
                      <tr
                        key={patrimonio.id}
                        className="border-t border-[#e5ebf3] hover:bg-[#f8fbff]"
                      >
                        <td className="p-4">
                          <input
                            type="radio"
                            name="patrimonio"
                            aria-label={`Selecionar patrimônio ${patrimonio.numeroPatrimonio}`}
                            checked={selecionado?.id === patrimonio.id}
                            onChange={() => setSelecionado(patrimonio)}
                          />
                        </td>
                        <td className="p-4 font-semibold">
                          {patrimonio.numeroPatrimonio}
                        </td>
                        <td className="max-w-80 break-words p-4">
                          {patrimonio.descricao}
                        </td>
                        <td className="p-4">{patrimonio.setorAtual.nome}</td>
                        <td className="p-4">{patrimonio.especie.nome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe7f1] p-4">
              <nav
                aria-label="Paginação dos patrimônios"
                className="flex gap-2"
              >
                {resposta.meta.pagina > 1 ? (
                  <Button asChild variant="outline">
                    <Link href={hrefPagina(resposta.meta.pagina - 1)}>
                      Anterior
                    </Link>
                  </Button>
                ) : null}
                {resposta.meta.pagina < resposta.meta.ultimaPagina ? (
                  <Button asChild variant="outline">
                    <Link href={hrefPagina(resposta.meta.pagina + 1)}>
                      Próxima
                    </Link>
                  </Button>
                ) : null}
              </nav>
              <Button
                type="button"
                disabled={!selecionado}
                onClick={() => setEtapa("dados")}
              >
                Continuar com 1 patrimônio <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </section>
        </>
      ) : selecionado ? (
        <BaixaFormulario
          patrimonio={selecionado}
          onCancelar={() => setEtapa("selecao")}
          onSuccess={(baixa) =>
            router.push(`/baixas/${baixa.patrimonio.id}?sucesso=1`)
          }
        />
      ) : null}
    </main>
  );
}
