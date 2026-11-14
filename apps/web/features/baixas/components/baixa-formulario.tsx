"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, FileText, PackageCheck } from "lucide-react";
import {
  TIPOS_BAIXA_PATRIMONIO,
  type BaixaPatrimonioDetalhe,
  type PatrimonioResumo,
  type TipoBaixaPatrimonio,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { browserPatrimonioOperations } from "@/features/patrimonios/api/browser-patrimonio-operations";
import { mensagemErroBaixa, rotulosTipoBaixa } from "../apresentacao";

const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] bg-white px-3 py-2 text-sm text-[#19355d] focus-visible:outline-2 focus-visible:outline-[#2863ec] disabled:bg-slate-100";

function hojeSaoPaulo() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function BaixaFormulario({
  patrimonio,
  compacto = false,
  onCancelar,
  onPendingChange,
  onSuccess,
}: {
  patrimonio: Pick<PatrimonioResumo, "id" | "numeroPatrimonio" | "descricao">;
  compacto?: boolean;
  onCancelar?: () => void;
  onPendingChange?: (pending: boolean) => void;
  onSuccess: (baixa: BaixaPatrimonioDetalhe) => void;
}) {
  const hoje = hojeSaoPaulo();
  const feedback = useRef<HTMLParagraphElement>(null);
  const [dataBaixa, setDataBaixa] = useState("");
  const [comissoes, setComissoes] = useState<
    Array<{ id: string; nome: string }>
  >([]);
  const [carregandoComissoes, setCarregandoComissoes] = useState(false);
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState("");
  const controleComissoes = useRef<AbortController | null>(null);

  async function carregarComissoes(data: string) {
    controleComissoes.current?.abort();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data > hoje) return;
    const controle = new AbortController();
    controleComissoes.current = controle;
    setCarregandoComissoes(true);
    setErro("");
    try {
      const resposta =
        await browserPatrimonioOperations.listarOpcoesComissoesBaixa(
          patrimonio.id,
          { dataBaixa: data, pagina: "1", limite: "50" },
          controle.signal,
        );
      if (!controle.signal.aborted) setComissoes(resposta.dados);
    } catch (falha) {
      if (!controle.signal.aborted) setErro(mensagemErroBaixa(falha));
    } finally {
      if (!controle.signal.aborted) setCarregandoComissoes(false);
    }
  }

  useEffect(() => () => controleComissoes.current?.abort(), []);

  useEffect(() => onPendingChange?.(pending), [onPendingChange, pending]);
  useEffect(() => {
    if (erro) feedback.current?.focus();
  }, [erro]);

  async function confirmar(formData: FormData) {
    if (pending) return;
    const documento = formData.get("documento");
    if (documento instanceof File && documento.size > 10 * 1024 * 1024) {
      setErro("O PDF deve possuir no máximo 10 MiB.");
      return;
    }
    setPending(true);
    setErro("");
    try {
      const resposta = await browserPatrimonioOperations.baixar(
        patrimonio.id,
        {
          dataBaixa: String(formData.get("dataBaixa")),
          tipo: String(formData.get("tipo")) as TipoBaixaPatrimonio,
          comissaoId: String(formData.get("comissaoId")),
          motivo: String(formData.get("motivo")),
          observacao: String(formData.get("observacao")).trim() || undefined,
        },
        documento instanceof File && documento.size ? documento : undefined,
      );
      onSuccess(resposta.dados);
    } catch (falha) {
      setErro(mensagemErroBaixa(falha));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={(dados) => void confirmar(dados)}
      className={compacto ? "grid gap-5 p-5 sm:p-7" : "grid gap-5"}
    >
      <section
        className="rounded-lg border border-[#dce5f0] bg-white p-4"
        aria-labelledby="bem-baixa"
      >
        <div className="flex items-start gap-3">
          <PackageCheck
            aria-hidden="true"
            className="mt-0.5 size-5 text-[#2863ec]"
          />
          <div className="min-w-0">
            <h2 id="bem-baixa" className="font-bold">
              Patrimônio selecionado
            </h2>
            <p className="mt-1 break-words text-sm text-[#526580]">
              {patrimonio.numeroPatrimonio} · {patrimonio.descricao}
            </p>
          </div>
          <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            1 de 1
          </span>
        </div>
      </section>

      <fieldset className="grid gap-4 rounded-lg border border-[#dce5f0] bg-white p-4 sm:grid-cols-2">
        <legend className="px-2 font-bold">Dados da baixa</legend>
        <label className="text-sm font-medium">
          Data da baixa
          <input
            className={campo}
            type="date"
            name="dataBaixa"
            required
            max={hoje}
            value={dataBaixa}
            onChange={(e) => {
              setDataBaixa(e.target.value);
              setComissoes([]);
              void carregarComissoes(e.target.value);
            }}
          />
        </label>
        <label className="text-sm font-medium">
          Tipo
          <select className={campo} name="tipo" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            {TIPOS_BAIXA_PATRIMONIO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {rotulosTipoBaixa[tipo]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Comissão vigente na data
          <select
            className={campo}
            name="comissaoId"
            required
            disabled={carregandoComissoes || comissoes.length === 0}
            defaultValue=""
          >
            <option value="">
              {carregandoComissoes
                ? "Carregando…"
                : comissoes.length
                  ? "Selecione"
                  : "Nenhuma comissão elegível"}
            </option>
            {comissoes.map((comissao) => (
              <option key={comissao.id} value={comissao.id}>
                {comissao.nome}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="grid gap-4 rounded-lg border border-[#dce5f0] bg-white p-4">
        <legend className="px-2 font-bold">Justificativa e documento</legend>
        <label className="text-sm font-medium">
          Motivo
          <textarea
            className={campo}
            name="motivo"
            required
            maxLength={2000}
            rows={4}
          />
        </label>
        <label className="text-sm font-medium">
          Observação (opcional)
          <textarea
            className={campo}
            name="observacao"
            maxLength={2000}
            rows={3}
          />
        </label>
        <label className="text-sm font-medium">
          <span className="flex items-center gap-2">
            <FileText aria-hidden="true" className="size-4" /> Documento PDF
            (opcional, até 10 MiB)
          </span>
          <input
            className={campo}
            type="file"
            name="documento"
            accept="application/pdf,.pdf"
          />
        </label>
      </fieldset>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <div className="flex gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          <div>
            <h2 className="font-bold">Operação irreversível</h2>
            <p className="mt-1 text-sm">
              A baixa altera o patrimônio para BAIXADO e não pode ser editada,
              excluída ou estornada.
            </p>
          </div>
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm font-medium">
          <input className="mt-1" type="checkbox" required />
          Revisei o patrimônio, a data, o tipo, a comissão, a justificativa e o
          documento e confirmo a baixa irreversível.
        </label>
      </section>

      <p
        ref={feedback}
        tabIndex={-1}
        role={erro ? "alert" : "status"}
        className={
          erro ? "rounded-md bg-red-50 p-3 text-sm text-red-900" : "sr-only"
        }
      >
        {erro}
      </p>
      <div className="flex flex-wrap justify-end gap-3 border-t border-[#dce5f0] pt-4">
        {onCancelar ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancelar}
          >
            Cancelar
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="destructive"
          disabled={pending || carregandoComissoes || comissoes.length === 0}
        >
          {pending ? "Confirmando…" : "Confirmar baixa"}
        </Button>
      </div>
    </form>
  );
}
