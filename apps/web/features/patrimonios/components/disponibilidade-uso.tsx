"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DisponibilidadeUsoPatrimonio,
  PatrimonioDetalhe,
} from "@repo/contracts";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState(hoje);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [confirmadaLocal, setConfirmadaLocal] =
    useState<DisponibilidadeUsoPatrimonio | null>(null);
  const confirmada = confirmadaLocal ?? patrimonio.disponibilidadeUso;

  const competenciaPrevista = patrimonio.depreciavel
    ? rotuloCompetencia(primeiraCompetencia(data))
    : "Não se aplica a bem não depreciável";

  async function confirmar() {
    if (mutacao.pending || enviando.current || data > hoje) return;
    enviando.current = true;
    setErro("");
    setSucesso("");
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
      setSucesso("Disponibilidade para uso confirmada com sucesso.");
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
    <section
      className="min-w-0 rounded-lg border border-[#dfe7f1] bg-white p-4 sm:p-5"
      aria-labelledby="disponibilidade-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="disponibilidade-title"
            className="flex items-center gap-2 font-bold"
          >
            <CalendarCheck className="size-4 text-[#2863ec]" /> Disponibilidade
            para uso
          </h2>
          {confirmada ? (
            <p className="mt-2 text-sm text-[#526b8c]">
              Confirmada em {formatarData(confirmada.dataDisponibilidade)} por{" "}
              {confirmada.createdBy.nome}.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#8d5a2a]">
              {patrimonio.depreciavel
                ? "Aguardando disponibilidade"
                : "Não depreciável — disponibilidade ainda não confirmada"}
            </p>
          )}
        </div>
        {diretor && !confirmada && patrimonio.status !== "BAIXADO" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setAberto(true)}
          >
            Confirmar disponibilidade para uso
          </Button>
        ) : null}
      </div>
      {confirmada ? (
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#7188a5]">Primeira competência</dt>
            <dd className="mt-1 font-medium text-[#203b61]">
              {confirmada.primeiraCompetencia
                ? rotuloCompetencia(confirmada.primeiraCompetencia)
                : "Não se aplica"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#7188a5]">Registrada em</dt>
            <dd className="mt-1 font-medium text-[#203b61]">
              {formatarData(confirmada.createdAt)}
            </dd>
          </div>
        </dl>
      ) : null}
      {sucesso ? (
        <p
          role="status"
          className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          {sucesso}
        </p>
      ) : null}
      {erro && !aberto ? (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-900"
        >
          {erro}
        </p>
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
          <label className="text-sm font-medium">
            Data da disponibilidade
            <input
              className="mt-2 min-h-10 w-full rounded-md border border-[#dce5f0] bg-white px-3"
              type="date"
              value={data}
              max={hoje}
              required
              disabled={mutacao.pending}
              onChange={(evento) => {
                setData(evento.target.value);
                setErro("");
              }}
            />
          </label>
          <p className="rounded-md bg-[#eef5ff] p-3 text-sm text-[#38577f]">
            Primeira competência prevista:{" "}
            <strong>{competenciaPrevista}</strong>.
          </p>
          {data > hoje ? (
            <p role="alert" className="text-sm text-red-800">
              A data não pode ser futura em São Paulo.
            </p>
          ) : null}
          {erro ? (
            <p
              role="alert"
              className="rounded-md bg-red-50 p-3 text-sm text-red-900"
            >
              {erro}
            </p>
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
  );
}
