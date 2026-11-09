"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ItemInventarioResponse } from "@repo/contracts";
import { browserInventarioOperations } from "../api/browser-inventario-operations";

type ItemCorrigivel = Extract<
  ItemInventarioResponse,
  { situacao: "DIVERGENCIA" | "NAO_LOCALIZADO" }
>;

export function ResolverCorrecaoDialog({
  inventarioId,
  item,
  bloqueado,
}: {
  inventarioId: string;
  item: ItemCorrigivel;
  bloqueado: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<
    "RETORNO_AO_SETOR_CADASTRADO" | "TRANSFERENCIA_CADASTRAL" | ""
  >("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const localizacaoPendente =
    item.situacao === "NAO_LOCALIZADO" &&
    item.localizacaoPosterior?.statusCorrecao === "PENDENTE";
  const divergenciaPendente =
    item.situacao === "DIVERGENCIA" && item.statusCorrecao === "PENDENTE";
  const podeResolver =
    !bloqueado && (localizacaoPendente || divergenciaPendente);
  const setorEncontrado =
    item.situacao === "DIVERGENCIA"
      ? item.setorEncontrado.nome
      : item.localizacaoPosterior?.setorEncontrado.nome;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!tipo) return;
    setEnviando(true);
    setErro("");
    try {
      await browserInventarioOperations.corrigir(inventarioId, item.id, {
        tipoCorrecao: tipo,
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      });
      setAberto(false);
      router.refresh();
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível registrar a correção.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!podeResolver) {
    return (
      <span className="text-xs text-[#627996]">
        {bloqueado
          ? "Inventário finalizado ou consulta"
          : item.situacao === "NAO_LOCALIZADO" && !localizacaoPendente
            ? "Aguardando localização no aplicativo móvel"
            : "Correção registrada"}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-md border border-[#d8e1ed] px-4 py-2 text-sm font-semibold text-[#203e66] hover:bg-[#f5f8fc]"
      >
        Resolver
      </button>
      {aberto && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#102845]/45 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !enviando) setAberto(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolver-inventario-title"
            className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
          >
            <h2
              id="resolver-inventario-title"
              className="text-2xl font-bold text-[#17253d]"
            >
              Resolver divergência
            </h2>
            <p className="mt-1 text-sm text-[#627996]">
              {item.patrimonio.numeroPatrimonio} · {item.patrimonio.descricao}
            </p>
            <div className="mt-5 rounded-lg bg-[#f6f8fb] p-4 text-sm">
              <strong className="block">
                Setor cadastrado: {item.setorEsperado.nome}
              </strong>
              <span className="mt-1 block text-[#627996]">
                Encontrado em: {setorEncontrado ?? "—"}
              </span>
            </div>
            <form className="mt-5 grid gap-3" onSubmit={enviar}>
              <fieldset className="grid gap-2">
                <legend className="mb-2 text-sm font-semibold">
                  O que fazer com o bem?
                </legend>
                <label
                  className={`cursor-pointer rounded-lg border p-4 ${tipo === "RETORNO_AO_SETOR_CADASTRADO" ? "border-blue-500 bg-blue-50" : "border-[#d8e1ed]"}`}
                >
                  <input
                    required
                    type="radio"
                    name="tipoCorrecao"
                    value="RETORNO_AO_SETOR_CADASTRADO"
                    checked={tipo === "RETORNO_AO_SETOR_CADASTRADO"}
                    onChange={() => setTipo("RETORNO_AO_SETOR_CADASTRADO")}
                    className="mr-2"
                  />
                  Trazer para o setor cadastrado
                  <p className="ml-6 mt-1 text-xs text-[#627996]">
                    Registra o retorno físico, sem criar transferência
                    cadastral.
                  </p>
                </label>
                <label
                  className={`cursor-pointer rounded-lg border p-4 ${tipo === "TRANSFERENCIA_CADASTRAL" ? "border-blue-500 bg-blue-50" : "border-[#d8e1ed]"}`}
                >
                  <input
                    required
                    type="radio"
                    name="tipoCorrecao"
                    value="TRANSFERENCIA_CADASTRAL"
                    checked={tipo === "TRANSFERENCIA_CADASTRAL"}
                    onChange={() => setTipo("TRANSFERENCIA_CADASTRAL")}
                    className="mr-2"
                  />
                  Atualizar o cadastro para o setor encontrado
                  <p className="ml-6 mt-1 text-xs text-[#627996]">
                    Registra a transferência cadastral para{" "}
                    {setorEncontrado ?? "o setor encontrado"}.
                  </p>
                </label>
              </fieldset>
              <label className="text-sm">
                Observação (opcional)
                <textarea
                  maxLength={2000}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-[#d8e1ed] p-3"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Contexto adicional para o histórico"
                />
              </label>
              <p className="text-xs leading-5 text-[#627996]">
                A ocorrência e o resultado original da conferência permanecem no
                histórico.
              </p>
              {erro && (
                <p
                  role="alert"
                  className="rounded-md bg-red-50 p-3 text-sm text-red-800"
                >
                  {erro}
                </p>
              )}
              <footer className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => setAberto(false)}
                  className="rounded-md border border-[#d8e1ed] px-4 py-2 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !tipo}
                  className="rounded-md bg-[#203e66] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {enviando ? "Registrando…" : "Registrar correção"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
