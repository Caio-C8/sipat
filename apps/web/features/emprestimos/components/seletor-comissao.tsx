"use client";
import { useEffect, useState } from "react";
import { useComissoesEmprestimo } from "../api/hooks";
import type { ListarOpcoesComissoesEmprestimoResponse } from "@repo/contracts";
import { campoEmprestimo, mensagemEmprestimo } from "../apresentacao";

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
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  useEffect(() => {
    if (dataReferencia)
      void carregar({
        dataReferencia,
        pagina: String(pagina),
        limite: "20",
        ...(filtro ? { busca: filtro } : {}),
      });
  }, [dataReferencia, pagina, filtro, carregar]);
  const dados = comissoes.dados;
  const comissaoAtual =
    dados?.dados.find((item) => item.id === value) ??
    (selecionada?.id === value ? selecionada : null);
  return (
    <div className="grid gap-2">
      <label className="text-sm">
        Buscar comissão
        <input
          className={campoEmprestimo}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome da comissão"
        />
      </label>
      <button
        type="button"
        className="w-fit text-sm underline"
        onClick={() => {
          setPagina(1);
          setFiltro(busca.trim());
          onChange("");
          onSelecionar?.(null);
        }}
      >
        Buscar comissão
      </button>
      <label className="text-sm">
        {rotulo}
        <select
          className={campoEmprestimo}
          required
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onSelecionar?.(
              dados?.dados.find((item) => item.id === e.target.value) ?? null,
            );
          }}
        >
          <option value="">Selecione</option>
          {selecionada &&
            !dados?.dados.some((item) => item.id === selecionada.id) && (
              <option value={selecionada.id}>{selecionada.nome}</option>
            )}
          {dados?.dados.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
      </label>
      {comissaoAtual && (
        <p className="text-xs text-[#526580]">
          Vigência:{" "}
          {comissaoAtual.dataVigenciaInicio.split("-").reverse().join("/")} a{" "}
          {comissaoAtual.dataVigenciaFim.split("-").reverse().join("/")}
        </p>
      )}
      {comissoes.loading && <p role="status">Carregando comissões...</p>}
      {comissoes.erro !== null && (
        <p role="alert" className="text-red-800">
          {mensagemEmprestimo(comissoes.erro)}
        </p>
      )}
      {dados?.dados.length === 0 && (
        <p>Nenhuma comissão vigente encontrada para esta data e busca.</p>
      )}
      {dados && dados.meta.ultimaPagina > 1 && (
        <div className="flex gap-4 text-sm">
          <span>
            Página {dados.meta.pagina} de {dados.meta.ultimaPagina}
          </span>
          <button
            type="button"
            className="underline disabled:opacity-50"
            disabled={pagina <= 1}
            onClick={() => {
              setPagina((n) => n - 1);
              onChange("");
              onSelecionar?.(null);
            }}
          >
            Anterior
          </button>
          <button
            type="button"
            className="underline disabled:opacity-50"
            disabled={pagina >= dados.meta.ultimaPagina}
            onClick={() => {
              setPagina((n) => n + 1);
              onChange("");
              onSelecionar?.(null);
            }}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
