"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { browserInventarioOperations } from "../api/browser-inventario-operations";
import { criarOperacoesReavaliacoes } from "@/features/reavaliacoes/api/reavaliacao-operations";
import { browserApiClient } from "@/lib/api/browser-api-client";

const operacoesReavaliacao = criarOperacoesReavaliacoes(browserApiClient);
const campo =
  "mt-1 w-full rounded-md border border-[#d8e1ed] bg-white px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

export function AbrirInventarioDialog() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [comissaoId, setComissaoId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [comissoes, setComissoes] = useState<
    {
      id: string;
      nome: string;
      dataVigenciaInicio: string;
      dataVigenciaFim: string;
    }[]
  >([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const chaveRef = useRef<{ payload: string; chave: string } | null>(null);

  async function abrir() {
    setAberto(true);
    if (comissoes.length) return;
    setCarregando(true);
    try {
      const resposta = await operacoesReavaliacao.comissoes({
        contexto: "REGISTRO",
        pagina: "1",
        limite: "50",
      });
      setComissoes(resposta.dados);
    } catch {
      setErro(
        "Não foi possível carregar as comissões vigentes. Feche e tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    const body = { nome, comissaoId, observacao: observacao || undefined };
    const payload = JSON.stringify(body);
    if (!chaveRef.current || chaveRef.current.payload !== payload) {
      chaveRef.current = { payload, chave: crypto.randomUUID() };
    }
    setCarregando(true);
    try {
      const resposta = await browserInventarioOperations.criar({
        ...body,
        chaveIdempotencia: chaveRef.current.chave,
      });
      chaveRef.current = null;
      setAberto(false);
      router.push(`/inventarios/${resposta.dados.id}`);
      router.refresh();
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível abrir o inventário.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-2 rounded-md bg-[#203e66] px-4 py-3 text-sm font-semibold text-white hover:bg-[#172f50]"
      >
        <Plus className="size-4" aria-hidden="true" /> Abrir inventário
      </button>
      {aberto && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#102845]/45 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !carregando) setAberto(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="abrir-inventario-title"
            className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="abrir-inventario-title"
                  className="text-2xl font-bold text-[#17253d]"
                >
                  Abrir inventário
                </h2>
                <p className="mt-1 text-sm text-[#627996]">
                  Informe a comissão e identifique este inventário.
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                disabled={carregando}
                onClick={() => setAberto(false)}
                className="rounded p-1 text-[#627996] disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </header>
            <form className="mt-6 grid gap-4" onSubmit={enviar}>
              <label className="text-sm font-medium">
                Nome do inventário *
                <input
                  required
                  maxLength={150}
                  className={campo}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Inventário patrimonial 2026"
                />
              </label>
              <label className="text-sm font-medium">
                Comissão vigente *
                <select
                  required
                  className={campo}
                  value={comissaoId}
                  onChange={(e) => setComissaoId(e.target.value)}
                  disabled={carregando || !comissoes.length}
                >
                  <option value="">
                    {carregando
                      ? "Carregando comissões…"
                      : "Selecione uma comissão"}
                  </option>
                  {comissoes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} · {c.dataVigenciaInicio} a {c.dataVigenciaFim}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Observação (opcional)
                <textarea
                  maxLength={2000}
                  rows={3}
                  className={campo}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </label>
              <aside className="rounded-lg bg-[#eef5ff] p-4 text-sm leading-6 text-[#35577e]">
                <strong className="block text-[#203e66]">
                  Inventário global
                </strong>
                A abertura inclui todos os setores ativos e os bens com situação
                ativa neste momento. A conferência dos setores é realizada no
                aplicativo móvel.
              </aside>
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
                  disabled={carregando}
                  onClick={() => setAberto(false)}
                  className="rounded-md border border-[#d8e1ed] px-4 py-2 text-sm font-semibold text-[#203e66]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carregando || !comissoes.length}
                  className="rounded-md bg-[#203e66] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {carregando ? "Abrindo…" : "Abrir inventário"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
