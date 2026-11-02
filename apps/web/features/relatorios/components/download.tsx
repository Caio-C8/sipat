"use client";
import type { TipoRelatorio } from "@repo/contracts";
import type { ApiQuery } from "@/lib/api/core/types";
import { Button } from "@/components/ui/button";
import * as hooks from "../api/hooks";
import { mensagemRelatorio } from "../apresentacao";
type Props = { query: ApiQuery; patrimonioId?: string };
function Botao({
  estado,
  query,
  nome,
}: {
  estado: ReturnType<typeof hooks.usePdfPatrimonios>;
  query: ApiQuery;
  nome: string;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Button
        type="button"
        className="h-auto min-h-10 w-full whitespace-normal break-words px-3 py-2"
        disabled={estado.pending}
        onClick={() => void estado.baixar(query, nome)}
      >
        {estado.pending
          ? "Gerando PDF…"
          : "Gerar e baixar PDF de todos os resultados filtrados"}
      </Button>
      {estado.erro != null && (
        <p role="alert" className="text-sm text-red-700">
          {mensagemRelatorio(estado.erro)}
        </p>
      )}
    </div>
  );
}
function Patrimonios({ query }: Props) {
  const estado = hooks.usePdfPatrimonios();
  return <Botao estado={estado} query={query} nome="sipat-patrimonios.pdf" />;
}
function Movimentacoes({ query }: Props) {
  const estado = hooks.usePdfMovimentacoes();
  return <Botao estado={estado} query={query} nome="sipat-movimentacoes.pdf" />;
}
function Manutencoes({ query }: Props) {
  const estado = hooks.usePdfManutencoes();
  return <Botao estado={estado} query={query} nome="sipat-manutencoes.pdf" />;
}
function Depreciacoes({ query }: Props) {
  const estado = hooks.usePdfDepreciacoes();
  return <Botao estado={estado} query={query} nome="sipat-depreciacoes.pdf" />;
}
function Reavaliacoes({ query }: Props) {
  const estado = hooks.usePdfReavaliacoes();
  return <Botao estado={estado} query={query} nome="sipat-reavaliacoes.pdf" />;
}
function Inventarios({ query }: Props) {
  const estado = hooks.usePdfInventarios();
  return <Botao estado={estado} query={query} nome="sipat-inventarios.pdf" />;
}
function Emprestimos({ query }: Props) {
  const estado = hooks.usePdfEmprestimos();
  return <Botao estado={estado} query={query} nome="sipat-emprestimos.pdf" />;
}
function Baixas({ query }: Props) {
  const estado = hooks.usePdfBaixas();
  return <Botao estado={estado} query={query} nome="sipat-baixas.pdf" />;
}
function Ficha({ query, patrimonioId }: Props) {
  const estado = hooks.usePdfFicha(patrimonioId!);
  return <Botao estado={estado} query={query} nome="sipat-ficha-bem.pdf" />;
}
const botoes = {
  patrimonios: Patrimonios,
  movimentacoes: Movimentacoes,
  manutencoes: Manutencoes,
  depreciacoes: Depreciacoes,
  reavaliacoes: Reavaliacoes,
  inventarios: Inventarios,
  emprestimos: Emprestimos,
  baixas: Baixas,
  "ficha-bem": Ficha,
};
export function DownloadRelatorio({
  tipo,
  ...props
}: Props & { tipo: TipoRelatorio }) {
  const Componente = botoes[tipo];
  return <Componente key={tipo} {...props} />;
}
