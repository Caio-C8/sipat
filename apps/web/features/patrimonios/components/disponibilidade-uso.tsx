"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DisponibilidadeUsoPatrimonio,
  PatrimonioDetalhe,
} from "@repo/contracts";
import { CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/shared/form-fields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isApiError } from "@/lib/api/core/api-error";
import {
  decidirAposFalha,
  mensagemConflitoIdempotencia,
  obterTentativaIdempotente,
  type TentativaIdempotente,
} from "@/lib/api/core/idempotencia";
import {
  primeiraCompetencia,
  rotuloCompetencia,
} from "@/features/depreciacoes/apresentacao";
import { useConfirmarDisponibilidadeUso } from "../api/hooks";
import { formatarData } from "../apresentacao";

function mensagemErro(erro: unknown) {
  const conflito = mensagemConflitoIdempotencia(erro);
  if (conflito) return conflito;
  if (isApiError(erro)) {
    if (erro.status === 401)
      return "Sua sessão expirou. Entre novamente para continuar.";
    if (erro.status === 403)
      return "Seu perfil não pode confirmar a disponibilidade para uso.";
    if (erro.codigo === "DATA_DISPONIBILIDADE_FUTURA")
      return "Informe uma data igual ou anterior a hoje em São Paulo.";
    if (erro.codigo === "DISPONIBILIDADE_JA_CONFIRMADA")
      return "A disponibilidade já foi confirmada. Atualize os dados do patrimônio.";
    if (erro.codigo === "CONFLITO_CONCORRENTE_DISPONIBILIDADE")
      return "Outra alteração ocorreu ao mesmo tempo. Atualize os dados antes de confirmar novamente.";
    if (erro.codigo === "REGRA_DISPONIBILIDADE_DESATUALIZADA")
      return "Este patrimônio precisa ser atualizado antes da confirmação. Solicite a atualização e tente novamente; o status do bem não é a causa.";
    if (erro.codigo === "ESTADO_CONTABIL_INCONSISTENTE")
      return "A disponibilidade não pode ser confirmada porque os parâmetros contábeis deste bem estão inconsistentes. Revise a última reavaliação antes de tentar novamente.";
    if (erro.status === null || erro.status >= 500)
      return "O resultado não pôde ser confirmado. A tentativa foi preservada; confira os dados antes de reenviar.";
    return erro.message;
  }
  return "O resultado não pôde ser confirmado. A tentativa foi preservada; confira os dados antes de reenviar.";
}

export function DisponibilidadeUso({
  patrimonio,
  diretor,
  hoje,
}: {
  patrimonio: PatrimonioDetalhe;
  diretor: boolean;
  hoje: string;
}) {
  const router = useRouter();
  const mutacao = useConfirmarDisponibilidadeUso(patrimonio.id);
  const tentativa = useRef<TentativaIdempotente | null>(null);
  const enviando = useRef(false);
  const alertaErro = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState(hoje);
  const [erro, setErro] = useState("");
  const [confirmadaLocal, setConfirmadaLocal] =
    useState<DisponibilidadeUsoPatrimonio | null>(null);
  const confirmada = confirmadaLocal ?? patrimonio.disponibilidadeUso;

  const competenciaPrevista = patrimonio.depreciavel
    ? rotuloCompetencia(primeiraCompetencia(data))
    : "Não se aplica a bem não depreciável";

  useEffect(() => {
    if (!erro) return;
    const frame = requestAnimationFrame(() => {
      alertaErro.current?.scrollIntoView?.({ block: "nearest" });
      alertaErro.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [erro]);

  async function confirmar() {
    if (mutacao.pending || enviando.current || data > hoje) return;
    enviando.current = true;
    setErro("");
    const assinatura = JSON.stringify({ patrimonioId: patrimonio.id, data });
    tentativa.current = obterTentativaIdempotente(
      tentativa.current,
      assinatura,
    );
    try {
      const resposta = await mutacao.confirmar({
        dataDisponibilidade: data,
        chaveIdempotencia: tentativa.current.chave,
      });
      if (!resposta) return;
      tentativa.current = null;
      setConfirmadaLocal(resposta.dados);
      toast.success("Disponibilidade para uso confirmada.");
      setAberto(false);
      router.refresh();
    } catch (falha) {
      const decisao = decidirAposFalha(falha);
      if (!decisao.manterChave) tentativa.current = null;
      setErro(mensagemErro(falha));
      if (decisao.atualizarConsultas) {
        setAberto(false);
        router.refresh();
      }
    } finally {
      enviando.current = false;
    }
  }

  return (
    <Card asChild className="min-w-0">
      <section aria-labelledby="disponibilidade-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              id="disponibilidade-title"
              className="flex items-center gap-2 font-bold"
            >
              <CalendarCheck className="size-4 text-interactive" />{" "}
              Disponibilidade para uso
            </h2>
            {confirmada ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Confirmada em {formatarData(confirmada.dataDisponibilidade)} por{" "}
                {confirmada.createdBy.nome}.
              </p>
            ) : (
              <Badge variant="outline" className="mt-2">
                {patrimonio.depreciavel
                  ? "Aguardando disponibilidade"
                  : "Não depreciável — disponibilidade ainda não confirmada"}
              </Badge>
            )}
          </div>
          {!confirmada ? (
            <Button
              type="button"
              variant="outline"
              disabled={!diretor || patrimonio.status === "BAIXADO"}
              title={
                !diretor
                  ? "Seu perfil possui acesso somente para consulta."
                  : patrimonio.status === "BAIXADO"
                    ? "Patrimônio baixado não pode ter disponibilidade confirmada."
                    : undefined
              }
              onClick={() => setAberto(true)}
            >
              Confirmar disponibilidade para uso
            </Button>
          ) : null}
        </div>
        {confirmada ? (
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">
                Primeira competência
              </dt>
              <dd className="mt-1 font-medium text-brand-deep">
                {confirmada.primeiraCompetencia
                  ? rotuloCompetencia(confirmada.primeiraCompetencia)
                  : "Não se aplica"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Registrada em</dt>
              <dd className="mt-1 font-medium text-brand-deep">
                {formatarData(confirmada.createdAt)}
              </dd>
            </div>
          </dl>
        ) : null}
        {erro && !aberto ? (
          <Alert
            ref={alertaErro}
            tabIndex={-1}
            className="mt-4"
            variant="destructive"
          >
            <AlertTitle>
              Não foi possível confirmar a disponibilidade
            </AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        ) : null}

        <Dialog
          open={aberto}
          onOpenChange={(valor) => !mutacao.pending && setAberto(valor)}
        >
          <DialogContent closeDisabled={mutacao.pending}>
            <DialogHeader>
              <DialogTitle>Confirmar disponibilidade para uso</DialogTitle>
              <DialogDescription>
                Registre quando o bem passou a estar no local e em condição de
                funcionamento. O fato não poderá ser editado ou estornado nesta
                interface.
              </DialogDescription>
            </DialogHeader>
            <TextField
              id="data-disponibilidade"
              label="Data da disponibilidade"
              type="date"
              value={data}
              max={hoje}
              required
              disabled={mutacao.pending}
              error={
                data > hoje
                  ? "Informe uma data igual ou anterior a hoje."
                  : undefined
              }
              onChange={(evento) => {
                setData(evento.target.value);
                setErro("");
              }}
            />
            <Alert>
              <AlertTitle>Primeira competência prevista</AlertTitle>
              <AlertDescription>{competenciaPrevista}</AlertDescription>
            </Alert>
            {erro ? (
              <Alert ref={alertaErro} tabIndex={-1} variant="destructive">
                <AlertTitle>Revise antes de confirmar</AlertTitle>
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={mutacao.pending}
                onClick={() => setAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={mutacao.pending || !data || data > hoje}
                onClick={() => void confirmar()}
              >
                {mutacao.pending ? "Confirmando…" : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </Card>
  );
}
