"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BuscaGlobal, GrupoBuscaGlobal } from "@repo/contracts";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { isApiError } from "@/lib/api/core/api-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { criarOperacoesBusca } from "../api/busca-operations";

const operacoes = criarOperacoesBusca(browserApiClient);
const ATRASO_BUSCA_MS = 300;

function GrupoResultados({
  grupo,
  fechar,
}: Readonly<{ grupo: GrupoBuscaGlobal; fechar: () => void }>) {
  return (
    <section aria-labelledby={`grupo-${grupo.dominio}`} className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3
          id={`grupo-${grupo.dominio}`}
          className="text-sm font-semibold text-foreground"
        >
          {grupo.rotulo}
        </h3>
        <Badge variant="secondary">{grupo.total}</Badge>
      </div>
      <ul className="space-y-1" role="list">
        {grupo.itens.map((item) => (
          <li key={item.id}>
            <Button
              asChild
              variant="ghost"
              className="h-auto w-full justify-start whitespace-normal px-2 py-2 text-left"
            >
              <Link href={item.destino} onClick={fechar}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {item.titulo}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {item.identificador}
                    {item.complemento ? ` · ${item.complemento}` : ""}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
      {grupo.verTodosDestino ? (
        <Button asChild variant="link" className="h-auto px-2 py-1 text-xs">
          <Link href={grupo.verTodosDestino} onClick={fechar}>
            Ver todos em {grupo.rotulo}
          </Link>
        </Button>
      ) : null}
    </section>
  );
}

export function BuscaGlobal() {
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [resultado, setResultado] = useState<BuscaGlobal | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const abrirComAtalho = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setAberta(true);
      }
    };
    document.addEventListener("keydown", abrirComAtalho);
    return () => document.removeEventListener("keydown", abrirComAtalho);
  }, []);

  useEffect(() => {
    const termoNormalizado = termo.trim();
    if (!aberta || termoNormalizado.length < 2) return;

    const controller = new AbortController();
    const temporizador = window.setTimeout(() => {
      void operacoes
        .buscar({ termo: termoNormalizado }, controller.signal)
        .then((response) => {
          if (!controller.signal.aborted) setResultado(response.dados);
        })
        .catch((falha: unknown) => {
          if (!(isApiError(falha) && falha.categoria === "cancelada")) {
            setResultado(null);
            setErro(true);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setCarregando(false);
        });
    }, ATRASO_BUSCA_MS);

    return () => {
      window.clearTimeout(temporizador);
      controller.abort();
    };
  }, [aberta, termo]);

  const grupos = resultado?.grupos.filter((grupo) => grupo.total > 0) ?? [];
  const total = grupos.reduce((soma, grupo) => soma + grupo.total, 0);

  const atualizarAbertura = (novaAbertura: boolean) => {
    setAberta(novaAbertura);
    if (!novaAbertura) {
      setTermo("");
      setResultado(null);
      setCarregando(false);
      setErro(false);
    }
  };

  const atualizarTermo = (novoTermo: string) => {
    setTermo(novoTermo);
    setResultado(null);
    setErro(false);
    setCarregando(novoTermo.trim().length >= 2);
  };

  const fechar = () => atualizarAbertura(false);

  return (
    <Dialog open={aberta} onOpenChange={atualizarAbertura}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="size-[34px] justify-center bg-[#f7f9fc] px-0 text-[#54708c] min-[701px]:h-[30px] min-[701px]:w-[clamp(170px,20vw,260px)] min-[701px]:justify-start min-[701px]:px-2 min-[1500px]:h-9 min-[1500px]:w-[310px]"
        >
          <Search aria-hidden="true" className="size-4" />
          <span className="sr-only min-w-0 flex-1 truncate text-left text-[10px] font-normal min-[701px]:not-sr-only min-[1500px]:text-xs">
            Pesquisar no SIPAT...
          </span>
          <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground min-[900px]:inline">
            Ctrl K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100svh-2rem)] max-w-2xl grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogHeader className="px-5 pt-5 pr-12">
          <DialogTitle>Busca global</DialogTitle>
          <DialogDescription>
            Pesquise nos registros que você pode consultar.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              ref={inputRef}
              value={termo}
              onChange={(event) => atualizarTermo(event.target.value)}
              className="pr-10 pl-9"
              placeholder="Número patrimonial, nome, pedido..."
              aria-label="Termo da busca global"
              aria-describedby="status-busca-global"
            />
            {carregando ? (
              <LoaderCircle
                aria-hidden="true"
                className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              />
            ) : null}
          </div>
          <p
            id="status-busca-global"
            className="mt-2 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {termo.trim().length < 2
              ? "Digite pelo menos 2 caracteres."
              : carregando
                ? "Buscando registros..."
                : resultado
                  ? `${total} resultado${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}.`
                  : ""}
          </p>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 pb-5">
          <Separator className="mb-4" />
          {carregando ? (
            <div className="space-y-4" aria-hidden="true">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-16 w-full" />
              ))}
            </div>
          ) : erro ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível buscar agora</AlertTitle>
              <AlertDescription>
                Verifique sua conexão e tente novamente.
              </AlertDescription>
            </Alert>
          ) : resultado && grupos.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-medium text-foreground">
                Nenhum registro encontrado
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tente outro número, nome ou termo.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {grupos.map((grupo) => (
                <GrupoResultados
                  key={grupo.dominio}
                  grupo={grupo}
                  fechar={fechar}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
