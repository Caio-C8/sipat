"use client";

import type { ReactNode } from "react";
import {
  Archive,
  ArrowLeftRight,
  Check,
  FileUp,
  Hash,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { patrimonioExemplo as bem } from "./dados-exemplo";

export type AcaoPatrimonio =
  "movimentar" | "reavaliar" | "baixar" | "substituir";

const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] bg-white px-3 text-sm text-[#203b61] outline-none focus-visible:ring-2 focus-visible:ring-[#2863ec]";
const rotulo = "block text-xs font-medium text-[#25446f]";

function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <label className={rotulo}>
      {titulo}
      {children}
    </label>
  );
}

function Resumo({ detalhe }: { detalhe?: string }) {
  return (
    <div className="rounded-lg bg-[#eef5ff] p-4 text-[#203b61]">
      <strong className="text-sm">{bem.nome}</strong>
      <p className="mt-1 text-xs text-[#7188a5]">
        Patrimônio {bem.numero}
        {detalhe ? ` · ${detalhe}` : ""}
      </p>
    </div>
  );
}

function Aviso({
  children,
  alerta = false,
}: {
  children: ReactNode;
  alerta?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-4 text-xs leading-relaxed ${alerta ? "bg-[#fff9e8] text-[#9b430e]" : "bg-[#eef5ff] text-[#25446f]"}`}
    >
      {children}
    </div>
  );
}

function Movimentar() {
  return (
    <>
      <Resumo detalhe="Ativo" />
      <section>
        <h3 className="mb-3 font-semibold">Origem atual</h3>
        <div className="grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <span className="text-[#7b8fa8]">Setor</span>
            <p>{bem.setor}</p>
          </div>
          <div>
            <span className="text-[#7b8fa8]">Responsável do setor</span>
            <p>{bem.responsavel}</p>
          </div>
        </div>
      </section>
      <section className="border-t border-[#e4ebf4] pt-4">
        <h3 className="mb-3 font-semibold">Destino da movimentação</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo titulo="Setor de destino *">
            <select className={campo} defaultValue="Administrativo">
              <option>Administrativo</option>
              <option>Tecnologia da Informação</option>
            </select>
          </Campo>
          <Campo titulo="Responsável do setor de destino">
            <input className={campo} defaultValue="Ana Oliveira" readOnly />
          </Campo>
          <Campo titulo="Data da movimentação *">
            <input className={campo} type="date" defaultValue="2026-09-27" />
          </Campo>
          <Campo titulo="Comissão vigente *">
            <select className={campo}>
              <option>Comissão de Inventário 2026</option>
            </select>
          </Campo>
        </div>
      </section>
      <Campo titulo="Motivo da movimentação *">
        <textarea
          className={`${campo} min-h-24 py-2`}
          defaultValue="Redistribuição do notebook para as atividades do setor Administrativo."
        />
      </Campo>
      <Aviso>
        <strong>O que será atualizado</strong>
        <p className="mt-1">
          Setor: Administrativo. Responsável: Ana Oliveira. A movimentação
          ficará no histórico.
        </p>
      </Aviso>
    </>
  );
}

function Reavaliar() {
  return (
    <>
      <Resumo detalhe="Ativo" />
      <section>
        <h3 className="mb-3 font-semibold">Situação atual</h3>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[#7b8fa8]">Valor atual</span>
            <p>{bem.atual}</p>
          </div>
          <div>
            <span className="text-[#7b8fa8]">Valor residual</span>
            <p>R$ 549,00</p>
          </div>
          <div>
            <span className="text-[#7b8fa8]">Vida útil restante</span>
            <p>57 meses</p>
          </div>
        </div>
      </section>
      <div className="grid gap-4 border-t border-[#e4ebf4] pt-4 sm:grid-cols-2">
        <Campo titulo="Data da reavaliação *">
          <input className={campo} type="date" defaultValue="2026-09-27" />
        </Campo>
        <Campo titulo="Comissão vigente *">
          <select className={campo}>
            <option>Comissão de Inventário 2026</option>
          </select>
        </Campo>
        <Campo titulo="Novo valor do bem (R$) *">
          <input
            className={campo}
            type="text"
            inputMode="decimal"
            defaultValue="4.500,00"
          />
        </Campo>
        <Campo titulo="Nova vida útil (meses) *">
          <input className={campo} type="number" min="1" defaultValue="36" />
        </Campo>
        <Campo titulo="Informar o residual em">
          <select className={campo}>
            <option>Percentual (%)</option>
            <option>Valor (R$)</option>
          </select>
        </Campo>
        <Campo titulo="Novo residual (%) *">
          <input
            className={campo}
            type="text"
            inputMode="decimal"
            defaultValue="10,00"
          />
        </Campo>
      </div>
      <div className="grid gap-4 rounded-lg border border-[#dce5f0] bg-[#f7f9fc] p-4 sm:grid-cols-2">
        <div>
          <span className="text-xs text-[#7188a5]">
            Residual após a reavaliação
          </span>
          <p className="text-lg font-bold">R$ 450,00</p>
        </div>
        <div>
          <span className="text-xs text-[#7188a5]">
            Depreciação mensal estimada
          </span>
          <p className="text-lg font-bold text-[#2863ec]">R$ 112,50</p>
        </div>
        <p className="text-xs text-[#7188a5] sm:col-span-2">
          Prévia ilustrativa dos parâmetros exibidos no layout.
        </p>
      </div>
      <Aviso>
        <strong>
          O parâmetro anterior será encerrado e ficará no histórico.
        </strong>
        <p className="mt-1">A reavaliação não executa a depreciação.</p>
      </Aviso>
    </>
  );
}

function Baixar() {
  return (
    <>
      <Resumo detalhe="Ativo" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo titulo="Data da baixa *">
          <input className={campo} type="date" defaultValue="2026-09-27" />
        </Campo>
        <Campo titulo="Comissão · quando aplicável">
          <select className={campo}>
            <option>Comissão de Inventário 2026</option>
          </select>
        </Campo>
      </div>
      <Campo titulo="Motivo da baixa *">
        <textarea
          className={`${campo} min-h-24 py-2`}
          defaultValue="Bem sem condições de uso e com reparo economicamente inviável."
        />
      </Campo>
      <Campo titulo="Observação · opcional">
        <textarea
          className={`${campo} min-h-20 py-2`}
          defaultValue="Avaliação técnica realizada pela comissão responsável."
        />
      </Campo>
      <Campo titulo="Documento comprobatório · opcional">
        <span className="mt-1 flex items-center gap-3 rounded-lg border border-[#dce5f0] bg-[#f7f9fc] p-4">
          <FileUp className="size-5 text-[#2863ec]" />
          <span>
            Anexar documento
            <br />
            <small className="text-[#7188a5]">PDF ou imagem (PNG/JPG)</small>
          </span>
        </span>
        <input
          className="mt-2 w-full text-xs"
          type="file"
          accept="application/pdf,image/png,image/jpeg"
        />
      </Campo>
      <Aviso alerta>
        <strong>A baixa não poderá ser estornada.</strong>
        <p className="mt-1">
          O bem ficará com a situação Baixado. Seu cadastro e os registros
          anteriores serão preservados.
        </p>
      </Aviso>
    </>
  );
}

function Substituir() {
  return (
    <>
      <Resumo detalhe="Ativo" />
      <section>
        <h3 className="mb-4 font-semibold">Identificação patrimonial</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <span className="text-xs text-[#7188a5]">Número atual</span>
            <p className="mt-1 rounded-md border border-[#dce5f0] bg-[#f7f9fc] p-3 text-lg font-bold">
              {bem.numero}
            </p>
          </div>
          <span className="hidden self-center text-[#7188a5] sm:block">→</span>
          <div>
            <span className="text-xs text-[#7188a5]">
              Novo número · ilustrativo
            </span>
            <p className="mt-1 rounded-md border border-[#bfd4ff] bg-[#eef5ff] p-3 text-lg font-bold text-[#2863ec]">
              000002657
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#7188a5]">
          O número definitivo será atribuído pelo sistema ao confirmar.
        </p>
      </section>
      <Aviso>
        <strong>O número anterior deixará de identificar este bem.</strong>
        <p className="mt-1">
          O patrimônio e seu histórico permanecem no mesmo cadastro.
        </p>
      </Aviso>
      <Campo titulo="Motivo da substituição *">
        <textarea
          className={`${campo} min-h-28 py-2`}
          defaultValue="Placa patrimonial danificada e sem condições de leitura."
        />
      </Campo>
      <Aviso>
        <strong>Após a substituição</strong>
        <p className="mt-1">
          Utilize o novo número na placa física deste patrimônio. A alteração
          ficará registrada no histórico do bem.
        </p>
      </Aviso>
    </>
  );
}

const configuracao = {
  movimentar: {
    titulo: "Movimentar bem",
    descricao: "Transfira o patrimônio para outro setor.",
    icone: ArrowLeftRight,
    conteudo: Movimentar,
  },
  reavaliar: {
    titulo: "Registrar reavaliação",
    descricao: "Defina o novo valor e os parâmetros do patrimônio selecionado.",
    icone: TrendingUp,
    conteudo: Reavaliar,
  },
  baixar: {
    titulo: "Registrar baixa",
    descricao: "Registre a baixa do patrimônio selecionado.",
    icone: Archive,
    conteudo: Baixar,
  },
  substituir: {
    titulo: "Substituir número da placa",
    descricao: "Atribua o próximo número patrimonial da sequência ao bem.",
    icone: Hash,
    conteudo: Substituir,
  },
} as const;

export function PatrimonioModal({
  acao,
  onClose,
}: {
  acao: AcaoPatrimonio | null;
  onClose: () => void;
}) {
  const atual = acao ? configuracao[acao] : null;
  const Icone = atual?.icone;
  const Conteudo = atual?.conteudo;
  return (
    <Dialog
      open={acao !== null}
      onOpenChange={(aberto) => {
        if (!aberto) onClose();
      }}
    >
      <DialogContent
        className="top-0 right-0 bottom-0 left-auto flex h-svh w-full max-w-[min(100vw,540px)] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-l border-[#dce5f0] p-0 text-[#203b61]"
        showCloseButton
      >
        {atual && Icone && Conteudo && (
          <>
            <DialogHeader className="shrink-0 px-5 pt-6 pb-4 sm:px-7">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <Icone className="size-5 text-[#2863ec]" />
                {atual.titulo}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#7188a5]">
                {atual.descricao}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-6 text-[#203b61] sm:px-7">
              <Conteudo />
              <p className="text-xs text-[#7188a5]">
                Interface ilustrativa. Nenhuma alteração será enviada.
              </p>
            </div>
            <DialogFooter className="shrink-0 flex-row justify-between gap-3 border-t border-[#e4ebf4] bg-white px-5 py-4 sm:px-7">
              <DialogClose className="rounded-md border border-[#dce5f0] px-5 py-2 text-xs font-semibold">
                Cancelar
              </DialogClose>
              <button
                className="flex items-center gap-2 rounded-md bg-[#203b61] px-5 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled
                title="Disponível após integração com a API"
              >
                <Check className="size-4" />
                Confirmar{" "}
                {acao === "movimentar"
                  ? "movimentação"
                  : acao === "reavaliar"
                    ? "reavaliação"
                    : acao === "baixar"
                      ? "baixa"
                      : "substituição"}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
