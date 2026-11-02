"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box } from "lucide-react";
import {
  TIPOS_BAIXA_PATRIMONIO,
  type PatrimonioDetalhe,
  type TipoBaixaPatrimonio,
} from "@repo/contracts";
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
import { browserPatrimonioOperations } from "../api/browser-patrimonio-operations";

const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] bg-white px-3 py-2 text-sm";
const botao =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-[#dce5f0] bg-white px-4 text-sm font-semibold text-[#203b61] hover:bg-[#f4f8ff] focus-visible:outline-2 focus-visible:outline-[#2863ec]";
const hoje = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const rotuloTipo = (tipo: string) =>
  tipo
    .toLocaleLowerCase("pt-BR")
    .replaceAll("_", " ")
    .replace(/^./, (letra) => letra.toLocaleUpperCase("pt-BR"));

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
  const [dataBaixa, setDataBaixa] = useState(hoje);
  const [comissoes, setComissoes] = useState<
    Array<{ id: string; nome: string }>
  >([]);
  const [carregandoComissoes, setCarregandoComissoes] = useState(false);
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

  async function carregarComissoes(data = dataBaixa) {
    setCarregandoComissoes(true);
    setErro("");
    try {
      const resposta =
        await browserPatrimonioOperations.listarOpcoesComissoesBaixa(
          patrimonio.id,
          { dataBaixa: data, pagina: "1", limite: "50" },
        );
      setComissoes(resposta.dados);
    } catch (e) {
      setErro(
        isApiError(e)
          ? e.message
          : "Não foi possível carregar as comissões elegíveis.",
      );
    } finally {
      setCarregandoComissoes(false);
    }
  }

  async function confirmarBaixa(formData: FormData) {
    if (pending) return;
    const arquivo = formData.get("documento");
    if (arquivo instanceof File && arquivo.size > 10 * 1024 * 1024) {
      setErro("O PDF deve possuir no máximo 10 MiB.");
      return;
    }
    setPending(true);
    setErro("");
    setMensagem("");
    try {
      await browserPatrimonioOperations.baixar(
        patrimonio.id,
        {
          dataBaixa: String(formData.get("dataBaixa")),
          tipo: String(formData.get("tipo")) as TipoBaixaPatrimonio,
          motivo: String(formData.get("motivo")),
          observacao: String(formData.get("observacao")).trim() || undefined,
          comissaoId: String(formData.get("comissaoId")),
        },
        arquivo instanceof File && arquivo.size ? arquivo : undefined,
      );
      setMensagem(
        "Baixa registrada. Os dados e o histórico foram atualizados.",
      );
      setAcao(null);
      router.refresh();
    } catch (e) {
      setErro(
        isApiError(e)
          ? e.message
          : "Não foi possível confirmar a baixa. Releia o patrimônio antes de tentar novamente.",
      );
    } finally {
      setPending(false);
    }
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
          <button
            className={botao}
            type="button"
            onClick={() => {
              setAcao("baixa");
              void carregarComissoes();
            }}
          >
            Registrar baixa
          </button>
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
        open={acao === "baixa"}
        onOpenChange={(aberto) => !aberto && !pending && setAcao(null)}
      >
        <DialogContent closeDisabled={pending}>
          <DialogHeader>
            <DialogTitle>Registrar baixa patrimonial</DialogTitle>
            <DialogDescription>
              A baixa é irreversível. Confira a data, a comissão e o motivo
              antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          <form
            action={(dados) => void confirmarBaixa(dados)}
            className="grid gap-4"
          >
            <label className="text-sm">
              Data da baixa
              <input
                className={campo}
                type="date"
                name="dataBaixa"
                required
                max={hoje()}
                value={dataBaixa}
                onChange={(e) => {
                  setDataBaixa(e.target.value);
                  void carregarComissoes(e.target.value);
                }}
              />
            </label>
            <label className="text-sm">
              Comissão
              <select
                className={campo}
                name="comissaoId"
                required
                disabled={carregandoComissoes}
              >
                <option value="">
                  {carregandoComissoes ? "Carregando…" : "Selecione"}
                </option>
                {comissoes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Tipo
              <select className={campo} name="tipo" required>
                {TIPOS_BAIXA_PATRIMONIO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {rotuloTipo(tipo)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Motivo
              <textarea
                className={campo}
                name="motivo"
                required
                maxLength={2000}
                rows={3}
              />
            </label>
            <label className="text-sm">
              Observação (opcional)
              <textarea
                className={campo}
                name="observacao"
                maxLength={2000}
                rows={2}
              />
            </label>
            <label className="text-sm">
              Documento PDF (opcional, até 10 MiB)
              <input
                className={campo}
                type="file"
                name="documento"
                accept="application/pdf,.pdf"
              />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input className="mt-1" type="checkbox" required /> Confirmo que
              revisei os dados e entendo que a baixa é irreversível.
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setAcao(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || carregandoComissoes}>
                {pending ? "Confirmando…" : "Confirmar baixa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
