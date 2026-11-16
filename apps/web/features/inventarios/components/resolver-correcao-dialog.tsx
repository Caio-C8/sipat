"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ItemInventarioResponse } from "@repo/contracts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { browserInventarioOperations } from "../api/browser-inventario-operations";
import { toast } from "sonner";

type ItemCorrigivel = Extract<
  ItemInventarioResponse,
  { situacao: "DIVERGENCIA" | "NAO_LOCALIZADO" }
>;

export function ResolverCorrecaoDialog({
  inventarioId,
  item,
  bloqueado,
}: {
  inventarioId: string;
  item: ItemCorrigivel;
  bloqueado: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<
    "RETORNO_AO_SETOR_CADASTRADO" | "TRANSFERENCIA_CADASTRAL" | ""
  >("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const localizacaoPendente =
    item.situacao === "NAO_LOCALIZADO" &&
    item.localizacaoPosterior?.statusCorrecao === "PENDENTE";
  const divergenciaPendente =
    item.situacao === "DIVERGENCIA" && item.statusCorrecao === "PENDENTE";
  const podeResolver =
    !bloqueado && (localizacaoPendente || divergenciaPendente);
  const setorEncontrado =
    item.situacao === "DIVERGENCIA"
      ? item.setorEncontrado.nome
      : item.localizacaoPosterior?.setorEncontrado.nome;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!tipo) return;
    setEnviando(true);
    setErro("");
    try {
      await browserInventarioOperations.corrigir(inventarioId, item.id, {
        tipoCorrecao: tipo,
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      });
      setAberto(false);
      toast.success("Correção registrada com sucesso.");
      router.refresh();
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível registrar a correção. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!podeResolver) {
    return (
      <span className="text-xs text-muted-foreground">
        {bloqueado
          ? "Somente leitura"
          : item.situacao === "NAO_LOCALIZADO" && !localizacaoPendente
            ? "Aguardando localização no aplicativo móvel"
            : "Correção registrada"}
      </span>
    );
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline">Resolver</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl" closeDisabled={enviando}>
        <DialogHeader>
          <DialogTitle>Resolver divergência</DialogTitle>
          <DialogDescription>
            {item.patrimonio.numeroPatrimonio} · {item.patrimonio.descricao}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={enviar}>
          <RadioGroup
            value={tipo}
            onValueChange={(valor) => setTipo(valor as typeof tipo)}
          >
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
              <RadioGroupItem
                value="RETORNO_AO_SETOR_CADASTRADO"
                aria-label="Trazer para o setor cadastrado"
              />
              <span>
                <strong className="block">
                  Trazer para o setor cadastrado
                </strong>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Registra o retorno físico sem criar transferência cadastral.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
              <RadioGroupItem
                value="TRANSFERENCIA_CADASTRAL"
                aria-label="Atualizar o cadastro para o setor encontrado"
              />
              <span>
                <strong className="block">
                  Atualizar o cadastro para o setor encontrado
                </strong>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Registra a transferência para{" "}
                  {setorEncontrado ?? "o setor encontrado"}.
                </span>
              </span>
            </label>
          </RadioGroup>
          <Field>
            <FieldLabel htmlFor="observacao-correcao">Observação</FieldLabel>
            <Textarea
              id="observacao-correcao"
              maxLength={2000}
              rows={3}
              value={observacao}
              onChange={(evento) => setObservacao(evento.target.value)}
            />
          </Field>
          {erro ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível registrar</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={enviando}
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando || !tipo}>
              {enviando ? "Registrando…" : "Registrar correção"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
