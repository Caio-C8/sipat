"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box } from "lucide-react";
import { toast } from "sonner";
import type { PatrimonioDetalhe } from "@repo/contracts";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { isApiError } from "@/lib/api/core/api-error";
import { NovaMovimentacao } from "@/features/movimentacoes/components/nova-movimentacao";
import { NovaReavaliacao } from "@/features/reavaliacoes/components/nova-reavaliacao";
import { BaixaFormulario } from "@/features/baixas/components/baixa-formulario";
import { browserPatrimonioOperations } from "../api/browser-patrimonio-operations";
import { usePreviaNumeracaoPatrimonio } from "../api/hooks";

export function PatrimonioAcoes({
  patrimonio,
  usuarioId,
  diretor,
}: {
  patrimonio: PatrimonioDetalhe;
  usuarioId: string;
  diretor: boolean;
}) {
  const router = useRouter();
  const feedback = useRef<HTMLParagraphElement>(null);
  const feedbackDrawer = useRef<HTMLParagraphElement>(null);
  const [acao, setAcao] = useState<
    "movimentacao" | "reavaliacao" | "baixa" | "substituicao" | null
  >(null);
  const [pending, setPending] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const {
    dados: previaNumeracao,
    loading: carregandoPrevia,
    carregar: carregarPrevia,
  } = usePreviaNumeracaoPatrimonio();
  const podeMovimentar = diretor && patrimonio.status === "ATIVO";
  const podeReavaliar =
    diretor && patrimonio.status !== "BAIXADO" && patrimonio.depreciavel;
  const podeBaixar = diretor && patrimonio.status === "ATIVO";
  const podeSubstituir =
    diretor &&
    patrimonio.status === "ATIVO" &&
    patrimonio.tipoNumeroPatrimonial === "OFICIAL";
  const statusApresentado =
    {
      ATIVO: "ativo",
      EMPRESTADO: "emprestado",
      EM_MANUTENCAO: "em manutenção",
      BAIXADO: "baixado",
    }[patrimonio.status] ?? patrimonio.status.toLowerCase();
  const motivoGeral = !diretor
    ? "Seu perfil possui acesso somente para consulta."
    : patrimonio.status !== "ATIVO"
      ? `O bem está ${statusApresentado}; as ações incompatíveis permanecem desativadas.`
      : "A disponibilidade das ações considera o estado e a classificação do bem.";

  useEffect(() => {
    if (erro) {
      if (acao === "substituicao") feedbackDrawer.current?.focus();
      else feedback.current?.focus();
    }
  }, [acao, erro]);

  useEffect(() => {
    if (acao === "substituicao") void carregarPrevia();
  }, [acao, carregarPrevia]);

  function concluirAcao(mensagemSucesso: string) {
    setPending(false);
    setErro("");
    setMensagem(mensagemSucesso);
    toast.success(mensagemSucesso);
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
      toast.success("Número patrimonial substituído.");
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
      <Card
        asChild
        className="flex-row flex-wrap items-center gap-3 bg-accent shadow-none"
      >
        <section>
          <Box className="size-5" />
          <div className="mr-auto">
            <h2 className="font-bold">Ações deste patrimônio</h2>
            <p
              id="motivo-acoes-patrimonio"
              className="text-xs text-muted-foreground"
            >
              {motivoGeral}
            </p>
          </div>
          <Drawer
            open={acao === "movimentacao"}
            onOpenChange={(aberto) => {
              if (aberto) setAcao("movimentacao");
              else if (!pending) setAcao(null);
            }}
          >
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                type="button"
                disabled={!podeMovimentar}
                aria-describedby="motivo-acoes-patrimonio"
                title={!podeMovimentar ? motivoGeral : undefined}
              >
                Movimentar
              </Button>
            </DrawerTrigger>
            <DrawerContent closeDisabled={pending}>
              <DrawerHeader>
                <DrawerTitle>Movimentar patrimônio</DrawerTitle>
                <DrawerDescription>
                  {patrimonio.numeroPatrimonio} · {patrimonio.descricao}. O bem
                  e o setor de origem permanecem fixos nesta operação.
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
              <Button
                variant="outline"
                type="button"
                disabled={!podeReavaliar}
                aria-describedby="motivo-acoes-patrimonio"
                title={
                  !podeReavaliar
                    ? !patrimonio.depreciavel
                      ? "Bem não depreciável não pode ser reavaliado contabilmente."
                      : motivoGeral
                    : undefined
                }
              >
                Reavaliar
              </Button>
            </DrawerTrigger>
            <DrawerContent closeDisabled={pending}>
              <DrawerHeader>
                <DrawerTitle>Reavaliar patrimônio</DrawerTitle>
                <DrawerDescription>
                  {patrimonio.numeroPatrimonio} · {patrimonio.descricao}. A
                  confirmação usará a prévia válida mais recente.
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
          <Drawer
            open={acao === "baixa"}
            onOpenChange={(aberto) => {
              if (aberto) setAcao("baixa");
              else if (!pending) setAcao(null);
            }}
          >
            <DrawerTrigger asChild>
              <Button
                variant="destructive"
                type="button"
                disabled={!podeBaixar}
                aria-describedby="motivo-acoes-patrimonio"
                title={!podeBaixar ? motivoGeral : undefined}
              >
                Registrar baixa
              </Button>
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
          <Drawer
            open={acao === "substituicao"}
            onOpenChange={(aberto) => {
              if (aberto) setAcao("substituicao");
              else if (!pending) setAcao(null);
            }}
          >
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                type="button"
                disabled={!podeSubstituir}
                aria-describedby="motivo-acoes-patrimonio"
                title={
                  !podeSubstituir &&
                  patrimonio.tipoNumeroPatrimonial !== "OFICIAL"
                    ? "Somente numeração oficial pode ser substituída."
                    : !podeSubstituir
                      ? motivoGeral
                      : undefined
                }
              >
                Substituir número
              </Button>
            </DrawerTrigger>
            <DrawerContent closeDisabled={pending}>
              <DrawerHeader>
                <DrawerTitle>Substituir número patrimonial</DrawerTitle>
                <DrawerDescription>
                  O número atual {patrimonio.numeroPatrimonio} será usado como
                  pré-condição. O próximo número oficial será gerado na
                  confirmação e não pode ser escolhido.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerBody className="grid content-start gap-4 p-5 sm:p-7">
                <Card className="grid gap-3 bg-background p-4 shadow-none sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Número atual
                    </p>
                    <p className="mt-1 text-xl font-bold text-brand-deep">
                      {patrimonio.numeroPatrimonio}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Próximo número previsto
                    </p>
                    <p className="mt-1 text-xl font-bold text-interactive">
                      {carregandoPrevia
                        ? "Consultando…"
                        : (previaNumeracao?.numeroOficial ??
                          "Prévia indisponível")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    A prévia não reserva o número. Outro cadastro concluído
                    antes desta confirmação pode alterar o valor final.
                  </p>
                </Card>
                <Alert>
                  <AlertTitle>Confirme a identificação atual</AlertTitle>
                  <AlertDescription>
                    Confira a placa do bem antes de continuar. Se outra pessoa
                    alterar o número primeiro, será necessário atualizar a
                    ficha.
                  </AlertDescription>
                </Alert>
                {erro ? (
                  <Alert
                    ref={feedbackDrawer}
                    tabIndex={-1}
                    variant="destructive"
                  >
                    <AlertTitle>
                      Não foi possível substituir o número
                    </AlertTitle>
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex flex-wrap justify-end gap-2">
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
                    variant="destructive"
                    disabled={pending}
                    onClick={() => void confirmarSubstituicao()}
                  >
                    {pending ? "Confirmando…" : "Confirmar substituição"}
                  </Button>
                </div>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </section>
      </Card>
      <p
        ref={feedback}
        tabIndex={-1}
        role={erro ? "alert" : "status"}
        className="sr-only"
      >
        {erro || mensagem}
      </p>
    </>
  );
}
