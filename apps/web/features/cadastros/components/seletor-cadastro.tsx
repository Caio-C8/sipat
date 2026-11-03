"use client";
import { useEffect, useState } from "react";
import {
  useListarNaturezas,
  useListarResponsaveisAtivos,
  useListarFornecedoresAtivos,
  type OpcaoCadastro,
} from "../api/hooks";
import { botao, campo, mensagemErro } from "./cadastro-ui";
type Props = {
  name: string;
  rotulo: string;
  inicial?: OpcaoCadastro;
  required?: boolean;
};
function SeletorPaginado({
  name,
  rotulo,
  inicial,
  required = true,
  consulta,
}: { consulta: ReturnType<typeof useListarNaturezas> } & Props) {
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [escolhida, setEscolhida] = useState<OpcaoCadastro | undefined>(
    inicial,
  );
  const { carregar, dados, loading, erro } = consulta;
  useEffect(() => {
    void carregar({
      busca: busca || undefined,
      pagina: String(pagina),
      limite: "20",
    });
  }, [busca, pagina, carregar]);
  const opcoes = dados?.dados ?? [];
  return (
    <fieldset className="grid min-w-0 gap-2 rounded-md border border-[#dfe7f1] p-3">
      <legend className="px-1 text-sm">
        {rotulo}
        {required ? " *" : ""}
      </legend>
      <div className="flex flex-wrap gap-2">
        <input
          aria-label={"Buscar " + rotulo.toLowerCase()}
          className={campo + " min-w-0 flex-1"}
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setPagina(1);
              setBusca(termo.trim());
            }
          }}
          maxLength={100}
          placeholder="Buscar por nome…"
        />
        <button
          type="button"
          className={botao}
          onClick={() => {
            setPagina(1);
            setBusca(termo.trim());
          }}
        >
          Buscar opções
        </button>
      </div>
      <label className="text-sm">
        {rotulo}
        <select
          name={name}
          required={required}
          className={campo}
          value={escolhida?.id ?? ""}
          onChange={(e) =>
            setEscolhida(opcoes.find((x) => x.id === e.target.value))
          }
        >
          <option value="">Selecione</option>
          {escolhida && !opcoes.some((x) => x.id === escolhida.id) && (
            <option value={escolhida.id}>{escolhida.rotulo}</option>
          )}
          {opcoes.map((x) => (
            <option key={x.id} value={x.id}>
              {x.rotulo}
            </option>
          ))}
        </select>
      </label>
      {loading && (
        <p role="status" className="text-sm">
          Carregando opções…
        </p>
      )}
      {erro != null && (
        <div role="alert" className="text-sm text-red-800">
          {mensagemErro(erro)}{" "}
          <button
            type="button"
            className="underline"
            onClick={() =>
              void carregar({
                busca: busca || undefined,
                pagina: String(pagina),
                limite: "20",
              })
            }
          >
            Tentar novamente
          </button>
        </div>
      )}
      {!loading && !erro && dados?.dados.length === 0 && (
        <p className="text-sm">Nenhuma opção encontrada.</p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          className={botao}
          disabled={pagina === 1 || loading}
          onClick={() => setPagina((p) => p - 1)}
        >
          Opções anteriores
        </button>
        <span>Página {pagina}</span>
        <button
          type="button"
          className={botao}
          disabled={!dados || pagina >= dados.meta.ultimaPagina || loading}
          onClick={() => setPagina((p) => p + 1)}
        >
          Mais opções
        </button>
      </div>
    </fieldset>
  );
}
export function SeletorNatureza(props: Props) {
  const consulta = useListarNaturezas();
  return <SeletorPaginado {...props} consulta={consulta} />;
}
export function SeletorResponsavel(props: Props) {
  const consulta = useListarResponsaveisAtivos();
  return <SeletorPaginado {...props} consulta={consulta} />;
}
export function SeletorFornecedor(props: Props) {
  const consulta = useListarFornecedoresAtivos();
  return <SeletorPaginado {...props} consulta={consulta} />;
}
