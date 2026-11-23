"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { mensagemErro } from "./cadastro-ui";

export function SituacaoCadastro({
  ativo,
  pending,
  alterar,
}: {
  ativo: boolean;
  pending: boolean;
  alterar: () => Promise<unknown>;
}) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="grid gap-3 rounded-md border border-border p-4 text-sm">
      <p aria-live="polite">
        Situação atual: <strong>{ativo ? "Ativo" : "Inativo"}</strong>
      </p>
      {erro ? (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      ) : null}
      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogTrigger asChild>
          <Button type="button" variant={ativo ? "destructive" : "outline"}>
            {ativo ? "Inativar" : "Ativar"} cadastro
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ativo ? "Inativar" : "Ativar"} cadastro?
            </AlertDialogTitle>
            <AlertDialogDescription>
              A situação será alterada, mas os vínculos e o histórico existentes
              serão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={ativo ? "destructive" : "default"}
              disabled={pending}
              onClick={async (event) => {
                event.preventDefault();
                setErro(null);
                try {
                  const resultado = await alterar();
                  if (resultado === null) return;
                  setConfirmar(false);
                  toast.success("Situação atualizada com sucesso.");
                  router.refresh();
                } catch (error) {
                  setErro(mensagemErro(error));
                  setConfirmar(false);
                }
              }}
            >
              {pending ? "Atualizando…" : "Confirmar situação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
