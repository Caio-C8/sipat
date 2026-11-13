"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box } from "lucide-react";
import type { PatrimonioDetalhe } from "@repo/contracts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/core/api-error";
import { NovaMovimentacao } from "@/features/movimentacoes/components/nova-movimentacao";
import { NovaReavaliacao } from "@/features/reavaliacoes/components/nova-reavaliacao";
import { BaixaFormulario } from "@/features/baixas/components/baixa-formulario";
import { browserPatrimonioOperations } from "../api/browser-patrimonio-operations";

const botao =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-[#dce5f0] bg-white px-4 text-sm font-semibold text-[#203b61] hover:bg-[#f4f8ff] focus-visible:outline-2 focus-visible:outline-[#2863ec]";
export function PatrimonioAcoes({
  patrimonio,
  usuarioId,
}: {
  patrimonio: PatrimonioDetalhe;
  usuarioId: string;
}) {
  const router = useRouter();
  const feedback = useRef<HTMLParagraphElement>(null);
  const [acao, setAcao] = useState<
    "movimentacao" | "reavaliacao" | "baixa" | "substituicao" | null
  >(null);
  const [pending, setPending] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (erro) feedback.current?.focus();
  }, [erro]);

  function concluirAcao(mensagemSucesso: string) {
    setPending(false);
    setErro("");
    setMensagem(mensagemSucesso);
    setAcao(null);
    router.refresh();
  }

  async function confirmarSubstituicao() {
    if (pending) return;
    setPending(true);
    setErro("");
    setMensagem("");
    try {
      await browserPatrimonioOperations.substituirNumero(
        patrimonio.id,
        patrimonio.numeroPatrimonio,
      );
      setMensagem(
        "Número patrimonial substituído pelo próximo número oficial.",
      );
      setAcao(null);
      router.refresh();
    } catch (e) {
      setErro(
        isApiError(e)
          ? e.message
          : "Resultado não confirmado. Releia o patrimônio antes de tentar novamente.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-[#d5e4ff] bg-[#eef5ff] p-4">
        <Box className="size-5" />
        <div className="mr-auto">
          <h2 className="font-bold">Ações deste patrimônio</h2>
          <p className="text-xs text-[#7188a5]">O bem já está selecionado.</p>
        </div>
        <Drawer
          open={acao === "movimentacao"}
          onOpenChange={(aberto) => {
            if (aberto) setAcao("movimentacao");
            else if (!pending) setAcao(null);
          }}
        >
          <DrawerTrigger asChild>
            <button className={botao} type="button">
              Movimentar
            </button>
          </DrawerTrigger>
          <DrawerContent closeDisabled={pending}>
            <DrawerHeader>
              <DrawerTitle>Movimentar patrimônio</DrawerTitle>
              <DrawerDescription>
                {patrimonio.numeroPatrimonio} · {patrimonio.descricao}. O bem e
                o setor de origem permanecem fixos nesta operação.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <NovaMovimentacao
                modoDetalhe
                usuarioId={usuarioId}
                patrimonioInicial={patrimonio}
                onCancelar={() => setAcao(null)}
                onPendingChange={setPending}
                onSuccess={concluirAcao}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        <Drawer
          open={acao === "reavaliacao"}
          onOpenChange={(aberto) => {
            if (aberto) setAcao("reavaliacao");
            else if (!pending) setAcao(null);
          }}
        >
          <DrawerTrigger asChild>
            <button className={botao} type="button">
              Reavaliar
            </button>
          </DrawerTrigger>
          <DrawerContent closeDisabled={pending}>
            <DrawerHeader>
              <DrawerTitle>Reavaliar patrimônio</DrawerTitle>
              <DrawerDescription>
                {patrimonio.numeroPatrimonio} · {patrimonio.descricao}. A
                confirmação usará a prévia válida mais recente da API.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <NovaReavaliacao
                modoDetalhe
                usuarioId={usuarioId}
                patrimonioInicial={patrimonio}
                onPendingChange={setPending}
                onSuccess={concluirAcao}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        {patrimonio.status === "ATIVO" ? (
          <Drawer
            open={acao === "baixa"}
            onOpenChange={(aberto) => {
              if (aberto) setAcao("baixa");
              else if (!pending) setAcao(null);
            }}
          >
            <DrawerTrigger asChild>
              <button className={botao} type="button">
                Registrar baixa
              </button>
            </DrawerTrigger>
            <DrawerContent closeDisabled={pending}>
              <DrawerHeader>
                <DrawerTitle>Registrar baixa</DrawerTitle>
                <DrawerDescription>
                  O patrimônio permanece fixo nesta operação. Confira todos os
                  dados antes da confirmação irreversível.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerBody>
                <BaixaFormulario
                  compacto
                  patrimonio={patrimonio}
                  onCancelar={() => setAcao(null)}
                  onPendingChange={setPending}
                  onSuccess={() =>
                    concluirAcao(
                      "Baixa registrada. Os dados e o histórico foram atualizados.",
                    )
                  }
                />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        ) : null}
        {patrimonio.status === "ATIVO" &&
        patrimonio.tipoNumeroPatrimonial === "OFICIAL" ? (
          <button
            className={botao}
            type="button"
            onClick={() => setAcao("substituicao")}
          >
            Substituir número
          </button>
        ) : null}
      </section>
      <p
        ref={feedback}
        tabIndex={-1}
        role={erro ? "alert" : "status"}
        className={
          erro
            ? "rounded-md bg-red-50 p-3 text-sm text-red-900"
            : mensagem
              ? "rounded-md bg-green-50 p-3 text-sm text-green-900"
              : "sr-only"
        }
      >
        {erro || mensagem}
      </p>
      <Dialog
        open={acao === "substituicao"}
        onOpenChange={(aberto) => !aberto && !pending && setAcao(null)}
      >
        <DialogContent closeDisabled={pending}>
          <DialogHeader>
            <DialogTitle>Substituir número patrimonial</DialogTitle>
            <DialogDescription>
              O número atual {patrimonio.numeroPatrimonio} será usado como
              pré-condição. O servidor gerará o próximo número oficial; não é
              possível escolhê-lo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setAcao(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => void confirmarSubstituicao()}
            >
              {pending ? "Confirmando…" : "Confirmar substituição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
