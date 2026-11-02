"use client";
import { useRef, useState } from "react";
import type {
  CatalogoOpcaoRelatorio,
  TipoRelatorio,
  OpcoesRelatorioResponse,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { useOpcoesRelatorio } from "../api/hooks";
import { campo, mensagemRelatorio } from "../apresentacao";
export function SeletorRelatorio({
  nome,
  label,
  catalogo,
  tipo,
  valor,
  onChange,
  obrigatorio = false,
}: {
  nome: string;
  label: string;
  catalogo: CatalogoOpcaoRelatorio;
  tipo: TipoRelatorio;
  valor: string;
  onChange: (v: string) => void;
  obrigatorio?: boolean;
}) {
  const carregar = useOpcoesRelatorio(catalogo, tipo);
  const [busca, setBusca] = useState("");
  const [resposta, setResposta] = useState<OpcoesRelatorioResponse | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState("");
  const atual = useRef(0);
  async function consultar(pagina = 1) {
    const id = ++atual.current;
    setPending(true);
    setErro("");
    try {
      const r = await carregar(busca, pagina);
      if (id === atual.current) setResposta(r);
    } catch (e) {
      if (id === atual.current) setErro(mensagemRelatorio(e));
    } finally {
      if (id === atual.current) setPending(false);
    }
  }
  return (
    <fieldset className="min-w-0 rounded-md border border-slate-200 p-3">
      <legend className="px-1 text-sm font-semibold">
        {label}
        {obrigatorio ? " (obrigatório)" : " (opcional)"}
      </legend>
      <div className="flex gap-2">
        <input
          aria-label={`Buscar ${label}`}
          className={campo}
          value={busca}
          maxLength={200}
          onChange={(e) => {
            setBusca(e.target.value);
            ++atual.current;
            setResposta(null);
            setPending(false);
          }}
          placeholder="Nome ou número"
        />
        <Button
          type="button"
          variant="outline"
          className="mt-1"
          disabled={pending}
          onClick={() => void consultar()}
        >
          {pending ? "Buscando…" : "Buscar"}
        </Button>
      </div>
      <label className="mt-2 block text-sm">
        Selecionar {label}
        <select
          className={campo}
          name={nome}
          value={valor}
          required={obrigatorio}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {obrigatorio ? "Selecione um registro" : "Todos"}
          </option>
          {valor && !resposta?.dados.some((d) => d.id === valor) && (
            <option value={valor}>Selecionado: {valor}</option>
          )}
          {resposta?.dados.map((d) => (
            <option key={d.id} value={d.id}>
              {d.rotulo}
            </option>
          ))}
        </select>
      </label>
      {resposta && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span>
            {resposta.meta.total} opções; página {resposta.meta.pagina} de{" "}
            {resposta.meta.ultimaPagina}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || resposta.meta.pagina <= 1}
            onClick={() => void consultar(resposta.meta.pagina - 1)}
          >
            Opções anteriores
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              pending || resposta.meta.pagina >= resposta.meta.ultimaPagina
            }
            onClick={() => void consultar(resposta.meta.pagina + 1)}
          >
            Mais opções
          </Button>
        </div>
      )}
      {resposta?.dados.length === 0 && (
        <p role="status" className="mt-2 text-sm">
          Nenhum registro encontrado.
        </p>
      )}
      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {erro}
        </p>
      )}
    </fieldset>
  );
}
