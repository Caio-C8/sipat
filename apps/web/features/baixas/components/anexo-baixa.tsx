"use client";

import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { browserPatrimonioOperations } from "@/features/patrimonios/api/browser-patrimonio-operations";
import { mensagemErroBaixa } from "../apresentacao";

export function AnexoBaixa({
  patrimonioId,
  numero,
}: {
  patrimonioId: string;
  numero: string;
}) {
  const ocupado = useRef(false);
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState("");
  async function abrir() {
    if (ocupado.current) return;
    ocupado.current = true;
    setPending(true);
    setErro("");
    try {
      const blob =
        await browserPatrimonioOperations.obterAnexoBaixa(patrimonioId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (falha) {
      setErro(mensagemErroBaixa(falha));
    } finally {
      ocupado.current = false;
      setPending(false);
    }
  }
  return (
    <div>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => void abrir()}
      >
        <FileDown aria-hidden="true" />{" "}
        {pending ? "Abrindo…" : "Abrir PDF comprobatório"}
      </Button>
      {erro ? (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {erro}
        </p>
      ) : null}
      <span className="sr-only">Documento da baixa do patrimônio {numero}</span>
    </div>
  );
}
