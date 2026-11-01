"use client";

import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/core/api-error";
import {
  mensagemConflitoIdempotencia,
  type DecisaoIdempotencia,
} from "@/lib/api/core/idempotencia";

type AlertaIdempotenciaProps = {
  erro: unknown;
  decisao: DecisaoIdempotencia;
  destino: { href: string; rotulo: string };
  onTentarNovamente?: () => void;
  pending?: boolean;
};

export function AlertaIdempotencia({
  erro,
  decisao,
  destino,
  onTentarNovamente,
  pending = false,
}: AlertaIdempotenciaProps) {
  const mensagem = mensagemConflitoIdempotencia(erro);
  if (!mensagem || !isApiError(erro)) return null;

  const permiteNovaConfirmacao =
    decisao.tipo === "chave_reutilizada" || decisao.tipo === "em_processamento";
  const informativo =
    decisao.tipo === "ja_processada" || decisao.tipo === "em_processamento";

  return (
    <section
      role={informativo ? "status" : "alert"}
      className={`grid gap-3 rounded-md border p-4 text-sm ${
        informativo
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      <p>{mensagem}</p>
      <div className="flex flex-wrap gap-3">
        {permiteNovaConfirmacao && onTentarNovamente ? (
          <Button type="button" disabled={pending} onClick={onTentarNovamente}>
            {pending ? "Confirmando…" : "Confirmar novamente"}
          </Button>
        ) : null}
        {decisao.tipo === "ja_processada" ? (
          <Button asChild variant="outline">
            <a href={destino.href}>{destino.rotulo}</a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
