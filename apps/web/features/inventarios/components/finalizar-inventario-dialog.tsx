"use client";

import * as React from "react";
import type { InventarioDetalhe } from "@repo/contracts";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { isApiError } from "@/lib/api/core/api-error";
import { browserInventarioOperations } from "../api/browser-inventario-operations";

export function FinalizarInventarioDialog({
  inventario,
}: {
  inventario: InventarioDetalhe;
}) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [confirmado, setConfirmado] = React.useState(false);
  const [enviando, setEnviando] = React.useState(false);
  const [erro, setErro] = React.useState("");
  const setoresRestantes =
    inventario.progresso.setoresPendentes +
    inventario.progresso.setoresEmAndamento;
  const podeFinalizar =
    inventario.status === "EM_ANDAMENTO" && setoresRestantes === 0;
  const exigeConfirmacao = inventario.progresso.correcoesPendentes > 0;

  async function finalizar(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!podeFinalizar || (exigeConfirmacao && !confirmado)) return;
    setEnviando(true);
    setErro("");
    try {
      await browserInventarioOperations.finalizar(inventario.id, {
        confirmarCorrecoesPendentes: confirmado,
      });
      setAberto(false);
      toast.success("Inventário finalizado com sucesso.");
      router.refresh();
    } catch (falha) {
      setErro(
        isApiError(falha)
          ? falha.message
          : "Não foi possível finalizar o inventário. Confira o progresso e tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (inventario.status === "FINALIZADO") return null;
  return (
    <div className="grid justify-items-end gap-2">
      <AlertDialog open={aberto} onOpenChange={setAberto}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={!podeFinalizar}>
            Finalizar inventário
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar este inventário?</AlertDialogTitle>
            <AlertDialogDescription>
              A finalização encerra a conferência e torna o inventário somente
              leitura. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {exigeConfirmacao ? (
            <Alert>
              <AlertTitle>
                {inventario.progresso.correcoesPendentes} correções pendentes
              </AlertTitle>
              <AlertDescription className="grid gap-3">
                <p>
                  As divergências continuarão registradas, mas não poderão ser
                  corrigidas depois da finalização.
                </p>
                <label className="flex items-start gap-2 font-medium text-foreground">
                  <Checkbox
                    checked={confirmado}
                    onCheckedChange={(valor) => setConfirmado(valor === true)}
                    disabled={enviando}
                  />
                  Confirmo a finalização com correções pendentes.
                </label>
              </AlertDescription>
            </Alert>
          ) : null}
          {erro ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível finalizar</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={enviando || (exigeConfirmacao && !confirmado)}
              onClick={finalizar}
            >
              {enviando ? "Finalizando…" : "Finalizar inventário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!podeFinalizar ? (
        <p className="max-w-sm text-right text-sm text-muted-foreground">
          {inventario.status === "PENDENTE"
            ? "Inicie e conclua a conferência dos setores no aplicativo móvel."
            : `${setoresRestantes} ${setoresRestantes === 1 ? "setor ainda precisa" : "setores ainda precisam"} ser concluído${setoresRestantes === 1 ? "" : "s"}.`}
        </p>
      ) : null}
    </div>
  );
}
