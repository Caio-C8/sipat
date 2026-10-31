"use client";
import { useEffect, useState } from "react";
import { useComissoesEmprestimo } from "../api/hooks";
import { campoEmprestimo, mensagemEmprestimo } from "../apresentacao";

export function SeletorComissaoEmprestimo({
  dataReferencia,
  rotulo,
  value,
  onChange,
}: {
  dataReferencia: string;
  rotulo: string;
  value: string;
  onChange: (id: string) => void;
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
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Selecione</option>
          {dados?.dados.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
      </label>
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
            }}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
