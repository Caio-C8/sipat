"use client";
import { useEffect, useState } from "react";
import { useComissoesEmprestimo } from "../api/hooks";
import type { ListarOpcoesComissoesEmprestimoResponse } from "@repo/contracts";
import { mensagemEmprestimo } from "../apresentacao";
import { ComboboxField } from "@/components/shared/form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SeletorComissaoEmprestimo({
  dataReferencia,
  rotulo,
  value,
  onChange,
  onSelecionar,
  selecionada,
}: {
  dataReferencia: string;
  rotulo: string;
  value: string;
  onChange: (id: string) => void;
  onSelecionar?: (
    comissao: ListarOpcoesComissoesEmprestimoResponse["dados"][number] | null,
  ) => void;
  selecionada?: ListarOpcoesComissoesEmprestimoResponse["dados"][number] | null;
}) {
  const comissoes = useComissoesEmprestimo();
  const carregar = comissoes.carregar;
  const [busca, setBusca] = useState("");
  useEffect(() => {
    if (!dataReferencia) return;
    const temporizador = window.setTimeout(() => {
      void carregar({
        dataReferencia,
        pagina: "1",
        limite: "50",
        ...(busca.trim() ? { busca: busca.trim() } : {}),
      });
    }, 250);
    return () => window.clearTimeout(temporizador);
  }, [dataReferencia, busca, carregar]);
  const dados = comissoes.dados;
  const comissaoAtual =
    dados?.dados.find((item) => item.id === value) ??
    (selecionada?.id === value ? selecionada : null);
  return (
    <div className="grid gap-2">
      <ComboboxField
        id="comissao-emprestimo"
        label={rotulo}
        required
        value={value}
        onSearchChange={setBusca}
        onValueChange={(nextValue) => {
          onChange(nextValue);
          onSelecionar?.(
            dados?.dados.find((item) => item.id === nextValue) ?? null,
          );
        }}
        loading={comissoes.loading}
        placeholder="Selecione"
        searchPlaceholder="Buscar nas opções…"
        emptyText="Nenhuma comissão encontrada."
        options={[
          ...(selecionada &&
          !dados?.dados.some((item) => item.id === selecionada.id)
            ? [{ value: selecionada.id, label: selecionada.nome }]
            : []),
          ...(dados?.dados.map((item) => ({
            value: item.id,
            label: item.nome,
          })) ?? []),
        ]}
      />
      {comissaoAtual && (
        <p className="text-xs text-muted-foreground">
          Vigência:{" "}
          {comissaoAtual.dataVigenciaInicio.split("-").reverse().join("/")} a{" "}
          {comissaoAtual.dataVigenciaFim.split("-").reverse().join("/")}
        </p>
      )}
      {comissoes.loading && <p role="status">Carregando comissões...</p>}
      {comissoes.erro !== null && (
        <Alert variant="destructive">
          <AlertDescription>
            {mensagemEmprestimo(comissoes.erro)}
          </AlertDescription>
        </Alert>
      )}
      {dados?.dados.length === 0 && (
        <p>Nenhuma comissão vigente encontrada para esta data e busca.</p>
      )}
    </div>
  );
}
